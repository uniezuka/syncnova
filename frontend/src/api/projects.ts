import { api } from "./client";
import type { Project } from "../types";

export interface ProjectDetailInput {
  name?: string;
  description?: string;
  notes?: string;
  url?: string;
  stagingUrl?: string;
  devUrl?: string;
}

export const projectsApi = {
  get: (id: string) => api.get<Project>(`/projects/${id}`),
  update: (id: string, data: { [K in keyof ProjectDetailInput]: ProjectDetailInput[K] | null }) => api.patch<Project>(`/projects/${id}`, data),
  remove: (id: string) => api.delete<void>(`/projects/${id}`),
  addMember: (id: string, userId: string) =>
    api.post<Project>(`/projects/${id}/members`, { userId }),
  removeMember: (id: string, userId: string) =>
    api.delete<Project>(`/projects/${id}/members/${userId}`),
};
