import { toDateKey } from "@/lib/leave/calculator";

export function formatUserName(user: { firstName: string; lastName: string }): string {
  return `${user.firstName} ${user.lastName}`;
}

export function formatDateOnly(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const key = typeof date === "string" ? date.slice(0, 10) : toDateKey(date);
  const [year, month, day] = key.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${day} ${months[Number(month) - 1]} ${year}`;
}

export function parseFormDate(value: FormDataEntryValue | null): Date | null {
  if (!value || typeof value !== "string" || !value.trim()) return null;
  return new Date(`${value}T00:00:00.000Z`);
}

export function currentYear(): number {
  return new Date().getUTCFullYear();
}
