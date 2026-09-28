import { Router } from "express";
import { asyncHandler } from "../../middleware/auth";
import { timeEntryController } from "./time-entry.controller";

// mergeParams: needs :projectId and :taskId from the parent routers.
export const timeEntryRouter = Router({ mergeParams: true });

timeEntryRouter.get("/", asyncHandler(timeEntryController.list));
timeEntryRouter.post("/", asyncHandler(timeEntryController.create));
timeEntryRouter.patch("/:entryId", asyncHandler(timeEntryController.update));
timeEntryRouter.delete("/:entryId", asyncHandler(timeEntryController.remove));
