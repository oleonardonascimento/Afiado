import type { Metadata } from "next";
import { BarberProfile } from "@/features/public-site/components/BarberProfile";

export const metadata: Metadata = { title: "Barbeiro" };

export default async function BarberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BarberProfile id={id} />;
}
