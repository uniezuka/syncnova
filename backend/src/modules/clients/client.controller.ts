import { Request, Response } from "express";
import { clientService } from "./client.service";
import { createClientSchema, updateClientSchema } from "./client.schemas";
import { createProjectSchema } from "../projects/project.schemas";

export const clientController = {
  async list(req: Request, res: Response) {
    const clients = await clientService.listForUser(req.user!.id);
    res.json(clients);
  },

  async get(req: Request, res: Response) {
    const client = await clientService.getById(req.params.id, req.user!.id);
    res.json(client);
  },

  async create(req: Request, res: Response) {
    const data = createClientSchema.parse(req.body);
    const client = await clientService.create(req.user!.id, data);
    res.status(201).json(client);
  },

  async update(req: Request, res: Response) {
    const data = updateClientSchema.parse(req.body);
    const client = await clientService.update(req.params.id, req.user!.id, data);
    res.json(client);
  },

  async remove(req: Request, res: Response) {
    await clientService.delete(req.params.id, req.user!.id);
    res.status(204).send();
  },

  async createProject(req: Request, res: Response) {
    const data = createProjectSchema.parse(req.body);
    const project = await clientService.createProject(req.params.id, req.user!.id, data);
    res.status(201).json(project);
  },
};
