"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { DeleteUserForm } from "./DeleteUserForm";

type Props = {
  userId: string;
  userName: string;
  isSelf: boolean;
};

export function UserRowActions({ userId, userName, isSelf }: Props) {
  return (
    <div className="admin-actions admin-actions--nowrap justify-end">
      <Link href={`/admin/users/${userId}`} className="admin-btn-secondary">
        <Pencil />
        Edit
      </Link>
      <DeleteUserForm userId={userId} userName={userName} isSelf={isSelf} variant="button" />
    </div>
  );
}
