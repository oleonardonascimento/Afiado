import { AdminBottomNav } from "@/features/admin-shell/components/AdminBottomNav";
import { AdminSidebar } from "@/features/admin-shell/components/AdminSidebar";
import { AdminTopBar } from "@/features/admin-shell/components/AdminTopBar";
import { RoleGate } from "@/features/admin-shell/components/RoleGate";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar />
        <main className="flex-1 px-4 pt-6 pb-24 lg:px-8 lg:pb-8">
          <RoleGate>{children}</RoleGate>
        </main>
      </div>
      <AdminBottomNav />
    </div>
  );
}
