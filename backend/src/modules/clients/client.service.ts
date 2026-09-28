import { ForbiddenError, NotFoundError } from "../../middleware/errors";
import { clientRepository } from "./client.repository";
import { projectService } from "../projects/project.service";
import type { CreateProjectInput } from "../projects/project.schemas";

async function getAccessibleClient(clientId: string, userId: string) {
  const client = await clientRepository.findById(clientId);
  if (!client) {
    throw new NotFoundError("Client not found");
  }
  const hasAccess =
    client.creatorId === userId ||
    client.projects.some(
      (p) => p.ownerId === userId || p.members.some((m) => m.userId === userId)
    );
  if (!hasAccess) {
    throw new ForbiddenError("You do not have access to this client");
  }
  return client;
}

export const clientService = {
  listForUser(userId: string) {
    return clientRepository.findForUser(userId);
  },

  async getById(clientId: string, userId: string) {
    return getAccessibleClient(clientId, userId);
  },

  create(
    userId: string,
    data: {
      name: string;
      notes?: string;
      contactName?: string;
      contactEmail?: string;
      contactPhone?: string;
      billingAddress?: string;
    }
  ) {
    return clientRepository.create({ ...data, creatorId: userId });
  },

  async update(
    clientId: string,
    userId: string,
    data: Partial<{
      name: string;
      notes: string | null;
      contactName: string | null;
      contactEmail: string | null;
      contactPhone: string | null;
      billingAddress: string | null;
    }>
  ) {
    const client = await getAccessibleClient(clientId, userId);
    if (client.creatorId !== userId) {
      throw new ForbiddenError("Only the client's creator can edit it");
    }
    return clientRepository.update(client.id, data);
  },

  async delete(clientId: string, userId: string) {
    const client = await getAccessibleClient(clientId, userId);
    if (client.creatorId !== userId) {
      throw new ForbiddenError("Only the client's creator can delete it");
    }
    await clientRepository.delete(client.id);
  },

  async createProject(clientId: string, userId: string, data: CreateProjectInput) {
    await getAccessibleClient(clientId, userId);
    return projectService.create(clientId, data, userId);
  },
};
