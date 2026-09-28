import fs from "fs";
import path from "path";
import multer from "multer";
import { env } from "../../config/env";

// Multer first lands files in a temp folder inside the uploads root (same volume, so
// the service can move them into the project's folder with a plain rename). The
// service is responsible for cleaning them up by moving them out.
const tempDir = path.join(env.uploadsDir, ".tmp");
fs.mkdirSync(tempDir, { recursive: true });

const storage = multer.diskStorage({
  destination: tempDir,
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: env.maxUploadMb * 1024 * 1024 },
});
