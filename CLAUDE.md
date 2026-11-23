# CLAUDE.md — Afiado

Sistema próprio de uma barbearia: página do cliente (agendar, Clube de assinatura) + painel de gestão (agenda, comanda, caixa, clientes, comissões).
**Fonte da verdade do produto:** [docs/PRD-v1.md](docs/PRD-v1.md). Leia a seção relevante antes de criar ou alterar uma tela. Se algo pedido contradiz o PRD, aponte antes de implementar.

**Fase atual:** V1 — 100% front-end com dados mockados. Backend vem na V2; não crie API routes, banco ou auth real.

## Stack

Next.js (App Router) · TypeScript `strict` · Tailwind CSS v4 · shadcn/ui (Radix) · TanStack Query · React Hook Form + Zod · Zustand (só estado de UI) · date-fns + date-fns-tz · Recharts · Lucide · Vitest + Testing Library · Playwright.

Não adicione dependências fora dessa lista sem justificar e perguntar.

## Comandos

```bash
npm run dev          # servidor local
npm run build        # build de produção (precisa passar antes de dar tarefa como concluída)
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run test         # Vitest
npm run test:e2e     # Playwright
```

Antes de dizer que algo está pronto: `typecheck`, `lint` e `test` passando, e a tela conferida no navegador (desktop e 375px).

## Estrutura

```
src/
  app/
    (public)/            páginas do cliente (/, /agendar, /clube, /conta...)
    admin/               painel (/admin/...)
  components/
    ui/                  shadcn customizado — primitivos, sem regra de negócio
    shared/              componentes reutilizados entre público e painel
  features/<feature>/    componentes, hooks e utils de uma área (agenda, comanda, clube...)
  domain/                tipos, schemas Zod e regras de negócio PURAS (sem React, sem I/O)
  data/
    repositories.ts      interfaces assíncronas dos repositórios
    mock/                implementação mock (memória + localStorage + latência) e seed
    index.ts             exporta a implementação ativa
  hooks/                 hooks genéricos (useMediaQuery, useDebounce...)
  lib/                   utilitários (format de moeda/data/telefone, cn())
  styles/                tokens e globals.css
```

- Código de uma feature fica em `features/<feature>/`. Só sobe para `shared/` quando for usado por 2+ features.
- Imports absolutos com `@/`. Sem barrel files (`index.ts` reexportando tudo) dentro de features.
- Nomes: componentes `PascalCase.tsx`, hooks `useAlgo.ts`, demais arquivos `kebab-case.ts`. Código em inglês; textos da interface em pt-BR.

## Regra de ouro dos dados (não quebrar)

**Componente → hook (TanStack Query) → repositório (interface) → mock.**

- Componentes **nunca** importam de `data/mock/`. Só hooks de `features/*/hooks` ou `hooks/` acessam repositórios, via `data/index.ts`.
- Repositórios são `async` e retornam tipos de `domain/`. O mock simula latência (200–600ms) e pode simular erro.
- Toda regra de negócio (horários disponíveis, comissão, benefício do Clube, fechamento de caixa) vive em `domain/` como função pura e tem teste unitário. Componentes não calculam regra de negócio.
- Mutations invalidam as query keys afetadas. Query keys centralizadas por feature (`appointmentKeys.list(filters)`).
- Validar entrada com os schemas Zod de `domain/` — os mesmos serão usados pelo backend.

## React — boas práticas

**Server vs Client Components**
- Padrão é Server Component. Use `"use client"` só quando precisar de estado, efeitos, eventos, browser APIs ou TanStack Query — e o mais baixo possível na árvore (folhas, não layouts).
- Como na V1 os dados vêm de mock no navegador, telas com dados serão client; mantenha ainda assim o layout/page como server e isole a parte interativa num componente client.
- Não passe funções ou objetos não serializáveis de server para client.

**Componentes**
- Funções pequenas e com uma responsabilidade. Passou de ~150 linhas ou mistura dados + layout + lógica → extrair.
- Props tipadas com `type` (não `interface`, salvo extensão). Sem `React.FC`. Sem `any` — use `unknown` e estreite.
- Composição antes de configuração: prefira `children`/slots a dezenas de props booleanas.
- Chaves de lista estáveis (id), nunca índice em listas que mudam.

