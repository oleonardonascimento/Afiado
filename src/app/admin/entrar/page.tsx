import type { Metadata } from "next";
import { StaffSignIn } from "@/features/admin-shell/components/StaffSignIn";

export const metadata: Metadata = { title: "Entrar no painel" };

export default function StaffSignInPage() {
  return <StaffSignIn />;
}
