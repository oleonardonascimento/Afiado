import type { Metadata } from "next";
import { LegalPage } from "@/features/public-site/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacidade",
  description: "Quais dados a Afiado guarda, para quê e como pedir a exclusão.",
};

const SECTIONS = [
  {
    title: "Quais dados guardamos",
    paragraphs: [
      "Para agendar, pedimos só nome e celular. E-mail e aniversário são opcionais.",
      "Guardamos também seu histórico de atendimentos, compras na barbearia e, se você assinar o Clube, o plano e as cobranças.",
    ],
  },
  {
    title: "Para que usamos",
    paragraphs: [
      "Para marcar e lembrar seus horários, registrar o atendimento e aplicar os benefícios do Clube.",
      "Só enviamos novidades e promoções se você autorizar. Você pode mudar essa escolha a qualquer momento em “Meu perfil”.",
    ],
  },
  {
    title: "Com quem compartilhamos",
    paragraphs: [
      "Não vendemos seus dados. Eles são vistos apenas pela equipe da barbearia e pelos serviços necessários para funcionar, como o envio de mensagens e o processamento de pagamentos.",
    ],
  },
  {
    title: "Seus direitos",
    paragraphs: [
      "Pela Lei Geral de Proteção de Dados (LGPD), você pode ver, corrigir e pedir a exclusão dos seus dados.",
      "Para excluir, use “Excluir meus dados” em “Meu perfil” ou fale com a barbearia pelo WhatsApp.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacidade" updatedAt="24/11/2026" sections={SECTIONS} />
  );
}
