import { useEffect, useState } from "react";
import type { Task } from "../types";
import { tasksApi } from "../api/tasks";
import { ApiError } from "../api/client";
import { PRIORITY_LABEL, STATUS_LABEL, TYPE_LABEL } from "../taskLabels";

interface Props {
  projectId: string;
  taskId: string;
  onClose: () => void;
}

// Read-only view for the Reports and Dashboard pages, so people can check a task
// without leaving the page or risking an accidental edit.
export function TaskDetailsModal({ projectId, taskId, onClose }: Props) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    tasksApi
      .get(projectId, taskId)
      .then(setTask)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load task"))
      .finally(() => setLoading(false));
  }, [projectId, taskId]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal-wide modal-scroll"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Task details</h3>
        <div className="modal-body">
          {loading ? (
            <p>Loading...</p>
          ) : error || !task ? (
            <div className="error-banner">{error ?? "Task not found"}</div>
          ) : (
            <dl className="detail-list">
              <dt>Title</dt>
              <dd>{task.title}</dd>
              <dt>Type</dt>
              <dd>{TYPE_LABEL[task.type]}</dd>
              <dt>Status</dt>
              <dd>{STATUS_LABEL[task.status]}</dd>
              <dt>Priority</dt>
              <dd>{PRIORITY_LABEL[task.priority]}</dd>
              <dt>Assignee</dt>
              <dd>{task.assignee?.name ?? "Unassigned"}</dd>
              <dt>Due date</dt>
              <dd>
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString()
                  : "—"}
              </dd>
              {task.description && (
                <>
                  <dt>Description</dt>
                  <dd className="detail-multiline">{task.description}</dd>
                </>
              )}
              {task.notes && (
                <>
                  <dt>Notes</dt>
                  <dd className="detail-multiline">{task.notes}</dd>
                </>
              )}
            </dl>
          )}
        </div>
        <div className="modal-actions">
          <div className="spacer" />
          <button type="button" className="secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
