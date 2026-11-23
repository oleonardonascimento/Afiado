# PRD — Afiado V1 (MVP front-end com dados mockados)

> **Status:** rascunho para aprovação · **Data:** 23/11/2026
> **Nome provisório:** *Afiado* (nome da pasta do projeto — trocar à vontade)
> **Stack:** Next.js (App Router) + TypeScript · backend fica para a V2

---

## 1. Visão

Um sistema próprio para **uma barbearia** (a nossa), com duas faces:

1. **Página do cliente** — onde qualquer pessoa vê a barbearia, escolhe serviço, barbeiro e horário e agenda em menos de 1 minuto; e onde assina e gerencia o **Clube** (plano mensal).
2. **Painel da barbearia** — onde dono e barbeiros tocam o dia: agenda, comandas, caixa, clientes, clube, comissões e números.

A V1 é **100% front-end com dados mockados**, mas já com **todas as telas do produto final navegáveis**, para termos a visão macro do projeto, validar fluxos com barbeiros e clientes reais e só então construir o backend sabendo exatamente o que ele precisa servir.

### Por que construir em vez de assinar um sistema
| Problema nos sistemas atuais | Nossa resposta |
|---|---|
| Sistemas genéricos (Trinks, Avec) servem salão, estética, SPA — muita coisa que barbearia não usa, curva de aprendizado alta | Feito só para barbearia, só para a nossa operação |
| Mensalidade de R$ 100–300/mês + extras cobrados à parte (WhatsApp por mensagem, fidelidade fora do plano) | Custo nosso; tudo que importa incluso |
| Clube de assinatura é onde mais acontecem reclamações (CashBarber, BestBarbers: cobrança falha, cancelamento difícil, reembolso) | Clube transparente: status claro, cancelamento em 1 clique, histórico de cobranças visível |

---

## 2. Referências — o que pegamos de cada uma e o que corrigimos

| Referência | Pegamos (ponto forte) | Corrigimos (ponto fraco) |
|---|---|---|
| **CashBarber** | Página com cara da barbearia (foto grande, identidade forte); Clube como centro da receita; campo "Como conheceu?" para marketing | **Login obrigatório antes de ver horários** → no Afiado o cliente vê serviços e horários livres sem conta; identificação só no último passo, por telefone. Cobrança recorrente opaca → status e histórico de cobrança sempre visíveis |
| **BestBarbers** | Clube de assinatura com regras claras; app da própria barbearia; plano grátis focado em agenda | Reclamações de cancelamento/reembolso → **cancelar em 1 clique** com data de término clara e sem letra miúda |
| **AppBarber** | Comandas, comissões, vales, fidelidade, **lista de espera**; app para cliente e barbeiro; preço transparente | Sem clube de assinatura e sem página com domínio próprio → temos os dois |
| **Trinks** | Gestão completa (agenda + financeiro + comissões robustas) | Complexo demais; erros no cálculo de comissão → **regras de comissão simples e extrato auditável** por atendimento |
| **Booksy** | **Avaliações** que geram confiança; UX de agendamento polida | Barbearia "dentro" de um marketplace, sem marca própria → página 100% nossa |
| **Avec** | **Comanda digital**; lembretes/agenda via WhatsApp; interface simples | Sem perfil de profissional, sem fotos/avaliações por serviço → **perfil de cada barbeiro com foto, especialidades e nota** |

### Diferenciais do Afiado (resumo)
1. Agendar **sem criar conta** antes (identificação por telefone no final).
2. Clube **honesto**: o que está incluso, quanto já usou no mês, próxima cobrança, cancelar em 1 clique.
3. **Perfil de barbeiro** com foto, especialidades e avaliações.
4. **Lembrete e confirmação por WhatsApp** (na V1: botão "abrir WhatsApp" com mensagem pronta; automação na V2).
5. **Comissão auditável**: cada centavo de comissão aponta para a comanda que o gerou.
6. **Lista de espera**: horário cancelado avisa quem estava esperando.

---

## 3. Escopo

### Dentro da V1 (front mockado)
- Todas as telas do cliente e do painel listadas na seção 7, navegáveis e com dados realistas.
- Fluxos funcionando de ponta a ponta **no navegador**: agendar, remarcar, cancelar, assinar/cancelar clube, abrir/fechar comanda, abrir/fechar caixa, calcular comissão.
- Estado persistido em `localStorage` (recarregar a página não perde o que foi feito) + botão "resetar dados de demonstração".
- Troca de papel (Dono / Barbeiro / Cliente) para demonstrar permissões.

### Fora da V1 (vai para V2+)
- Backend, banco, autenticação real, envio real de SMS/WhatsApp/e-mail.
- Pagamento real (Pix/cartão/recorrência) — na V1 é simulado.
- Nota fiscal, integração contábil.
- Multi-barbearia / multi-unidade.
- App nativo (a V1 é web responsiva; PWA fica para depois).

