import type { Metadata } from "next";
import { ClubCheckout } from "@/features/club/components/ClubCheckout";

export const metadata: Metadata = { title: "Assinar o Clube" };

export default async function ClubCheckoutRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ClubCheckout planId={id} />;
}
