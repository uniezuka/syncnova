import { api } from "./client";
import type { Client, Project } from "../types";
import type { ProjectDetailInput } from "./projects";

export interface ClientInput {
  name: string;
  notes?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  billingAddress?: string;
}

export const clientsApi = {
  list: () => api.get<Client[]>("/clients"),
  get: (id: string) => api.get<Client>(`/clients/${id}`),
  create: (data: ClientInput) => api.post<Client>("/clients", data),
  update: (id: string, data: Partial<ClientInput>) => api.patch<Client>(`/clients/${id}`, data),
  remove: (id: string) => api.delete<void>(`/clients/${id}`),
  createProject: (clientId: string, data: ProjectDetailInput & { name: string }) =>
    api.post<Project>(`/clients/${clientId}/projects`, data),
};
