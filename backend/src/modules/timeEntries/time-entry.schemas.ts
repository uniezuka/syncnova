import { z } from "zod";

export const createTimeEntrySchema = z
  .object({
    date: z.coerce.date(),
    startTime: z.coerce.date().optional(),
    endTime: z.coerce.date().optional(),
    note: z.string().optional(),
  })
  .refine((data) => data.startTime || data.endTime, {
    message: "Enter a start time or an end time",
    path: ["startTime"],
  });

export const updateTimeEntrySchema = z.object({
  date: z.coerce.date().optional(),
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
  note: z.string().nullable().optional(),
});
