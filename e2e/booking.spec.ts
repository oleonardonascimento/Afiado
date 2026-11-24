import { expect, test } from "@playwright/test";

test("cliente novo agenda, vê na conta e cancela", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/agendar");

  await page.getByRole("checkbox", { name: /^Corte\s/ }).first().click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: /Qualquer disponível/ }).click();

  // Um dia à frente com horários, para ficar fora do prazo mínimo de cancelamento.
  const days = page.getByRole("list", { name: "Dias" }).getByRole("button", { name: /horários?$/ });
  await expect(days.first()).toBeVisible({ timeout: 10_000 });
  await days.nth(2).click();
  const firstSlot = page.getByRole("button", { name: /^\d{2}:\d{2}$/ }).first();
  await expect(firstSlot).toBeVisible({ timeout: 10_000 });
  await firstSlot.click();

  await page.getByLabel("Seu celular com DDD").fill("61999990000");
  await page.getByRole("button", { name: "Receber código" }).click();
  const hint = page.getByText(/Demonstração: o código é/);
  await expect(hint).toBeVisible();
  const code = (await hint.locator("strong").textContent())?.trim() ?? "";
  await page.getByLabel("Código").fill(code);
  await page.getByLabel("Seu nome").fill("Cliente E2E");
  await page.getByRole("button", { name: "Criar cadastro e continuar" }).click();

  await page.getByRole("button", { name: "Confirmar agendamento" }).click();
  await expect(page.getByRole("heading", { name: "Horário marcado" })).toBeVisible({ timeout: 10_000 });

  await page.goto("/conta/agendamentos");
  await expect(page.getByRole("tab", { name: "Próximos (1)" })).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: "Cancelar agendamento" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Cancelar agendamento" }).click();
  await expect(page.getByText("Agendamento cancelado")).toBeVisible();
  await expect(page.getByRole("tab", { name: "Próximos (0)" })).toBeVisible();
});
