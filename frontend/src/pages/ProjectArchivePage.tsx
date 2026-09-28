import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { projectsApi } from "../api/projects";
import { tasksApi } from "../api/tasks";
import type { Project, Task } from "../types";
import { ApiError } from "../api/client";
import { PRIORITY_LABEL, STATUS_LABEL, TYPE_LABEL, statusClass } from "../taskLabels";
import { TaskTypeIcon } from "../components/TaskTypeIcon";

export function ProjectArchivePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([projectsApi.get(id), tasksApi.listArchived(id)])
      .then(([projectData, archivedTasks]) => {
        setProject(projectData);
        setTasks(archivedTasks);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load archive"))
      .finally(() => setLoading(false));
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

  return (
    <Layout>
      <p className="breadcrumb">
        <Link to="/clients">Clients</Link>
        {project.client && (
          <>
            {" / "}
            <Link to={`/clients/${project.client.id}`}>{project.client.name}</Link>
          </>
        )}
        {" / "}
        <Link to={`/projects/${project.id}`}>{project.name}</Link> / Archive
      </p>
      <h2>Archive</h2>
      <p className="subtitle">
        Tasks archived from Done or Rejected end up here. They can't be edited, but can be
        duplicated into a fresh To do task, or deleted for good.
      </p>

      {tasks.length === 0 ? (
        <p className="empty-state">No archived tasks yet.</p>
      ) : (
        <div className="task-row-list">
          {tasks.map((task) => {
            const priorityClass = `priority-${task.priority.toLowerCase()}`;
            return (
              <button
                key={task.id}
                className={`task-row task-row-button ${statusClass(task.status)}`}
                onClick={() => navigate(`/projects/${project.id}/tasks/${task.id}`)}
              >
                <span className={`priority-badge ${priorityClass}`}>
                  {PRIORITY_LABEL[task.priority]}
                </span>
                <div className="task-row-main">
                  <p className="task-title">{task.title}</p>
                  <p className="task-row-meta">
                    <span className="meta-type">
                      <TaskTypeIcon type={task.type} /> {TYPE_LABEL[task.type]}
                    </span>
                    {task.assignee && ` · ${task.assignee.name}`}
                  </p>
                </div>
                <span className="role-tag">{STATUS_LABEL[task.status]}</span>
                {task.archivedAt && (
                  <span className="task-row-meta">
                    Archived {new Date(task.archivedAt).toLocaleDateString()}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
