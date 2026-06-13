"use client";

import { useState } from "react";
import { UserForm, UserList } from "@/components/org/UserManager";

type Role = { id: string; name: string };
type Department = { id: string; name: string };
type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  employeeNumber: string | null;
  jobTitle: string | null;
  employmentType: string;
  status: string;
  dateOfEmployment: Date;
  roleId: string;
  departmentId: string | null;
  role: Role;
  department: Department | null;
};

export function UsersPageClient({
  users,
  roles,
  departments,
}: {
  users: User[];
  roles: Role[];
  departments: Department[];
}) {
  const [editUser, setEditUser] = useState<User | null>(null);

  return (
    <div className="space-y-6">
      <UserForm roles={roles} departments={departments} editUser={editUser} onDone={() => setEditUser(null)} />
      <UserList users={users} onEdit={setEditUser} />
    </div>
  );
}