**Estado**
- Ordem de preferência: derivar do que já existe → estado local → URL (`searchParams` para filtros, data da agenda, aba) → Zustand (UI compartilhada: passo do fluxo de agendamento, papel atual) → TanStack Query (dados do "servidor").
- Não duplique dados do servidor em `useState`/Zustand. Não guarde em estado o que pode ser calculado.

**Efeitos**
- `useEffect` é para sincronizar com algo externo. Não use para derivar estado, reagir a evento de clique ou buscar dados (isso é TanStack Query).
- Sem `useMemo`/`useCallback` por reflexo — só com motivo (lista pesada, dependência de efeito, componente memoizado).

**Formulários**
- React Hook Form + `zodResolver` com schema de `domain/`. Erros exibidos junto ao campo, em pt-BR.
- Botão de envio desabilitado e com indicador durante a mutation; feedback de sucesso/erro via toast.

## Design

Baseado na skill `design-skills-reference` do Leo e nas skills que ela indica. Responder sempre em português.

### Qual skill carregar (ferramenta Skill) antes de trabalho visual
| Trabalho | Skill | Status nesta máquina |
|---|---|---|
| Direção visual, tela nova, refazer visual | `frontend-design:frontend-design` | instalada |
| Página pública (home, clube) com cara de empresa real | `design-taste-frontend` | **não instalada** → usar `frontend-design` e avisar |
| Escolher/trocar fontes | `fontpool-typography` (precisa do MCP fontpool) | **não instalada** → usar os critérios abaixo e avisar que a fonte não foi verificada no catálogo |
| Logo, monograma, favicon, ícone do app | `logo-design` | **não instalada** → avisar antes de improvisar |
| Crítica de tela | `/design-critique` (plugin Design) | no disco |
| Auditoria de acessibilidade | `/accessibility-review` | no disco |
| Textos de interface, erros, estados vazios | `/ux-copy` | no disco |
| Tokens e componentes do design system | `/design-system` | no disco |
| Especificar tela para implementar | `/design-handoff` | no disco |

Se uma skill não estiver disponível na sessão, diga em uma linha e siga com as que estiverem.

### Ordem de trabalho visual
1. **Direção** — público, adjetivos da marca, referências, o que evitar (PRD §8 é o ponto de partida).
2. **Logo** — briefing → 3 conceitos → checkpoint com o Leo → arquivos só depois do "sim".
3. **Tipografia** — um par display + texto, justificado em uma linha.
4. **Telas** — cores e fontes vindas dos passos 2 e 3; cores do logo = cores do site.
5. **Revisão** — crítica + acessibilidade antes de entregar.

### Design system (tokens e componentes)
- **Só tokens.** Cores, tipografia, espaçamento, raio, sombra e movimento vêm de CSS variables mapeadas no Tailwind (PRD §8). Proibido hex solto, `text-[13px]`, `p-[7px]` ou sombra avulsa. Valor novo? Crie o token primeiro.
- Categorias de cor: marca, semânticas (success/warning/danger/info) e neutras. Tema claro e escuro em todo componente.
- **Todo componente interativo define estados:** default, hover, active, focus-visible, disabled, loading e, quando couber, error. Variantes (primary, secondary, ghost, destructive) e tamanhos (sm, md, lg) via `cva`.
- Consistência antes de criatividade: antes de criar componente novo, procure um existente em `components/ui` ou `shared/` e estenda.
- Componente compartilhado novo ganha uma nota curta no topo do arquivo: quando usar, variantes, comportamento de teclado.

### Fugir da cara de "feito por IA"
Escolhas deliberadas para *uma barbearia*, não defaults de qualquer projeto. A direção vem do universo da barbearia: o poste listrado, o letreiro de fachada, a cadeira, a navalha.

