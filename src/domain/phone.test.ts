import { describe, expect, it } from "vitest";
import { isValidPhone, normalizePhone } from "@/domain/phone";

describe("phone", () => {
  it("normaliza para dígitos nacionais", () => {
    expect(normalizePhone("(61) 99999-8888")).toBe("61999998888");
    expect(normalizePhone("+55 61 99999-8888")).toBe("61999998888");
    expect(normalizePhone("55 61 3333 4444")).toBe("6133334444");
  });

  it("valida DDD + número", () => {
    expect(isValidPhone("61999998888")).toBe(true);
    expect(isValidPhone("6133334444")).toBe(true);
    expect(isValidPhone("61899998888")).toBe(false);
    expect(isValidPhone("999998888")).toBe(false);
    expect(isValidPhone("01999998888")).toBe(false);
  });
});
