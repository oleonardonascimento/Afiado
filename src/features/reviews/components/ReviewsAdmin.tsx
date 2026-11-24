"use client";

/** A15: avaliações — média, filtro por barbeiro e nota, resposta da barbearia. */
import { MessageSquareReply, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Stars } from "@/components/shared/Stars";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { Review } from "@/domain/entities";
import { ratingSummary } from "@/domain/shop";
import {
  useProfessionals,
  useReviews,
} from "@/features/catalog/hooks/useCatalog";
import { useClients } from "@/features/clients/hooks/useClients";
import { useReplyReview } from "@/features/settings/hooks/useCatalogAdmin";
import { formatDate } from "@/lib/format";
import { firstName } from "@/lib/labels";

export function ReviewsAdmin() {
  const reviews = useReviews();
  const professionals = useProfessionals();
  const clients = useClients();
  const [pro, setPro] = useState("all");
  const [rating, setRating] = useState("all");

  if (reviews.isError)
    return <ErrorState onRetry={() => void reviews.refetch()} />;
  const barbers = (professionals.data ?? []).filter(
    (p) => p.role !== "reception",
  );
  const list = (reviews.data ?? [])
    .filter((r) => pro === "all" || r.professionalId === pro)
    .filter((r) => rating === "all" || r.rating === Number(rating))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const summary = ratingSummary(
    reviews.data ?? [],
    pro === "all" ? undefined : pro,
  );
  const clientName = (id: string) =>
    clients.data?.find((c) => c.id === id)?.name ?? "Cliente";
  const proName = (id: string) =>
    firstName(professionals.data?.find((p) => p.id === id)?.name ?? "");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title="Avaliações"
        description={
          summary.average === null
            ? "Nenhuma avaliação ainda."
            : `Média ${summary.average.toLocaleString("pt-BR")} de 5 em ${summary.count} avaliações`
        }
      />
      <div className="flex flex-wrap gap-2">
        <Select value={pro} onValueChange={setPro}>
          <SelectTrigger className="w-48" aria-label="Barbeiro">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os barbeiros</SelectItem>
            {barbers.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={rating} onValueChange={setRating}>
          <SelectTrigger className="w-40" aria-label="Nota">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as notas</SelectItem>
            {[5, 4, 3, 2, 1].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} {n === 1 ? "estrela" : "estrelas"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {reviews.isLoading ? (
        <Skeleton className="rounded-card h-64" />
      ) : list.length === 0 ? (
        <EmptyState
          icon={Star}
          title="Nenhuma avaliação com esses filtros"
          description="Os clientes avaliam pela área “Meus agendamentos” depois do atendimento."
        />
      ) : (
        <ul className="divide-border flex flex-col divide-y">
          {list.slice(0, 100).map((r) => (
            <ReviewItem
              key={r.id}
              review={r}
              clientName={clientName(r.clientId)}
              proName={proName(r.professionalId)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

type ReviewItemProps = { review: Review; clientName: string; proName: string };

function ReviewItem({ review, clientName, proName }: ReviewItemProps) {
  const reply = useReplyReview();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(review.reply ?? "");

  const save = (value: string | null) =>
    reply.mutate(
      { id: review.id, reply: value },
      {
        onSuccess: () => {
          toast.success(value ? "Resposta publicada" : "Resposta removida");
          setOpen(false);
        },
        onError: () =>
          toast.error("Não foi possível salvar a resposta. Tente de novo."),
      },
    );

  return (
    <li className="flex flex-col gap-2 py-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Stars value={review.rating} />
        <span className="font-medium">{clientName}</span>
        <span className="text-text-muted text-sm">
          com {proName} em {formatDate(review.createdAt, "dd/MM/yy")}
        </span>
      </div>
      {review.comment ? (
        <p className="max-w-prose">{review.comment}</p>
      ) : (
        <p className="text-text-muted text-sm">Sem comentário.</p>
      )}
      {review.reply && !open && (
        <p className="rounded-control bg-surface-2 max-w-prose px-3 py-2 text-sm">
          <span className="font-medium">Resposta da barbearia: </span>
          {review.reply}
        </p>
      )}
      {open ? (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) save(text.trim());
          }}
        >
          <label htmlFor={`reply-${review.id}`} className="text-sm font-medium">
            Sua resposta
          </label>
          <Textarea
            id={`reply-${review.id}`}
            value={text}
            maxLength={500}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex flex-wrap justify-end gap-2">
            {review.reply && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => save(null)}
                disabled={reply.isPending}
              >
                Remover resposta
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Voltar
            </Button>
            <Button
              type="submit"
              loading={reply.isPending}
              disabled={!text.trim()}
            >
              Publicar resposta
            </Button>
          </div>
        </form>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={() => setOpen(true)}
        >
          <MessageSquareReply strokeWidth={1.75} aria-hidden />
          {review.reply ? "Editar resposta" : "Responder"}
        </Button>
      )}
    </li>
  );
}
