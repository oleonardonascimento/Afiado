import type { Metadata } from "next";
import { ClientDetail } from "@/features/clients/components/ClientDetail";

export const metadata: Metadata = { title: "Ficha do cliente" };

export default async function ClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ClientDetail id={id} />;
}
