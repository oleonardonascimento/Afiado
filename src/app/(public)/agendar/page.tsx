import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingFlow } from "@/features/booking/components/BookingFlow";

export const metadata: Metadata = { title: "Agendar horário" };

export default function BookingPage() {
  return (
    <Suspense>
      <BookingFlow />
    </Suspense>
  );
}