### Anti-objetivos (o que tornaria a V1 um fracasso mesmo "funcionando")
- Cliente precisar de mais de **4 toques** depois de escolher o serviço para concluir um agendamento.
- Painel que o barbeiro não consegue usar **no celular, entre um corte e outro**.
- Mock acoplado às telas a ponto de o backend exigir reescrever componentes.

---

## 4. Perfis de usuário

| Perfil | Quem | O que precisa |
|---|---|---|
| **Cliente** | Quem corta na barbearia | Agendar rápido, lembrar do horário, remarcar, assinar o clube |
| **Barbeiro** | Profissional da equipe | Ver *a própria* agenda, abrir/fechar comanda dos seus atendimentos, ver *as próprias* comissões |
| **Dono / Gerente** | Administra a barbearia | Tudo: agenda geral, caixa, clientes, clube, serviços, equipe, comissões, relatórios, configurações |
| **Recepção** *(opcional)* | Atendente | Agenda geral, comandas, caixa, clientes — sem relatórios financeiros nem configurações |

---

## 5. Requisitos funcionais

Prioridade: **P0** = sem isso não há V1 · **P1** = entra na V1 · **P2** = tela existe, funcionalidade mínima/placeholder.

### 5.1 Página pública e agendamento (cliente)
| ID | Requisito | Prior. |
|---|---|---|
| RF-01 | Exibir página da barbearia: capa, sobre, serviços com preço e duração, equipe, avaliações, endereço/mapa, horário de funcionamento, contatos | P0 |
| RF-02 | Agendar sem login prévio: serviço(s) → profissional (ou "qualquer disponível") → dia → horário → identificação → confirmação | P0 |
| RF-03 | Permitir escolher **mais de um serviço** no mesmo agendamento (ex.: corte + barba), somando duração e preço | P0 |
| RF-04 | Mostrar apenas horários realmente livres, considerando: expediente da barbearia, expediente/folgas do barbeiro, duração somada, agendamentos existentes, antecedência mínima | P0 |
| RF-05 | Identificação por **telefone + código** (na V1 o código é simulado e exibido na tela); nome no primeiro acesso; "Como conheceu?" opcional | P0 |
| RF-06 | Tela de confirmação com resumo, botão "adicionar ao calendário" (.ics) e "abrir no WhatsApp" | P1 |
| RF-07 | Cliente ver próximos agendamentos e histórico; **remarcar** e **cancelar** respeitando a regra de antecedência configurada | P0 |
| RF-08 | Entrar na **lista de espera** de um dia quando não houver horário; ser "avisado" (notificação simulada) se abrir vaga | P1 |
| RF-09 | Avaliar o atendimento (1–5 estrelas + comentário) após atendimento concluído | P1 |
| RF-10 | Perfil do barbeiro: foto, bio curta, especialidades, nota média, próximos horários livres | P1 |
| RF-11 | Assinante do clube vê no agendamento quais serviços **saem pelo plano** (R$ 0,00) e quanto do plano já usou no mês | P0 |

### 5.2 Clube de assinatura (cliente)
| ID | Requisito | Prior. |
|---|---|---|
| RF-20 | Listar planos com preço, o que inclui (ex.: cortes ilimitados, 4 barbas/mês), regras e comparação lado a lado | P0 |
| RF-21 | Assinar plano com checkout simulado (Pix ou cartão), mostrando data da 1ª e da próxima cobrança | P0 |
| RF-22 | "Meu plano": status (ativo, pagamento pendente, cancelado-até-dd/mm), uso no mês, histórico de cobranças | P0 |
| RF-23 | **Cancelar em 1 clique** (com confirmação), mostrando até quando o benefício vale; sem retenção forçada | P0 |
| RF-24 | Trocar de plano (upgrade/downgrade) com efeito na próxima cobrança | P2 |

### 5.3 Painel — operação do dia
| ID | Requisito | Prior. |
|---|---|---|
| RF-30 | Agenda em **colunas por barbeiro** (dia) e visão semanal; filtro por barbeiro | P0 |
| RF-31 | Criar agendamento pelo painel (encaixe), incluindo cliente novo rápido | P0 |
| RF-32 | Bloquear horário (almoço, compromisso) e cadastrar folga/férias | P0 |
| RF-33 | Status do agendamento: agendado → confirmado → em atendimento → concluído; ou faltou / cancelado. Mudança por clique/arrastar | P0 |
| RF-34 | Arrastar agendamento para outro horário/barbeiro (remarcar) | P1 |
| RF-35 | Botão "confirmar via WhatsApp" que abre conversa com mensagem pronta | P1 |
| RF-36 | **Comanda**: abrir a partir do agendamento ou avulsa; adicionar serviços e produtos; desconto; aplicar benefício do clube; dividir pagamento entre formas (dinheiro, Pix, débito, crédito) | P0 |
| RF-37 | **Caixa**: abrir com troco inicial, registrar entradas/saídas/sangria, fechar com conferência (esperado × contado) por forma de pagamento | P0 |
| RF-38 | Barbeiro só vê e altera a própria agenda e as próprias comandas | P0 |

