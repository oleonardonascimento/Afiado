# Afiado

Sistema próprio de barbearia: página do cliente para **agendar horário** e assinar o **Clube**, e um **painel de gestão** com agenda, comanda, caixa, clientes, comissões e relatórios.

> **Versão atual: V1 (demonstração).** Tudo roda no navegador com dados simulados, sem backend, login real ou pagamentos de verdade. Os dados ficam no `localStorage` e podem ser restaurados em **Painel → Configurações → Demonstração**. Nomes, telefones e avaliações são fictícios.

## O que tem

**Para o cliente**
- Página inicial com serviços, equipe, Clube, avaliações e localização
- Agendamento em poucos toques: serviço → barbeiro (ou "qualquer disponível") → dia e horário → confirmação
- Entrada pelo celular com código (sem senha)
- Minha conta: próximos horários, histórico, remarcar, cancelar e avaliar
- Clube de assinatura: planos, assinatura (pagamento simulado), uso do mês e cancelamento
- Meu perfil, preferências de mensagens e "Excluir meus dados"

**Para a barbearia (`/admin`)**
- Início com faturamento do dia, ocupação, aniversariantes e clientes sumidos
- Agenda por dia e semana, encaixe, bloqueios, status com cor + ícone + texto
- Comanda com serviços, produtos, descontos, benefício do Clube e várias formas de pagamento
- Caixa: abertura, entradas, saídas, sangria e fechamento conferido por forma de pagamento
- Clientes, Clube, serviços, produtos (estoque), equipe (horários, folgas, comissões)
- Comissões por barbeiro, relatórios com exportação CSV, avaliações com resposta
- Três papéis — Dono, Barbeiro e Recepção — cada um vê só as telas que lhe cabem

## Rodando

Requer Node.js 20 ou mais recente.

```bash
npm install
npm run dev        # http://localhost:3000  (painel em /admin)
```

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor local |
| `npm run build` / `npm start` | build e servidor de produção |
| `npm run typecheck` | checagem de tipos |
| `npm run lint` | ESLint |
| `npm run test` | testes de unidade (Vitest) |
| `npm run test:e2e` | testes ponta a ponta (Playwright, desktop e 375px) |

Na tela de login do cliente, o código de verificação aparece na própria tela (modo demonstração).

## Stack

Next.js (App Router) · TypeScript strict · Tailwind CSS v4 · shadcn/ui (Radix) · TanStack Query · React Hook Form + Zod · Zustand · date-fns-tz · Recharts · Lucide · Vitest + Testing Library · Playwright

## Como o código está organizado

```
src/
  app/            rotas: (public)/ para o cliente, admin/ para o painel
  components/     ui/ (primitivos) e shared/ (usados por várias telas)
  features/       uma pasta por área: agenda, orders, cash, club, clients...
  domain/         tipos, schemas Zod e regras de negócio puras (com testes)
  data/           interfaces dos repositórios + implementação mock
  lib/            formatação de moeda, data, telefone, CSV
```

Regra dos dados: **componente → hook (TanStack Query) → repositório → mock**. Na V2, a implementação mock é trocada por uma API real com a mesma interface, sem mexer nas telas. Dinheiro é sempre inteiro em centavos; datas no fuso `America/Sao_Paulo`.

Documentos: [PRD](docs/PRD-v1.md) (fonte da verdade do produto) · [Glossário](docs/glossario.md) · [Regras do projeto](CLAUDE.md).

## Próximos passos (V2)

Backend e banco de dados, login real, pagamentos (Pix e cartão) e lembretes pelo WhatsApp.

## Avisos

- Os textos de Termos e Privacidade são modelos e precisam de revisão jurídica antes de uso real.
- Fontes e marca: verificar licenças e registro com um profissional antes de publicar.
