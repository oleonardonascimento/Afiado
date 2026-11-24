import type { Metadata } from "next";
import { Dashboard } from "@/features/dashboard/components/Dashboard";

export const metadata: Metadata = { title: "Início" };

export default function AdminHomePage() {
  return <Dashboard />;
}