### 5.4 Painel — gestão
| ID | Requisito | Prior. |
|---|---|---|
| RF-40 | **Clientes**: lista com busca; ficha com histórico, total gasto, frequência média, último corte, plano, origem ("como conheceu"), observações/preferências ("máquina 2 na lateral") | P0 |
| RF-41 | Sinalizar clientes "sumidos" (sem visita há X dias) com atalho para chamar no WhatsApp | P1 |
| RF-42 | **Serviços**: CRUD com nome, categoria, preço, duração, comissão padrão (%), ativo/inativo, quais barbeiros fazem | P0 |
| RF-43 | **Equipe**: CRUD de barbeiros com foto, bio, especialidades, expediente semanal, comissão (padrão ou por serviço), papel/permissão | P0 |
| RF-44 | **Planos do clube**: CRUD com preço, benefícios (serviço + quantidade/mês ou ilimitado), regras (intervalo mínimo entre usos, dias permitidos) | P0 |
| RF-45 | **Assinantes**: lista com status, próxima cobrança, uso no mês; filtro de inadimplentes e cancelamentos | P0 |
| RF-46 | **Comissões**: por período e barbeiro; extrato linha a linha ligado à comanda; regra para atendimentos pelo clube (valor fixo por atendimento ou % do rateio); marcar como pago | P0 |
| RF-47 | **Produtos/estoque**: CRUD simples com preço, custo, quantidade; baixa automática ao vender na comanda; alerta de estoque baixo | P1 |
| RF-48 | **Dashboard**: faturamento hoje/mês, agendamentos hoje, taxa de ocupação, faltas, ticket médio, assinantes ativos, receita recorrente (MRR), inadimplência, origem dos clientes | P0 |
| RF-49 | **Relatórios**: faturamento por período/forma de pagamento/barbeiro, serviços mais vendidos, retenção de clientes, evolução do clube; exportar CSV | P1 |
| RF-50 | **Avaliações**: lista com resposta do dono; nota média por barbeiro | P2 |
| RF-51 | **Configurações**: dados da barbearia, fotos, horários de funcionamento e feriados, regras de agendamento (antecedência mínima, janela máxima, prazo para cancelar, intervalo entre atendimentos), textos das mensagens de WhatsApp | P0 |
| RF-52 | Alternar papel (Dono/Barbeiro/Recepção) e "resetar dados de demonstração" — **só na V1** | P0 |

---

## 6. Requisitos não funcionais

| ID | Categoria | Requisito |
|---|---|---|
| RNF-01 | **Responsividade** | Página do cliente *mobile-first* (360px+). Painel usável no celular (agenda do dia, comanda) e completo no desktop (1280px+) |
| RNF-02 | **Desempenho** | Página pública: LCP < 2,5s em 4G, Lighthouse Performance ≥ 90. Imagens via `next/image`, fontes via `next/font` |
| RNF-03 | **Acessibilidade** | WCAG 2.1 AA: contraste ≥ 4.5:1, navegação por teclado, foco visível, labels em formulários, alvos de toque ≥ 44px. Lighthouse A11y ≥ 95 |
| RNF-04 | **Localização** | pt-BR em toda interface; moeda BRL (`Intl.NumberFormat`), datas `dd/MM`, fuso `America/Sao_Paulo`, telefone com máscara BR |
| RNF-05 | **Troca de mock por backend** | Telas **nunca** acessam dados mockados diretamente: usam *repositórios* com interface tipada (ver §9). Trocar mock por API = trocar a implementação, sem tocar em componentes |
| RNF-06 | **Tipagem e validação** | TypeScript `strict`; schemas Zod para entidades e formulários — os mesmos schemas serão reaproveitados no backend |
| RNF-07 | **Dados de demonstração** | Seed determinístico e realista (1 barbearia, 4 barbeiros, ~12 serviços, ~60 clientes, 3 planos, 90 dias de histórico). Persistido em `localStorage`; resetável |
| RNF-08 | **Latência simulada** | Repositórios mock respondem com atraso de 200–600ms, para que estados de carregamento, vazio e erro sejam desenhados de verdade |
| RNF-09 | **Estados de tela** | Toda lista/tela tem estado de carregando (skeleton), vazio (com ação sugerida) e erro (com tentar de novo) |
| RNF-10 | **SEO** (página pública) | Metadados, Open Graph, `schema.org/HairSalon` com endereço, horários e avaliações; URLs legíveis |
| RNF-11 | **Privacidade (LGPD)** | Coletar o mínimo (nome + telefone para agendar); consentimento explícito para marketing; páginas de Termos e Privacidade; cliente pode pedir exclusão dos dados (fluxo desenhado, efetivo na V2) |
| RNF-12 | **Qualidade** | ESLint + Prettier; testes unitários (Vitest) para regras de negócio (disponibilidade de horários, comissão, uso do clube, fechamento de caixa); testes E2E (Playwright) para "agendar", "fechar comanda" e "assinar clube" |
| RNF-13 | **Consistência visual** | Todo componente usa os tokens de design (§8); nada de cor/tamanho "solto" no código |
| RNF-14 | **Modo escuro** | Painel e página pública com tema claro e escuro (padrão: segue o sistema) |

