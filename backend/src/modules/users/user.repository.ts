import { prisma } from "../../config/prisma";

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  findAll() {
    return prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });
  },

  create(data: { email: string; name: string; passwordHash: string }) {
    return prisma.user.create({ data });
  },
};
