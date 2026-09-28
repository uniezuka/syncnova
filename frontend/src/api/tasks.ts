import { api } from "./client";
import type { AssignedTask, Task, TaskActivityEntry, TaskPriority, TaskStatus, TaskType } from "../types";

export interface TaskInput {
  title: string;
  description?: string;
  notes?: string;
  dueDate?: string;
  assigneeId?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  position?: number;
}

export const tasksApi = {
  list: (projectId: string) => api.get<Task[]>(`/projects/${projectId}/tasks`),
  listArchived: (projectId: string) => api.get<Task[]>(`/projects/${projectId}/tasks/archived`),
  get: (projectId: string, taskId: string) =>
    api.get<Task>(`/projects/${projectId}/tasks/${taskId}`),
  mine: () => api.get<AssignedTask[]>("/tasks/mine"),
  activity: (projectId: string, taskId: string) =>
    api.get<TaskActivityEntry[]>(`/projects/${projectId}/tasks/${taskId}/activity`),
  create: (projectId: string, data: TaskInput) =>
    api.post<Task>(`/projects/${projectId}/tasks`, data),
  update: (projectId: string, taskId: string, data: Partial<TaskInput>) =>
    api.patch<Task>(`/projects/${projectId}/tasks/${taskId}`, data),
  remove: (projectId: string, taskId: string) =>
    api.delete<void>(`/projects/${projectId}/tasks/${taskId}`),
  archive: (projectId: string, taskId: string) =>
    api.post<Task>(`/projects/${projectId}/tasks/${taskId}/archive`),
  duplicate: (projectId: string, taskId: string) =>
    api.post<Task>(`/projects/${projectId}/tasks/${taskId}/duplicate`),
};