---

## 7. Telas

### Mapa de rotas

```
Página do cliente                    Painel (/admin)
/                    Home            /admin                    Dashboard
/agendar             Fluxo agendar   /admin/agenda             Agenda
/agendar/confirmado  Confirmação     /admin/comandas           Comandas
/barbeiros/[id]      Perfil barbeiro /admin/comandas/[id]      Comanda
/clube               Planos          /admin/caixa              Caixa
/clube/assinar/[id]  Checkout        /admin/clientes           Clientes
/entrar              Identificação   /admin/clientes/[id]      Ficha do cliente
/conta               Minha conta     /admin/clube              Planos + assinantes
/conta/agendamentos  Agendamentos    /admin/servicos           Serviços
/conta/plano         Meu plano       /admin/produtos           Produtos/estoque
/conta/perfil        Perfil          /admin/equipe             Equipe
/termos /privacidade Legais          /admin/equipe/[id]        Barbeiro
                                     /admin/comissoes          Comissões
                                     /admin/relatorios         Relatórios
                                     /admin/avaliacoes         Avaliações
                                     /admin/configuracoes      Configurações
                                     /admin/entrar             Login do painel
```

### 7.1 Página do cliente

**C1 · Home (`/`)** — P0
- Capa com foto da barbearia, logo, nome, nota média e botão fixo **"Agendar horário"** (sempre visível no rodapé no mobile).
- Status "Aberto agora · fecha às 20h".
- Serviços em destaque (nome, duração, preço; marca "incluso no Clube").
- Equipe: cards dos barbeiros (foto, nome, especialidade, nota) → perfil.
- Bloco do Clube: "a partir de R$ X/mês", 3 benefícios, CTA "Conhecer planos".
- Avaliações recentes.
- Localização (mapa estático + "Como chegar"), horários da semana, WhatsApp, Instagram.
- Cabeçalho: logo, "Entrar" / avatar do cliente.

**C2 · Agendar (`/agendar`)** — P0 — fluxo em passos com barra de progresso e resumo fixo (total de tempo e valor):
1. **Serviços** — lista por categoria, seleção múltipla, soma de duração/preço; assinante vê "R$ 0 pelo Clube".
2. **Profissional** — "Qualquer disponível" (primeira opção) + cards dos barbeiros que fazem *todos* os serviços escolhidos.
3. **Data e horário** — faixa de dias (próximos 14) com indicação de dias lotados; horários agrupados em Manhã/Tarde/Noite; se o dia estiver lotado → "Entrar na lista de espera".
4. **Identificação** — se não logado: telefone → código (simulado) → nome (+ "Como conheceu?" opcional). Se logado, pula.
5. **Revisão** — resumo, observação opcional, política de cancelamento em uma linha, botão "Confirmar agendamento".

**C3 · Confirmado (`/agendar/confirmado`)** — P0
- Ícone de sucesso, data/hora/barbeiro/serviços/valor, endereço.
- Botões: adicionar ao calendário, abrir WhatsApp, ver meus agendamentos.
- Se não for assinante: card discreto do Clube ("este corte sairia por R$ 0").

**C4 · Perfil do barbeiro (`/barbeiros/[id]`)** — P1
- Foto, bio, especialidades, nota e avaliações, galeria de cortes (fotos mock), próximos horários livres → já entra no fluxo C2 com o barbeiro escolhido.

**C5 · Clube (`/clube`)** — P0
- Explicação em 3 passos ("assine, agende, corte sem pagar na hora").
- Cards dos planos lado a lado (preço, inclusos, regras), plano recomendado destacado.
- FAQ com **cancelamento explicado de forma direta** ("cancela quando quiser, em 1 clique, o benefício vale até o fim do mês pago").

**C6 · Checkout do plano (`/clube/assinar/[id]`)** — P0
- Resumo do plano, identificação (se necessário), forma de pagamento (Pix/cartão simulados), datas da 1ª e da próxima cobrança, aceite dos termos, "Assinar". Tela de sucesso.

