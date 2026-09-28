import { Router } from "express";
import { asyncHandler, requireAuth } from "../../middleware/auth";
import { clientController } from "./client.controller";

export const clientRouter = Router();

clientRouter.use(requireAuth);

clientRouter.get("/", asyncHandler(clientController.list));
clientRouter.post("/", asyncHandler(clientController.create));
clientRouter.get("/:id", asyncHandler(clientController.get));
clientRouter.patch("/:id", asyncHandler(clientController.update));
clientRouter.delete("/:id", asyncHandler(clientController.remove));
clientRouter.post("/:id/projects", asyncHandler(clientController.createProject));
