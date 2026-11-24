import type { Metadata } from "next";
import { LegalPage } from "@/features/public-site/components/LegalPage";

export const metadata: Metadata = {
  title: "Termos de uso",
  description: "Regras para agendar horários e assinar o Clube da Afiado.",
};

const SECTIONS = [
  {
    title: "Agendamento",
    paragraphs: [
      "Ao agendar, você reserva um horário com o barbeiro escolhido. O horário fica confirmado na hora e você recebe os detalhes pelo WhatsApp.",
      "Você pode cancelar ou remarcar pelo site até o prazo informado na confirmação. Depois desse prazo, fale com a barbearia pelo WhatsApp.",
    ],
  },
  {
    title: "Clube de assinatura",
    paragraphs: [
      "O Clube é uma assinatura mensal com renovação automática. Os benefícios de cada plano estão descritos na página do Clube e valem por pessoa, sem transferência.",
      "Benefícios não usados no mês não acumulam para o mês seguinte.",
      "Você pode cancelar quando quiser em “Meu plano”. O cancelamento vale no fim do período já pago, e até lá os benefícios continuam valendo.",
      "Se uma cobrança não for aprovada, a assinatura fica pendente e os benefícios ficam suspensos até o pagamento.",
    ],
  },
  {
    title: "Preços e pagamentos",
    paragraphs: [
      "Os preços dos serviços estão no site e podem mudar. O valor que vale é o do momento do atendimento.",
      "Os pagamentos no balcão aceitam dinheiro, Pix, cartão de débito e de crédito.",
    ],
  },
  {
    title: "Contato",
    paragraphs: [
      "Dúvidas sobre estes termos: fale com a barbearia pelo WhatsApp informado na página inicial.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Termos de uso"
      updatedAt="24/11/2026"
      sections={SECTIONS}
    />
  );
}
