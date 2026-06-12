import { AdminHeader } from "@/components/admin/AdminHeader";
import { LeadershipMemberForm } from "@/components/admin/forms/LeadershipMemberForm";

export default function NewLeadershipPage() {
  return (
    <>
      <AdminHeader
        title="Add Leadership Member"
        breadcrumbs={[
          { label: "Leadership", href: "/admin/leadership" },
          { label: "New" },
        ]}
      />
      <LeadershipMemberForm />
    </>
  );
}
