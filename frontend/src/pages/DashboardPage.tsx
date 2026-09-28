import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { tasksApi } from "../api/tasks";
import { timeEntriesApi } from "../api/timeEntries";
import { reportsApi } from "../api/reports";
import type { AssignedTask, ReportSummary } from "../types";
import { ApiError } from "../api/client";
import { PRIORITY_LABEL, STATUS_LABEL, TYPE_LABEL, statusClass } from "../taskLabels";
import { TaskTypeIcon } from "../components/TaskTypeIcon";
import {
  combineDateAndTime,
  compareRecentFirst,
  formatTimeRange,
  previewHours,
  todayLocalDate,
} from "../utils/timeEntry";

const ALL_TIME_FROM = "2000-01-01";

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="task-time-log-icon"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<AssignedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [quickStart, setQuickStart] = useState("");
  const [quickEnd, setQuickEnd] = useState("");
  const [quickNote, setQuickNote] = useState("");
  const [quickLogError, setQuickLogError] = useState<string | null>(null);
  const [loggingTaskId, setLoggingTaskId] = useState<string | null>(null);

  const [clientFilter, setClientFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");

  const [timeSummary, setTimeSummary] = useState<ReportSummary | null>(null);
  // Every task's "Time logged" starts collapsed; expanding one adds its id here.
  const [openTimeLogs, setOpenTimeLogs] = useState<Set<string>>(new Set());

  function setTaskTimeLogOpen(taskId: string, open: boolean) {
    setOpenTimeLogs((prev) => {
      const next = new Set(prev);
      if (open) {
        next.add(taskId);
      } else {
        next.delete(taskId);
      }
      return next;
    });
  }

  function loadTasks() {
    setLoading(true);
    return tasksApi
      .mine()
      .then(setTasks)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load tasks"))
      .finally(() => setLoading(false));
  }

  function loadTimeLog() {
    if (!user) return Promise.resolve();
    // The API defaults to today when no range is given, so pass an early start date to get
    // all time logged.
    return reportsApi
      .summary({ from: ALL_TIME_FROM, to: todayLocalDate(), userId: user.id })
      .then(setTimeSummary)
      .catch(() => {});
  }

  useEffect(() => {
    loadTasks();
    loadTimeLog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  function openQuickLog(taskId: string) {
    setOpenTaskId(taskId);
    setQuickStart("");
    setQuickEnd("");
    setQuickNote("");
    setQuickLogError(null);
  }

  async function handleQuickLog(e: FormEvent, task: AssignedTask) {
    e.preventDefault();
    if (!quickStart && !quickEnd) {
      setQuickLogError("Enter a start time or an end time");
      return;
    }
    const today = todayLocalDate();
    const startTime = quickStart ? combineDateAndTime(today, quickStart) : undefined;
    const endTime = quickEnd ? combineDateAndTime(today, quickEnd) : undefined;
    if (startTime && endTime && new Date(endTime) <= new Date(startTime)) {
      setQuickLogError("End time must be after start time");
      return;
    }
    setLoggingTaskId(task.id);
    setQuickLogError(null);
    try {
      await timeEntriesApi.create(task.project.id, task.id, {
        date: today,
        startTime,
        endTime,
        note: quickNote || undefined,
      });
      if (task.status === "TODO") {
        await tasksApi.update(task.project.id, task.id, { status: "IN_PROGRESS" });
      }
      setOpenTaskId(null);
      await Promise.all([loadTasks(), loadTimeLog()]);
    } catch (err) {
      setQuickLogError(err instanceof ApiError ? err.message : "Failed to log time");
    } finally {
      setLoggingTaskId(null);
    }
  }

  // Filter options come from the tasks themselves, so only clients/projects with open tasks show.
  const clientOptions = [...new Map(tasks.map((t) => [t.project.client.id, t.project.client.name]))]
    .sort((a, b) => a[1].localeCompare(b[1]));
  const projectOptions = [
    ...new Map(
      tasks
        .filter((t) => !clientFilter || t.project.client.id === clientFilter)
        .map((t) => [t.project.id, t.project.name])
    ),
  ].sort((a, b) => a[1].localeCompare(b[1]));

  const visibleTasks = tasks.filter(
    (t) =>
      (!clientFilter || t.project.client.id === clientFilter) &&
      (!projectFilter || t.project.id === projectFilter)
  );
  const isFiltered = Boolean(clientFilter || projectFilter);

  const overdueCount = visibleTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date()
  ).length;

  return (
    <Layout>
      <h2>Welcome back, {user?.name}</h2>

      <div className="page-header">
        <h3>My tasks</h3>
        {!loading && tasks.length > 0 && (
          <p className="subtitle">
            {isFiltered
              ? `${visibleTasks.length} of ${tasks.length} open tasks`
              : `${tasks.length} open task${tasks.length === 1 ? "" : "s"}`}{" "}
            assigned to you
            {overdueCount > 0 && (
              <span className="task-due overdue"> · {overdueCount} overdue</span>
            )}
          </p>
        )}
      </div>

      {!loading && tasks.length > 0 && (
        <div className="report-filters dashboard-filters">
          <div className="report-filters-row">
            <label className="report-filter-wide">
              Client
              <select
                value={clientFilter}
                onChange={(e) => {
                  setClientFilter(e.target.value);
                  setProjectFilter("");
                }}
              >
                <option value="">All clients</option>
                {clientOptions.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label className="report-filter-wide">
              Project
              <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
                <option value="">All projects</option>
                {projectOptions.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            {isFiltered && (
              <button
                type="button"
                className="secondary btn-sm"
                onClick={() => {
                  setClientFilter("");
                  setProjectFilter("");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : tasks.length === 0 ? (
        <p className="empty-state">
          No open tasks assigned to you. Browse your <Link to="/clients">clients</Link> to find
          something to work on.
        </p>
      ) : visibleTasks.length === 0 ? (
        <p className="empty-state">No open tasks match these filters.</p>
      ) : (
        <div className="task-row-list">
          {visibleTasks.map((task) => {
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
            const priorityClass = `priority-${task.priority.toLowerCase()}`;
            const isOpen = openTaskId === task.id;
            const taskTimeEntries = (
              timeSummary?.entries.filter((e) => e.task.id === task.id) ?? []
            ).sort(compareRecentFirst);
            // Round to avoid float drift like 1.4100000000000001 when summing hours.
            const taskTimeHours =
              Math.round(taskTimeEntries.reduce((sum, e) => sum + e.hours, 0) * 100) / 100;
            const timeLogOpen = openTimeLogs.has(task.id);
            return (
              <div key={task.id} className={`task-row ${statusClass(task.status)}`}>
                <Link
                  to={`/projects/${task.project.id}/tasks/${task.id}`}
                  state={{ from: "/dashboard" }}
                  className="task-row-link"
                >
                  <span className={`priority-badge ${priorityClass}`}>
                    {PRIORITY_LABEL[task.priority]}
                  </span>
                  <div className="task-row-main">
                    <p className="task-title">{task.title}</p>
                    <p className="task-row-meta">
                      <span className="meta-client">
                        <span className="meta-label">Client:</span> {task.project.client.name}
                      </span>
                      <span className="meta-sep">·</span>
                      <span className="meta-project">
                        <span className="meta-label">Project:</span> {task.project.name}
                      </span>
                    </p>
                  </div>
                  <span className="role-tag">
                    <TaskTypeIcon type={task.type} />
                    {TYPE_LABEL[task.type]}
                  </span>
                  <span className="role-tag">{STATUS_LABEL[task.status]}</span>
                  {task.dueDate && (
                    <span className={`task-due ${isOverdue ? "overdue" : ""}`}>
                      Due {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </Link>

                <div className={`task-row-quicklog ${isOpen ? "quicklog-open" : ""}`}>
                  {isOpen ? (
                    <form className="quick-log-form" onSubmit={(e) => handleQuickLog(e, task)}>
                      {quickLogError && <span className="error-banner">{quickLogError}</span>}
                      <input
                        type="time"
                        value={quickStart}
                        onChange={(e) => setQuickStart(e.target.value)}
                        autoFocus
                      />
                      <span className="time-log-sep">to</span>
                      <input
                        type="time"
                        value={quickEnd}
                        onChange={(e) => setQuickEnd(e.target.value)}
                      />
                      {previewHours(todayLocalDate(), quickStart, quickEnd) !== null && (
                        <span className="time-log-preview">
                          = {previewHours(todayLocalDate(), quickStart, quickEnd)}h
                        </span>
                      )}
                      <textarea
                        rows={2}
                        placeholder="Note (optional)"
                        value={quickNote}
                        onChange={(e) => setQuickNote(e.target.value)}
                      />
                      <button type="submit" disabled={loggingTaskId === task.id}>
                        {loggingTaskId === task.id ? "Saving..." : "Save"}
                      </button>
                      <button type="button" className="secondary" onClick={() => setOpenTaskId(null)}>
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      className="secondary btn-sm"
                      onClick={() => openQuickLog(task.id)}
                    >
                      Log time
                    </button>
                  )}
                </div>

                {taskTimeEntries.length > 0 && (
                  <details
                    className="task-time-log"
                    open={timeLogOpen}
                    onToggle={(e) => setTaskTimeLogOpen(task.id, e.currentTarget.open)}
                  >
                    <summary>
                      <ClockIcon />
                      <span className="task-time-log-label">Time logged</span>
                      <span className="count">{taskTimeHours}h</span>
                    </summary>
                    <ul className="task-time-entries">
                      {taskTimeEntries.map((entry) => {
                        const range = formatTimeRange(entry.startTime, entry.endTime);
                        return (
                          <li key={entry.id} className="task-time-entry">
                            <span className="task-time-entry-date">
                              {new Date(entry.date).toLocaleDateString()}
                            </span>
                            <span className="task-time-entry-range">
                              {range ?? `${entry.hours}h logged`}
                            </span>
                            {range && <span className="task-time-entry-hours">{entry.hours}h</span>}
                            {entry.note && <span className="task-time-entry-note">{entry.note}</span>}
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
