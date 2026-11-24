import type { Metadata } from "next";
import { ClientsList } from "@/features/clients/components/ClientsList";

export const metadata: Metadata = { title: "Clientes" };

export default function ClientsPage() {
  return <ClientsList />;
}
