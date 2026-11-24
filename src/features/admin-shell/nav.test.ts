import { describe, expect, it } from "vitest";
import { canAccess } from "@/features/admin-shell/nav";

describe("canAccess", () => {
  it("libera telas do papel e bloqueia as de outro papel, inclusive subrotas", () => {
    expect(canAccess("owner", "/admin/equipe/pro-1")).toBe(true);
    expect(canAccess("reception", "/admin/equipe")).toBe(false);
    expect(canAccess("reception", "/admin/equipe/pro-1")).toBe(false);
    expect(canAccess("barber", "/admin/comissoes")).toBe(true);
    expect(canAccess("barber", "/admin/caixa")).toBe(false);
    expect(canAccess("barber", "/admin")).toBe(true);
  });
});
