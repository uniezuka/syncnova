import { Router } from "express";
import { asyncHandler } from "../../middleware/auth";
import { fileController } from "./file.controller";
import { upload } from "./file.upload";

// mergeParams: needs access to :projectId from the parent project router.
export const fileRouter = Router({ mergeParams: true });

fileRouter.get("/", asyncHandler(fileController.list));
fileRouter.post("/", upload.array("files", 10), asyncHandler(fileController.upload));
fileRouter.get("/:fileId/download", asyncHandler(fileController.download));
fileRouter.delete("/:fileId", asyncHandler(fileController.remove));