**C7 · Entrar (`/entrar`)** — P0
- Telefone → código → (nome, se novo). Sem senha.

**C8 · Minha conta (`/conta`)** — P0
- Atalhos: próximo agendamento em destaque (remarcar/cancelar), "Agendar de novo" (repete último serviço+barbeiro), status do plano.

**C9 · Meus agendamentos (`/conta/agendamentos`)** — P0
- Abas Próximos / Histórico. Ações: remarcar, cancelar (respeita prazo; se fora do prazo, explica o porquê), avaliar atendimento concluído.

**C10 · Meu plano (`/conta/plano`)** — P0
- Status com cor, uso do mês (ex.: "2 de 4 barbas"), próxima cobrança, histórico de cobranças, forma de pagamento, **Cancelar assinatura**, trocar plano (P2).

**C11 · Perfil (`/conta/perfil`)** — P1
- Nome, telefone, e-mail, aniversário, preferências de comunicação (consentimento de marketing), "Excluir meus dados".

**C12 · Termos / Privacidade** — P1 · texto estático.

### 7.2 Painel da barbearia

Layout: barra lateral (desktop) / barra inferior com 4 atalhos + "Mais" (mobile): **Agenda · Comandas · Clientes · Caixa**. Topo: seletor de papel (V1), busca global de cliente, botão "+ Novo" (agendamento, comanda, cliente).

**A1 · Entrar no painel (`/admin/entrar`)** — P0 · e-mail + senha mock; escolher perfil de demonstração.

**A2 · Dashboard (`/admin`)** — P0
- Cards: faturamento hoje / mês (com variação vs. período anterior), agendamentos hoje (feitos/restantes), ocupação %, faltas, ticket médio, assinantes ativos, MRR, inadimplentes.
- Gráficos: faturamento últimos 30 dias; ocupação por barbeiro; origem dos clientes.
- Listas: próximos atendimentos, aniversariantes da semana, clientes sumidos, estoque baixo.
- Barbeiro vê versão reduzida: seus atendimentos de hoje e sua comissão do mês.

**A3 · Agenda (`/admin/agenda`)** — P0
- Visão **Dia** (colunas por barbeiro, linha do "agora") e **Semana**; navegação de datas; filtro por barbeiro.
- Blocos coloridos por status; ícone de assinante do Clube; clique abre painel lateral com dados do cliente, serviços, ações (confirmar, iniciar, concluir → abre comanda, faltou, cancelar, WhatsApp).
- Clique em espaço vazio → novo agendamento/encaixe ou bloqueio.
- Arrastar para remarcar (P1). Lista de espera do dia num painel lateral (P1).

**A4 · Comandas (`/admin/comandas`)** — P0
- Abas Abertas / Fechadas hoje / Todas; busca por cliente.

**A5 · Comanda (`/admin/comandas/[id]`)** — P0
- Cliente (com selo do Clube e saldo do mês), barbeiro.
- Itens: serviços e produtos (busca rápida), quantidade, preço, desconto por item ou total.
- Benefício do Clube aplicado automaticamente quando cabível (linha "Clube −R$ 45,00").
- Pagamento: uma ou mais formas, troco calculado, botão "Fechar comanda". Exige caixa aberto.
- Mostra a comissão que será gerada (para o dono).

**A6 · Caixa (`/admin/caixa`)** — P0
- Estado fechado: "Abrir caixa" com valor inicial.
- Estado aberto: totais por forma de pagamento, lista de movimentos (comandas, entradas, saídas, sangrias), botões de lançamento.
- Fechar: valores contados × esperados por forma, diferença destacada, observação. Histórico de caixas anteriores.

**A7 · Clientes (`/admin/clientes`)** — P0
- Tabela com busca e filtros (assinante, sumido há +30/60/90 dias, aniversariante, origem); colunas: nome, telefone, última visita, visitas, total gasto, plano.

**A8 · Ficha do cliente (`/admin/clientes/[id]`)** — P0
- Cabeçalho: nome, telefone (WhatsApp), aniversário, origem, plano, tags.
- Abas: Histórico de atendimentos · Comandas · Assinatura · Observações/preferências · Avaliações.
- Ações: agendar, abrir comanda, editar.

**A9 · Clube (`/admin/clube`)** — P0
- Aba **Planos**: CRUD (nome, preço, benefícios por serviço com limite mensal ou ilimitado, regras de uso, ativo).
- Aba **Assinantes**: status, desde, próxima cobrança, uso no mês; filtros inadimplente/cancelando.
- Indicadores: assinantes ativos, MRR, churn do mês, novos no mês.

**A10 · Serviços (`/admin/servicos`)** — P0 · lista por categoria + formulário (nome, categoria, preço, duração, comissão %, barbeiros que fazem, aparece no agendamento online, ativo).

