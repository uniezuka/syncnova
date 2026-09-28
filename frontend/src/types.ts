export type TaskStatus = "TODO" | "IN_PROGRESS" | "FOR_REVIEW" | "REJECTED" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";
export type TaskType = "TASK" | "BUG" | "FEATURE" | "CHORE" | "IMPROVEMENT" | "DOCUMENTATION";

export interface PublicUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthResult {
  user: PublicUser;
  token: string;
}

export interface ProjectMember {
  id: string;
  userId: string;
  role: "OWNER" | "MEMBER";
  user: PublicUser;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  notes: string | null;
  url: string | null;
  stagingUrl: string | null;
  devUrl: string | null;
  clientId: string;
  client?: { id: string; name: string };
  ownerId: string;
  owner: PublicUser;
  members: ProjectMember[];
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  notes: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  billingAddress: string | null;
  creatorId: string;
  projects: Project[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  dueDate: string | null;
  position: number;
  archivedAt: string | null;
  projectId: string;
  assigneeId: string | null;
  assignee: PublicUser | null;
  creator: PublicUser;
  createdAt: string;
  updatedAt: string;
}

export interface AssignedTask extends Task {
  project: { id: string; name: string; client: { id: string; name: string } };
}

export interface TaskActivityEntry {
  id: string;
  taskId: string;
  userId: string;
  user: PublicUser;
  action: string;
  details: string | null;
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  user: PublicUser;
  date: string;
  startTime: string | null;
  endTime: string | null;
  hours: number;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportEntry {
  id: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  hours: number;
  note: string | null;
  user: PublicUser;
  task: {
    id: string;
    title: string;
    status: TaskStatus;
    project: { id: string; name: string; client: { id: string; name: string } };
  };
}

export interface ProjectReportTotal {
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string;
  hours: number;
  entryCount: number;
}

export interface ClientReportTotal {
  clientId: string;
  clientName: string;
  hours: number;
  entryCount: number;
}

export interface UserReportTotal {
  userId: string;
  userName: string;
  hours: number;
  entryCount: number;
}

export interface ReportSummary {
  range: { from: string; to: string };
  totalHours: number;
  entries: ReportEntry[];
  byProject: ProjectReportTotal[];
  byClient: ClientReportTotal[];
  byUser: UserReportTotal[];
}

export interface PendingTask extends AssignedTask {
  isOverdue: boolean;
}
