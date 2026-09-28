import { Request, Response } from "express";
import { reportService } from "./report.service";

function parseDate(value: unknown): Date | undefined {
  if (typeof value !== "string" || !value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function parseString(value: unknown): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

export const reportController = {
  async summary(req: Request, res: Response) {
    const result = await reportService.summary(req.user!.id, {
      from: parseDate(req.query.from),
      to: parseDate(req.query.to),
      userId: parseString(req.query.userId),
      projectId: parseString(req.query.projectId),
      clientId: parseString(req.query.clientId),
    });
    res.json(result);
  },

  async pending(req: Request, res: Response) {
    const result = await reportService.pending(req.user!.id, {
      projectId: parseString(req.query.projectId),
      clientId: parseString(req.query.clientId),
      assigneeId: parseString(req.query.assigneeId),
    });
    res.json(result);
  },
};
