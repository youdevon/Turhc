# Leave & Employee Management System — Build Specification

Internal office application for managing employee leave requests, organizational structure, employee documents/qualifications, contracts, and distributed assets. Built for a small organization with multi-level, delegation-aware approvals and full audit logging.

---

## 1. Stack & Conventions

- **Framework:** Next.js (App Router) + TypeScript
- **ORM/DB:** Prisma + PostgreSQL
- **Auth:** NextAuth (credentials provider) with role-based access control
- **Deployment:** Ubuntu server, PM2 process manager, Nginx reverse proxy
- **Email:** Nodemailer over configurable SMTP (host, port, TLS, from-address stored in app settings, editable by Administrator)
- **File storage:** Local disk under `/var/app-data/files/{category}/{userId}/`, served via authenticated API route only (never public static)
- **Timezone:** America/Port_of_Spain. All date-only fields stored as DATE (no time component) to avoid TZ drift.

## 2. Roles (RBAC)

| Role | Capabilities |
|------|-------------|
| Administrator | Everything: org structure, users, policies, leave types, holidays, SMTP settings, audit log viewer, balance adjustments |
| HR | Manage employee records, documents, contracts, balances (with audit trail), view all leave, final-level approvals where policy requires |
| Manager | Approve/reject at their level, view their department's records, delegate authority |
| Supervisor | Approve/reject at their level for direct reports, view direct reports' leave |
| Employee | Submit/cancel own leave, view own balances, documents, assets |

Roles are capabilities; approval routing is driven by reporting lines, not roles. A person can hold a role and also be someone's supervisor.

## 3. Organizational Structure

### 3.1 Departments

Hierarchical: `Department(id, name, parentId?, headUserId?)`

A department head is a user reference, optional.

### 3.2 Reporting Lines (core of routing)

A user may have multiple supervisors/managers simultaneously.

```
ReportingLine {
  id
  employeeId
  authorityId        // the supervisor/manager
  level              // 1 = first approver level, 2 = next, etc.
  isPrimary          // for display / default escalation path
  effectiveFrom      // DATE
  effectiveTo        // DATE nullable — null = current
}
```

Never delete reporting lines; close them with `effectiveTo`. This preserves historical chain of command so old approvals always show who the authority was at the time.

Org chart view renders from current (`effectiveTo = null`) lines.

### 3.3 Delegation / Acting Capacity

```
Delegation {
  id
  delegatorId        // authority going on leave / unavailable
  delegateId         // person acting in their capacity
  startDate, endDate
  reason
  createdBy          // self or Admin/HR
}
```

When an approved leave is created for a user who is an authority for anyone, prompt them (and allow Admin/HR) to set a delegation for that period.

Resolution rule at action time: when an approval step needs an actor, check in order:

1. The assigned authority, if not on approved leave that day and active.
2. Their active delegate (Delegation covering today).
3. Escalate to the assigned authority's own level-1 primary authority (next in command).

The audit log records both the assigned approver and the actual actor.

## 4. Employee Records

```
User {
  id, firstName, lastName, email, phone
  employeeNumber
  dateOfEmployment        // DATE
  employmentType          // PERMANENT | CONTRACT | TEMPORARY
  position / jobTitle
  departmentId
  status                  // ACTIVE | ON_LEAVE | SUSPENDED | EXITED
  role                    // RBAC role
}
```

### 4.1 Contracts

```
Contract {
  id, userId
  type, startDate, endDate
  documentId?             // signed contract file
  status                  // ACTIVE | EXPIRED | RENEWED | TERMINATED
}
```

Dashboard widget + email notification to HR/Admin 60 and 30 days before contract expiry.

### 4.2 Documents, Reports & Qualifications

Single document store with typed categories:

```
Document {
  id, userId
  category    // QUALIFICATION | REPORT | CONTRACT | MEDICAL_CERTIFICATE | ID | OTHER
  title, description
  fileName, mimeType, sizeBytes, storagePath, sha256
  uploadedById, uploadedAt
}

Qualification {            // structured metadata on top of a document
  id, userId, documentId?
  title, institution
  dateAttained, expiryDate?   // expiry for certs (e.g., first aid, licenses)
}
```

Expiring qualifications surface on HR dashboard.

Medical certificates are sensitive: visible only to the owner, HR, and Administrator (Data Protection Act 2011 consideration) — supervisors see only "certificate provided: yes/no".

## 5. Assets

```
Asset {
  id, assetTag, name, category, serialNumber, status   // IN_STORE | ASSIGNED | REPAIR | RETIRED
}
AssetAssignment {
  id, assetId, userId
  assignedAt, assignedById
  returnedAt?, returnCondition?, receivedById?
}
```

Employee profile shows current holdings.

Exit clearance check: an employee cannot be set to EXITED while assets remain assigned (warning + override with reason, audited).

Keep scope to assignment tracking (no depreciation/procurement) — Asset Registry remains the full lifecycle system; optional future sync via asset tag.

## 6. Leave

### 6.1 Leave Types (seedable, admin-editable)

| Type | Default entitlement | Notes |
|------|---------------------|-------|
| Vacation | per employment type/years of service | |
| Sick | 14 days | > 2 consecutive days requires medical certificate |
| Casual | e.g., 3 days | |
| Maternity / Paternity | statutory | |
| Bereavement | e.g., 3 days | |
| Study | configurable | |
| No-Pay | unlimited, flagged | does not draw from balance |

```
LeaveType { id, name, requiresCertificateAfterDays?, drawsFromBalance, color, active }
LeaveBalance { id, userId, leaveTypeId, year, entitled, carriedOver, adjusted, used, pending }
```

