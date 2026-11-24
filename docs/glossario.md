# Glossário — Afiado

Mesma palavra para a mesma coisa em todo o app. Termo da interface (pt-BR) → nome no código.

| Na interface | No código | O que é |
|---|---|---|
| Agendamento / horário | `Appointment` | Reserva de um cliente com um barbeiro em data e hora. |
| Encaixe | `allowOverlap` | Agendamento feito pelo painel que pode sobrepor outro horário. |
| Bloqueio | `TimeOff` (`block`) | Intervalo em que o barbeiro não atende (reunião, almoço fora do padrão). |
| Folga / Férias | `TimeOff` (`dayoff` / `vacation`) | Dias inteiros sem atendimento do barbeiro. |
| Dias fechados | `Barbershop.closures` | Datas em que a barbearia inteira não abre. |
| Comanda | `Order` | Conta do atendimento: serviços, produtos, descontos e pagamentos. |
| Avulso | `Order` sem `appointmentId` | Comanda aberta sem agendamento (cliente que chegou na hora). |
| Caixa | `CashSession` | Período entre abrir e fechar o caixa do dia. |
| Movimentação | `CashMovement` | Entrada, saída, sangria ou recebimento de comanda no caixa. |
| Sangria | `withdrawal` | Retirada de dinheiro do caixa. |
| Comissão | `Commission` | Valor devido ao barbeiro por item de comanda fechada. |
| Exceção de comissão | `commissionOverrides` | % diferente do padrão para um serviço específico, por barbeiro. |
| Clube | `Subscription` / `Plan` | Assinatura mensal com benefícios em serviços. |
| Plano | `Plan` | Opção do Clube (preço + benefícios + regras). |
| Assinante | cliente com `Subscription` ativa | — |
| Cancelamento agendado | `canceling` | Assinatura cancelada que segue valendo até o fim do período pago. |
| Pagamento pendente | `past_due` | Cobrança do Clube não aprovada; benefícios suspensos. |
| Coberto pelo Clube | `clubCovered` | Item da comanda pago pelo plano (valor zero para o cliente). |
| Faltou | `no_show` | Cliente não compareceu ao horário. |
| Lista de espera | `WaitlistEntry` | Pedido para ser avisado se abrir vaga num dia. |
| Papel | `StaffRole` | Dono (`owner`), Barbeiro (`barber`), Recepção (`reception`). |
| Origem | `ClientSource` | Como o cliente conheceu a barbearia. |
