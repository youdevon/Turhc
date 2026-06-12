import type { DocumentCategory } from "@prisma/client";

/** Where each document category appears on the public site. */
export const DOCUMENT_CATEGORY_OPTIONS: {
  value: DocumentCategory;
  label: string;
  frontendPath: string;
}[] = [
  {
    value: "ANNUAL_REPORT",
    label: "Annual Report",
    frontendPath: "/governance/annual-reports",
  },
  {
    value: "PROCUREMENT_POLICY",
    label: "Procurement Policy",
    frontendPath: "/governance/procurement-policies",
  },
  {
    value: "FREEDOM_OF_INFORMATION",
    label: "Freedom of Information",
    frontendPath: "/governance/freedom-of-information",
  },
  {
    value: "PUBLIC_DOCUMENT",
    label: "Public Document",
    frontendPath: "/governance/documents",
  },
  {
    value: "GENERAL",
    label: "General",
    frontendPath: "/governance/documents",
  },
  {
    value: "GOVERNANCE",
    label: "Governance",
    frontendPath: "/governance/documents",
  },
];

const GOVERNANCE_SECTION_CATEGORIES: Record<string, DocumentCategory[]> = {
  "annual-reports": ["ANNUAL_REPORT"],
  "procurement-policies": ["PROCUREMENT_POLICY"],
  "freedom-of-information": ["FREEDOM_OF_INFORMATION"],
  documents: ["PUBLIC_DOCUMENT", "GENERAL", "GOVERNANCE"],
};

export const GOVERNANCE_DOCUMENT_SECTION_PATHS = [
  "/governance",
  "/governance/annual-reports",
  "/governance/procurement-policies",
  "/governance/freedom-of-information",
  "/governance/documents",
] as const;

export function getCategoriesForGovernanceSection(section: string): DocumentCategory[] {
  return GOVERNANCE_SECTION_CATEGORIES[section] ?? [];
}

export function getFrontendPathForCategory(category: string): string | null {
  return DOCUMENT_CATEGORY_OPTIONS.find((o) => o.value === category)?.frontendPath ?? null;
}
