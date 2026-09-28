import { prisma } from "../../config/prisma";
import { TaskStatus } from "@prisma/client";

const CLOSED_STATUSES: TaskStatus[] = ["DONE", "REJECTED"];

function accessibleProjectsFilter(userId: string) {
  return { OR: [{ ownerId: userId }, { members: { some: { userId } } }] };
}

export const reportRepository = {
  async accessibleProjectIds(userId: string) {
    const projects = await prisma.project.findMany({
      where: accessibleProjectsFilter(userId),
      select: { id: true },
    });
    return projects.map((p) => p.id);
  },

  findTimeEntries(params: {
    projectIds: string[];
    from: Date;
    to: Date;
    userId?: string;
    projectId?: string;
    clientId?: string;
  }) {
    return prisma.timeEntry.findMany({
      where: {
        date: { gte: params.from, lte: params.to },
        userId: params.userId,
        task: {
          projectId: params.projectId ?? { in: params.projectIds },
          project: params.clientId ? { clientId: params.clientId } : undefined,
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            project: {
              select: { id: true, name: true, client: { select: { id: true, name: true } } },
            },
          },
        },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });
  },

  findPendingTasks(params: {
    projectIds: string[];
    projectId?: string;
    clientId?: string;
    assigneeId?: string;
  }) {
    return prisma.task.findMany({
      where: {
        projectId: params.projectId ?? { in: params.projectIds },
        archivedAt: null,
        status: { notIn: CLOSED_STATUSES },
        assigneeId: params.assigneeId,
        project: params.clientId ? { clientId: params.clientId } : undefined,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        project: {
          select: { id: true, name: true, client: { select: { id: true, name: true } } },
        },
      },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
    });
  },
};
