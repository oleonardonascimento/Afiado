import { describe, expect, it } from "vitest";
import { browserStorage } from "@/data/mock/browser-storage";

describe("browserStorage", () => {
  it("devolve null no servidor e quando o navegador bloqueia o acesso ao localStorage", () => {
    expect(browserStorage(undefined)).toBeNull();
    const blocked = {
      get localStorage(): Storage {
        throw new DOMException("bloqueado", "SecurityError");
      },
    };
    expect(browserStorage(blocked)).toBeNull();
  });

  it("devolve o localStorage quando está disponível", () => {
    const storage = {} as Storage;
    expect(browserStorage({ localStorage: storage })).toBe(storage);
  });
});
