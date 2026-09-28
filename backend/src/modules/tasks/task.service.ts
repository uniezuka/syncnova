import { TaskStatus, TaskPriority, TaskType } from "@prisma/client";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../middleware/errors";
import { projectService } from "../projects/project.service";
import { taskRepository } from "./task.repository";

const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  FOR_REVIEW: "For review",
  REJECTED: "Rejected",
  DONE: "Done",
};

// Archiving only ever happens through the explicit archive action below, and only
// from one of these statuses - it's not automatic on a status change anymore.
const ARCHIVABLE_STATUSES = new Set<TaskStatus>(["DONE", "REJECTED"]);

async function getOwnedTask(projectId: string, taskId: string) {
  const task = await taskRepository.findById(taskId);
  if (!task || task.projectId !== projectId) {
    throw new NotFoundError("Task not found");
  }
  return task;
}

interface TaskDetailInput {
  title?: string;
  description?: string | null;
  notes?: string | null;
  dueDate?: Date | null;
  assigneeId?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
}

export const taskService = {
  async list(projectId: string, userId: string) {
    await projectService.checkAccess(projectId, userId);
    return taskRepository.findByProject(projectId);
  },

  async listArchived(projectId: string, userId: string) {
    await projectService.checkAccess(projectId, userId);
    return taskRepository.findArchivedByProject(projectId);
  },

  async get(projectId: string, taskId: string, userId: string) {
    await projectService.checkAccess(projectId, userId);
    return getOwnedTask(projectId, taskId);
  },

  mine(userId: string) {
    return taskRepository.findByAssignee(userId);
  },

  async activity(projectId: string, taskId: string, userId: string) {
    await projectService.checkAccess(projectId, userId);
    await getOwnedTask(projectId, taskId);
    return taskRepository.findActivityByTask(taskId);
  },

  async create(projectId: string, userId: string, data: TaskDetailInput & { title: string }) {
    await projectService.checkAccess(projectId, userId);
    const status = data.status ?? "TODO";
    const position = await taskRepository.nextPosition(projectId, status);

    const task = await taskRepository.create({
      ...data,
      description: data.description ?? undefined,
      notes: data.notes ?? undefined,
      dueDate: data.dueDate ?? undefined,
      assigneeId: data.assigneeId ?? undefined,
      status,
      position,
      projectId,
      creatorId: userId,
    });

    await taskRepository.logActivity({
      taskId: task.id,
      userId,
      action: "created",
      details: "Task created",
    });

    return task;
  },

  async update(
    projectId: string,
    taskId: string,
    userId: string,
    data: TaskDetailInput & { position?: number }
  ) {
    await projectService.checkAccess(projectId, userId);
    const task = await getOwnedTask(projectId, taskId);
    if (task.archivedAt) {
      throw new ForbiddenError("This task is archived and can no longer be edited");
    }

    const updated = await taskRepository.update(taskId, data);

    if (data.status && data.status !== task.status) {
      await taskRepository.logActivity({
        taskId,
        userId,
        action: "status_changed",
        details: `Status changed from ${STATUS_LABEL[task.status]} to ${STATUS_LABEL[data.status]}`,
      });
    }

    const changedFields: string[] = [];
    if (data.title !== undefined && data.title !== task.title) changedFields.push("title");
    if (data.description !== undefined && data.description !== task.description)
      changedFields.push("description");
    if (data.notes !== undefined && data.notes !== task.notes) changedFields.push("notes");
    if (
      data.dueDate !== undefined &&
      (data.dueDate?.getTime() ?? null) !== (task.dueDate?.getTime() ?? null)
    )
      changedFields.push("due date");
    if (data.priority !== undefined && data.priority !== task.priority)
      changedFields.push("priority");
    if (data.type !== undefined && data.type !== task.type) changedFields.push("type");
    if (data.assigneeId !== undefined && data.assigneeId !== task.assigneeId)
      changedFields.push("assignee");

    if (changedFields.length > 0) {
      await taskRepository.logActivity({
        taskId,
        userId,
        action: "updated",
        details: `Updated: ${changedFields.join(", ")}`,
      });
    }

    return updated;
  },

  async archive(projectId: string, taskId: string, userId: string) {
    await projectService.checkAccess(projectId, userId);
    const task = await getOwnedTask(projectId, taskId);
    if (task.archivedAt) {
      throw new BadRequestError("This task is already archived");
    }
    if (!ARCHIVABLE_STATUSES.has(task.status)) {
      throw new BadRequestError("Only a Done or Rejected task can be archived");
    }
    const updated = await taskRepository.update(taskId, { archivedAt: new Date() });
    await taskRepository.logActivity({
      taskId,
      userId,
      action: "archived",
      details: "Archived",
    });
    return updated;
  },

  // The only thing you can do with an archived task: clone it into a brand new,
  // unarchived To do task. Both tasks get an activity entry pointing at each other.
  async duplicate(projectId: string, taskId: string, userId: string) {
    await projectService.checkAccess(projectId, userId);
    const task = await getOwnedTask(projectId, taskId);
    if (!task.archivedAt) {
      throw new BadRequestError("Only an archived task can be duplicated");
    }

    const status: TaskStatus = "TODO";
    const position = await taskRepository.nextPosition(projectId, status);
    const copy = await taskRepository.create({
      title: `${task.title} (copy)`,
      description: task.description ?? undefined,
      notes: task.notes ?? undefined,
      assigneeId: task.assigneeId ?? undefined,
      priority: task.priority,
      type: task.type,
      status,
      position,
      projectId,
      creatorId: userId,
    });

    await taskRepository.logActivity({
      taskId: copy.id,
      userId,
      action: "created",
      details: `Duplicated from archived task "${task.title}"`,
    });
    await taskRepository.logActivity({
      taskId: task.id,
      userId,
      action: "duplicated",
      details: `Duplicated as new task "${copy.title}"`,
    });

    return copy;
  },

  async delete(projectId: string, taskId: string, userId: string) {
    await projectService.checkAccess(projectId, userId);
    await getOwnedTask(projectId, taskId);
    await taskRepository.delete(taskId);
  },
};
