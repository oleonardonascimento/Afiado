import { expect, test } from "@playwright/test";
import { resetDemo } from "./helpers";

test("abre caixa, fecha uma comanda avulsa e fecha o caixa", async ({
  page,
}) => {
  await resetDemo(page);

  // Caixa: no seed pode já estar aberto; se não estiver, abre com R$ 100.
  await page.goto("/admin/caixa");
  const openHeading = page.getByRole("heading", { name: "Abrir caixa" });
  const closeButton = page.getByRole("button", { name: "Fechar caixa" });
  await expect(openHeading.or(closeButton)).toBeVisible({ timeout: 10_000 });
  if (await openHeading.isVisible()) {
    await page.getByLabel("Valor inicial em dinheiro").fill("100");
    await page.getByRole("button", { name: "Abrir caixa" }).click();
    await expect(closeButton).toBeVisible();
  }

  // Comanda avulsa com um corte, paga no Pix.
  await page.goto("/admin/comandas");
  await page.getByRole("button", { name: "Nova comanda" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Barbeiro responsável").click();
  await page.getByRole("option").first().click();
  await dialog.getByRole("button", { name: "Abrir comanda" }).click();
  await expect(page).toHaveURL(/\/admin\/comandas\/.+/, { timeout: 10_000 });

  await page.getByLabel("Adicionar serviço ou produto").fill("Corte");
  await page.getByRole("button", { name: /^Corte\s+Serviço/ }).click();
  await page.getByRole("button", { name: "Preencher o restante" }).click();
  await page.getByRole("button", { name: "Fechar comanda" }).click();
  await expect(page.getByText("Fechada", { exact: true })).toBeVisible({
    timeout: 10_000,
  });

  // Fecha o caixa contando exatamente o esperado.
  await page.goto("/admin/caixa");
  await page.getByRole("button", { name: "Fechar caixa" }).click();
  const close = page.getByRole("dialog");
  for (const row of await close.locator("tbody tr").all()) {
    const expected = (await row.locator("td").first().textContent()) ?? "";
    await row.getByRole("textbox").fill(expected.replace(/R\$\s?/, "").trim());
  }
  await close.getByRole("button", { name: "Fechar caixa" }).click();
  await expect(
    page.getByRole("heading", { name: "Abrir caixa" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("region", { name: "Caixas anteriores" })
      .getByRole("listitem")
      .first(),
  ).toContainText("Sem diferença");
});

test("recepção não abre telas do dono pela URL", async ({ page }) => {
  await resetDemo(page);
  await page.goto("/admin/entrar");
  await page
    .getByRole("radio", { name: /Recepção/ })
    .first()
    .click();
  await page.getByRole("button", { name: "Entrar no painel" }).click();
  await expect(
    page.getByRole("button", { name: "Papel: Recepção" }),
  ).toBeVisible({ timeout: 10_000 });
  await page.goto("/admin/equipe");
  await expect(
    page.getByText("Esta tela não está disponível para o seu papel"),
  ).toBeVisible({ timeout: 10_000 });
});
