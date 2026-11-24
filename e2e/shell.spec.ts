import { expect, test } from "@playwright/test";

test("home tem cabeçalho, entrar e CTA de agendar", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Afiado/);
  const header = page.getByRole("banner");
  await expect(header.getByText("Afiado", { exact: false })).toBeVisible();
  await expect(header.getByRole("link", { name: "Entrar" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Agendar horário" }).first()).toBeVisible();
});

test("painel: menu e troca de papel", async ({ page, isMobile }, testInfo) => {
  const mobile = isMobile || testInfo.project.name === "mobile";
  await page.goto("/admin");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  const openMore = async () => {
    if (mobile) await page.getByRole("button", { name: "Mais" }).click();
  };

  const nav = page.getByRole("navigation", { name: "Painel" });
  for (const name of ["Agenda", "Comandas", "Clientes", "Caixa"]) {
    await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();
  }
  await openMore();
  await expect(page.getByRole("link", { name: "Configurações" })).toBeVisible();
  if (mobile) await page.keyboard.press("Escape");

  await page.getByRole("button", { name: /Papel/ }).click();
  await page.getByRole("menuitemradio", { name: "Barbeiro" }).click();
  await expect(page.getByRole("button", { name: /Papel: Barbeiro/ })).toBeVisible();
  await openMore();
  await expect(page.getByRole("link", { name: "Configurações" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Relatórios" })).toHaveCount(0);
  if (mobile) await page.keyboard.press("Escape");

  await page.reload();
  await expect(page.getByRole("button", { name: /Papel: Barbeiro/ })).toBeVisible();

  await page.getByRole("button", { name: /Papel/ }).click();
  await page.getByRole("menuitem", { name: "Resetar dados de demonstração" }).click();
  await expect(page.getByText("Dados de demonstração restaurados")).toBeVisible();
  await expect(page.getByRole("button", { name: /Papel: Dono/ })).toBeVisible();
});
