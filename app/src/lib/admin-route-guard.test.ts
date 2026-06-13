import { describe, expect, it } from "vitest";
import { canAccessAdminPath, isAdminOnlyPath } from "@/lib/admin-route-guard";

describe("admin-route-guard", () => {
  it("marks admin-only paths", () => {
    expect(isAdminOnlyPath("/admin/settings")).toBe(true);
    expect(isAdminOnlyPath("/admin/users/new")).toBe(true);
    expect(isAdminOnlyPath("/admin/projects")).toBe(false);
  });

  it("allows administrators on admin-only paths", () => {
    expect(canAccessAdminPath("Administrator", "/admin/audit-log")).toBe(true);
  });

  it("blocks editors from admin-only paths", () => {
    expect(canAccessAdminPath("Editor", "/admin/settings")).toBe(false);
    expect(canAccessAdminPath("Editor", "/admin/projects")).toBe(true);
  });
});
