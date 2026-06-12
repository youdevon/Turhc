/** Next.js cache tags for targeted revalidation after CMS changes. */
export const CACHE_TAGS = {
  settings: "site-settings",
  landing: "landing-page",
  landingV2: "landing-v2-page",
  unreadEnquiries: "unread-enquiries",
} as const;
