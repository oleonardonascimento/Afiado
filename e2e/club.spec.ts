import { expect, test } from "@playwright/test";
import { resetDemo, signInWithPhone } from "./helpers";

test("cliente assina o Clube, cancela e edita o perfil", async ({ page }) => {
  await resetDemo(page);
  await page.goto("/clube");
  await page
    .getByRole("link", { name: /^Assinar o plano/ })
    .first()
    .click();
  await page.getByRole("link", { name: "Entrar com celular" }).click();
  await signInWithPhone(page, "61988887777", "Assinante E2E");

  await expect(
    page.getByRole("heading", { name: /^Assinar o plano/ }),
  ).toBeVisible({ timeout: 10_000 });
  await page.getByRole("checkbox").last().click();
  await page.getByRole("button", { name: /^Assinar por/ }).click();
  await expect(
    page.getByRole("heading", { name: "Bem-vindo ao Clube" }),
  ).toBeVisible({ timeout: 10_000 });

  await page.getByRole("link", { name: "Ver meu plano" }).click();
  await page.getByRole("button", { name: "Cancelar assinatura" }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Cancelar assinatura" })
    .click();
  await expect(page.getByText(/Assinatura cancelada/)).toBeVisible();

  await page.goto("/conta/perfil");
  await page.getByRole("button", { name: "Editar meus dados" }).click();
  await page.getByLabel("Nome").fill("Assinante Editado");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByText("Perfil atualizado")).toBeVisible();
  await expect(page.getByText("Assinante Editado").first()).toBeVisible();
});
