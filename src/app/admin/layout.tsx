import type { Metadata } from "next";
import { AdminBottomNav } from "@/features/admin-shell/components/AdminBottomNav";
import { AdminSidebar } from "@/features/admin-shell/components/AdminSidebar";
import { AdminTopBar } from "@/features/admin-shell/components/AdminTopBar";

export const metadata: Metadata = {
  title: { default: "Painel", template: "%s · Painel Afiado" },
  robots: { index: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar />
        <main className="flex-1 px-4 pt-6 pb-24 lg:px-8 lg:pb-8">{children}</main>
      </div>
      <AdminBottomNav />
    </div>
  );
}
