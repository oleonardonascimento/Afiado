import { PoleStripe } from "@/components/shared/PoleStripe";
import { HomeHero } from "@/features/public-site/components/HomeHero";
import { HomeLocation } from "@/features/public-site/components/HomeLocation";
import {
  HomeClub,
  HomeReviews,
  HomeServices,
  HomeTeam,
} from "@/features/public-site/components/HomeSections";

export default function HomePage() {
  return (
    <>
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
