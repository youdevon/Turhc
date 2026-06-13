import { prisma } from "./db";

export type DashboardStats = {
  unreadEnquiries: number;
  draftContentCount: number;
  failedLogins24h: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [unreadEnquiries, draftProjects, draftTenders, draftNews, failedLogins24h] =
    await Promise.all([
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
    ]);

  return {
    unreadEnquiries,
    draftContentCount: draftProjects + draftTenders + draftNews,
    failedLogins24h,
  };
}
