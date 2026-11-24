"use client";

/**
 * Capa da home: o letreiro de fachada é a "ousadia" da tela (nome enorme em
 * Big Shoulders sobre o marinho, como a placa da loja). Sem foto real na V1.
 */
import { Clock, Star } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { openStatus, ratingSummary } from "@/domain/shop";
import { useReviews, useShop } from "@/features/catalog/hooks/useCatalog";
import { cn } from "@/lib/cn";

export function HomeHero() {
  const shop = useShop();
  const reviews = useReviews();
  const status = shop.data ? openStatus(shop.data, new Date()) : null;
  const rating = ratingSummary(reviews.data ?? []);

  return (
    <section className="bg-primary text-primary-fg dark:bg-surface dark:text-text">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 pt-10 pb-12 md:pt-16 md:pb-16">
        <h1 className="font-display leading-display font-black tracking-display uppercase">
          <span className="block text-2xl md:text-3xl">Barbearia</span>
          <span className="block text-6xl">Afiado</span>
        </h1>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-base">
          {status ? (
            <span className="inline-flex items-center gap-2">
              <Clock className="size-4" strokeWidth={1.75} aria-hidden />
              <span className={cn(status.isOpen && "font-medium")}>{status.label}</span>
            </span>
          ) : (
            <Skeleton className="h-5 w-48 bg-primary-fg/20" />
          )}
          {rating.average !== null && (
            <span className="inline-flex items-center gap-2">
              <Star className="size-4 fill-current" strokeWidth={1.75} aria-hidden />
              <span className="tabular-nums">
                {rating.average.toFixed(1).replace(".", ",")} · {rating.count} avaliações
              </span>
            </span>
          )}
          {shop.data && <span>{shop.data.address.district}, {shop.data.address.city}</span>}
        </div>
        <p className="max-w-prose text-lg opacity-90">
          Escolha o serviço, o barbeiro e o horário. Sem criar conta antes: o celular só é pedido no final.
        </p>
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface p-3 md:static md:border-0 md:bg-transparent md:p-0">
          <Button asChild variant="brand" size="lg" className="w-full md:w-auto">
            <Link href="/agendar">Agendar horário</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
