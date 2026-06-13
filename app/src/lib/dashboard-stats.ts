import { prisma } from "./db";

export type DashboardStats = {
  unreadEnquiries: number;
  draftContentCount: number;
  failedLogins24h: number;
  recentActivity: Array<{
    id: string;
    summary: string;
    createdAt: Date;
    outcome: string;
  }>;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    unreadEnquiries,
    draftProjects,
    draftTenders,
    draftNews,
    failedLogins24h,
    recentActivity,
  ] = await Promise.all([
    prisma.enquiry.count({ where: { isDeleted: false, isRead: false } }),
    prisma.project.count({ where: { statusContent: "DRAFT" } }),
    prisma.tender.count({ where: { statusContent: "DRAFT" } }),
    prisma.newsPost.count({ where: { status: "DRAFT" } }),
    prisma.auditLog.count({
      where: {
        action: "LOGIN_FAILED",
        createdAt: { gte: since },
      },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        displayAction: true,
        action: true,
        recordName: true,
        module: true,
        outcome: true,
        details: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    unreadEnquiries,
    draftContentCount: draftProjects + draftTenders + draftNews,
    failedLogins24h,
    recentActivity: recentActivity.map((row) => ({
      id: row.id,
      outcome: row.outcome,
      createdAt: row.createdAt,
      summary:
        (() => {
          try {
            return row.details ? JSON.parse(row.details).summary : null;
          } catch {
            return null;
          }
        })() ||
        `${row.displayAction ?? row.action} — ${row.recordName || row.module}`,
    })),
  };
}
