export const ADMIN_LIST_PAGE_SIZE = 25;
export const AUDIT_LOG_PAGE_SIZE = 50;

export function parseListPage(value: string | undefined): number {
  const n = parseInt(value ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function listSkip(page: number): number {
  return (page - 1) * ADMIN_LIST_PAGE_SIZE;
}
