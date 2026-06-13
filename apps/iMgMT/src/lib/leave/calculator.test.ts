import { describe, expect, it } from "vitest";
import { calculateLeaveDays } from "./calculator";

const holidays = new Set([
  "2026-08-31", // Independence Day
  "2026-12-25", // Christmas
  "2027-01-01", // New Year
]);

describe("calculateLeaveDays", () => {
  it("counts Fri + Mon as 4 days (sandwiched weekend)", () => {
    const result = calculateLeaveDays("2026-06-05", "2026-06-08", holidays);
    expect(result.totalDays).toBe(4);
    expect(result.countedDates).toEqual([
      "2026-06-05",
      "2026-06-06",
      "2026-06-07",
      "2026-06-08",
    ]);
    expect(result.sandwichedNotes.some((n) => n.includes("Sat"))).toBe(true);
    expect(result.sandwichedNotes.some((n) => n.includes("Sun"))).toBe(true);
  });

  it("counts a single Friday as 1 day (weekend after is outside range)", () => {
    const result = calculateLeaveDays("2026-06-05", "2026-06-05", holidays);
    expect(result.totalDays).toBe(1);
    expect(result.trimmedFromEnd).toEqual([]);
  });

  it("counts Mon–Fri as 5 working days", () => {
    const result = calculateLeaveDays("2026-06-01", "2026-06-05", holidays);
    expect(result.totalDays).toBe(5);
    expect(result.sandwichedNotes).toHaveLength(0);
  });

  it("trims consecutive leading weekend days at the edge", () => {
    const result = calculateLeaveDays("2026-06-06", "2026-06-09", holidays);
    expect(result.totalDays).toBe(2);
    expect(result.trimmedFromStart).toEqual(["2026-06-06", "2026-06-07"]);
    expect(result.countedDates).toEqual(["2026-06-08", "2026-06-09"]);
  });

  it("trims trailing weekend and holiday at edges", () => {
    const result = calculateLeaveDays("2026-12-23", "2026-12-26", holidays);
    expect(result.totalDays).toBe(2);
    expect(result.trimmedFromEnd).toEqual(["2026-12-25", "2026-12-26"]);
    expect(result.countedDates).toEqual(["2026-12-23", "2026-12-24"]);
  });

  it("includes sandwiched public holiday and weekend between working boundaries", () => {
    const result = calculateLeaveDays("2026-08-28", "2026-09-02", holidays);
    expect(result.totalDays).toBe(6);
    expect(result.countedDates).toContain("2026-08-31");
    expect(result.sandwichedNotes.some((n) => n.includes("Mon"))).toBe(true);
    expect(result.sandwichedNotes.some((n) => n.includes("Sat"))).toBe(true);
  });

  it("counts Thu–Mon spanning a weekend as 5 days", () => {
    const result = calculateLeaveDays("2026-06-04", "2026-06-08", holidays);
    expect(result.totalDays).toBe(5);
  });

  it("throws when start is after end", () => {
    expect(() => calculateLeaveDays("2026-06-10", "2026-06-05", holidays)).toThrow(
      "startDate must be on or before endDate"
    );
  });
});
