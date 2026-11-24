import type { Metadata } from "next";
import { ClubPage } from "@/features/club/components/ClubPage";

export const metadata: Metadata = {
  title: "Clube",
  description:
    "Assinatura mensal da barbearia: corte sem pagar na hora e cancelamento em 1 clique.",
};

export default function ClubRoute() {
  return <ClubPage />;
}
