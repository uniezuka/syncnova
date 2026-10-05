import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { tasksApi } from "../api/tasks";
import { timeEntriesApi } from "../api/timeEntries";
import { reportsApi } from "../api/reports";
import type { AssignedTask, ReportSummary, TaskPriority } from "../types";
import { ApiError } from "../api/client";
import { PRIORITY_LABEL, STATUS_LABEL, TYPE_LABEL, statusClass } from "../taskLabels";
import { TaskTypeIcon } from "../components/TaskTypeIcon";
import {
  combineDateAndTime,
  compareRecentFirst,
  formatClockTime,
  formatTimeRange,
  isTimeEntryIncomplete,
  previewHours,
  todayLocalDate,
} from "../utils/timeEntry";

const ALL_TIME_FROM = "2000-01-01";

const PRIORITY_OPTIONS: TaskPriority[] = ["HIGH", "MEDIUM", "LOW"];

const PRIORITY_RANK: Record<TaskPriority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

function isTaskOverdue(task: AssignedTask) {
  return Boolean(task.dueDate && new Date(task.dueDate) < new Date());
}

// Inside a project: high priority first, then soonest due date (undated last).
function compareTasksInProject(a: AssignedTask, b: AssignedTask) {
  const byPriority = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  if (byPriority !== 0) return byPriority;
  const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
  const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
  return aDue - bDue;
}

interface ProjectGroup {
  project: AssignedTask["project"];
  tasks: AssignedTask[];
  priorityCounts: Record<TaskPriority, number>;
  overdueCount: number;
}

// One group per project. Projects with the most high priority (then overdue) work come
// first, so urgent work stays at the top even though the list is no longer one flat sort.
function groupTasksByProject(tasks: AssignedTask[]): ProjectGroup[] {
  const groups = new Map<string, ProjectGroup>();
  for (const task of tasks) {
    let group = groups.get(task.project.id);
    if (!group) {
      group = {
        project: task.project,
        tasks: [],
        priorityCounts: { HIGH: 0, MEDIUM: 0, LOW: 0 },
        overdueCount: 0,
      };
      groups.set(task.project.id, group);
    }
    group.tasks.push(task);
    group.priorityCounts[task.priority] += 1;
    if (isTaskOverdue(task)) group.overdueCount += 1;
  }
  for (const group of groups.values()) group.tasks.sort(compareTasksInProject);
  return [...groups.values()].sort(
    (a, b) =>
      b.priorityCounts.HIGH - a.priorityCounts.HIGH ||
      b.overdueCount - a.overdueCount ||
      a.project.name.localeCompare(b.project.name)
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`project-group-chevron ${open ? "open" : ""}`}
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

// What to show for an entry that has only a start or only an end time, e.g. a clock-in
// with no clock-out yet. Its hours are 0 until both are set, so the time itself is the
// useful part.
function incompleteTimeLabel(entry: { startTime: string | null; endTime: string | null }) {
  if (entry.startTime) return `Started ${formatClockTime(entry.startTime)}`;
  if (entry.endTime) return `Ended ${formatClockTime(entry.endTime)}`;
  return null;
}

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

  // Every project group starts open; collapsing one adds its project id here.
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());

  function toggleProject(projectId: string) {
    setCollapsedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  }

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

  const overdueCount = tasks.filter(isTaskOverdue).length;
  const projectGroups = groupTasksByProject(tasks);

  return (
    <Layout>
      <h2>Welcome back, {user?.name}</h2>

      <div className="page-header">
        <h3>My tasks</h3>
        {!loading && tasks.length > 0 && (
          <p className="subtitle">
            {tasks.length} open task{tasks.length === 1 ? "" : "s"} assigned to you
            {overdueCount > 0 && (
              <span className="task-due overdue"> · {overdueCount} overdue</span>
            )}
          </p>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : tasks.length === 0 ? (
        <p className="empty-state">
          No open tasks assigned to you. Browse your <Link to="/clients">clients</Link> to find
          something to work on.
        </p>
      ) : (
        <div className="project-group-list">
          {projectGroups.map((group) => {
            const groupOpen = !collapsedProjects.has(group.project.id);
            return (
              <section key={group.project.id} className="project-group">
                <button
                  type="button"
                  className="project-group-header"
                  aria-expanded={groupOpen}
                  onClick={() => toggleProject(group.project.id)}
                >
                  <ChevronIcon open={groupOpen} />
                  <span className="project-group-title">
                    <span className="project-group-name">{group.project.name}</span>
                    <span className="project-group-client">{group.project.client.name}</span>
                  </span>
                  <span className="project-group-counts">
                    {PRIORITY_OPTIONS.filter((p) => group.priorityCounts[p] > 0).map((p) => (
                      <span
                        key={p}
                        className={`priority-badge priority-${p.toLowerCase()}`}
                        title={`${group.priorityCounts[p]} ${PRIORITY_LABEL[p]} priority`}
                      >
                        {group.priorityCounts[p]} {PRIORITY_LABEL[p]}
                      </span>
                    ))}
                    {group.overdueCount > 0 && (
                      <span className="project-group-overdue">
                        {group.overdueCount} overdue
                      </span>
                    )}
                    <span className="count">
                      {group.tasks.length} task{group.tasks.length === 1 ? "" : "s"}
                    </span>
                  </span>
                </button>

                {groupOpen && (
                  <div className="task-row-list">
                    {group.tasks.map((task) => {
                      const isOverdue = isTaskOverdue(task);
                      const priorityClass = `priority-${task.priority.toLowerCase()}`;
                      const isOpen = openTaskId === task.id;
                      const taskTimeEntries = (
                        timeSummary?.entries.filter((e) => e.task.id === task.id) ?? []
                      ).sort(compareRecentFirst);
                      // Round to avoid float drift like 1.4100000000000001 when summing hours.
                      const taskTimeHours =
                        Math.round(taskTimeEntries.reduce((sum, e) => sum + e.hours, 0) * 100) / 100;
                      const timeLogOpen = openTimeLogs.has(task.id);
                      // Newest entry that still misses its start or end time, if any.
                      const incompleteEntry = taskTimeEntries.find(isTimeEntryIncomplete);
                      return (
                        <div
                          key={task.id}
                          className={`task-row ${statusClass(task.status)} ${priorityClass}`}
                        >
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
                                {incompleteEntry && (
                                  <span className="time-entry-warning">
                                    {incompleteTimeLabel(incompleteEntry)} · not finished
                                  </span>
                                )}
                                <span className="count">{taskTimeHours}h</span>
                              </summary>
                              <ul className="task-time-entries">
                                {taskTimeEntries.map((entry) => {
                                  const range = formatTimeRange(entry.startTime, entry.endTime);
                                  const incomplete = isTimeEntryIncomplete(entry);
                                  return (
                                    <li
                                      key={entry.id}
                                      className={`task-time-entry ${incomplete ? "time-entry-incomplete" : ""}`}
                                    >
                                      <span className="task-time-entry-date">
                                        {new Date(entry.date).toLocaleDateString()}
                                      </span>
                                      <span className="task-time-entry-range">
                                        {incomplete
                                          ? incompleteTimeLabel(entry)
                                          : range ?? `${entry.hours}h logged`}
                                      </span>
                                      {incomplete && (
                                        <span className="time-entry-warning">
                                          missing {entry.startTime ? "end" : "start"} time
                                        </span>
                                      )}
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
              </section>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
