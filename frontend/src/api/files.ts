import { api } from "./client";
import type { PublicUser } from "../types";

export interface ProjectFile {
  id: string;
  projectId: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedById: string;
  uploadedBy: PublicUser;
  createdAt: string;
}

export const filesApi = {
  list: (projectId: string) => api.get<ProjectFile[]>(`/projects/${projectId}/files`),

  upload: (projectId: string, files: FileList | File[]) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));
    return api.postForm<ProjectFile[]>(`/projects/${projectId}/files`, formData);
  },

  remove: (projectId: string, fileId: string) =>
    api.delete<void>(`/projects/${projectId}/files/${fileId}`),

  download: (projectId: string, fileId: string) =>
    api.getBlob(`/projects/${projectId}/files/${fileId}/download`),
};