Evitar (são os sinais mais comuns de página gerada):
- Fundo creme (`#F4F1EA`-ish) + serifada de alto contraste + acento terroso, como padrão.
- Fundo quase preto com um único acento neon.
- Kit "SaaS de cards": tudo em cards iguais, mesmo raio, mesma sombra cinza, gradiente decorativo.
- Rótulo em CAPS espaçado acima de cada título; meta-texto ligado por " · "; "→" no fim de todo botão; mono para rótulos pequenos só por estilo.
- Destacar uma única palavra do título em itálico/cor.
- Numeração 01/02/03 em conteúdo que não é sequência (no fluxo de agendamento, que *é* sequência, pode).
- Animação de fade-in em cada seção e hover animado em todo card.

Fazer:
- **Ousadia em um lugar só** por tela (ex.: a capa da home ou o número grande do dashboard); o resto quieto e disciplinado. Antes de entregar, tire um enfeite.
- Hero da home abre com o mais característico do mundo da barbearia (foto real do espaço, a cadeira, o letreiro), não com "número grande + label + gradiente".
- Estrutura visual é informação: borda, divisor, numeração e selo só quando comunicam algo.
- Tipografia carrega a personalidade: no máximo 2 famílias, claramente diferentes; escala definida; linhas de texto com < 80 caracteres.
- Movimento só em resposta a ação do usuário (abrir, confirmar, mover agendamento) ou em um único momento orquestrado; 150–200ms; respeitar `prefers-reduced-motion`.

### Direção escolhida: "Poste de barbeiro" (PRD §8 tem os tokens completos)
- **Cores:** gelo `#F4F6F8`, azul-marinho `#14213D`, vermelho-poste `#C42A2A`, azul-céu `#A9C6E8` e tinta `#0E1726`. O tema escuro usa marinho-noite `#0B1220`. Os contrastes já foram medidos (PRD §8.2).
- **Fontes:**
  - **Big Shoulders Display** (letreiro) só para o nome da barbearia, títulos da página pública e números grandes do dashboard. É o único lugar com caixa alta.
  - **Instrument Sans** para todo o resto, com `tabular-nums` em horários e valores. Sem fonte mono.
- **Listra do poste:** um lugar por tela, no máximo (faixa do topo da home, barra de progresso do agendamento, selo do logo). Nunca como fundo ou textura.
- **Vermelho é escasso:**
  - Na página pública, só no CTA principal ("Agendar horário"), uma vez por tela.
  - No painel, vermelho significa erro ou perigo. A ação principal do painel é marinho (`--primary`).
  - Nunca usar `--brand` e `--danger` lado a lado.
- **Bordas:** `--border` é decorativo (2.8:1). Input, checkbox e chip de horário usam `--border-strong`.
- **Status da agenda:** cor + ícone + texto, conforme a tabela do PRD §8.2.

### Layout e responsividade
- **Mobile-first**: estilo base para 375px, depois `md:`/`lg:`. Página pública otimizada para celular; painel usável no celular (agenda, comanda) e completo no desktop.
- Conferir em 375px, 768px e 1280px, e com zoom de 200% (não pode quebrar).
- Imagens com `next/image` e dimensões definidas. Ícones Lucide, um único traço em todo o app.

### Estados e casos-limite (toda tela)
- **Carregando**: skeleton com o formato do conteúdo.
- **Vazio**: o que é + por que está vazio + ação para começar ("Nenhum agendamento hoje. Crie um encaixe ou compartilhe o link de agendamento.").
- **Erro**: o que aconteceu + como resolver + "Tentar de novo".
- Texto longo (nome de cliente, observação): regra de truncamento definida, com o texto completo acessível (tooltip ou detalhe).
- Dado ausente (cliente sem foto, barbeiro sem avaliação): fallback desenhado, nunca "undefined" ou espaço quebrado.

### Textos de interface (UX copy)
- Claro, curto, consistente, útil, humano. pt-BR, "você", frase em caixa normal (sem Title Case).
- Nomeie pelo que o usuário entende, não pelo sistema: "Clube", "Comanda", "Caixa" — não "subscription", "order", "cash session".
- **Botões começam com verbo e dizem o resultado**: "Confirmar agendamento", "Fechar comanda" — nunca "Enviar" ou "OK". A ação mantém o nome no fluxo inteiro (botão "Cancelar assinatura" → toast "Assinatura cancelada").
- **Erro** = o que aconteceu + por quê + como resolver. Sem pedir desculpa, sem ser vago. Ex.: "Esse horário acabou de ser ocupado. Escolha outro horário abaixo."
- **Confirmação destrutiva**: diga a ação e a consequência ("Cancelar o agendamento de sexta, 14h? O horário fica livre para outro cliente.") e rotule os botões com a ação ("Cancelar agendamento" / "Manter").
- Sucesso comemora sem exagero; aviso é claro e diz o que fazer.
- Mesma palavra para a mesma coisa em todo o app (mantenha um glossário em `docs/glossario.md` quando surgirem termos novos).

