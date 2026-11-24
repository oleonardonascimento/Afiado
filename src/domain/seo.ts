/** Dados estruturados schema.org/HairSalon para a página inicial (SEO local). */
import type { Barbershop } from "@/domain/entities";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function e164Like(digits: string): string {
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  const cut = rest.length - 4;
  return `+55-${ddd}-${rest.slice(0, cut)}-${rest.slice(cut)}`;
}

export function hairSalonJsonLd(shop: Barbershop, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: shop.name,
    description: shop.about,
    url,
    telephone: e164Like(shop.phone),
    address: {
      "@type": "PostalAddress",
      streetAddress: shop.address.street,
      addressLocality: shop.address.city,
      addressRegion: shop.address.state,
      postalCode: shop.address.zip.replace(/^(\d{5})-?(\d{3})$/, "$1-$2"),
      addressCountry: "BR",
    },
    openingHoursSpecification: shop.hours.flatMap((day) =>
      day.ranges.map((r) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: `https://schema.org/${DAYS[day.weekday]}`,
        opens: r.start,
        closes: r.end,
      })),
    ),
    sameAs: shop.instagram
      ? [`https://www.instagram.com/${shop.instagram}`]
      : [],
  };
}
