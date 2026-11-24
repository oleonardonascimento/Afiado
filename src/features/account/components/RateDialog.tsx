"use client";

/** Avaliar atendimento concluído: 1–5 estrelas + comentário (RF-09). */
import { Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Appointment } from "@/domain/entities";
import { useRateAppointment } from "@/features/account/hooks/useMyAppointments";
import { cn } from "@/lib/cn";

type RateDialogProps = { appointment: Appointment; professionalName: string };

export function RateDialog({ appointment, professionalName }: RateDialogProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const rate = useRateAppointment();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="self-start">
          <Star strokeWidth={1.75} aria-hidden />
          Avaliar atendimento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Como foi com {professionalName}?</DialogTitle>
          <DialogDescription>
            Sua nota ajuda outros clientes e a equipe.
          </DialogDescription>
        </DialogHeader>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">Nota</legend>
          <div
            className="flex gap-1"
            role="radiogroup"
            aria-label="Nota de 1 a 5"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} ${n === 1 ? "estrela" : "estrelas"}`}
                onClick={() => setRating(n)}
                className="rounded-control hover:bg-surface-2 flex size-11 items-center justify-center"
              >
                <Star
                  className={cn(
                    "size-7",
                    n <= rating
                      ? "fill-warning text-warning"
                      : "text-border-strong",
                  )}
                  strokeWidth={1.75}
                  aria-hidden
                />
              </button>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`comment-${appointment.id}`}>
            Comentário (opcional)
          </Label>
          <Textarea
            id={`comment-${appointment.id}`}
            value={comment}
            maxLength={500}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button
            disabled={rating === 0}
            loading={rate.isPending}
            onClick={() =>
              rate.mutate(
                {
                  appointmentId: appointment.id,
                  clientId: appointment.clientId,
                  professionalId: appointment.professionalId,
                  rating,
                  comment: comment.trim(),
                },
                {
                  onSuccess: () => {
                    toast.success("Avaliação enviada. Obrigado!");
                    setOpen(false);
                  },
                  onError: () =>
                    toast.error("Não foi possível enviar. Tente de novo."),
                },
              )
            }
          >
            Enviar avaliação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
