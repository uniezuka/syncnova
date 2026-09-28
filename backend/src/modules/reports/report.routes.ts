import { Router } from "express";
import { asyncHandler, requireAuth } from "../../middleware/auth";
import { reportController } from "./report.controller";

export const reportRouter = Router();

reportRouter.use(requireAuth);
reportRouter.get("/summary", asyncHandler(reportController.summary));
reportRouter.get("/pending", asyncHandler(reportController.pending));
