import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { TaskCard } from "../components/TaskCard";
import { TaskModal } from "../components/TaskModal";
import { projectsApi } from "../api/projects";
import { tasksApi } from "../api/tasks";
import { usersApi } from "../api/users";
import { useAuth } from "../context/AuthContext";
import type { Project, PublicUser, Task, TaskStatus } from "../types";
import { ApiError } from "../api/client";
import { STATUS_LABEL } from "../taskLabels";

const BOARD_COLUMNS: { key: string; title: string; statuses: TaskStatus[] }[] = [
  { key: "TODO", title: STATUS_LABEL.TODO, statuses: ["TODO"] },
  { key: "IN_PROGRESS", title: STATUS_LABEL.IN_PROGRESS, statuses: ["IN_PROGRESS"] },
  { key: "FOR_REVIEW", title: STATUS_LABEL.FOR_REVIEW, statuses: ["FOR_REVIEW"] },
  { key: "CLOSED", title: "Done / Rejected", statuses: ["DONE", "REJECTED"] },
];

export function ProjectBoardPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allUsers, setAllUsers] = useState<PublicUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [creatingStatus, setCreatingStatus] = useState<TaskStatus | null>(null);
  const [addMemberId, setAddMemberId] = useState("");

  async function loadAll() {
    if (!id) return;
    setLoading(true);
    try {
      const [projectData, taskData, usersData] = await Promise.all([
        projectsApi.get(id),
        tasksApi.list(id),
        usersApi.list(),
      ]);
      setProject(projectData);
      setTasks(taskData);
      setAllUsers(usersData);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <p>Loading...</p>
      </Layout>
    );
  }

  if (error || !project) {
    return (
      <Layout>
        <div className="error-banner">{error ?? "Project not found"}</div>
      </Layout>
    );
  }

  const isOwner = project.ownerId === user?.id;
  const memberUserIds = new Set(project.members.map((m) => m.userId));
  const availableUsers = allUsers.filter((u) => !memberUserIds.has(u.id));
  const links = [
    { label: "Production", url: project.url },
    { label: "Staging", url: project.stagingUrl },
    { label: "Dev", url: project.devUrl },
  ].filter((l) => l.url);

  async function handleStatusChange(task: Task, status: TaskStatus) {
    await tasksApi.update(project!.id, task.id, { status });
    await loadAll();
  }

  async function handleArchive(task: Task) {
    if (!confirm("Archive this task? It can only be duplicated from the archive afterward, not edited.")) {
      return;
    }
    await tasksApi.archive(project!.id, task.id);
    await loadAll();
  }

  async function handleAddMember() {
    if (!addMemberId) return;
    await projectsApi.addMember(project!.id, addMemberId);
    setAddMemberId("");
    await loadAll();
  }

  async function handleRemoveMember(userId: string) {
    if (!confirm("Remove this member from the project?")) return;
    await projectsApi.removeMember(project!.id, userId);
    await loadAll();
  }

  async function handleDeleteProject() {
    if (!confirm("Delete this project and all its tasks? This cannot be undone.")) return;
    await projectsApi.remove(project!.id);
    navigate(`/clients/${project!.clientId}`);
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <p className="breadcrumb">
            <Link to="/clients">Clients</Link>
            {project.client && (
              <>
                {" / "}
                <Link to={`/clients/${project.client.id}`}>{project.client.name}</Link>
              </>
            )}
            {" / "}
            {project.name}
          </p>
          <h2>{project.name}</h2>
          {project.description && <p className="subtitle">{project.description}</p>}
        </div>
        <div className="page-header-actions">
          <button className="secondary" onClick={() => navigate(`/projects/${project!.id}/archive`)}>
            View archive
          </button>
          {isOwner && (
            <button className="danger" onClick={handleDeleteProject}>
              Delete project
            </button>
          )}
        </div>
      </div>

      <section className="members-panel">
        <div className="page-header" style={{ marginBottom: 8 }}>
          <h4>Project details</h4>
          <button onClick={() => navigate(`/projects/${project!.id}/edit`)}>Edit details</button>
        </div>

        {links.length > 0 && (
          <ul className="member-list">
            {links.map((l) => (
              <li key={l.label}>
                {l.label}:{" "}
                <a href={l.url!} target="_blank" rel="noopener noreferrer">
                  {l.url}
                </a>
              </li>
            ))}
          </ul>
        )}
        {project.notes && <p className="subtitle detail-multiline">{project.notes}</p>}
        {links.length === 0 && !project.notes && (
          <p className="empty-state">No links or notes yet.</p>
        )}
      </section>

      <section className="members-panel">
        <h4>Members</h4>
        <ul className="member-list">
          {project.members.map((m) => (
            <li key={m.userId}>
              {m.user.name} <span className="role-tag">{m.role}</span>
              {isOwner && m.role !== "OWNER" && (
                <button className="link-button" onClick={() => handleRemoveMember(m.userId)}>
                  remove
                </button>
              )}
            </li>
          ))}
        </ul>
        {isOwner && availableUsers.length > 0 && (
          <div className="inline-form">
            <select value={addMemberId} onChange={(e) => setAddMemberId(e.target.value)}>
              <option value="">Add a member...</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
            <button onClick={handleAddMember} disabled={!addMemberId}>
              Add
            </button>
          </div>
        )}
      </section>

      <div className="board">
        {BOARD_COLUMNS.map((column) => {
          const columnTasks = tasks.filter((t) => column.statuses.includes(t.status));
          return (
            <div key={column.key} className="board-column">
              <div className="board-column-header">
                <h4>{column.title}</h4>
                <span className="count">{columnTasks.length}</span>
              </div>
              <div className="board-column-body">
                {columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => setEditingTask(task)}
                    onStatusChange={(newStatus) => handleStatusChange(task, newStatus)}
                    onArchive={() => handleArchive(task)}
                  />
                ))}
              </div>
              <button className="add-task-button" onClick={() => setCreatingStatus(column.statuses[0])}>
                + Add task
              </button>
            </div>
          );
        })}
      </div>

      {(editingTask || creatingStatus) && (
        <TaskModal
          projectId={project.id}
          members={project.members}
          task={editingTask ?? undefined}
          defaultStatus={creatingStatus ?? undefined}
          onClose={() => {
            setEditingTask(null);
            setCreatingStatus(null);
          }}
          onSaved={() => {
            setEditingTask(null);
            setCreatingStatus(null);
            loadAll();
          }}
        />
      )}
    </Layout>
  );
}
