import type { ReactElement } from "react";
import type { TaskType } from "../types";

function iconProps() {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}

function TaskIcon() {
  return (
    <svg {...iconProps()}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="m8 12 3 3 5-6" />
    </svg>
  );
}

function BugIcon() {
  return (
    <svg {...iconProps()}>
      <circle cx="12" cy="14" r="6" />
      <line x1="12" y1="8" x2="12" y2="4" />
      <line x1="6" y1="12" x2="3" y2="10" />
      <line x1="18" y1="12" x2="21" y2="10" />
      <line x1="6" y1="17" x2="3" y2="19" />
      <line x1="18" y1="17" x2="21" y2="19" />
    </svg>
  );
}

function FeatureIcon() {
  return (
    <svg {...iconProps()}>
      <polygon points="12 2 14.9 8.6 22 9.3 16.5 14 18.2 21 12 17.3 5.8 21 7.5 14 2 9.3 9.1 8.6" />
    </svg>
  );
}

function ChoreIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M14.7 6.3a4 4 0 1 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.8 2.8-2-2 2.8-2.8z" />
    </svg>
  );
}

function ImprovementIcon() {
  return (
    <svg {...iconProps()}>
      <polyline points="3 17 9 11 13 15 21 7" />
      <polyline points="14 7 21 7 21 14" />
    </svg>
  );
}

function DocumentationIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M8 3h5l5 5v13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M13 3v5h5" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="15" y2="17" />
    </svg>
  );
}

const TYPE_ICON: Record<TaskType, () => ReactElement> = {
  TASK: TaskIcon,
  BUG: BugIcon,
  FEATURE: FeatureIcon,
  CHORE: ChoreIcon,
  IMPROVEMENT: ImprovementIcon,
  DOCUMENTATION: DocumentationIcon,
};

export function TaskTypeIcon({ type, className }: { type: TaskType; className?: string }) {
  const Icon = TYPE_ICON[type];
  return <span className={`task-type-icon ${className ?? ""}`}><Icon /></span>;
}
