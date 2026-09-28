import { z } from "zod";

export const taskStatusEnum = z.enum(["TODO", "IN_PROGRESS", "FOR_REVIEW", "REJECTED", "DONE"]);
export const taskPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH"]);
export const taskTypeEnum = z.enum(["TASK", "BUG", "FEATURE", "CHORE", "IMPROVEMENT", "DOCUMENTATION"]);

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  notes: z.string().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  type: taskTypeEnum.optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  type: taskTypeEnum.optional(),
  position: z.number().int().min(0).optional(),
});
