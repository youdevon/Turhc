export type ReportingLineRecord = {
  level: number;
  authorityId: string;
  isPrimary: boolean;
};

export type ApprovalChainLevel = {
  level: number;
  authorityIds: string[];
};

/**
 * Resolve approval chain from reporting lines active on a given date.
 * Groups authorities by level; multiple authorities at the same level may all act (first wins).
 */
export function resolveApprovalChainFromLines(
  lines: ReportingLineRecord[],
  levels?: number[]
): ApprovalChainLevel[] {
  const byLevel = new Map<number, string[]>();

  for (const line of lines) {
    const existing = byLevel.get(line.level) ?? [];
    if (!existing.includes(line.authorityId)) {
      existing.push(line.authorityId);
    }
    byLevel.set(line.level, existing);
  }

  const sortedLevels = levels ?? Array.from(byLevel.keys()).sort((a, b) => a - b);

  return sortedLevels
    .filter((level) => byLevel.has(level))
    .map((level) => ({
      level,
      authorityIds: byLevel.get(level)!,
    }));
}

export function isReportingLineActive(
  line: { effectiveFrom: Date; effectiveTo: Date | null },
  asOf: Date
): boolean {
  const asOfTime = asOf.getTime();
  const fromTime = line.effectiveFrom.getTime();
  if (fromTime > asOfTime) return false;
  if (line.effectiveTo && line.effectiveTo.getTime() < asOfTime) return false;
  return true;
}
