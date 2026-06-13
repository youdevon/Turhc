type User = {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
  department: { name: string } | null;
};

type Line = {
  employeeId: string;
  authorityId: string;
  level: number;
  isPrimary: boolean;
};

export function OrgChart({ users, lines }: { users: User[]; lines: Line[] }) {
  const userMap = new Map(users.map((u) => [u.id, u]));

  const primaryLevel1 = lines.filter((l) => l.level === 1 && l.isPrimary);
  const employeesWithPrimary = new Set(primaryLevel1.map((l) => l.employeeId));
  const authorities = new Set(lines.map((l) => l.authorityId));

  const roots = users.filter(
    (u) => authorities.has(u.id) && !employeesWithPrimary.has(u.id)
  );

  if (roots.length === 0 && users.length > 0) {
    roots.push(...users.filter((u) => !employeesWithPrimary.has(u.id)));
  }

  function directReports(authorityId: string): User[] {
    const employeeIds = primaryLevel1
      .filter((l) => l.authorityId === authorityId)
      .map((l) => l.employeeId);
    return employeeIds.map((id) => userMap.get(id)).filter(Boolean) as User[];
  }

  function OrgNode({ user, depth = 0 }: { user: User; depth?: number }) {
    const reports = directReports(user.id);
    return (
      <li className="org-node">
        <div className="org-card" style={{ marginLeft: depth * 24 }}>
          <p className="font-medium">
            {user.firstName} {user.lastName}
          </p>
          {user.jobTitle && <p className="text-xs text-text-muted">{user.jobTitle}</p>}
          {user.department && <p className="text-xs text-gold">{user.department.name}</p>}
        </div>
        {reports.length > 0 && (
          <ul className="mt-2 space-y-2 border-l border-border/60 pl-4">
            {reports.map((report) => (
              <OrgNode key={report.id} user={report} depth={depth + 1} />
            ))}
          </ul>
        )}
      </li>
    );
  }

  const unassigned = users.filter(
    (u) => !lines.some((l) => l.employeeId === u.id) && !roots.some((r) => r.id === u.id)
  );

  return (
    <div className="space-y-8">
      <div className="card p-5">
        <h3 className="mb-4 font-medium">Reporting Hierarchy (primary level-1 lines)</h3>
        {roots.length === 0 ? (
          <p className="text-sm text-text-muted">No reporting lines configured yet.</p>
        ) : (
          <ul className="space-y-4">
            {roots.map((root) => (
              <OrgNode key={root.id} user={root} />
            ))}
          </ul>
        )}
      </div>

      {unassigned.length > 0 && (
        <div className="card p-5">
          <h3 className="mb-3 font-medium text-text-muted">Unassigned / no primary supervisor</h3>
          <ul className="flex flex-wrap gap-2">
            {unassigned.map((u) => (
              <li key={u.id} className="org-card text-sm">
                {u.firstName} {u.lastName}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