**A11 · Produtos (`/admin/produtos`)** — P1 · lista com estoque, alerta de baixo; formulário (nome, preço, custo, quantidade, estoque mínimo, comissão %); ajuste de estoque.

**A12 · Equipe (`/admin/equipe` e `/[id]`)** — P0 · cards dos barbeiros; formulário com foto, bio, especialidades, papel, expediente semanal (grade de dias/horários), folgas, serviços que faz, comissão padrão e exceções por serviço, comissão por atendimento do Clube.

**A13 · Comissões (`/admin/comissoes`)** — P0
- Filtro de período; resumo por barbeiro (serviços, produtos, Clube, total, pago, a pagar).
- Detalhe: extrato linha a linha (data, cliente, item, base, %, valor, link para comanda). "Marcar como pago".
- Barbeiro vê apenas o próprio extrato.

**A14 · Relatórios (`/admin/relatorios`)** — P1 · faturamento (período, forma de pagamento, barbeiro), serviços mais vendidos, retenção (clientes que voltaram em até 30/60 dias), evolução do Clube, origem dos clientes; exportar CSV.

**A15 · Avaliações (`/admin/avaliacoes`)** — P2 · lista, filtro por barbeiro/nota, responder.

**A16 · Configurações (`/admin/configuracoes`)** — P0
- **Barbearia**: nome, logo, capa, fotos, sobre, endereço, contatos, redes.
- **Horários**: funcionamento por dia, feriados/fechamentos.
- **Agendamento**: antecedência mínima, até quantos dias à frente, prazo para cancelar/remarcar, intervalo entre atendimentos, permitir "qualquer barbeiro".
- **Mensagens**: modelos de WhatsApp (confirmação, lembrete, "sentimos sua falta") com variáveis `{nome}`, `{data}`, `{hora}`.
- **Demonstração** (V1): resetar dados.

**Total: 12 telas do cliente + 16 do painel = 28 telas.**

---

## 8. Identidade visual — direção "Poste de barbeiro"

Escolhida em 23/11/2026 entre três direções (Poste, Cadeira, Azulejo). Parte do símbolo mais reconhecível de uma barbearia: o **poste listrado em azul-marinho, vermelho e branco** e o **letreiro de fachada** em letra condensada. A identidade se reconhece de longe, sem cair nos padrões genéricos (fundo creme com serifada, ou preto com acento neon).

**Princípios**
- **O poste é a assinatura.** As listras diagonais aparecem em **um lugar por tela, no máximo**: a faixa do topo da home, a barra de progresso do agendamento e o selo do logo. Nunca como fundo nem como textura.
- **Vermelho é escasso.** Na página pública, o vermelho é a cor de **um** botão por tela ("Agendar horário"). No painel, o vermelho fica só para erro e perigo (cancelar, faltou, diferença no caixa). A ação principal do painel é azul-marinho.
- **Letreiro só para nomes e números grandes.** Big Shoulders em caixa alta só no nome da barbearia, nos títulos da página pública e nos números grandes do dashboard. Rótulos, botões e menus usam Instrument Sans em caixa normal.
- **Painel calmo, página pública com presença.** A página pública usa display grande e foto. O painel usa a mesma paleta com menos contraste de cor: fundo gelo, marinho só em seleção e ação.

### 8.1 Tipografia
| Papel | Fonte | Uso |
|---|---|---|
| **Display (letreiro)** | **Big Shoulders Display** (Google Fonts, OFL), pesos 800–900 | Nome da barbearia, títulos da home e do Clube, números grandes do dashboard. Caixa alta permitida **só aqui**. |
| **Interface** | **Instrument Sans** (Google Fonts, OFL, variável em peso 400–700 e largura 75–100) | Todo o resto: textos, botões, formulários, tabelas, agenda. Horários e valores em `font-variant-numeric: tabular-nums` (sem fonte mono) |

Carregar via `next/font/google`. Confirmar que Instrument Sans tem algarismos tabulares (`tnum`) ao implementar. Se não tiver, usar `lining-nums` e alinhar os valores à direita.

Escala (rem, base 16px): `12 · 14 · 16 · 18 · 20 · 24 · 30 · 40 · 56 · 72`.
- Texto com altura de linha 1.5; display com 0.95 e `letter-spacing` de 0.01em.
- O painel usa display no máximo em 40 (números do dashboard). Os tamanhos 56 e 72 são só da página pública.
- Linhas de texto com menos de 80 caracteres.

### 8.2 Paleta

**Cores-base**
| Nome | Hex | Papel |
|---|---|---|
| Gelo | `#F4F6F8` | Fundo claro (branco frio, não creme) |
| Azul-marinho | `#14213D` | Cor da marca, ação principal do painel, títulos |
| Vermelho-poste | `#C42A2A` | CTA principal da página pública; listra |
| Azul-céu | `#A9C6E8` | Destaques suaves, Clube, primário no tema escuro |
| Tinta | `#0E1726` | Texto |

