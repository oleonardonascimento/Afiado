import type { Metadata } from "next";
import { TeamList } from "@/features/team/components/TeamList";

export const metadata: Metadata = { title: "Equipe" };

export default function TeamPage() {
  return <TeamList />;
}
