"use client";

import { useState } from "react";
import { DepartmentForm, DepartmentList } from "@/components/org/DepartmentManager";

type Department = {
  id: string;
  name: string;
  parentId: string | null;
  headUserId: string | null;
  _count: { users: number };
  headUser: { id: string; firstName: string; lastName: string } | null;
};

type UserOption = { id: string; firstName: string; lastName: string };

export function DepartmentsPageClient({
  departments,
  users,
}: {
  departments: Department[];
  users: UserOption[];
}) {
  const [editDepartment, setEditDepartment] = useState<Pick<Department, "id" | "name" | "parentId" | "headUserId"> | null>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <DepartmentForm
        departments={departments}
        users={users}
        editDepartment={editDepartment}
        onDone={() => setEditDepartment(null)}
      />
      <DepartmentList
        departments={departments}
        onEdit={(dept) =>
          setEditDepartment({
            id: dept.id,
            name: dept.name,
            parentId: dept.parentId,
            headUserId: dept.headUserId,
          })
        }
      />
    </div>
  );
}
