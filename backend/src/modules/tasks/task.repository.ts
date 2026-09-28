import { prisma } from "../../config/prisma";
import { TaskStatus, TaskPriority, TaskType } from "@prisma/client";

const taskInclude = {
  assignee: { select: { id: true, name: true, email: true } },
  creator: { select: { id: true, name: true, email: true } },
};

export const taskRepository = {
  // The active board only ever shows unarchived tasks - archived ones live on the
  // project's archive page instead.
  findByProject(projectId: string) {
    return prisma.task.findMany({
      where: { projectId, archivedAt: null },
      include: taskInclude,
      orderBy: [{ status: "asc" }, { position: "asc" }],
    });
  },

  findArchivedByProject(projectId: string) {
    return prisma.task.findMany({
      where: { projectId, archivedAt: { not: null } },
      include: taskInclude,
      orderBy: { archivedAt: "desc" },
    });
  },

  findById(id: string) {
    return prisma.task.findUnique({ where: { id }, include: taskInclude });
  },

  // Cross-project: everything assigned to a user, for their dashboard. Excludes
  // archived (finished/closed) work since a dashboard is about what still needs attention.
  findByAssignee(userId: string) {
    return prisma.task.findMany({
      where: { assigneeId: userId, archivedAt: null },
      include: {
        ...taskInclude,
        project: {
          select: { id: true, name: true, client: { select: { id: true, name: true } } },
        },
      },
      // Postgres puts NULLs last in ASC order, so undated tasks sort after dated ones.
      // Ties (same due date, e.g. two undated tasks) fall back to priority, high first.
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
    });
  },

  async nextPosition(projectId: string, status: TaskStatus) {
    const last = await prisma.task.findFirst({
      where: { projectId, status },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    return (last?.position ?? -1) + 1;
  },

  create(data: {
    title: string;
    description?: string;
    notes?: string;
    dueDate?: Date;
    projectId: string;
    assigneeId?: string;
    creatorId: string;
    status: TaskStatus;
    priority?: TaskPriority;
    type?: TaskType;
    archivedAt?: Date;
    position: number;
  }) {
    return prisma.task.create({ data, include: taskInclude });
  },

  update(
    id: string,
    data: Partial<{
      title: string;
      description: string | null;
      notes: string | null;
      status: TaskStatus;
      priority: TaskPriority;
      type: TaskType;
      dueDate: Date | null;
      assigneeId: string | null;
      position: number;
      archivedAt: Date;
    }>
  ) {
    return prisma.task.update({ where: { id }, data, include: taskInclude });
  },

  delete(id: string) {
    return prisma.task.delete({ where: { id } });
  },

  logActivity(data: { taskId: string; userId: string; action: string; details?: string }) {
    return prisma.taskActivity.create({ data });
  },

  findActivityByTask(taskId: string) {
    return prisma.taskActivity.findMany({
      where: { taskId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
  },
};
