import type { Metadata } from "next";
import { CashView } from "@/features/cash/components/CashView";

export const metadata: Metadata = { title: "Caixa" };

export default function CashPage() {
  return <CashView />;
}
