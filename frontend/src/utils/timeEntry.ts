// The date input's local calendar day, as YYYY-MM-DD. Deliberately not
// `Date.toISOString().slice(0, 10)` - that reads the UTC date, which is the wrong day
// for part of the day in any timezone ahead of UTC (e.g. just after local midnight).
export function formatLocalDate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayLocalDate() {
  return formatLocalDate(new Date());
}

export function combineDateAndTime(date: string, time: string) {
  return new Date(`${date}T${time}`).toISOString();
}

export function formatClockTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// The value an <input type="time"> needs, e.g. "14:05" - not the same as formatClockTime,
// which is for display (12-hour, localized).
export function formatTimeInputValue(iso: string) {
  const d = new Date(iso);
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function formatTimeRange(startTime: string | null, endTime: string | null) {
  if (!startTime || !endTime) return null;
  return `${formatClockTime(startTime)} – ${formatClockTime(endTime)}`;
}

// Newest first: by date, then by start time within the same day (entries with no start
// time go last for their day). For use with Array.prototype.sort.
export function compareRecentFirst(
  a: { date: string; startTime: string | null },
  b: { date: string; startTime: string | null }
) {
  const byDate = new Date(b.date).getTime() - new Date(a.date).getTime();
  if (byDate !== 0) return byDate;
  const aStart = a.startTime ? new Date(a.startTime).getTime() : 0;
  const bStart = b.startTime ? new Date(b.startTime).getTime() : 0;
  return bStart - aStart;
}

// True when exactly one of start/end is set - a clock-in with no clock-out yet, or
// vice versa. Used to flag entries that still need the other time filled in.
export function isTimeEntryIncomplete(entry: { startTime: string | null; endTime: string | null }) {
  return Boolean(entry.startTime) !== Boolean(entry.endTime);
}

// Live preview while the user is filling in the form, before the server computes the
// authoritative value. Returns null until both times are set and end is after start.
export function previewHours(date: string, startTime: string, endTime: string): number | null {
  if (!startTime || !endTime) return null;
  const ms =
    new Date(combineDateAndTime(date, endTime)).getTime() -
    new Date(combineDateAndTime(date, startTime)).getTime();
  if (ms <= 0) return null;
  return Math.round((ms / (1000 * 60 * 60)) * 100) / 100;
}
