import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { Task, TaskPriority, TaskStatus, TaskType, ProjectMember } from "../types";
import { tasksApi } from "../api/tasks";
import type { TaskInput } from "../api/tasks";
import { ApiError } from "../api/client";
import { ARCHIVABLE_STATUSES, PRIORITY_LABEL, STATUS_LABEL, STATUS_ORDER, TYPE_LABEL } from "../taskLabels";

interface Props {
  projectId: string;
  members: ProjectMember[];
  task?: Task;
  defaultStatus?: TaskStatus;
  onClose: () => void;
  onSaved: () => void;
}

// Quick-edit for the handful of fields you change most often from the board. Anything
// else (description, notes, activity history) lives on the full task page instead,
// so this stays short no matter how much detail a task accumulates over time.
export function TaskModal({ projectId, members, task, defaultStatus, onClose, onSaved }: Props) {
  const navigate = useNavigate();

  const [title, setTitle] = useState(task?.title ?? "");
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId ?? "");
  const [dueDate, setDueDate] = useState(task?.dueDate ? task.dueDate.slice(0, 10) : "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? defaultStatus ?? "TODO");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "MEDIUM");
  const [type, setType] = useState<TaskType>(task?.type ?? "TASK");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const data: TaskInput = {
      title,
      assigneeId: assigneeId || null,
      dueDate: dueDate || undefined,
      status,
      priority,
      type,
    };
    try {
      if (task) {
        await tasksApi.update(projectId, task.id, data);
      } else {
        await tasksApi.create(projectId, data);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save task");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!task) return;
    if (!confirm("Delete this task?")) return;
    await tasksApi.remove(projectId, task.id);
    onSaved();
  }

  async function handleArchive() {
    if (!task) return;
    if (!confirm("Archive this task? It can only be duplicated from the archive afterward, not edited.")) {
      return;
    }
    setError(null);
    try {
      await tasksApi.archive(projectId, task.id);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to archive task");
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h3>{task ? "Edit task" : "New task"}</h3>
        {error && <div className="error-banner">{error}</div>}
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
        </label>
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Priority
          <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
            {Object.entries(PRIORITY_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Type
          <select value={type} onChange={(e) => setType(e.target.value as TaskType)}>
            {Object.entries(TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Assignee
          <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.user.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Due date
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </label>

        {task && (
          <button
            type="button"
            className="link-button more-details-link"
            onClick={() => navigate(`/projects/${projectId}/tasks/${task.id}`)}
          >
            Description, notes, activity...
          </button>
        )}

        <div className="modal-actions">
          {task && (
            <button type="button" className="danger" onClick={handleDelete}>
              Delete
            </button>
          )}
          {task && ARCHIVABLE_STATUSES.includes(task.status) && (
            <button type="button" className="secondary" onClick={handleArchive}>
              Archive
            </button>
          )}
          <div className="spacer" />
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
