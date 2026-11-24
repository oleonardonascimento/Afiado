"use client";

/** Comanda avulsa: venda sem agendamento (cliente opcional). */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Client } from "@/domain/entities";
import { useProfessionals } from "@/features/catalog/hooks/useCatalog";
import { ClientPicker } from "@/features/clients/components/ClientPicker";
import { useOpenWalkIn } from "@/features/orders/hooks/useOrders";
import { useStaffMember } from "@/hooks/useSession";

export function WalkInDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const professionals = useProfessionals();
  const { role, staff } = useStaffMember();
  const open = useOpenWalkIn();
  const team = (professionals.data ?? []).filter((p) => p.active && p.serviceIds.length > 0);
  const [client, setClient] = useState<Client | null>(null);
  const [professionalId, setProfessionalId] = useState(role === "barber" ? (staff?.id ?? "") : "");

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova comanda</DialogTitle>
          <DialogDescription>Para venda de produto ou atendimento sem agendamento.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="walkin-pro">Barbeiro responsável</Label>
            <Select value={professionalId} onValueChange={setProfessionalId}>
              <SelectTrigger id="walkin-pro">
                <SelectValue placeholder="Escolha o barbeiro" />
              </SelectTrigger>
              <SelectContent>
                {team.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="walkin-client">Cliente (opcional)</Label>
            <ClientPicker id="walkin-client" value={client} onChange={setClient} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Voltar
          </Button>
          <Button
            disabled={!professionalId}
            loading={open.isPending}
            onClick={() =>
              open.mutate(
                { clientId: client?.id ?? null, professionalId },
                {
                  onSuccess: (order) => {
                    toast.success("Comanda aberta");
                    router.push(`/admin/comandas/${order.id}`);
                  },
                  onError: () => toast.error("Não foi possível abrir a comanda. Tente de novo."),
                },
              )
            }
          >
            Abrir comanda
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
