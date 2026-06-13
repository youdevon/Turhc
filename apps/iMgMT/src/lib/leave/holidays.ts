import { prisma } from "@/lib/db";
import { toDateKey } from "./calculator";

export async function getHolidayDateSet(): Promise<Set<string>> {
  const holidays = await prisma.holiday.findMany({ select: { date: true } });
  return new Set(holidays.map((h) => toDateKey(h.date)));
}

export async function getHolidayDateSetForRange(startYear: number, endYear: number): Promise<Set<string>> {
  const holidays = await prisma.holiday.findMany({
    where: { year: { gte: startYear, lte: endYear } },
    select: { date: true },
  });
  return new Set(holidays.map((h) => toDateKey(h.date)));
}
