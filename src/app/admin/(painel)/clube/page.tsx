import type { Metadata } from "next";
import { Suspense } from "react";
import { ClubAdmin } from "@/features/club/components/ClubAdmin";

export const metadata: Metadata = { title: "Clube" };

export default function ClubAdminPage() {
  return (
    <Suspense>
      <ClubAdmin />
    </Suspense>
  );
}
