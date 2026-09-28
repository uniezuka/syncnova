import { ForbiddenError, NotFoundError } from "../../middleware/errors";
import { projectRepository } from "./project.repository";

interface ProjectDetailInput {
  name?: string;
  description?: string | null;
  notes?: string | null;
  url?: string | null;
  stagingUrl?: string | null;
  devUrl?: string | null;
}

async function getAccessibleProject(projectId: string, userId: string) {
  const project = await projectRepository.findById(projectId);
  if (!project) {
    throw new NotFoundError("Project not found");
  }
  const isMember = project.ownerId === userId || project.members.some((m) => m.userId === userId);
  if (!isMember) {
    throw new ForbiddenError("You do not have access to this project");
  }
  return project;
}

export const projectService = {
  async getById(projectId: string, userId: string) {
    return getAccessibleProject(projectId, userId);
  },

  create(clientId: string, data: ProjectDetailInput & { name: string }, ownerId: string) {
    return projectRepository.create({ ...data, clientId, ownerId });
  },

  async update(projectId: string, userId: string, data: ProjectDetailInput) {
    const project = await getAccessibleProject(projectId, userId);
    return projectRepository.update(project.id, data);
  },

  async delete(projectId: string, userId: string) {
    const project = await getAccessibleProject(projectId, userId);
    if (project.ownerId !== userId) {
      throw new ForbiddenError("Only the project owner can delete this project");
    }
    await projectRepository.delete(project.id);
  },

  async addMember(projectId: string, userId: string, newMemberId: string) {
    const project = await getAccessibleProject(projectId, userId);
    if (project.ownerId !== userId) {
      throw new ForbiddenError("Only the project owner can add members");
    }
    await projectRepository.addMember(project.id, newMemberId);
    return projectRepository.findById(project.id);
  },

  async removeMember(projectId: string, userId: string, memberId: string) {
    const project = await getAccessibleProject(projectId, userId);
    if (project.ownerId !== userId) {
      throw new ForbiddenError("Only the project owner can remove members");
    }
    if (memberId === project.ownerId) {
      throw new ForbiddenError("Cannot remove the project owner");
    }
    await projectRepository.removeMember(project.id, memberId);
    return projectRepository.findById(project.id);
  },

  // Exposed so other modules (tasks) can check access without duplicating the rule.
  checkAccess(projectId: string, userId: string) {
    return getAccessibleProject(projectId, userId);
  },
};
