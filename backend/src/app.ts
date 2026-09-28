import cors from "cors";
import express from "express";
import fs from "fs";
import path from "path";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { authRouter } from "./modules/auth/auth.routes";
import { clientRouter } from "./modules/clients/client.routes";
import { projectRouter } from "./modules/projects/project.routes";
import { myTasksRouter } from "./modules/tasks/my-tasks.routes";
import { userRouter } from "./modules/users/user.routes";
import { reportRouter } from "./modules/reports/report.routes";

export const app = express();

app.use(
  cors({
    origin: env.corsOrigin === "*" ? true : env.corsOrigin.split(",").map((o) => o.trim()),
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/clients", clientRouter);
app.use("/api/projects", projectRouter);
app.use("/api/tasks", myTasksRouter);
app.use("/api/reports", reportRouter);

// Single-process deploy: if a built frontend is present, serve it too, so the whole
// app runs from one port with no separate static host or CORS setup needed.
const frontendExists = fs.existsSync(path.join(env.frontendDistPath, "index.html"));
if (env.nodeEnv === "production" && frontendExists) {
  app.use(express.static(env.frontendDistPath));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(env.frontendDistPath, "index.html"));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);
