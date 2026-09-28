import { BadRequestError, ForbiddenError, NotFoundError } from "../../middleware/errors";
import { projectService } from "../projects/project.service";
import { taskRepository } from "../tasks/task.repository";
import { timeEntryRepository } from "./time-entry.repository";

async function getOwnedTask(projectId: string, taskId: string) {
  const task = await taskRepository.findById(taskId);
  if (!task || task.projectId !== projectId) {
    throw new NotFoundError("Task not found");
  }
  return task;
}

async function getOwnEntry(taskId: string, entryId: string, userId: string) {
  const entry = await timeEntryRepository.findById(entryId);
  if (!entry || entry.taskId !== taskId) {
    throw new NotFoundError("Time entry not found");
  }
  if (entry.userId !== userId) {
    throw new ForbiddenError("You can only change your own time entries");
  }
  return entry;
}

// Clock in/out like Hubstaff - hours is always derived from the range, never typed in directly.
function computeHours(startTime: Date, endTime: Date) {
  const ms = endTime.getTime() - startTime.getTime();
  if (ms <= 0) {
    throw new BadRequestError("End time must be after start time");
  }
  const hours = ms / (1000 * 60 * 60);
  if (hours > 24) {
    throw new BadRequestError("A single time entry can't be longer than 24 hours");
  }
  return Math.round(hours * 100) / 100;
}

export const timeEntryService = {
  async list(projectId: string, taskId: string, userId: string) {
    await projectService.checkAccess(projectId, userId);
    await getOwnedTask(projectId, taskId);
    return timeEntryRepository.findByTask(taskId);
  },

  async create(
    projectId: string,
    taskId: string,
    userId: string,
    data: { date: Date; startTime?: Date; endTime?: Date; note?: string }
  ) {
    await projectService.checkAccess(projectId, userId);
    const task = await getOwnedTask(projectId, taskId);
    if (task.archivedAt) {
      throw new ForbiddenError("This task is archived and can no longer be logged against");
    }
    // hours stays 0 until both times are filled in - the entry is a placeholder to be
    // completed later (see time-entry.schemas.ts, which requires at least one time).
    const hours = data.startTime && data.endTime ? computeHours(data.startTime, data.endTime) : 0;
    return timeEntryRepository.create({ ...data, hours, taskId, userId });
  },

  async update(
    projectId: string,
    taskId: string,
    entryId: string,
    userId: string,
    data: Partial<{ date: Date; startTime: Date; endTime: Date; note: string | null }>
  ) {
    await projectService.checkAccess(projectId, userId);
    await getOwnedTask(projectId, taskId);
    const entry = await getOwnEntry(taskId, entryId, userId);

    let hours: number | undefined;
    if (data.startTime || data.endTime) {
      const startTime = data.startTime ?? entry.startTime;
      const endTime = data.endTime ?? entry.endTime;
      // Still missing one side after this edit - leave hours at 0 rather than blocking the
      // save, so the entry can be filled in over two separate edits.
      hours = startTime && endTime ? computeHours(startTime, endTime) : 0;
    }

    return timeEntryRepository.update(entryId, { ...data, ...(hours !== undefined && { hours }) });
  },

  async delete(projectId: string, taskId: string, entryId: string, userId: string) {
    await projectService.checkAccess(projectId, userId);
    await getOwnedTask(projectId, taskId);
    await getOwnEntry(taskId, entryId, userId);
    await timeEntryRepository.delete(entryId);
  },
};
