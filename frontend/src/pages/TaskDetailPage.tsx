import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { projectsApi } from "../api/projects";
import { tasksApi } from "../api/tasks";
import type { TaskInput } from "../api/tasks";
import { timeEntriesApi } from "../api/timeEntries";
import type { Project, Task, TaskActivityEntry, TaskPriority, TaskStatus, TaskType, TimeEntry } from "../types";
import { ApiError } from "../api/client";
import { ARCHIVABLE_STATUSES, PRIORITY_LABEL, STATUS_LABEL, STATUS_ORDER, TYPE_LABEL } from "../taskLabels";
import {
  combineDateAndTime,
  compareRecentFirst,
  formatLocalDate,
  formatTimeInputValue,
  formatTimeRange,
  isTimeEntryIncomplete,
  previewHours,
  todayLocalDate,
} from "../utils/timeEntry";

type TimeEntryFormProps = {
  className: string;
  title: string;
  date: string;
  start: string;
  end: string;
  note: string;
  onDateChange: (value: string) => void;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  error: string | null;
  saving: boolean;
  submitLabel: string;
  savingLabel: string;
  hint?: string;
  // Put the cursor in the start or end field that is still empty (used when editing).
  focusMissingTime?: boolean;
  onSubmit: (e: FormEvent) => void;
  onCancel?: () => void;
};

