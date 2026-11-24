import { Skeleton } from "@/components/ui/skeleton";

export default function AdminHomePage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Painel</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((n) => (
          <Skeleton key={n} className="h-28 rounded-card" />
        ))}
      </div>
    </div>
  );
}
