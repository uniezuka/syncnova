import { Request, Response } from "express";
import { taskService } from "./task.service";
import { createTaskSchema, updateTaskSchema } from "./task.schemas";

export const taskController = {
  async list(req: Request, res: Response) {
    const tasks = await taskService.list(req.params.projectId, req.user!.id);
    res.json(tasks);
  },

  async mine(req: Request, res: Response) {
    const tasks = await taskService.mine(req.user!.id);
    res.json(tasks);
  },

  async listArchived(req: Request, res: Response) {
    const tasks = await taskService.listArchived(req.params.projectId, req.user!.id);
    res.json(tasks);
  },

  async get(req: Request, res: Response) {
    const task = await taskService.get(req.params.projectId, req.params.taskId, req.user!.id);
    res.json(task);
  },

  async activity(req: Request, res: Response) {
    const entries = await taskService.activity(
      req.params.projectId,
      req.params.taskId,
      req.user!.id
    );
    res.json(entries);
  },

  async create(req: Request, res: Response) {
    const data = createTaskSchema.parse(req.body);
    const task = await taskService.create(req.params.projectId, req.user!.id, data);
    res.status(201).json(task);
  },

  async update(req: Request, res: Response) {
    const data = updateTaskSchema.parse(req.body);
    const task = await taskService.update(
      req.params.projectId,
      req.params.taskId,
      req.user!.id,
      data
    );
    res.json(task);
  },

  async remove(req: Request, res: Response) {
    await taskService.delete(req.params.projectId, req.params.taskId, req.user!.id);
    res.status(204).send();
  },

  async archive(req: Request, res: Response) {
    const task = await taskService.archive(req.params.projectId, req.params.taskId, req.user!.id);
    res.json(task);
  },

  async duplicate(req: Request, res: Response) {
    const task = await taskService.duplicate(
      req.params.projectId,
      req.params.taskId,
      req.user!.id
    );
    res.status(201).json(task);
  },
};
