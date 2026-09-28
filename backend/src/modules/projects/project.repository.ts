import { prisma } from "../../config/prisma";

interface ProjectDetailFields {
  name: string;
  description: string | null;
  notes: string | null;
  url: string | null;
  stagingUrl: string | null;
  devUrl: string | null;
}

const memberInclude = {
  members: {
    include: { user: { select: { id: true, name: true, email: true } } },
  },
  owner: { select: { id: true, name: true, email: true } },
  client: { select: { id: true, name: true } },
};

export const projectRepository = {
  findById(id: string) {
    return prisma.project.findUnique({
      where: { id },
      include: memberInclude,
    });
  },

  isMember(projectId: string, userId: string) {
    return prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
      select: { id: true },
    });
  },

  create(data: Partial<ProjectDetailFields> & { name: string; clientId: string; ownerId: string }) {
    return prisma.project.create({
      data: {
        ...data,
        members: {
          create: { userId: data.ownerId, role: "OWNER" },
        },
      },
      include: memberInclude,
    });
  },

  update(id: string, data: Partial<ProjectDetailFields>) {
    return prisma.project.update({ where: { id }, data, include: memberInclude });
  },

  delete(id: string) {
    return prisma.project.delete({ where: { id } });
  },

  addMember(projectId: string, userId: string) {
    return prisma.projectMember.upsert({
      where: { projectId_userId: { projectId, userId } },
      update: {},
      create: { projectId, userId, role: "MEMBER" },
    });
  },

  removeMember(projectId: string, userId: string) {
    return prisma.projectMember.deleteMany({ where: { projectId, userId } });
  },
};