function TimeEntryForm(props: TimeEntryFormProps) {
  const { date, start, end, note, onCancel, focusMissingTime } = props;
  const hours = previewHours(date, start, end);
  return (
    <form
      className={`time-entry-card ${props.className}`}
      onSubmit={props.onSubmit}
      onKeyDown={(e) => {
        if (e.key === "Escape" && onCancel) onCancel();
      }}
    >
      <div className="time-entry-card-title">{props.title}</div>
      {props.error && <div className="error-banner">{props.error}</div>}
      <div className="time-entry-card-row">
        <label>
          Date
          <input type="date" value={date} onChange={(e) => props.onDateChange(e.target.value)} required />
        </label>
        <label>
          Start time
          <input
            type="time"
            value={start}
            onChange={(e) => props.onStartChange(e.target.value)}
            autoFocus={focusMissingTime && !start}
          />
        </label>
        <label>
          End time
          <input
            type="time"
            value={end}
            onChange={(e) => props.onEndChange(e.target.value)}
            autoFocus={focusMissingTime && Boolean(start) && !end}
          />
        </label>
        <div className="time-entry-card-total">
          <span>Total</span>
          <strong>{hours !== null ? `${hours}h` : "—"}</strong>
        </div>
      </div>
      <label>
        Note
        <textarea
          rows={3}
          placeholder="What did you work on? (optional)"
          value={note}
          onChange={(e) => props.onNoteChange(e.target.value)}
        />
      </label>
      {props.hint && <p className="time-entry-card-hint">{props.hint}</p>}
      <div className="time-entry-card-actions">
        {onCancel && (
          <button type="button" className="secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" disabled={props.saving}>
          {props.saving ? props.savingLabel : props.submitLabel}
        </button>
      </div>
    </form>
  );
}

export function TaskDetailPage() {
  const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  // Where to go on Cancel/Save/Delete: the page that linked here, or the project board.
  const backTo = (location.state as { from?: string } | null)?.from ?? `/projects/${projectId}`;

  const [project, setProject] = useState<Project | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [activity, setActivity] = useState<TaskActivityEntry[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [entryDate, setEntryDate] = useState(todayLocalDate());
  const [entryStart, setEntryStart] = useState("");
  const [entryEnd, setEntryEnd] = useState("");
  const [entryNote, setEntryNote] = useState("");
  const [entryError, setEntryError] = useState<string | null>(null);
  const [loggingTime, setLoggingTime] = useState(false);

  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [type, setType] = useState<TaskType>("TASK");

  async function load() {
    if (!projectId || !taskId) return;
    setLoading(true);
    try {
      const [projectData, taskData, activityData, timeEntryData] = await Promise.all([
        projectsApi.get(projectId),
        tasksApi.get(projectId, taskId),
        tasksApi.activity(projectId, taskId),
        timeEntriesApi.list(projectId, taskId),
      ]);
      setProject(projectData);
      setTask(taskData);
      setActivity(activityData);
      setTimeEntries(timeEntryData);
      setTitle(taskData.title);
      setDescription(taskData.description ?? "");
      setNotes(taskData.notes ?? "");
      setAssigneeId(taskData.assigneeId ?? "");
      setDueDate(taskData.dueDate ? taskData.dueDate.slice(0, 10) : "");
      setStatus(taskData.status);
      setPriority(taskData.priority);
      setType(taskData.type);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load task");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, taskId]);

  const isArchived = Boolean(task?.archivedAt);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!projectId || !taskId) return;
    setSubmitting(true);
    setError(null);
    const data: TaskInput = {
      title,
      description: description || undefined,
      notes: notes || undefined,
      assigneeId: assigneeId || null,
      dueDate: dueDate || undefined,
      status,
      priority,
      type,
    };
    try {
      await tasksApi.update(projectId, taskId, data);
      navigate(backTo);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save task");
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!projectId || !taskId) return;
    if (!confirm("Delete this task? This cannot be undone.")) return;
    await tasksApi.remove(projectId, taskId);
    navigate(backTo);
  }

  async function handleArchive() {
    if (!projectId || !taskId) return;
    if (!confirm("Archive this task? It can only be duplicated from the archive afterward, not edited.")) {
      return;
    }
    try {
      await tasksApi.archive(projectId, taskId);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to archive task");
    }
  }

  async function handleDuplicate() {
    if (!projectId || !taskId) return;
    try {
      await tasksApi.duplicate(projectId, taskId);
      navigate(`/projects/${projectId}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to duplicate task");
    }
  }

  async function handleLogTime(e: FormEvent) {
    e.preventDefault();
    if (!projectId || !taskId) return;
    if (!entryDate || (!entryStart && !entryEnd)) {
      setEntryError("Enter a date and a start time or an end time");
      return;
    }
    const startTime = entryStart ? combineDateAndTime(entryDate, entryStart) : undefined;
    const endTime = entryEnd ? combineDateAndTime(entryDate, entryEnd) : undefined;
    if (startTime && endTime && new Date(endTime) <= new Date(startTime)) {
      setEntryError("End time must be after start time");
      return;
    }
    setLoggingTime(true);
    setEntryError(null);
    try {
      await timeEntriesApi.create(projectId, taskId, {
        date: entryDate,
        startTime,
        endTime,
        note: entryNote || undefined,
      });
      setEntryStart("");
      setEntryEnd("");
      setEntryNote("");
      await load();
    } catch (err) {
      setEntryError(err instanceof ApiError ? err.message : "Failed to log time");
    } finally {
      setLoggingTime(false);
    }
  }

  async function handleDeleteTimeEntry(entryId: string) {
    if (!projectId || !taskId) return;
    if (!confirm("Delete this time entry?")) return;
    await timeEntriesApi.remove(projectId, taskId, entryId);
    await load();
  }

  function handleStartEditTimeEntry(entry: TimeEntry) {
    setEditingEntryId(entry.id);
    setEditDate(formatLocalDate(new Date(entry.date)));
    setEditStart(entry.startTime ? formatTimeInputValue(entry.startTime) : "");
    setEditEnd(entry.endTime ? formatTimeInputValue(entry.endTime) : "");
    setEditNote(entry.note ?? "");
    setEditError(null);
  }

  function handleCancelEditTimeEntry() {
    setEditingEntryId(null);
    setEditError(null);
  }

  async function handleSaveTimeEntry(e: FormEvent, entryId: string) {
    e.preventDefault();
    if (!projectId || !taskId) return;
    if (!editDate || (!editStart && !editEnd)) {
      setEditError("Enter a date and a start time or an end time");
      return;
    }
    const startTime = editStart ? combineDateAndTime(editDate, editStart) : undefined;
    const endTime = editEnd ? combineDateAndTime(editDate, editEnd) : undefined;
    if (startTime && endTime && new Date(endTime) <= new Date(startTime)) {
      setEditError("End time must be after start time");
      return;
    }
    setSavingEdit(true);
    setEditError(null);
    try {
      await timeEntriesApi.update(projectId, taskId, entryId, {
        date: editDate,
        startTime,
        endTime,
        note: editNote || undefined,
      });
      setEditingEntryId(null);
      await load();
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : "Failed to save time entry");
    } finally {
      setSavingEdit(false);
    }
  }

  if (loading) {
    return (
      <Layout>
        <p>Loading...</p>
      </Layout>
    );
  }

  if (error || !project || !task) {
    return (
      <Layout>
        <div className="error-banner">{error ?? "Task not found"}</div>
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
        <Link to={`/projects/${project.id}`}>{project.name}</Link> / {task.title}
      </p>
      <h2>Task details</h2>

      {isArchived && (
        <div className="error-banner archived-banner">
          This task is archived and can no longer be edited. You can duplicate it into a fresh
          To do task instead.
        </div>
      )}

      <form className="edit-page-form" onSubmit={handleSubmit}>
        {error && <div className="error-banner">{error}</div>}
        <fieldset disabled={isArchived} className="task-fieldset">
          <label>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
          </label>
          <label>
            Description
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
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
            Assignee
            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
              <option value="">Unassigned</option>
              {project.members.map((m) => (
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
          <label>
            Notes
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={6} />
          </label>
        </fieldset>

        <div className="modal-actions">
          <button type="button" className="danger" onClick={handleDelete}>
            Delete
          </button>
          {!isArchived && ARCHIVABLE_STATUSES.includes(task.status) && (
            <button type="button" className="secondary" onClick={handleArchive}>
              Archive
            </button>
          )}
          {isArchived && (
            <button type="button" onClick={handleDuplicate}>
              Duplicate
            </button>
          )}
          <div className="spacer" />
          <button type="button" className="secondary" onClick={() => navigate(backTo)}>
            {isArchived ? "Close" : "Cancel"}
          </button>
          {!isArchived && (
            <button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </button>
          )}
        </div>
      </form>

      <section className="members-panel">
        <div className="page-header" style={{ marginBottom: 8 }}>
          <h4>Time log</h4>
          {timeEntries.length > 0 && (
            <span className="count">
              {timeEntries.reduce((sum, e) => sum + e.hours, 0)}h total
            </span>
          )}
        </div>

        {timeEntries.length === 0 ? (
          <p className="empty-state">No time logged yet.</p>
        ) : (
          <ul className="member-list">
            {[...timeEntries].sort(compareRecentFirst).map((entry) => {
              if (editingEntryId === entry.id) {
                return (
                  <li key={entry.id}>
                    <TimeEntryForm
                      className="time-entry-edit"
                      title="Edit time entry"
                      date={editDate}
                      start={editStart}
                      end={editEnd}
                      note={editNote}
                      onDateChange={setEditDate}
                      onStartChange={setEditStart}
                      onEndChange={setEditEnd}
                      onNoteChange={setEditNote}
                      error={editError}
                      saving={savingEdit}
                      submitLabel="Save changes"
                      savingLabel="Saving..."
                      focusMissingTime
                      onSubmit={(e) => handleSaveTimeEntry(e, entry.id)}
                      onCancel={handleCancelEditTimeEntry}
                    />
                  </li>
                );
              }

              const range = formatTimeRange(entry.startTime, entry.endTime);
              const incomplete = isTimeEntryIncomplete(entry);
              return (
                <li key={entry.id} className={incomplete ? "time-entry-incomplete" : undefined}>
                  {new Date(entry.date).toLocaleDateString()}
                  {range && <> — {range}</>} — {entry.hours}h — {entry.user.name}
                  {incomplete && (
                    <span className="time-entry-warning">
                      missing {entry.startTime ? "end" : "start"} time
                    </span>
                  )}
                  {entry.userId === user?.id && !editingEntryId && (
                    <>
                      <button className="link-button" onClick={() => handleStartEditTimeEntry(entry)}>
                        edit
                      </button>
                      <button className="link-button" onClick={() => handleDeleteTimeEntry(entry.id)}>
                        remove
                      </button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {!isArchived && !editingEntryId && (
          <TimeEntryForm
            className="time-entry-create"
            title="Log new time"
            date={entryDate}
            start={entryStart}
            end={entryEnd}
            note={entryNote}
            onDateChange={setEntryDate}
            onStartChange={setEntryStart}
            onEndChange={setEntryEnd}
            onNoteChange={setEntryNote}
            error={entryError}
            saving={loggingTime}
            submitLabel="Log time"
            savingLabel="Logging..."
            hint="Leave the end time empty if you are still working. You can add it later."
            onSubmit={handleLogTime}
          />
        )}
      </section>

      {activity.length > 0 && (
        <section className="members-panel">
          <h4>Activity</h4>
          <ul className="member-list">
            {activity.map((entry) => (
              <li key={entry.id}>
                <span className="activity-when">{new Date(entry.createdAt).toLocaleString()}</span>
                {" — "}
                {entry.user.name} — {entry.details}
              </li>
            ))}
          </ul>
        </section>
      )}
    </Layout>
  );
}
