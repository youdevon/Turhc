import { isAfter, parseISO } from "date-fns";

export type LeaveDayBreakdown = {
  totalDays: number;
  countedDates: string[];
  trimmedFromStart: string[];
  trimmedFromEnd: string[];
  sandwichedNotes: string[];
};

/** Parse YYYY-MM-DD as a UTC date-only value (no local TZ drift). */
export function parseDateOnly(value: string | Date): Date {
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }
  const iso = value.length >= 10 ? value.slice(0, 10) : value;
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year!, month! - 1, day!));
}

export function toDateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function eachUtcDateInRange(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const cursor = new Date(start);
  while (cursor.getTime() <= end.getTime()) {
    dates.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

export function isNonWorkingDay(date: Date, holidays: ReadonlySet<string>): boolean {
  return isWeekend(date) || holidays.has(toDateKey(date));
}

function formatDayLabel(dateKey: string): string {
  const date = parseDateOnly(dateKey);
  return `${WEEKDAY_LABELS[date.getUTCDay()]} ${date.getUTCDate()} ${MONTH_LABELS[date.getUTCMonth()]}`;
}

/**
 * T&T leave day calculation:
 * - Count all calendar days in [startDate, endDate]
 * - Trim leading/trailing weekends and public holidays (edge exclusion)
 * - Weekends/holidays sandwiched between working boundaries are included
 */
export function calculateLeaveDays(
  startDate: string | Date,
  endDate: string | Date,
  holidays: ReadonlySet<string> = new Set()
): LeaveDayBreakdown {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);

  if (isAfter(start, end)) {
    throw new Error("startDate must be on or before endDate");
  }

  const allDates = eachUtcDateInRange(start, end).map(toDateKey);
  const trimmedFromStart: string[] = [];
  const trimmedFromEnd: string[] = [];

  let from = 0;
  while (from < allDates.length && isNonWorkingDay(parseDateOnly(allDates[from]!), holidays)) {
    trimmedFromStart.push(allDates[from]!);
    from += 1;
  }

  let to = allDates.length - 1;
  while (to >= from && isNonWorkingDay(parseDateOnly(allDates[to]!), holidays)) {
    trimmedFromEnd.unshift(allDates[to]!);
    to -= 1;
  }

  const countedDates = allDates.slice(from, to + 1);
  const sandwichedNotes: string[] = [];

  for (const dateKey of countedDates) {
    if (isNonWorkingDay(parseDateOnly(dateKey), holidays)) {
      sandwichedNotes.push(`includes ${formatDayLabel(dateKey)}`);
    }
  }

  return {
    totalDays: countedDates.length,
    countedDates,
    trimmedFromStart,
    trimmedFromEnd,
    sandwichedNotes,
  };
}

export function assertValidLeaveRange(startDate: string | Date, endDate: string | Date): void {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  if (isAfter(start, end)) {
    throw new Error("Invalid leave range");
  }
}

/** @deprecated use parseDateOnly — kept for tests importing legacy name */
export { parseISO };
