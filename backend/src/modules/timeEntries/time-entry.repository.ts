import { prisma } from "../../config/prisma";

const entryInclude = {
  user: { select: { id: true, name: true, email: true } },
};

export const timeEntryRepository = {
  findByTask(taskId: string) {
    return prisma.timeEntry.findMany({
      where: { taskId },
      include: entryInclude,
      orderBy: { date: "desc" },
    });
  },

  findById(id: string) {
    return prisma.timeEntry.findUnique({ where: { id }, include: entryInclude });
  },

  create(data: {
    taskId: string;
    userId: string;
    date: Date;
    startTime?: Date;
    endTime?: Date;
    hours: number;
    note?: string;
  }) {
    return prisma.timeEntry.create({ data, include: entryInclude });
  },

  update(
    id: string,
    data: Partial<{
      date: Date;
      startTime: Date;
      endTime: Date;
      hours: number;
      note: string | null;
    }>
  ) {
    return prisma.timeEntry.update({ where: { id }, data, include: entryInclude });
  },

  delete(id: string) {
    return prisma.timeEntry.delete({ where: { id } });
  },
};
