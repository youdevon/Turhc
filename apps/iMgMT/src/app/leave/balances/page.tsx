import { AppShell } from "@/components/AppShell";
import { BalanceAdjustPanel, UserSelector } from "@/components/leave/BalancePanel";
import { getAllBalancesForUser, listLeaveTypes, listUsersForBalanceAdjustment } from "@/lib/actions/leave";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leave Balances" };

export default async function LeaveBalancesPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const { userId: selectedUserId = "" } = await searchParams;
  const [users, leaveTypes, balances] = await Promise.all([
    listUsersForBalanceAdjustment(),
    listLeaveTypes(),
    selectedUserId ? getAllBalancesForUser(selectedUserId) : Promise.resolve([]),
  ]);

  return (
    <AppShell title="Leave Balances">
      <div className="space-y-6">
        <UserSelector users={users} selectedUserId={selectedUserId} basePath="/leave/balances" />
        {selectedUserId && (
          <BalanceAdjustPanel
            users={users}
            leaveTypes={leaveTypes}
            selectedUserId={selectedUserId}
            balances={balances}
          />
        )}
      </div>
    </AppShell>
  );
}
