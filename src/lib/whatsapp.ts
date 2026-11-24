/** Link wa.me com mensagem pronta (V1 abre o WhatsApp; automação fica na V2). */
export function whatsappLink(phoneDigits: string, text: string): string {
  return `https://wa.me/55${phoneDigits}?text=${encodeURIComponent(text)}`;
}
