import { prisma } from "../../config/prisma";

const projectsInclude = {
  projects: {
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
    orderBy: { createdAt: "desc" as const },
  },
};

export const clientRepository = {
  findForUser(userId: string) {
    return prisma.client.findMany({
      where: {
        OR: [{ creatorId: userId }, { projects: { some: { members: { some: { userId } } } } }],
      },
      include: projectsInclude,
      orderBy: { createdAt: "desc" },
    });
  },

  findById(id: string) {
    return prisma.client.findUnique({
      where: { id },
      include: projectsInclude,
    });
  },

  create(data: {
    name: string;
    creatorId: string;
    notes?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    billingAddress?: string;
  }) {
    return prisma.client.create({ data, include: projectsInclude });
  },

  update(
    id: string,
    data: Partial<{
      name: string;
      notes: string | null;
      contactName: string | null;
      contactEmail: string | null;
      contactPhone: string | null;
      billingAddress: string | null;
    }>
  ) {
    return prisma.client.update({ where: { id }, data, include: projectsInclude });
  },

  delete(id: string) {
    return prisma.client.delete({ where: { id } });
  },
};
