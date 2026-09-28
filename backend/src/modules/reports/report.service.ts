import { BadRequestError, ForbiddenError } from "../../middleware/errors";
import { reportRepository } from "./report.repository";

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

// Summing rounded hours (e.g. 0.17 + 0.92 + 0.32) drifts into results like
// 1.4100000000000001 due to floating-point addition - round back to 2 decimals for display.
function round2(n: number) {
  return Math.round(n * 100) / 100;
}

interface GroupTotal {
  hours: number;
  entryCount: number;
}

export const reportService = {
  async summary(
    userId: string,
    params: { from?: Date; to?: Date; userId?: string; projectId?: string; clientId?: string }
  ) {
    const projectIds = await reportRepository.accessibleProjectIds(userId);
    if (params.projectId && !projectIds.includes(params.projectId)) {
      throw new ForbiddenError("You do not have access to this project");
    }
    const today = new Date();
    const from = startOfDay(params.from ?? today);
    const to = endOfDay(params.to ?? params.from ?? today);
    if (from > to) {
      throw new BadRequestError("'from' date must not be after 'to' date");
    }

    const entries = await reportRepository.findTimeEntries({
      projectIds,
      from,
      to,
      userId: params.userId,
      projectId: params.projectId,
      clientId: params.clientId,
    });

    const totalHours = round2(entries.reduce((sum, e) => sum + e.hours, 0));

    const byProject = new Map<string, GroupTotal & { projectId: string; projectName: string; clientId: string; clientName: string }>();
    const byClient = new Map<string, GroupTotal & { clientId: string; clientName: string }>();
    const byUser = new Map<string, GroupTotal & { userId: string; userName: string }>();

    for (const entry of entries) {
      const { project } = entry.task;
      const { client } = project;

      const projectRow = byProject.get(project.id) ?? {
        projectId: project.id,
        projectName: project.name,
        clientId: client.id,
        clientName: client.name,
        hours: 0,
        entryCount: 0,
      };
      projectRow.hours += entry.hours;
      projectRow.entryCount += 1;
      byProject.set(project.id, projectRow);

      const clientRow = byClient.get(client.id) ?? {
        clientId: client.id,
        clientName: client.name,
        hours: 0,
        entryCount: 0,
      };
      clientRow.hours += entry.hours;
      clientRow.entryCount += 1;
      byClient.set(client.id, clientRow);

      const userRow = byUser.get(entry.user.id) ?? {
        userId: entry.user.id,
        userName: entry.user.name,
        hours: 0,
        entryCount: 0,
      };
      userRow.hours += entry.hours;
      userRow.entryCount += 1;
      byUser.set(entry.user.id, userRow);
    }

    return {
      range: { from: from.toISOString(), to: to.toISOString() },
      totalHours,
      entries,
      byProject: [...byProject.values()]
        .map((row) => ({ ...row, hours: round2(row.hours) }))
        .sort((a, b) => b.hours - a.hours),
      byClient: [...byClient.values()]
        .map((row) => ({ ...row, hours: round2(row.hours) }))
        .sort((a, b) => b.hours - a.hours),
      byUser: [...byUser.values()]
        .map((row) => ({ ...row, hours: round2(row.hours) }))
        .sort((a, b) => b.hours - a.hours),
    };
  },

  async pending(userId: string, params: { projectId?: string; clientId?: string; assigneeId?: string }) {
    const projectIds = await reportRepository.accessibleProjectIds(userId);
    if (params.projectId && !projectIds.includes(params.projectId)) {
      throw new ForbiddenError("You do not have access to this project");
    }

    const tasks = await reportRepository.findPendingTasks({ projectIds, ...params });
    const now = new Date();
    return tasks.map((task) => ({
      ...task,
      isOverdue: Boolean(task.dueDate && new Date(task.dueDate) < now),
    }));
  },
};
