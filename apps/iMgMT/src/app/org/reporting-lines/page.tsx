import { AppShell } from "@/components/AppShell";
import { ReportingLineForm, ReportingLineList } from "@/components/org/ReportingLineManager";
import { listReportingLines } from "@/lib/actions/reporting-lines";
import { listUsersMinimal } from "@/lib/actions/users";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reporting Lines" };

export default async function ReportingLinesPage() {
  const [lines, users] = await Promise.all([listReportingLines(false), listUsersMinimal()]);

  return (
    <AppShell title="Reporting Lines">
      <div className="space-y-6">
        <ReportingLineForm users={users} />
        <ReportingLineList lines={lines} />
      </div>
    </AppShell>
  );
}
