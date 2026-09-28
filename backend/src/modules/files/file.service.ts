import fs from "fs";
import path from "path";
import { env } from "../../config/env";
import { NotFoundError } from "../../middleware/errors";
import { projectService } from "../projects/project.service";
import { slugify } from "../../utils/slug";
import { fileRepository } from "./file.repository";

interface UploadedTempFile {
  tempPath: string;
  originalName: string;
  mimeType: string;
  size: number;
}

async function ensureFolder(project: { id: string; name: string; filesFolder: string | null; client: { name: string } }) {
  if (project.filesFolder) {
    return project.filesFolder;
  }
  const base = `${slugify(project.client.name)}-${slugify(project.name)}` || project.id;
  const collision = await fileRepository.findByFilesFolder(base, project.id);
  const folder = collision ? `${base}-${project.id.slice(0, 8)}` : base;
  fs.mkdirSync(path.join(env.uploadsDir, folder), { recursive: true });
  await fileRepository.setFilesFolder(project.id, folder);
  return folder;
}

// Avoids overwriting an existing file with the same name already in the folder.
function uniqueDiskName(dir: string, originalName: string) {
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext);
  let candidate = `${base}${ext}`;
  let n = 1;
  while (fs.existsSync(path.join(dir, candidate))) {
    candidate = `${base}-${n}${ext}`;
    n += 1;
  }
  return candidate;
}

export const fileService = {
  async list(projectId: string, userId: string) {
    await projectService.checkAccess(projectId, userId);
    return fileRepository.findByProject(projectId);
  },

  async upload(projectId: string, userId: string, uploaded: UploadedTempFile[]) {
    const project = await projectService.checkAccess(projectId, userId);
    const folder = await ensureFolder(project);
    const folderPath = path.join(env.uploadsDir, folder);

    const created = [];
    for (const file of uploaded) {
      const diskName = uniqueDiskName(folderPath, file.originalName);
      fs.renameSync(file.tempPath, path.join(folderPath, diskName));
      created.push(
        await fileRepository.create({
          projectId,
          fileName: diskName,
          originalName: file.originalName,
          mimeType: file.mimeType,
          size: file.size,
          uploadedById: userId,
        })
      );
    }
    return created;
  },

  async getDownload(projectId: string, fileId: string, userId: string) {
    const project = await projectService.checkAccess(projectId, userId);
    const record = await fileRepository.findById(fileId);
    if (!record || record.projectId !== projectId || !project.filesFolder) {
      throw new NotFoundError("File not found");
    }
    return {
      absolutePath: path.join(env.uploadsDir, project.filesFolder, record.fileName),
      originalName: record.originalName,
      mimeType: record.mimeType,
    };
  },

  async remove(projectId: string, fileId: string, userId: string) {
    const project = await projectService.checkAccess(projectId, userId);
    const record = await fileRepository.findById(fileId);
    if (!record || record.projectId !== projectId) {
      throw new NotFoundError("File not found");
    }
    if (project.filesFolder) {
      const absolutePath = path.join(env.uploadsDir, project.filesFolder, record.fileName);
      fs.rm(absolutePath, { force: true }, () => {});
    }
    await fileRepository.delete(fileId);
  },
};
