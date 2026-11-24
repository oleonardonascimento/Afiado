import { describe, expect, it } from "vitest";
import { buildIcs } from "@/lib/ics";
import { whatsappLink } from "@/lib/whatsapp";

describe("buildIcs", () => {
  it("gera evento com início/fim em UTC e texto escapado", () => {
    const ics = buildIcs({
      uid: "apt-1@afiado",
      start: "2026-11-27T17:00:00.000Z",
      end: "2026-11-27T17:30:00.000Z",
      title: "Corte, barba na Afiado",
      location: "SCLN 210; Asa Norte",
      description: "Com Diego",
    });
    expect(ics).toContain("BEGIN:VCALENDAR\r\n");
    expect(ics).toContain("DTSTART:20261127T170000Z\r\n");
    expect(ics).toContain("DTEND:20261127T173000Z\r\n");
    expect(ics).toContain("SUMMARY:Corte\\, barba na Afiado\r\n");
    expect(ics).toContain("LOCATION:SCLN 210\\; Asa Norte\r\n");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });
});

describe("whatsappLink", () => {
  it("usa DDI 55 e codifica a mensagem", () => {
    expect(whatsappLink("61999990000", "Olá, tudo bem?")).toBe(
      "https://wa.me/5561999990000?text=Ol%C3%A1%2C%20tudo%20bem%3F",
    );
  });
});