### Acessibilidade (WCAG 2.1 AA)
- **Perceptível**: `alt` em imagem com significado (decorativa: `alt=""`); estrutura semântica (landmarks `header`/`nav`/`main`, títulos em ordem); contraste ≥ 4.5:1 texto normal, ≥ 3:1 texto grande e componentes/ícones; cor nunca é o único sinal (status da agenda tem cor + ícone/texto).
- **Operável**: tudo funciona por teclado; ordem de foco lógica; foco visível; alvos de toque ≥ 44×44px; sem armadilha de foco (Radix cuida dos modais — não reimplemente).
- **Compreensível**: sem mudança inesperada ao focar; erro identificado em texto junto ao campo; todo input com `label`.
- **Robusto**: nome, papel e valor em todo componente (`button` para ação, `Link` para navegação, `aria-*` só quando o HTML não resolve).
- Verificação: Lighthouse/axe (pega ~30%) + navegar só com teclado + conferir contraste dos tokens + zoom 200%.

### Revisão antes de entregar uma tela
1. **Primeira impressão (2s)**: o olho vai primeiro para o que importa (na home, "Agendar"; na agenda, o horário atual)?
2. **Usabilidade**: o usuário conclui a tarefa sem passos desnecessários? (meta do PRD: agendar em ≤ 4 toques após escolher o serviço)
3. **Hierarquia**: ordem de leitura clara, ênfase certa, respiro.
4. **Consistência**: só tokens e componentes do sistema; elementos parecidos se comportam igual.
5. **Acessibilidade**: checklist acima.
Tire screenshot no navegador (desktop e 375px) e critique antes de dizer que está pronto.

### Regras comuns
- Nada de depoimentos/avaliações inventados apresentados como reais, nem foto de banco como se fosse da barbearia — no mock, rotule como exemplo.
- Nada de logo parecido com marca existente.
- Licença de fontes e registro de marca: recomendar verificação profissional; não garantir.

## Formatação e localização

Use sempre os helpers de `lib/format.ts`, nunca formate na mão:
- Moeda: `formatBRL(cents)` — **valores monetários são inteiros em centavos** em todo o domínio.
- Datas/horas: date-fns com locale `ptBR` e fuso `America/Sao_Paulo`. Guardar datas como ISO string.
- Telefone: máscara BR, armazenado só com dígitos.

## Performance

- Evite `"use client"` em árvores grandes; importe libs pesadas (Recharts, calendário) com `next/dynamic` onde fizer sentido.
- Página pública: meta Lighthouse ≥ 90 performance e ≥ 95 acessibilidade. Metadata e `schema.org/HairSalon` via API de metadata do Next.

## Testes

- `domain/`: teste unitário obrigatório para toda regra (Vitest). Escreva o teste junto com a regra.
- Componentes: teste com Testing Library quando houver lógica de interação relevante; consulte por papel/texto acessível, não por classe.
- E2E (Playwright) para os fluxos críticos: agendar, fechar comanda, assinar e cancelar Clube, abrir/fechar caixa.
- Seed do mock é determinístico — testes podem depender dele.

## Git e qualidade

- Commits pequenos, mensagem no imperativo em pt-BR (`adiciona fluxo de seleção de horário`).
- Sem `console.log`, código comentado ou `// @ts-ignore` no que for entregue. `eslint-disable` só com comentário explicando.
- Não refatore fora do escopo da tarefa sem avisar.

## O que não fazer na V1

- Criar backend, API routes, auth real, integrações de pagamento/WhatsApp reais.
- Acessar `localStorage` fora de `data/mock/`.
- Cálculo de regra de negócio dentro de componente.
- Hardcode de dados de demonstração em componentes — tudo vem do seed via repositório.