HR/Admin can adjust balances; every adjustment requires a reason and is audited.

### 6.2 Day Calculation (critical business rule)

- Work week: Monday–Friday.
- Count all calendar days from `startDate` to `endDate` inclusive, then:
  - Exclude weekends and T&T public holidays **only at the edges** of the period.
  - Include weekends/holidays that are **sandwiched** inside the leave period.
- Therefore Friday + the following Monday = **4 days** (Sat + Sun counted because leave resumes immediately after).
- A request ending on a Friday does not count the following weekend.
- T&T public holidays table: `Holiday { date, name, year }`, seeded with fixed-date holidays + admin entry for movable ones (Eid, Divali, Easter-related). Holidays at the edge of a leave period are excluded; sandwiched holidays are included (same rule as weekends).
- Show the computed day count live on the request form before submission, with a breakdown ("includes Sat 14 & Sun 15").

### 6.3 Leave Request Lifecycle

```
LeaveRequest {
  id, userId, leaveTypeId
  startDate, endDate, calculatedDays
  reason
  status        // PENDING | APPROVED | REJECTED | CANCELLED
  certificateDocumentId?
  certificateRequired      // computed at submission
  createdAt, decidedAt?
}
ApprovalStep {
  id, leaveRequestId
  level
  assignedAuthorityId      // resolved from ReportingLines at submission
  actedById?               // actual actor (may be delegate/escalation)
  status                   // PENDING | APPROVED | REJECTED | SKIPPED
  comment?, actedAt?
}
```

**Flow:**

1. Employee submits → system resolves the approval chain from current ReportingLines (level 1, level 2, …). Balance `pending` increments.
2. Steps are actioned in order. Where an employee has multiple authorities at the same level, any one of them may action that level (first action wins; others notified it was handled).
3. Rejection at any level ends the request (REJECTED); subsequent steps become SKIPPED.
4. Final approval: `used` increments, `pending` decrements; if the requester is an authority, prompt delegation setup.
5. Cancellation: employee may cancel a PENDING request any time (chain notified), or an APPROVED request before its start date (balance restored, full chain + HR notified). Cancelling approved leave that has already started requires HR action ("recall/amend"), audited.
6. Sick leave > 2 computed days: certificate upload required either at submission or within 3 working days of resuming duty — request is approvable, but flagged `certificate outstanding` on HR dashboard until uploaded.

### 6.4 Conflict & Context Aids

On the approval screen show: requester's balance, team calendar overlap (who else in the department is off in that window), and certificate status.

Team/department calendar view (month grid, color by leave type).

## 7. Notifications (SMTP)

| Event | Recipients |
|-------|------------|
| Request submitted | Level-1 authorities (all at that level) |
| Step approved | Requester + next-level authority |
| Final approval / rejection | Requester + all chain participants |
| Cancellation | All chain participants + HR if previously approved |
| Delegation activated | Delegate + Admin/HR |
| Contract expiring (60/30 days) | HR + Admin |
| Certificate outstanding (daily digest) | HR |

All emails also recorded as in-app notifications (`Notification` table with readAt).

Email templates: clean dark-accented HTML, org name/logo configurable.

Sending is queued (DB-backed job table + interval worker under PM2) so SMTP outages never block the request flow; failed sends retried with backoff and visible in admin panel.

## 8. Audit Logging (full / deep)

Append-only `AuditLog`:

```
AuditLog {
  id, timestamp
  actorId            // who did it (null = system)
  actingForId?       // delegation context
  action             // e.g., LEAVE.APPROVE, USER.UPDATE, BALANCE.ADJUST, AUTH.LOGIN
  entityType, entityId
  before JSONB, after JSONB     // full snapshots or diffs
  ip, userAgent
}
```

Every create/update/delete on every entity, every auth event (login, failed login, logout, password change), every file download of sensitive documents, every email dispatch.

No UPDATE/DELETE permitted on this table at the app layer; enforce with a Postgres trigger that rejects modification.

Admin audit viewer: filter by actor, entity, action, date range; export CSV.

## 9. UI

Dark, modern, cinematic aesthetic consistent with existing house style.

Key views: Dashboard (role-aware), My Leave (+ request form with live day calc), Approvals queue, Team calendar, Org chart (departments + reporting lines, with effective-date history), Employee profile (tabs: Details / Contracts / Documents & Qualifications / Assets / Leave history), Admin (leave types, holidays, policies, SMTP, delegations, audit viewer, balance adjustments).

Mobile-friendly: employees will submit/cancel from phones.

## 10. Open Defaults (assumed unless changed)

- Accrual: fixed annual entitlement granted Jan 1 (pro-rated by month for mid-year hires), carry-over capped at 5 vacation days into Q1 of the following year.
- Same-level multiple authorities: any one may action the level (first action wins).
- Medical certificate timing: at submission or within 3 working days of resumption.
- Public holidays: treated exactly like weekends in the day calculation (excluded at edges, counted when sandwiched).

## 11. Build Order

1. Schema + Prisma migrations + seed (roles, leave types, T&T holidays 2026–2027)
2. Auth + RBAC middleware + audit logging infrastructure (wrap Prisma with middleware/extension so auditing is automatic)
3. Users, departments, reporting lines + org chart
4. Leave engine: day calculator (with unit tests for Fri+Mon=4, edge weekends, holidays), balances, request lifecycle, approval resolution incl. delegation/escalation
5. Notifications (queue + SMTP + templates)
6. Documents/qualifications + contracts + certificate flow
7. Assets + exit clearance
8. Dashboards, calendar, admin panels, audit viewer
9. Deployment scripts (install/update, PM2 ecosystem file, Nginx config, backup cron for DB + files)
