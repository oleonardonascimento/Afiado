"use client";

/**
 * ClientPicker — busca de cliente por nome ou telefone, com cadastro rápido (nome + celular).
 * Usado no novo agendamento da agenda e na comanda avulsa.
 * Teclado: o campo de busca filtra; cada resultado é um botão.
 */
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClientSchema, type Client } from "@/domain/entities";
import { normalizePhone } from "@/domain/phone";
import { useClients, useCreateClient } from "@/features/clients/hooks/useClients";
import { formatPhone } from "@/lib/format";

const MAX_RESULTS = 6;

type ClientPickerProps = { value: Client | null; onChange: (client: Client | null) => void; id?: string };

export function ClientPicker({ value, onChange, id = "client-search" }: ClientPickerProps) {
  const clients = useClients();
  const createClient = useCreateClient();
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-control border border-border-strong px-3 py-2">
        <span className="min-w-0">
          <span className="block truncate font-medium">{value.name}</span>
          <span className="text-sm text-text-muted tabular-nums">{formatPhone(value.phone)}</span>
        </span>
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
          Trocar cliente
        </Button>
      </div>
    );
  }

  if (creating) {
    return (
      <div className="flex flex-col gap-3 rounded-control border border-border-strong p-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-name`}>Nome</Label>
          <Input id={`${id}-name`} value={newName} onChange={(e) => setNewName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-phone`}>Celular com DDD</Label>
          <Input
            id={`${id}-phone`}
            inputMode="tel"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            loading={createClient.isPending}
            onClick={() => {
              const input = {
                name: newName.trim(),
                phone: normalizePhone(newPhone),
                email: null,
                birthday: null,
                source: null,
                notes: "",
                tags: [],
                marketingConsent: false,
                createdAt: new Date().toISOString(),
              };
              const parsed = ClientSchema.omit({ id: true }).safeParse(input);
              if (!parsed.success) {
                setError("Confira o nome (mínimo 2 letras) e o celular com DDD.");
                return;
              }
              if (clients.data?.some((c) => c.phone === input.phone)) {
                setError("Já existe cliente com esse celular. Busque pelo número.");
                return;
              }
              createClient.mutate(parsed.data, {
                onSuccess: (client) => {
                  toast.success("Cliente cadastrado");
                  setCreating(false);
                  onChange(client);
                },
                onError: () => setError("Não foi possível cadastrar. Tente de novo."),
              });
            }}
          >
            Cadastrar cliente
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setCreating(false)}>
            Voltar à busca
          </Button>
        </div>
      </div>
    );
  }

  const term = query.trim().toLowerCase();
  const digits = query.replace(/\D/g, "");
  const results =
    term.length < 2
      ? []
      : (clients.data ?? [])
          .filter((c) => c.name.toLowerCase().includes(term) || (digits.length >= 3 && c.phone.includes(digits)))
          .slice(0, MAX_RESULTS);

  return (
    <div className="flex flex-col gap-2">
      <Input
        id={id}
        placeholder="Nome ou celular"
        value={query}
        autoComplete="off"
        onChange={(e) => setQuery(e.target.value)}
      />
      {clients.isLoading && <p className="text-sm text-text-muted">Carregando clientes…</p>}
      {results.length > 0 && (
        <ul className="divide-y divide-border rounded-control border border-border">
          {results.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onChange(c)}
                className="flex min-h-11 w-full items-center justify-between gap-3 px-3 text-left hover:bg-surface-2"
              >
                <span className="truncate">{c.name}</span>
                <span className="text-sm text-text-muted tabular-nums">{formatPhone(c.phone)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {term.length >= 2 && results.length === 0 && !clients.isLoading && (
        <p className="text-sm text-text-muted">Nenhum cliente encontrado.</p>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="self-start"
        onClick={() => {
          setCreating(true);
          setNewName(/\d/.test(query) ? "" : query);
          setNewPhone(/\d/.test(query) ? query : "");
        }}
      >
        <UserPlus strokeWidth={1.75} aria-hidden />
        Cadastrar novo cliente
      </Button>
    </div>
  );
}
