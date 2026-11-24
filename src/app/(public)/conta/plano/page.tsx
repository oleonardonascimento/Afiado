import type { Metadata } from "next";
import { MyPlan } from "@/features/club/components/MyPlan";

export const metadata: Metadata = { title: "Meu plano" };

export default function MyPlanPage() {
  return <MyPlan />;
}
