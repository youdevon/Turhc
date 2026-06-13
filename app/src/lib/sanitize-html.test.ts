import { describe, expect, it } from "vitest";
import { sanitizePublicHtml } from "@/lib/sanitize-html";

describe("sanitizePublicHtml", () => {
  it("escapes HTML tags", () => {
    expect(sanitizePublicHtml('<script>alert("x")</script>')).not.toContain("<script>");
  });

  it("converts newlines to br tags", () => {
    expect(sanitizePublicHtml("line one\nline two")).toBe("line one<br/>line two");
  });

  it("handles empty input", () => {
    expect(sanitizePublicHtml("")).toBe("");
    expect(sanitizePublicHtml(null)).toBe("");
  });
});
