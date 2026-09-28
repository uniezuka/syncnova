import { z } from "zod";

const urlField = z.string().url().optional().or(z.literal(""));
const nullableUrlField = z.string().url().nullable().optional().or(z.literal(""));

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  notes: z.string().optional(),
  url: urlField,
  stagingUrl: urlField,
  devUrl: urlField,
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  url: nullableUrlField,
  stagingUrl: nullableUrlField,
  devUrl: nullableUrlField,
});

export const addMemberSchema = z.object({
  userId: z.string().uuid(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
