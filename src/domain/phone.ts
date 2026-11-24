/** Telefone BR armazenado só com dígitos nacionais: DDD (2) + número (8 ou 9). */
export function normalizePhone(input: string): string {
  let d = input.replace(/\D/g, "");
  if (d.startsWith("55") && (d.length === 12 || d.length === 13))
    d = d.slice(2);
  return d;
}

export function isValidPhone(digits: string): boolean {
  if (!/^\d{10,11}$/.test(digits)) return false;
  const ddd = Number(digits.slice(0, 2));
  if (ddd < 11) return false;
  if (digits.length === 11 && digits[2] !== "9") return false;
  return true;
}
