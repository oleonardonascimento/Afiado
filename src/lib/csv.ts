/** CSV para Excel em pt-BR: separador ";" e CRLF. */
function cell(value: string | number): string {
  const text = String(value);
  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(header: string[], rows: (string | number)[][]): string {
  return [header, ...rows].map((row) => row.map(cell).join(";")).join("\r\n");
}

/** Baixa um texto como arquivo (com BOM para o Excel reconhecer UTF-8). */
export function downloadText(
  filename: string,
  text: string,
  type = "text/csv;charset=utf-8",
) {
  const url = URL.createObjectURL(new Blob(["﻿", text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
