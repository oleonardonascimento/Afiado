/**
 * localStorage do navegador, ou null. Ler `window.localStorage` pode lançar SecurityError
 * (cookies bloqueados, iframe isolado, alguns modos privados): aí o mock segue só em memória.
 */
export function browserStorage(
  win: Pick<Window, "localStorage"> | undefined,
): Storage | null {
  if (!win) return null;
  try {
    return win.localStorage;
  } catch {
    return null;
  }
}
