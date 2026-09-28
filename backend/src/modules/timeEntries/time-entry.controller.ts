import { Request, Response } from "express";
import { timeEntryService } from "./time-entry.service";
import { createTimeEntrySchema, updateTimeEntrySchema } from "./time-entry.schemas";

export const timeEntryController = {
  async list(req: Request, res: Response) {
    const entries = await timeEntryService.list(
      req.params.projectId,
      req.params.taskId,
      req.user!.id
    );
    res.json(entries);
  },

  async create(req: Request, res: Response) {
    const data = createTimeEntrySchema.parse(req.body);
    const entry = await timeEntryService.create(
      req.params.projectId,
      req.params.taskId,
      req.user!.id,
      data
    );
    res.status(201).json(entry);
  },

  async update(req: Request, res: Response) {
    const data = updateTimeEntrySchema.parse(req.body);
    const entry = await timeEntryService.update(
      req.params.projectId,
      req.params.taskId,
      req.params.entryId,
      req.user!.id,
      data
    );
    res.json(entry);
  },

  async remove(req: Request, res: Response) {
    await timeEntryService.delete(
      req.params.projectId,
      req.params.taskId,
      req.params.entryId,
      req.user!.id
    );
    res.status(204).send();
  },
};
