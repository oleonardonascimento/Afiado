import type { Metadata } from "next";
import { ServicesAdmin } from "@/features/settings/components/ServicesAdmin";

export const metadata: Metadata = { title: "Serviços" };

export default function ServicesPage() {
  return <ServicesAdmin />;
}
