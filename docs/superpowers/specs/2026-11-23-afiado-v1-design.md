# Design — Afiado V1 (implementação)

> Data: 23/11/2026 · Complementa o [PRD](../../PRD-v1.md) e o [CLAUDE.md](../../../CLAUDE.md). O **o quê** está no PRD; este documento registra **como** vamos construir.

## Intenção
Construir a V1 inteira (28 telas, PRD §7) como front-end com dados mockados, para validar fluxos com barbeiros e clientes reais antes do backend. Sucesso = PRD §11 (agendar em ≤ 4 toques e < 60s; comanda no celular em < 30s; dono fecha o mês com dashboard, comissões e caixa; Lighthouse ≥ 90/95).

## Objetivos, não-objetivos, anti-objetivos
- **Objetivos:** todos os requisitos P0/P1 do PRD §5 funcionando no navegador; P2 com tela e funcionalidade mínima.
- **Não-objetivos:** backend, auth real, pagamento/WhatsApp reais, multi-unidade, PWA (PRD §3).
- **Anti-objetivos:** mais de 4 toques para agendar; painel inutilizável no celular; mock acoplado às telas (PRD §3).

## Restrições
- Stack, estrutura de pastas, regra de dados (componente → hook → repositório → mock), design system e checklist de entrega: CLAUDE.md. Nenhuma dependência fora da lista sem perguntar.
- Projeto fica em `OneDrive\Documents\afiado` (decisão do Leo); se o OneDrive travar com `node_modules`, mover.

## Abordagens consideradas
| | Abordagem | Troca |
|---|---|---|
| **A (escolhida)** | **Fase por fase** (PRD §10): cada fase entrega telas completas, regras testadas, estados de tela e conferência no navegador | Fluxos críticos prontos cedo; telas de gestão só no fim |
| B | Esqueleto das 28 rotas primeiro, depois aprofundar | Visão macro imediata, mas cada tela é mexida duas vezes e problemas de fluxo aparecem tarde |

Escolhida pelo Leo: **A**, porque o objetivo da V1 é validar fluxos reais.

## Decisões tomadas
1. **Ordem:** Fase 0 Fundação → 1 Agendar (C1, C2, C3, C7, C8, C9) → 2 Operação (A1, A2 básico, A3–A6) → 3 Clube (C5, C6, C10, A9) → 4 Gestão (A7, A8, A10, A12, A13, A16) → 5 Completar (C4, C11, C12, A11, A14, A15, A2 completo).
2. **Fim de cada fase:** `typecheck`, `lint`, `test` (e E2E dos fluxos da fase) passando, `build` passando, telas conferidas em 375px e 1280px; commit; resumo curto ao Leo com screenshots, e segue para a próxima.
3. **Git:** repositório iniciado em `main`; commits pequenos em pt-BR no imperativo.
4. **Pontos em aberto do PRD §12:** seguir as premissas do próprio PRD (1 unidade, 4 barbeiros, Clube central, login por telefone + código, 4 formas de pagamento, comissão % por serviço com exceção por barbeiro e valor fixo no Clube). Recepção entra como papel (PRD §4). Produtos entram (A11). Planos do Clube do seed: 3 planos inventados e rotulados como exemplo.
5. **Logo:** não será desenhado sem checkpoint (CLAUDE.md, skill `logo-design` ausente). Até lá: nome "AFIADO" em Big Shoulders + selo circular com a listra do poste.
6. **Fotos e avaliações:** placeholders desenhados (sem foto de banco) e rotulados como exemplo.

## Decisões do builder (marcadas como minhas)
- **Seed:** gerador determinístico com PRNG semeado (sem lib nova), datas relativas a "hoje" no fuso de São Paulo para a demo parecer viva; 90 dias de histórico.
- **Persistência mock:** um único snapshot versionado no `localStorage` (`afiado:db:v1`); latência 200–600ms; erro simulável por flag de debug.
- **Sessão mock:** cliente logado e papel do painel guardados pelo mock (não por componentes); código de verificação simulado fixo e exibido na tela.
- **Mapa:** imagem estática desenhada (sem serviço externo).
- **Fontes:** `next/font/google` (Big Shoulders Display, Instrument Sans).
- **Tema:** classe `dark` com `prefers-color-scheme` como padrão, sem lib extra.
- **Gráficos:** Recharts carregado com `next/dynamic`.

## Fica a cargo do builder
Detalhes de componente, nomes de arquivos dentro das convenções, textos de interface seguindo as regras de UX copy do CLAUDE.md.
