import { Router } from "express";
import { asyncHandler, requireAuth } from "../../middleware/auth";
import { projectController } from "./project.controller";
import { taskRouter } from "../tasks/task.routes";
import { fileRouter } from "../files/file.routes";

export const projectRouter = Router();

projectRouter.use(requireAuth);

projectRouter.get("/:id", asyncHandler(projectController.get));
projectRouter.patch("/:id", asyncHandler(projectController.update));
projectRouter.delete("/:id", asyncHandler(projectController.remove));
projectRouter.post("/:id/members", asyncHandler(projectController.addMember));
projectRouter.delete("/:id/members/:userId", asyncHandler(projectController.removeMember));

// Tasks and files are always scoped to a project, so nest them here.
projectRouter.use("/:projectId/tasks", taskRouter);
projectRouter.use("/:projectId/files", fileRouter);
