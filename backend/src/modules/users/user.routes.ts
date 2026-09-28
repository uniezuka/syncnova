import { Router } from "express";
import { requireAuth, asyncHandler } from "../../middleware/auth";
import { userRepository } from "./user.repository";

export const userRouter = Router();

// Used to populate "assign to" dropdowns. Local app, small trusted user base,
// so no extra restriction beyond being logged in.
userRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (_req, res) => {
    const users = await userRepository.findAll();
    res.json(users);
  })
);
