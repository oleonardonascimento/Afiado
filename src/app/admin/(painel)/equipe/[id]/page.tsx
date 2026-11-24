import type { Metadata } from "next";
import { ProfessionalEditor } from "@/features/team/components/ProfessionalEditor";

export const metadata: Metadata = { title: "Equipe" };

export default async function ProfessionalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProfessionalEditor id={id} />;
}
