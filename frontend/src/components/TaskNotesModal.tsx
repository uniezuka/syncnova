import type { Task } from "../types";

interface Props {
  task: Pick<Task, "title" | "notes">;
  onClose: () => void;
}

// Read-only popup with just the task notes, separate from the full details popup so
// people can check working notes quickly from the dashboard.
export function TaskNotesModal({ task, onClose }: Props) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide modal-scroll" onClick={(e) => e.stopPropagation()}>
        <h3>Notes</h3>
        <p className="modal-subtitle">{task.title}</p>
        <div className="modal-body">
          {task.notes ? (
            <p className="detail-multiline modal-notes">{task.notes}</p>
          ) : (
            <p className="empty-state">No notes on this task yet.</p>
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
