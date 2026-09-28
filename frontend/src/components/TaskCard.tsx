import type { Task, TaskStatus } from "../types";
import { ARCHIVABLE_STATUSES, PRIORITY_LABEL, STATUS_LABEL, STATUS_ORDER, TYPE_LABEL, statusClass } from "../taskLabels";
import { TaskTypeIcon } from "./TaskTypeIcon";

interface Props {
  task: Task;
  onClick: () => void;
  onStatusChange: (status: TaskStatus) => void;
  onArchive: () => void;
}

export function TaskCard({ task, onClick, onStatusChange, onArchive }: Props) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  const priorityClass = `priority-${task.priority.toLowerCase()}`;
  const canArchive = ARCHIVABLE_STATUSES.includes(task.status);

  return (
    <div className={`task-card ${priorityClass} ${statusClass(task.status)}`}>
      <div className="task-card-top">
        <select
          value={task.status}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
          title="Change status"
        >
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>
      <div className="task-card-body" onClick={onClick}>
        <p className="task-title">{task.title}</p>
        <div className="task-badges">
          <span className={`priority-badge ${priorityClass}`}>{PRIORITY_LABEL[task.priority]}</span>
          <span className="role-tag">
            <TaskTypeIcon type={task.type} />
            {TYPE_LABEL[task.type]}
          </span>
        </div>
        {task.dueDate && (
          <p className={`task-due ${isOverdue ? "overdue" : ""}`}>
            Due {new Date(task.dueDate).toLocaleDateString()}
          </p>
        )}
        {task.assignee && <p className="task-assignee">{task.assignee.name}</p>}
      </div>
      {canArchive && (
        <div className="task-card-bottom">
          <button
            className="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onArchive();
            }}
            title="Archive this task"
          >
            Archive
          </button>
        </div>
      )}
    </div>
  );
}
