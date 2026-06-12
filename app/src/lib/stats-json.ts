export type StatItem = { label: string; value: string };

export function parseStatsJson(json: string | null | undefined): StatItem[] {
  if (!json?.trim()) return [];
  try {
    const parsed = JSON.parse(json) as StatItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item.label === "string" && typeof item.value === "string")
      .map((item) => ({ label: item.label, value: item.value }));
  } catch {
    return [];
  }
}

export function serializeStatsJson(items: StatItem[]): string {
  return JSON.stringify(items.filter((item) => item.label.trim() || item.value.trim()));
}
