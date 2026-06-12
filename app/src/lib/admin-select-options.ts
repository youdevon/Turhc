export const PUBLISHING_STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft — not visible on the website" },
  { value: "PUBLISHED", label: "Published — live on the website" },
  { value: "ARCHIVED", label: "Archived — hidden from the website" },
] as const;

export const PROJECT_STATUS_OPTIONS = [
  { value: "PLANNED", label: "Planned" },
  { value: "TENDERING", label: "Tendering" },
  { value: "AWARDED", label: "Awarded" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "SUSPENDED", label: "Suspended" },
] as const;

export const TENDER_STATUS_OPTIONS = [
  { value: "OPEN", label: "Open" },
  { value: "CLOSED", label: "Closed" },
  { value: "AWARDED", label: "Awarded" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

export const MEDIA_TYPE_OPTIONS = [
  { value: "IMAGE", label: "Image" },
  { value: "VIDEO", label: "Video" },
] as const;

export const MANDATE_ICON_OPTIONS = [
  { value: "Shield", label: "Shield" },
  { value: "Building2", label: "Building" },
  { value: "Users", label: "People" },
  { value: "Target", label: "Target" },
  { value: "Landmark", label: "Landmark" },
  { value: "HardHat", label: "Construction" },
  { value: "Globe", label: "Global" },
  { value: "Scale", label: "Governance" },
] as const;
