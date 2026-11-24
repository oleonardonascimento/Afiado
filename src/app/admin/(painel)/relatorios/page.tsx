import type { Metadata } from "next";
import { ReportsView } from "@/features/reports/components/ReportsView";

export const metadata: Metadata = { title: "Relatórios" };

export default function ReportsPage() {
  return <ReportsView />;
}
