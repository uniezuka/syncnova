import { NotFoundError } from "../../middleware/errors";
import { projectService } from "../projects/project.service";
import { slugify } from "../../utils/slug";
import { fileRepository } from "./file.repository";
import { fileStorage } from "./file.storage";

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
  await fileRepository.setFilesFolder(project.id, folder);
  return folder;
}

export const fileService = {
  async list(projectId: string, userId: string) {
    await projectService.checkAccess(projectId, userId);
    return fileRepository.findByProject(projectId);
  },

  async upload(projectId: string, userId: string, uploaded: UploadedTempFile[]) {
    const project = await projectService.checkAccess(projectId, userId);
    const folder = await ensureFolder(project);

    const created = [];
    for (const file of uploaded) {
      const fileName = await fileStorage.save(folder, file.originalName, file.tempPath, file.mimeType);
      created.push(
        await fileRepository.create({
          projectId,
          fileName,
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
      folder: project.filesFolder,
      fileName: record.fileName,
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
      await fileStorage.remove(project.filesFolder, record.fileName);
    }
    await fileRepository.delete(fileId);
  },
};
