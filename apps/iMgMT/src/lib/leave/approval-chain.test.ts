import { describe, expect, it } from "vitest";
import {
  isReportingLineActive,
  resolveApprovalChainFromLines,
  type ReportingLineRecord,
} from "./approval-chain";

describe("resolveApprovalChainFromLines", () => {
  const lines: ReportingLineRecord[] = [
    { level: 1, authorityId: "supervisor-a", isPrimary: true },
    { level: 1, authorityId: "supervisor-b", isPrimary: false },
    { level: 2, authorityId: "manager-a", isPrimary: true },
  ];

  it("groups authorities by ascending level", () => {
    const chain = resolveApprovalChainFromLines(lines);
    expect(chain).toEqual([
      { level: 1, authorityIds: ["supervisor-a", "supervisor-b"] },
      { level: 2, authorityIds: ["manager-a"] },
    ]);
  });

  it("deduplicates same authority at a level", () => {
    const dupes: ReportingLineRecord[] = [
      { level: 1, authorityId: "sup-a", isPrimary: true },
      { level: 1, authorityId: "sup-a", isPrimary: false },
    ];
    const chain = resolveApprovalChainFromLines(dupes);
    expect(chain[0]?.authorityIds).toEqual(["sup-a"]);
  });

  it("returns empty chain when no lines", () => {
    expect(resolveApprovalChainFromLines([])).toEqual([]);
  });

  it("respects explicit level ordering", () => {
    const chain = resolveApprovalChainFromLines(lines, [2, 1]);
    expect(chain.map((c) => c.level)).toEqual([2, 1]);
  });
});

describe("isReportingLineActive", () => {
  it("returns true when asOf is within effective range", () => {
    const line = {
      effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
      effectiveTo: null,
    };
    expect(isReportingLineActive(line, new Date("2026-06-01T00:00:00.000Z"))).toBe(true);
  });

  it("returns false before effectiveFrom", () => {
    const line = {
      effectiveFrom: new Date("2026-06-01T00:00:00.000Z"),
      effectiveTo: null,
    };
    expect(isReportingLineActive(line, new Date("2026-05-01T00:00:00.000Z"))).toBe(false);
  });

  it("returns false after effectiveTo", () => {
    const line = {
      effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
      effectiveTo: new Date("2026-05-31T00:00:00.000Z"),
    };
    expect(isReportingLineActive(line, new Date("2026-06-01T00:00:00.000Z"))).toBe(false);
  });
});
