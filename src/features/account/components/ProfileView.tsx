"use client";

/** C11: meu perfil — dados, preferências de comunicação e "Excluir meus dados" (LGPD). */
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
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
import { useAccountClient } from "@/features/account/components/AccountShell";
import { ClientFormDialog } from "@/features/clients/components/ClientFormDialog";
import { useDeleteMyData } from "@/features/clients/hooks/useClients";
import { useClientClub } from "@/features/club/hooks/useClientClub";
import { middayIso } from "@/lib/calendar";
import { formatDate, formatPhone } from "@/lib/format";

export function ProfileView() {
  const client = useAccountClient();
  const club = useClientClub(client.id);
  const deleteData = useDeleteMyData();
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  const rows: [string, string][] = [
    ["Nome", client.name],
    ["Celular", formatPhone(client.phone)],
    ["E-mail", client.email ?? "Não informado"],
    [
      "Aniversário",
      client.birthday
        ? formatDate(middayIso(client.birthday), "dd/MM")
        : "Não informado",
    ],
    [
      "Novidades pelo WhatsApp",
      client.marketingConsent ? "Quero receber" : "Não quero receber",
    ],
  ];

  const onDelete = () =>
    deleteData.mutate(client.id, {
      onSuccess: () => {
        toast.success("Seus dados foram excluídos");
        router.replace("/");
      },
      onError: () =>
        toast.error("Não foi possível excluir seus dados. Tente de novo."),
    });

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="profile-data" className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="profile-data" className="text-lg font-semibold">
            Meus dados
          </h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditing(true)}
          >
            <Pencil strokeWidth={1.75} aria-hidden />
            Editar meus dados
          </Button>
        </div>
        <dl className="divide-border rounded-card border-border bg-surface divide-y border">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:justify-between"
            >
              <dt className="text-text-muted text-sm">{label}</dt>
              <dd className="break-words tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section
        aria-labelledby="profile-delete"
        className="flex flex-col items-start gap-2"
      >
        <h2 id="profile-delete" className="text-lg font-semibold">
          Excluir meus dados
        </h2>
        <p className="text-text-muted max-w-prose text-sm">
          Apaga seu cadastro e encerra sua sessão. Seus horários futuros deixam
          de aparecer para você.
        </p>
        {club.active ? (
          <p className="max-w-prose text-sm">
            Você tem uma assinatura do Clube ativa. Cancele em “Meu plano” antes
            de excluir seus dados.
          </p>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" loading={deleteData.isPending}>
                Excluir meus dados
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogTitle>Excluir seus dados da Afiado?</AlertDialogTitle>
              <AlertDialogDescription>
                Seu cadastro é apagado e você sai da conta. Para agendar de
                novo, será preciso se cadastrar outra vez.
              </AlertDialogDescription>
              <AlertDialogFooter>
                <AlertDialogCancel>Manter meus dados</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={onDelete}>
                  Excluir meus dados
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </section>

      {editing && (
        <ClientFormDialog
          client={client}
          mode="self"
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
