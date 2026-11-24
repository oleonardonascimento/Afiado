import type { Metadata } from "next";
import { ReviewsAdmin } from "@/features/reviews/components/ReviewsAdmin";

export const metadata: Metadata = { title: "Avaliações" };

export default function ReviewsPage() {
  return <ReviewsAdmin />;
}
