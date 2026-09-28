import { Router } from "express";
import { asyncHandler } from "../../middleware/auth";
import { taskController } from "./task.controller";
import { timeEntryRouter } from "../timeEntries/time-entry.routes";

// mergeParams: needs access to :projectId from the parent project router.
export const taskRouter = Router({ mergeParams: true });

taskRouter.get("/", asyncHandler(taskController.list));
taskRouter.post("/", asyncHandler(taskController.create));
taskRouter.get("/archived", asyncHandler(taskController.listArchived));
taskRouter.get("/:taskId", asyncHandler(taskController.get));
taskRouter.get("/:taskId/activity", asyncHandler(taskController.activity));
taskRouter.patch("/:taskId", asyncHandler(taskController.update));
taskRouter.delete("/:taskId", asyncHandler(taskController.remove));
taskRouter.post("/:taskId/archive", asyncHandler(taskController.archive));
taskRouter.post("/:taskId/duplicate", asyncHandler(taskController.duplicate));
taskRouter.use("/:taskId/time-entries", timeEntryRouter);
