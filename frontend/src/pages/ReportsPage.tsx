import { useEffect, useMemo, useState } from "react";
import { Layout } from "../components/Layout";
import { TaskDetailsModal } from "../components/TaskDetailsModal";
import { reportsApi } from "../api/reports";
import { usersApi } from "../api/users";
import { clientsApi } from "../api/clients";
import type { Client, PendingTask, PublicUser, ReportSummary } from "../types";
import { ApiError } from "../api/client";
import { PRIORITY_LABEL, STATUS_LABEL, statusClass } from "../taskLabels";
import { formatLocalDate, formatTimeRange, todayLocalDate } from "../utils/timeEntry";

function iconProps() {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "section-icon",
  };
}

function FilterIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M4 5h16l-6 8v5l-4 2v-7L4 5z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg {...iconProps()}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6z" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M3 21V8l7-4 7 4v13" />
      <path d="M13 21V13h4v8" />
      <path d="M7 9h.01M7 12h.01M7 15h.01" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg {...iconProps()}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
    </svg>
  );
}

function ChecklistIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="m3 6 1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 16" />
    </svg>
  );
}

type GroupBy = "none" | "project" | "client";

function startOfWeek() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return formatLocalDate(d);
}

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  return formatLocalDate(d);
}

function groupPending(tasks: PendingTask[], groupBy: GroupBy) {
  if (groupBy === "none") {
    return [{ key: "all", label: "", items: tasks }];
  }
  const map = new Map<string, { key: string; label: string; items: PendingTask[] }>();
  for (const t of tasks) {
    const key = groupBy === "project" ? t.project.id : t.project.client.id;
    const label = groupBy === "project" ? t.project.name : t.project.client.name;
    const group = map.get(key) ?? { key, label, items: [] };
    group.items.push(t);
    map.set(key, group);
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export function ReportsPage() {
  const [from, setFrom] = useState(todayLocalDate());
  const [to, setTo] = useState(todayLocalDate());
  const [personId, setPersonId] = useState("");
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [pendingGroupBy, setPendingGroupBy] = useState<GroupBy>("project");

  const [users, setUsers] = useState<PublicUser[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [pending, setPending] = useState<PendingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<{ projectId: string; taskId: string } | null>(null);

  useEffect(() => {
    Promise.all([usersApi.list(), clientsApi.list()])
      .then(([userData, clientData]) => {
        setUsers(userData);
        setClients(clientData);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load filters"));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      reportsApi.summary({
        from,
        to,
        userId: personId || undefined,
        clientId: clientId || undefined,
        projectId: projectId || undefined,
      }),
      reportsApi.pending({
        clientId: clientId || undefined,
        projectId: projectId || undefined,
        assigneeId: personId || undefined,
      }),
    ])
      .then(([summaryData, pendingData]) => {
        setSummary(summaryData);
        setPending(pendingData);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load reports"))
      .finally(() => setLoading(false));
  }, [from, to, personId, clientId, projectId]);

  const availableProjects = useMemo(() => {
    const source = clientId ? clients.filter((c) => c.id === clientId) : clients;
    return source.flatMap((c) => c.projects.map((p) => ({ ...p, clientName: c.name })));
  }, [clients, clientId]);

  const pendingGroups = groupPending(pending, pendingGroupBy);

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h2>Reports</h2>
          <p className="subtitle">See what got done, how many hours it took, and what's still open.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <section className="members-panel">
        <h4>
          <FilterIcon />
          Filters
        </h4>
        <div className="report-filters">
          <div className="report-filters-row">
            <label>
              From
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </label>
            <label>
              To
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </label>
            <div className="report-presets">
              <button
                type="button"
                className="secondary btn-sm"
                onClick={() => {
                  setFrom(todayLocalDate());
                  setTo(todayLocalDate());
                }}
              >
                Today
              </button>
              <button
                type="button"
                className="secondary btn-sm"
                onClick={() => {
                  setFrom(startOfWeek());
                  setTo(todayLocalDate());
                }}
              >
                This week
              </button>
              <button
                type="button"
                className="secondary btn-sm"
                onClick={() => {
                  setFrom(startOfMonth());
                  setTo(todayLocalDate());
                }}
              >
                This month
              </button>
            </div>
          </div>
          <div className="report-filters-row">
            <label className="report-filter-wide">
              Person
              <select value={personId} onChange={(e) => setPersonId(e.target.value)}>
                <option value="">All people</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="report-filter-wide">
              Client
              <select
                value={clientId}
                onChange={(e) => {
                  setClientId(e.target.value);
                  setProjectId("");
                }}
              >
                <option value="">All clients</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="report-filter-wide">
              Project
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                <option value="">All projects</option>
                {availableProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className="members-panel">
        <h4>
          <ClockIcon />
          Time logged
        </h4>
        {loading ? (
          <p>Loading...</p>
        ) : !summary || summary.entries.length === 0 ? (
          <p className="empty-state">No time logged in this range.</p>
        ) : (
          <div className="report-table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Person</th>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Hours</th>
                </tr>
              </thead>
              <tbody>
                {summary.entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{new Date(entry.date).toLocaleDateString()}</td>
                    <td>{formatTimeRange(entry.startTime, entry.endTime) ?? ""}</td>
                    <td>{entry.user.name}</td>
                    <td>
                      <button
                        type="button"
                        className="link-button"
                        onClick={() =>
                          setSelectedTask({ projectId: entry.task.project.id, taskId: entry.task.id })
                        }
                      >
                        {entry.task.title}
                      </button>
                    </td>
                    <td>{entry.task.project.name}</td>
                    <td>{entry.task.project.client.name}</td>
                    <td>
                      <span className="hours-pill">{entry.hours}h</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={6}>Total</td>
                  <td>
                    <span className="hours-pill">{summary.totalHours}h</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      <div className="report-breakdown-grid">
        <section className="members-panel">
          <h4>
            <FolderIcon />
            Hours by project
          </h4>
          {!summary || summary.byProject.length === 0 ? (
            <p className="empty-state">No data.</p>
          ) : (
            <table className="report-table report-table-compact">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Hours</th>
                </tr>
              </thead>
              <tbody>
                {summary.byProject.map((row) => (
                  <tr key={row.projectId}>
                    <td title={row.projectName}>{row.projectName}</td>
                    <td title={row.clientName}>{row.clientName}</td>
                    <td>
                      <span className="hours-pill">{row.hours}h</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="members-panel">
          <h4>
            <BuildingIcon />
            Hours by client
          </h4>
          {!summary || summary.byClient.length === 0 ? (
            <p className="empty-state">No data.</p>
          ) : (
            <table className="report-table report-table-compact">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Hours</th>
                </tr>
              </thead>
              <tbody>
                {summary.byClient.map((row) => (
                  <tr key={row.clientId}>
                    <td title={row.clientName}>{row.clientName}</td>
                    <td>
                      <span className="hours-pill">{row.hours}h</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="members-panel">
          <h4>
            <UserIcon />
            Hours by person
          </h4>
          {!summary || summary.byUser.length === 0 ? (
            <p className="empty-state">No data.</p>
          ) : (
            <table className="report-table report-table-compact">
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Hours</th>
                </tr>
              </thead>
              <tbody>
                {summary.byUser.map((row) => (
                  <tr key={row.userId}>
                    <td title={row.userName}>{row.userName}</td>
                    <td>
                      <span className="hours-pill">{row.hours}h</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <section className="members-panel">
        <div className="page-header" style={{ marginBottom: 8 }}>
          <h4>
            <ChecklistIcon />
            Pending tasks
          </h4>
          <select value={pendingGroupBy} onChange={(e) => setPendingGroupBy(e.target.value as GroupBy)}>
            <option value="none">No grouping</option>
            <option value="project">Group by project</option>
            <option value="client">Group by client</option>
          </select>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : pending.length === 0 ? (
          <p className="empty-state">Nothing pending — everything in scope is done or rejected.</p>
        ) : (
          pendingGroups.map((group) => (
            <div key={group.key} className="report-group">
              {group.label && (
                <h5 className="report-group-header">
                  {group.label} <span className="count">{group.items.length}</span>
                </h5>
              )}
              <div className="task-row-list">
                {group.items.map((t) => {
                  const priorityClass = `priority-${t.priority.toLowerCase()}`;
                  return (
                    <div key={t.id} className={`task-row ${statusClass(t.status)}`}>
                      <button
                        type="button"
                        className="task-row-link"
                        onClick={() => setSelectedTask({ projectId: t.project.id, taskId: t.id })}
                      >
                        <span className={`priority-badge ${priorityClass}`}>
                          {PRIORITY_LABEL[t.priority]}
                        </span>
                        <div className="task-row-main">
                          <p className="task-title">{t.title}</p>
                          <p className="task-row-meta">
                            <span className="meta-client">
                              <span className="meta-label">Client:</span> {t.project.client.name}
                            </span>
                            <span className="meta-sep">·</span>
                            <span className="meta-project">
                              <span className="meta-label">Project:</span> {t.project.name}
                            </span>
                            {t.assignee && <> · {t.assignee.name}</>}
                          </p>
                        </div>
                        <span className="role-tag">{STATUS_LABEL[t.status]}</span>
                        {t.dueDate && (
                          <span className={`task-due ${t.isOverdue ? "overdue" : ""}`}>
                            Due {new Date(t.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </section>

      {selectedTask && (
        <TaskDetailsModal
          projectId={selectedTask.projectId}
          taskId={selectedTask.taskId}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </Layout>
  );
}
