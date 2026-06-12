import { AdminHeader } from "@/components/admin/AdminHeader";
import { BoardMemberForm } from "@/components/admin/forms/BoardMemberForm";

export default function NewBoardMemberPage() {
  return (
    <>
      <AdminHeader
        title="Add Board Member"
        breadcrumbs={[
          { label: "Board", href: "/admin/board" },
          { label: "New" },
        ]}
      />
      <BoardMemberForm />
    </>
  );
}
