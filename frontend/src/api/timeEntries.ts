import { api } from "./client";
import type { TimeEntry } from "../types";

export interface TimeEntryInput {
  date: string;
  startTime?: string;
  endTime?: string;
  note?: string;
}

export type TimeEntryUpdateInput = Partial<TimeEntryInput>;

export const timeEntriesApi = {
  list: (projectId: string, taskId: string) =>
    api.get<TimeEntry[]>(`/projects/${projectId}/tasks/${taskId}/time-entries`),
  create: (projectId: string, taskId: string, data: TimeEntryInput) =>
    api.post<TimeEntry>(`/projects/${projectId}/tasks/${taskId}/time-entries`, data),
  update: (projectId: string, taskId: string, entryId: string, data: TimeEntryUpdateInput) =>
    api.patch<TimeEntry>(`/projects/${projectId}/tasks/${taskId}/time-entries/${entryId}`, data),
  remove: (projectId: string, taskId: string, entryId: string) =>
    api.delete<void>(`/projects/${projectId}/tasks/${taskId}/time-entries/${entryId}`),
};
