import { Router } from "express";
import { asyncHandler, requireAuth } from "../../middleware/auth";
import { taskController } from "./task.controller";

// Unlike task.routes.ts (scoped to one project), this is mounted directly at
// /api/tasks - it spans every project the user has tasks assigned in.
export const myTasksRouter = Router();

myTasksRouter.use(requireAuth);
myTasksRouter.get("/mine", asyncHandler(taskController.mine));
