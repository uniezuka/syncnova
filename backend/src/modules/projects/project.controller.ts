import { Request, Response } from "express";
import { projectService } from "./project.service";
import { addMemberSchema, updateProjectSchema } from "./project.schemas";

export const projectController = {
  async get(req: Request, res: Response) {
    const project = await projectService.getById(req.params.id, req.user!.id);
    res.json(project);
  },

  async update(req: Request, res: Response) {
    const data = updateProjectSchema.parse(req.body);
    const project = await projectService.update(req.params.id, req.user!.id, data);
    res.json(project);
  },

  async remove(req: Request, res: Response) {
    await projectService.delete(req.params.id, req.user!.id);
    res.status(204).send();
  },

  async addMember(req: Request, res: Response) {
    const { userId } = addMemberSchema.parse(req.body);
    const project = await projectService.addMember(req.params.id, req.user!.id, userId);
    res.json(project);
  },

  async removeMember(req: Request, res: Response) {
    const project = await projectService.removeMember(
      req.params.id,
      req.user!.id,
      req.params.userId
    );
    res.json(project);
  },
};
