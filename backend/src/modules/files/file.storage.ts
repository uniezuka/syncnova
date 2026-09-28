import fs from "fs";
import path from "path";
import type { Response } from "express";
// Storage-only client: the full @supabase/supabase-js also starts a realtime WebSocket
// client, which crashes on Node 20 (no built-in WebSocket).
import { StorageClient } from "@supabase/storage-js";
import { env } from "../../config/env";
import { NotFoundError } from "../../middleware/errors";

// Where uploaded project files live. Files are stored as "<folder>/<fileName>", where
// folder is the project's filesFolder. Two versions:
// - local disk (default, used in dev): files under env.uploadsDir
// - Supabase Storage: used when SUPABASE_URL and SUPABASE_SERVICE_KEY are set
export interface FileStorage {
  // Moves a temp upload into the folder. Returns the file name it was stored under,
  // which may get a "-1", "-2"... suffix so an existing file is never overwritten.
  save(folder: string, originalName: string, tempPath: string, mimeType: string): Promise<string>;
  sendDownload(res: Response, folder: string, fileName: string, originalName: string, mimeType: string): Promise<void>;
  remove(folder: string, fileName: string): Promise<void>;
}

function withSuffix(name: string, n: number) {
  if (n === 0) return name;
  const ext = path.extname(name);
  return `${path.basename(name, ext)}-${n}${ext}`;
}

const diskStorage: FileStorage = {
  async save(folder, originalName, tempPath) {
    const dir = path.join(env.uploadsDir, folder);
    fs.mkdirSync(dir, { recursive: true });
    let n = 0;
    while (fs.existsSync(path.join(dir, withSuffix(originalName, n)))) n += 1;
    const fileName = withSuffix(originalName, n);
    fs.renameSync(tempPath, path.join(dir, fileName));
    return fileName;
  },

  async sendDownload(res, folder, fileName, originalName) {
    res.download(path.join(env.uploadsDir, folder, fileName), originalName);
  },

  async remove(folder, fileName) {
    fs.rm(path.join(env.uploadsDir, folder, fileName), { force: true }, () => {});
  },
};

function createSupabaseStorage(): FileStorage {
  const bucket = new StorageClient(`${env.supabaseUrl.replace(/\/+$/, "")}/storage/v1`, {
    apikey: env.supabaseServiceKey,
    Authorization: `Bearer ${env.supabaseServiceKey}`,
  }).from(env.supabaseBucket);

  // Supabase rejects some characters in object keys (e.g. accents, #, %). The user-facing
  // name is kept in the database (originalName), so the stored name can be simplified.
  const safeName = (name: string) => name.replace(/[^A-Za-z0-9._\-() ]/g, "_");

  return {
    async save(folder, originalName, tempPath, mimeType) {
      try {
        const data = fs.readFileSync(tempPath);
        const base = safeName(originalName);
        for (let n = 0; ; n += 1) {
          const fileName = withSuffix(base, n);
          const { error } = await bucket.upload(`${folder}/${fileName}`, data, {
            contentType: mimeType,
            upsert: false,
          });
          if (!error) return fileName;
          const { status, statusCode } = error as { status?: number; statusCode?: string | number };
          const exists =
            status === 409 || String(statusCode) === "409" || /already exists|duplicate/i.test(error.message);
          if (!exists || n >= 100) throw new Error(`File upload to storage failed: ${error.message}`);
        }
      } finally {
        fs.rm(tempPath, { force: true }, () => {});
      }
    },

    async sendDownload(res, folder, fileName, originalName, mimeType) {
      const { data, error } = await bucket.download(`${folder}/${fileName}`);
      if (error || !data) throw new NotFoundError("File not found");
      res.attachment(originalName);
      res.type(mimeType || "application/octet-stream");
      res.send(Buffer.from(await data.arrayBuffer()));
    },

    async remove(folder, fileName) {
      await bucket.remove([`${folder}/${fileName}`]);
    },
  };
}

export const useSupabaseStorage = Boolean(env.supabaseUrl && env.supabaseServiceKey);

export const fileStorage: FileStorage = useSupabaseStorage ? createSupabaseStorage() : diskStorage;
