import { PoleStripe } from "@/components/shared/PoleStripe";
import { publicShopProfile } from "@/data/public-profile";
import { hairSalonJsonLd } from "@/domain/seo";
import { HomeHero } from "@/features/public-site/components/HomeHero";
import { HomeLocation } from "@/features/public-site/components/HomeLocation";
import {
  HomeClub,
  HomeReviews,
  HomeServices,
  HomeTeam,
} from "@/features/public-site/components/HomeSections";

export default function HomePage() {
  const jsonLd = hairSalonJsonLd(
    publicShopProfile,
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  );
  return (
    <>
      <script
        type="application/ld+json"
        // JSON-LD precisa ir como texto bruto; o conteúdo é gerado por nós e escapado abaixo.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <PoleStripe className="h-1.5" />
      <HomeHero />
      <div className="mx-auto flex max-w-5xl flex-col gap-14 px-4 py-12">
        <div className="grid gap-14 md:grid-cols-2">
          <HomeServices />
          <HomeTeam />
        </div>
        <HomeClub />
        <HomeReviews />
        <HomeLocation />
      </div>
    </>
  );
}
