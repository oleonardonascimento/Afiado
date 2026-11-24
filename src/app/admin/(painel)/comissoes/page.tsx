import type { Metadata } from "next";
import { CommissionsView } from "@/features/commissions/components/CommissionsView";

export const metadata: Metadata = { title: "Comissões" };

export default function CommissionsPage() {
  return <CommissionsView />;
}
