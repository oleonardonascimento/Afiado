import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingConfirmation } from "@/features/booking/components/BookingConfirmation";

export const metadata: Metadata = { title: "Horário marcado", robots: { index: false } };

export default function BookingConfirmedPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Suspense>
        <BookingConfirmation />
      </Suspense>
    </div>
  );
}
