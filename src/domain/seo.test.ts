import { describe, expect, it } from "vitest";
import { shop } from "@/data/mock/seed-catalog";
import { hairSalonJsonLd } from "@/domain/seo";

describe("hairSalonJsonLd", () => {
  it("gera HairSalon com endereço, telefone e horários por dia", () => {
    const ld = hairSalonJsonLd(shop, "https://afiado.example");
    expect(ld["@type"]).toBe("HairSalon");
    expect(ld.address.postalCode).toBe("70862-520");
    expect(ld.telephone).toBe("+55-61-3333-4444");
    expect(ld.openingHoursSpecification).toContainEqual({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "https://schema.org/Saturday",
      opens: "08:00",
      closes: "18:00",
    });
    expect(
      ld.openingHoursSpecification.some((o) => o.dayOfWeek.endsWith("Sunday")),
    ).toBe(false);
  });
});