**Tokens**
| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `--bg` | `#F4F6F8` | `#0B1220` (marinho-noite) | Fundo |
| `--surface` | `#FFFFFF` | `#131C2E` | Cards, painéis |
| `--surface-2` | `#E9EDF2` | `#1C2740` | Fundos secundários, hover, linha selecionada |
| `--border` | `#D3DAE3` | `#2A3754` | Divisores (decorativo) |
| `--border-strong` | `#7A8699` | `#5B6B88` | Borda de input, checkbox, chip (≥ 3:1) |
| `--text` | `#0E1726` | `#EEF2F7` | Texto principal |
| `--text-muted` | `#4A5568` | `#A3AEC2` | Texto secundário |
| `--primary` | `#14213D` | `#A9C6E8` | Ação principal do painel, seleção, links |
| `--primary-fg` | `#FFFFFF` | `#0E1726` | Texto sobre primário |
| `--brand` | `#C42A2A` | `#C42A2A` | CTA da página pública, listra do poste |
| `--brand-fg` | `#FFFFFF` | `#FFFFFF` | Texto sobre brand |
| `--club` | `#DCE8F5` (fundo) / `#14213D` (texto) | `#1C2F4D` / `#A9C6E8` | Selo e cards do Clube / assinante |
| `--success` | `#1E7A46` | `#4CC38A` | Concluído, pago, caixa batendo |
| `--warning` | `#9A5207` | `#F0A84A` | Pendente, estoque baixo, pagamento atrasado |
| `--danger` | `#B42318` | `#F07070` | Cancelado, faltou, erro, diferença no caixa |
| `--info` | `#2B5A8C` | `#8DB4E2` | Confirmado, informativo |
| `--focus-ring` | `#2B5A8C` | `#8DB4E2` | Anel de foco, 2px com 2px de afastamento |

**Contraste medido (WCAG):**
- Texto sobre fundo: 16.6 no claro e 16.7 no escuro.
- Texto secundário: 6.95 no claro e 8.4 no escuro.
- Branco sobre marinho: 16.0. Branco sobre vermelho: 5.7.
- Marinho sobre céu: 9.1. Tinta sobre céu: 10.2.
- Semânticas sobre o fundo claro: success 4.9, warning 5.4, danger 6.1, info 6.6.
- Semânticas sobre o fundo escuro: todas ≥ 6.4.
- `--border-strong` sobre o fundo: 3.4 no claro e 3.5 no escuro.
- `--border` (2.8:1) é decorativo. **Nunca** usar como única borda de um controle.

**Status da agenda.** A cor nunca é o único sinal: cada status também tem ícone e texto.
| Status | Fundo | Marca | Ícone (Lucide) |
|---|---|---|---|
| Agendado | `--surface` | borda `--border-strong` | `calendar` |
| Confirmado | `--info` 12% | barra lateral `--info` | `check` |
| Em atendimento | `--primary` | texto `--primary-fg` | `scissors` |
| Concluído | `--success` 12% | barra lateral `--success` | `check-check` |
| Faltou / cancelado | `--danger` 10% com hachura | texto riscado | `user-x` / `x` |
| Bloqueio | `--surface-2` listrado em cinza | — | `lock` |
| Assinante do Clube | selo `--club` no canto | — | `crown` |

### 8.3 Forma e movimento
- **Raios:** 6px em botões, inputs e chips de horário (corte reto, como letreiro); 10px em cards e painéis; 999px só em avatares e selos.
- **Sombra:** mínima, só em elementos flutuantes (menu, modal, toast). Cards se separam por superfície e borda.
- **Listra do poste:** `repeating-linear-gradient(135deg, brand 0 10px, bg 10px 20px, primary 20px 30px, bg 30px 40px)`. Usos:
  - faixa de 6–8px no topo da home;
  - preenchimento da barra de progresso do agendamento;
  - selo do logo.
- **Movimento:**
  - Um único momento orquestrado: a barra de progresso do agendamento "gira" como um poste ao avançar de passo.
  - Ações do usuário têm resposta curta (150–200ms).
  - Nada de fade-in por seção.
  - Respeitar `prefers-reduced-motion` (a listra fica parada).
- **Ícones:** Lucide, traço 1.75.
- **Fotografia:** fotos reais do espaço e dos cortes, com contraste alto. Texto sobre foto sempre com overlay marinho a 60–70%. No mock, as fotos de banco ficam rotuladas como exemplo.

---

## 9. Arquitetura do front-end

