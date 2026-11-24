"use client";

/** A16: configurações — abas Barbearia, Horários, Agendamento, Mensagens e Demonstração (aba na URL). */
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/states";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useShop } from "@/features/catalog/hooks/useCatalog";
import { useResetDemo } from "@/features/demo/hooks/useResetDemo";
import { BookingRulesForm } from "@/features/settings/components/BookingRulesForm";
import { MessagesForm } from "@/features/settings/components/MessagesForm";
import { ShopHoursForm } from "@/features/settings/components/ShopHoursForm";
import { ShopInfoForm } from "@/features/settings/components/ShopInfoForm";

const TABS = {
  barbearia: "Barbearia",
  horarios: "Horários",
  agendamento: "Agendamento",
  mensagens: "Mensagens",
  demonstracao: "Demonstração",
};
type Tab = keyof typeof TABS;

export function SettingsView() {
  const shop = useShop();
  const router = useRouter();
  const params = useSearchParams();
  const raw = params.get("aba");
  const tab: Tab = raw && raw in TABS ? (raw as Tab) : "barbearia";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader title="Configurações" />
      {shop.isError ? (
        <ErrorState onRetry={() => void shop.refetch()} />
      ) : !shop.data ? (
        <Skeleton className="rounded-card h-96" />
      ) : (
        <Tabs
          value={tab}
          onValueChange={(v) =>
            router.replace(`/admin/configuracoes?aba=${v}`, { scroll: false })
          }
        >
          <div className="-mx-4 overflow-x-auto px-4">
            <TabsList>
              {(Object.keys(TABS) as Tab[]).map((t) => (
                <TabsTrigger key={t} value={t}>
                  {TABS[t]}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <TabsContent value="barbearia" className="pt-4">
            <ShopInfoForm shop={shop.data} />
          </TabsContent>
          <TabsContent value="horarios" className="pt-4">
            <ShopHoursForm shop={shop.data} />
          </TabsContent>
          <TabsContent value="agendamento" className="pt-4">
            <BookingRulesForm rules={shop.data.booking} />
          </TabsContent>
          <TabsContent value="mensagens" className="pt-4">
            <MessagesForm messages={shop.data.messages} />
          </TabsContent>
          <TabsContent value="demonstracao" className="pt-4">
            <DemoReset />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function DemoReset() {
  const reset = useResetDemo();
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-text-muted max-w-prose">
        Esta versão guarda os dados só neste navegador. Restaurar volta
        clientes, agenda, comandas e caixa para o exemplo inicial.
      </p>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" loading={reset.isPending}>
            Restaurar dados de demonstração
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>
            Restaurar os dados de demonstração?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Tudo o que foi criado ou alterado neste navegador é apagado e volta
            ao exemplo inicial.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter meus dados</AlertDialogCancel>
            <AlertDialogAction onClick={() => reset.mutate()}>
              Restaurar dados
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
