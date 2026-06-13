/**
 * Escape user/CMS HTML for safe public rendering.
 * Preserves line breaks as <br/> without allowing tags or script.
 */
export function sanitizePublicHtml(input: string | null | undefined): string {
  if (!input) return "";

  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\r\n/g, "\n")
    .replace(/\n/g, "<br/>");
}