### 9.1 Stack
| Item | Escolha | Por quê |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript strict** | Definido |
| Estilo | **Tailwind CSS v4** com tokens da §8 como CSS variables | Rápido e consistente |
| Componentes | **shadcn/ui** (Radix por baixo) | Acessível, código nosso, fácil de customizar ao visual |
| Dados assíncronos | **TanStack Query** | Cache, loading/erro — e continua igual quando vier o backend |
| Formulários | **React Hook Form + Zod** | Validação tipada; schemas reaproveitados no backend |
| Datas | **date-fns** + `date-fns-tz` (pt-BR, America/Sao_Paulo) | Leve e suficiente |
| Gráficos | **Recharts** | Simples para o dashboard |
| Estado de UI | **Zustand** (só para estado de UI: fluxo de agendamento, papel atual) | Sem boilerplate |
| Testes | **Vitest** + Testing Library; **Playwright** E2E | RNF-12 |

### 9.2 Camada de dados (chave para trocar o mock depois)
```
src/
  domain/            # tipos + schemas Zod + regras puras (sem React)
    entities.ts        Barbershop, Professional, Service, Product, Client,
                       Appointment, WaitlistEntry, Plan, Subscription, Charge,
                       Order (comanda), OrderItem, Payment, CashSession,
                       CashMovement, Commission, Review, BusinessHours, TimeOff
    availability.ts    cálculo de horários livres
    commission.ts      cálculo de comissão
    subscription.ts    uso do plano no mês / benefício aplicável
    cash.ts            fechamento de caixa
  data/
    repositories.ts    interfaces: AppointmentRepo, ClientRepo, ... (async)
    mock/              implementação em memória + localStorage + latência
      seed.ts          dados de demonstração determinísticos
    http/              (V2) implementação chamando a API — mesma interface
    index.ts           escolhe mock ou http por variável de ambiente
  hooks/             # useAppointments(), useCloseOrder()... (TanStack Query)
  app/
    (public)/...     # páginas do cliente
    admin/...        # painel
  components/
    ui/              # shadcn customizado
    ...
```
Regra: **componente → hook → repositório**. Nenhum componente importa `mock/` diretamente. As regras de negócio em `domain/` são puras e testadas — o backend poderá reutilizá-las.

---

## 10. Plano de entrega da V1

| Fase | Entrega | Telas |
|---|---|---|
| **0 · Fundação** | Projeto Next + TS + Tailwind + shadcn, tokens de design, fontes, layouts (público e painel), `domain/` com tipos, repositórios mock, seed | — |
| **1 · Agendar** | Fluxo completo do cliente | C1, C2, C3, C7, C8, C9 |
| **2 · Operação** | Dia a dia no painel | A1, A2 (básico), A3, A4, A5, A6 |
| **3 · Clube** | Assinatura ponta a ponta | C5, C6, C10, A9 |
| **4 · Gestão** | Cadastros e dinheiro da equipe | A7, A8, A10, A12, A13, A16 |
| **5 · Completar** | P1/P2 restantes e polimento | C4, C11, C12, A11, A14, A15, A2 completo |

Cada fase termina navegável e demonstrável. Ao final da Fase 5 temos a **visão macro completa** e a lista exata de endpoints que a V2 precisa (= os métodos das interfaces de repositório).

### Depois: V2 (backend) — só para referência
Implementação `data/http/` + API; autenticação real (OTP por SMS/WhatsApp); pagamentos com gateway (Pix + cartão recorrente); WhatsApp automatizado (confirmação, lembrete 24h/2h, lista de espera); jobs de cobrança e inadimplência; PWA.

---

## 11. Métricas de sucesso da V1
- Agendamento concluído em **< 60s** e **≤ 4 toques** após escolher o serviço (testado com 5 clientes reais).
- Barbeiro consegue abrir e fechar uma comanda **no celular em < 30s**.
- Dono valida que dashboard, comissões e caixa mostram o que ele precisa para fechar o mês.
- Lighthouse ≥ 90 (performance) e ≥ 95 (acessibilidade) na página pública.
- Zero acesso direto a mock dentro de componentes (checado em revisão).

---

## 12. Premissas e pontos em aberto

**Premissas (decididas por mim — corrija se estiver errado):**
1. Uma unidade, ~4 barbeiros.
2. O Clube é parte central do negócio (como no CashBarber).
3. Login do cliente por telefone + código, sem senha.
4. Formas de pagamento no balcão: dinheiro, Pix, débito, crédito.
5. Comissão padrão em % por serviço, com exceção por barbeiro; atendimento do Clube paga comissão por valor fixo por atendimento.

**Em aberto (precisamos de você):**
1. Nome, logo e fotos reais da barbearia (a V1 usa placeholders).
2. Quais planos de Clube existem hoje (ou queremos criar) e suas regras.
3. Como a comissão é paga hoje — %, fixo, diferente para Clube?
4. Vendem produtos? Se não, A11 pode sair da V1.
5. Existe recepcionista ou só barbeiros + dono?
