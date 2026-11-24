import type { Metadata } from "next";
import { AccountHome } from "@/features/account/components/AccountHome";

export const metadata: Metadata = { title: "Minha conta" };

export default function AccountPage() {
  return <AccountHome />;
}
