import { expect, type Page } from "@playwright/test";

/** Começa do seed limpo. */
export async function resetDemo(page: Page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
}

/** Entra (ou cria cadastro) com um celular novo, partindo de uma tela que mostra o login por celular. */
export async function signInWithPhone(page: Page, phone: string, name: string) {
  await page.getByLabel("Seu celular com DDD").fill(phone);
  await page.getByRole("button", { name: "Receber código" }).click();
  const hint = page.getByText(/Demonstração: o código é/);
  await expect(hint).toBeVisible();
  const code = (await hint.locator("strong").textContent())?.trim() ?? "";
  await page.getByLabel("Código").fill(code);
  await page.getByLabel("Seu nome").fill(name);
  await page
    .getByRole("button", { name: "Criar cadastro e continuar" })
    .click();
}
