export const ENQUIRY_TYPES = [
  { value: "general", label: "General Enquiry" },
  { value: "tenders", label: "Tenders & Procurement" },
  { value: "projects", label: "Projects" },
  { value: "contractor", label: "Contractor Registration" },
  { value: "media", label: "Media & Communications" },
  { value: "foia", label: "Freedom of Information" },
  { value: "other", label: "Other" },
] as const;

export type EnquiryTypeValue = (typeof ENQUIRY_TYPES)[number]["value"];

export const ENQUIRY_TYPE_VALUES = ENQUIRY_TYPES.map((t) => t.value);

export function getEnquiryDisplayName(enquiry: {
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  email?: string | null;
}): string {
  if (enquiry.fullName?.trim()) return enquiry.fullName.trim();
  const first = enquiry.firstName?.trim() ?? "";
  const last = enquiry.lastName?.trim() ?? "";
  const combined = `${first} ${last}`.trim();
  if (combined) return combined;
  return enquiry.email?.trim() || "Unknown sender";
}

export function formatEnquiryType(type?: string | null): string {
  if (!type?.trim()) return "General Enquiry";
  return ENQUIRY_TYPES.find((t) => t.value === type)?.label ?? type;
}

export function formatEnquiryStatus(status?: string | null): string {
  if (!status) return "New";
  switch (status) {
    case "NEW":
      return "New";
    case "READ":
      return "Read";
    case "IN_PROGRESS":
      return "In Progress";
    case "RESPONDED":
      return "Responded";
    case "ARCHIVED":
      return "Archived";
    default:
      return status;
  }
}

export const ENQUIRY_STATUS_FILTERS = [
  { value: "all", label: "All active" },
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESPONDED", label: "Responded" },
  { value: "ARCHIVED", label: "Archived" },
  { value: "deleted", label: "Deleted" },
] as const;

export function isEnquiryUnread(enquiry: {
  isRead?: boolean | null;
  status?: string | null;
}): boolean {
  if (enquiry.isRead === false) return true;
  if (enquiry.status === "NEW") return true;
  return false;
}
