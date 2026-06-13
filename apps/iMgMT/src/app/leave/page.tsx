import { AppShell } from "@/components/AppShell";
import { LeaveBalancesPanel, LeaveRequestForm, LeaveRequestList } from "@/components/leave/LeavePanel";
import { getMyLeaveBalances, getMyLeaveRequests, listLeaveTypes } from "@/lib/actions/leave";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Leave" };

export default async function LeavePage() {
  const [balances, requests, leaveTypes] = await Promise.all([
    getMyLeaveBalances(),
    getMyLeaveRequests(),
    listLeaveTypes(),
  ]);

  return (
    <AppShell title="My Leave">
      <div className="space-y-6">
        <LeaveBalancesPanel balances={balances} />
        <LeaveRequestForm leaveTypes={leaveTypes} />
        <div>
          <h3 className="mb-3 font-medium">My Requests</h3>
          <LeaveRequestList requests={requests} />
        </div>
      </div>
    </AppShell>
  );
}
