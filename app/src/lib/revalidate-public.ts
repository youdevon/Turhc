import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS } from "./cache-tags";

/** Public routes that read from CMS settings or page records. */
export const PUBLIC_PAGE_PATHS = [
  "/",
  "/landing-v2",
  "/about",
  "/projects",
  "/tenders",
  "/contractors",
  "/governance",
  "/governance/board",
  "/governance/leadership",
  "/news",
  "/contact",
] as const;

/** Invalidate layout (header/footer/theme) and all main public pages. */
export async function revalidatePublicSite() {
  revalidateTag(CACHE_TAGS.settings);
  revalidateTag(CACHE_TAGS.landing);
  revalidateTag(CACHE_TAGS.landingV2);
  revalidatePath("/", "layout");
  for (const path of PUBLIC_PAGE_PATHS) {
    revalidatePath(path, "layout");
    revalidatePath(path, "page");
  }
}

export async function revalidatePublicPage(slug: string) {
  revalidatePath("/", "layout");
  revalidatePath(`/${slug}`);
}

export function revalidateUnreadEnquiries() {
  revalidateTag(CACHE_TAGS.unreadEnquiries);
  revalidatePath("/admin", "layout");
}

export function revalidateSiteSettings() {
  revalidateTag(CACHE_TAGS.settings);
  revalidatePath("/", "layout");
}

export function revalidateLandingPage() {
  revalidateTag(CACHE_TAGS.landing);
  revalidatePath("/");
  revalidatePath("/landing-v2");
}

export function revalidateLandingV2Page() {
  revalidateTag(CACHE_TAGS.landingV2);
  revalidatePath("/landing-v2");
}
