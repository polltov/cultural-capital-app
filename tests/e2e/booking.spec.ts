import { test, expect } from "@playwright/test";
import { truncate, seedTourWithSlot } from "./helpers";

test.beforeEach(async () => {
  await truncate();
});

test("guest can add tour to cart and submit order", async ({ page }) => {
  const { tourSlug } = await seedTourWithSlot();
  await page.goto(`/tours/${tourSlug}`);
  await page.getByRole("button", { name: /Добавить/ }).click();
  await page.goto("/cart");
  await page.getByLabel("Имя").fill("Иван Тестовый");
  await page.getByLabel("Телефон").fill("+79990000000");
  await page.getByLabel("Email").fill("ivan@example.com");
  await page.getByRole("button", { name: /Оформить/ }).click();
  await expect(page.locator("h1")).toContainText("принята");
});
