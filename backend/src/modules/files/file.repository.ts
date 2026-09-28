import { prisma } from "../../config/prisma";

export const fileRepository = {
  findByProject(projectId: string) {
    return prisma.projectFile.findMany({
      where: { projectId },
      include: { uploadedBy: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  findById(id: string) {
    return prisma.projectFile.findUnique({ where: { id } });
  },

  create(data: {
    projectId: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    size: number;
    uploadedById: string;
  }) {
    return prisma.projectFile.create({
      data,
      include: { uploadedBy: { select: { id: true, name: true, email: true } } },
    });
  },

  delete(id: string) {
    return prisma.projectFile.delete({ where: { id } });
  },

  setFilesFolder(projectId: string, folder: string) {
    return prisma.project.update({ where: { id: projectId }, data: { filesFolder: folder } });
  },

  findByFilesFolder(folder: string, excludeProjectId: string) {
    return prisma.project.findFirst({
      where: { filesFolder: folder, id: { not: excludeProjectId } },
      select: { id: true },
    });
  },
};
