"use client";

import { AtSign, MapPin, MessageCircle, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WEEKDAY_NAMES } from "@/domain/shop";
import { useShop } from "@/features/catalog/hooks/useCatalog";
import { todayIn, weekdayOf } from "@/lib/calendar";
import { formatPhone } from "@/lib/format";
import { whatsappLink } from "@/lib/whatsapp";
import { cn } from "@/lib/cn";
import { capitalizeFirst } from "@/lib/labels";

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function HomeLocation() {
  const shop = useShop();
  if (!shop.data) return <Skeleton className="h-64 rounded-card" />;
  const s = shop.data;
  const address = `${s.address.street}, ${s.address.district}, ${s.address.city}/${s.address.state}`;
  const today = weekdayOf(todayIn(new Date()));

  return (
    <section aria-labelledby="onde" className="grid gap-6 md:grid-cols-2">
      <div className="flex flex-col gap-4">
        <h2 id="onde" className="font-display text-3xl leading-display font-black tracking-display uppercase md:text-4xl">
          Onde fica
        </h2>
        <p className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-5 shrink-0 text-text-muted" strokeWidth={1.75} aria-hidden />
          {address}
        </p>
        <MapPlaceholder />
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Navigation strokeWidth={1.75} aria-hidden />
              Como chegar
            </a>
          </Button>
          <Button asChild variant="secondary">
            <a href={whatsappLink(s.whatsapp, "Olá! Vim pelo site da Afiado.")} target="_blank" rel="noopener noreferrer">
              <MessageCircle strokeWidth={1.75} aria-hidden />
              WhatsApp {formatPhone(s.whatsapp)}
            </a>
          </Button>
          <Button asChild variant="ghost">
            <a href={`https://instagram.com/${s.instagram}`} target="_blank" rel="noopener noreferrer">
              <AtSign strokeWidth={1.75} aria-hidden />
              {s.instagram}
            </a>
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-semibold">Horários</h3>
        <table className="w-full text-left">
          <caption className="sr-only">Horário de funcionamento</caption>
          <tbody>
            {WEEK_ORDER.map((weekday) => {
              const ranges = s.hours.find((h) => h.weekday === weekday)?.ranges ?? [];
              return (
                <tr key={weekday} className={cn("border-b border-border", weekday === today && "font-semibold")}>
                  <th scope="row" className="py-2 font-normal">
                    {capitalizeFirst(WEEKDAY_NAMES[weekday] ?? "")}
                    {weekday === today && <span className="sr-only"> (hoje)</span>}
                  </th>
                  <td className="py-2 text-right tabular-nums">
                    {ranges.length === 0 ? "Fechado" : ranges.map((r) => `${r.start}–${r.end}`).join(", ")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** Mapa estático desenhado (sem serviço externo na V1). */
function MapPlaceholder() {
  return (
    <svg
      viewBox="0 0 320 160"
      role="img"
      aria-label="Mapa ilustrativo da localização"
      className="h-40 w-full rounded-card border border-border bg-surface-2"
    >
      <g className="stroke-border-strong" strokeWidth="10" fill="none" opacity="0.5">
        <path d="M0 60 H320" />
        <path d="M0 120 H320" />
        <path d="M90 0 V160" />
        <path d="M230 0 V160" />
      </g>
      <g className="fill-brand">
        <circle cx="160" cy="88" r="10" />
        <path d="M160 112 L150 92 H170 Z" />
      </g>
      <circle cx="160" cy="88" r="4" className="fill-surface" />
    </svg>
  );
}
