import { AppShell } from "@/components/AppShell";
import { ApprovalQueue } from "@/components/leave/ApprovalQueue";
import { getPendingApprovalsForActor } from "@/lib/actions/leave";

export const dynamic = "force-dynamic";
export const metadata = { title: "Approvals" };

export default async function ApprovalsPage() {
  const items = await getPendingApprovalsForActor();

  return (
    <AppShell title="Approvals">
      <ApprovalQueue items={items} />
    </AppShell>
  );
}
