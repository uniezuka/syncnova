import type { TaskPriority, TaskStatus, TaskType } from "./types";

export const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  FOR_REVIEW: "For review",
  REJECTED: "Rejected",
  DONE: "Done",
};

// CSS class that tints a task's row/card by its status, e.g. "status-in-progress".
export function statusClass(status: TaskStatus): string {
  return `status-${status.toLowerCase().replace("_", "-")}`;
}

export const STATUS_ORDER:TaskStatus[] = ["TODO", "IN_PROGRESS", "FOR_REVIEW", "REJECTED", "DONE"];

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

export const TYPE_LABEL: Record<TaskType, string> = {
  TASK: "Task",
  BUG: "Bug",
  FEATURE: "Feature",
  CHORE: "Chore",
  IMPROVEMENT: "Improvement",
  DOCUMENTATION: "Documentation",
};

export const ARCHIVABLE_STATUSES: TaskStatus[] = ["DONE", "REJECTED"];
