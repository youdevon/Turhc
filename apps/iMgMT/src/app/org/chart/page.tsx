import { AppShell } from "@/components/AppShell";
import { OrgChart } from "@/components/org/OrgChart";
import { getOrgChartData } from "@/lib/actions/reporting-lines";

export const dynamic = "force-dynamic";
export const metadata = { title: "Org Chart" };

export default async function OrgChartPage() {
  const { users, lines } = await getOrgChartData();

  return (
    <AppShell title="Org Chart">
      <OrgChart users={users} lines={lines} />
    </AppShell>
  );
}
