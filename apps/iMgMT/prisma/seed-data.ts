/** Trinidad & Tobago public holidays for seeding (2026–2027). Movable dates are approximate/admin-editable. */
export type HolidaySeed = {
  date: string;
  name: string;
  year: number;
  isMovable?: boolean;
};

export const TT_HOLIDAYS_2026: HolidaySeed[] = [
  { date: "2026-01-01", name: "New Year's Day", year: 2026 },
  { date: "2026-03-30", name: "Spiritual Shouter Baptist Liberation Day", year: 2026 },
  { date: "2026-03-20", name: "Eid-ul-Fitr", year: 2026, isMovable: true },
  { date: "2026-04-03", name: "Good Friday", year: 2026, isMovable: true },
  { date: "2026-04-06", name: "Easter Monday", year: 2026, isMovable: true },
  { date: "2026-05-30", name: "Indian Arrival Day", year: 2026 },
  { date: "2026-05-21", name: "Corpus Christi", year: 2026, isMovable: true },
  { date: "2026-06-19", name: "Labour Day", year: 2026 },
  { date: "2026-08-01", name: "Emancipation Day", year: 2026 },
  { date: "2026-08-31", name: "Independence Day", year: 2026 },
  { date: "2026-09-24", name: "Republic Day", year: 2026 },
  { date: "2026-11-08", name: "Divali", year: 2026, isMovable: true },
  { date: "2026-12-25", name: "Christmas Day", year: 2026 },
  { date: "2026-12-26", name: "Boxing Day", year: 2026 },
];

export const TT_HOLIDAYS_2027: HolidaySeed[] = [
  { date: "2027-01-01", name: "New Year's Day", year: 2027 },
  { date: "2027-03-10", name: "Eid-ul-Fitr", year: 2027, isMovable: true },
  { date: "2027-03-26", name: "Good Friday", year: 2027, isMovable: true },
  { date: "2027-03-29", name: "Easter Monday", year: 2027, isMovable: true },
  { date: "2027-03-30", name: "Spiritual Shouter Baptist Liberation Day", year: 2027 },
  { date: "2027-05-13", name: "Corpus Christi", year: 2027, isMovable: true },
  { date: "2027-05-30", name: "Indian Arrival Day", year: 2027 },
  { date: "2027-06-19", name: "Labour Day", year: 2027 },
  { date: "2027-08-01", name: "Emancipation Day", year: 2027 },
  { date: "2027-08-31", name: "Independence Day", year: 2027 },
  { date: "2027-09-24", name: "Republic Day", year: 2027 },
  { date: "2027-10-29", name: "Divali", year: 2027, isMovable: true },
  { date: "2027-12-25", name: "Christmas Day", year: 2027 },
  { date: "2027-12-26", name: "Boxing Day", year: 2027 },
];

export const ALL_TT_HOLIDAYS = [...TT_HOLIDAYS_2026, ...TT_HOLIDAYS_2027];

export const LEAVE_TYPES_SEED = [
  {
    name: "Vacation",
    defaultEntitlement: 14,
    requiresCertificateAfterDays: null,
    drawsFromBalance: true,
    color: "#3b82f6",
    notes: "Annual leave — entitlement varies by employment type and years of service",
  },
  {
    name: "Sick",
    defaultEntitlement: 14,
    requiresCertificateAfterDays: 2,
    drawsFromBalance: true,
    color: "#ef4444",
    notes: "Medical certificate required after 2 consecutive days",
  },
  {
    name: "Casual",
    defaultEntitlement: 3,
    requiresCertificateAfterDays: null,
    drawsFromBalance: true,
    color: "#f59e0b",
    notes: null,
  },
  {
    name: "Maternity",
    defaultEntitlement: null,
    requiresCertificateAfterDays: null,
    drawsFromBalance: true,
    color: "#ec4899",
    notes: "Statutory entitlement",
  },
  {
    name: "Paternity",
    defaultEntitlement: null,
    requiresCertificateAfterDays: null,
    drawsFromBalance: true,
    color: "#8b5cf6",
    notes: "Statutory entitlement",
  },
  {
    name: "Bereavement",
    defaultEntitlement: 3,
    requiresCertificateAfterDays: null,
    drawsFromBalance: true,
    color: "#6b7280",
    notes: null,
  },
  {
    name: "Study",
    defaultEntitlement: null,
    requiresCertificateAfterDays: null,
    drawsFromBalance: true,
    color: "#14b8a6",
    notes: "Configurable by HR/Admin",
  },
  {
    name: "No-Pay",
    defaultEntitlement: null,
    requiresCertificateAfterDays: null,
    drawsFromBalance: false,
    color: "#64748b",
    notes: "Does not draw from balance",
  },
] as const;

export const ROLES_SEED = [
  { name: "Administrator", description: "Full system access" },
  { name: "HR", description: "Employee records, documents, balances, HR approvals" },
  { name: "Manager", description: "Department approvals and team visibility" },
  { name: "Supervisor", description: "Direct report approvals" },
  { name: "Employee", description: "Submit and manage own leave" },
] as const;
