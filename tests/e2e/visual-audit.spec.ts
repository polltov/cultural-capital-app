import { test } from "@playwright/test";
import fs from "node:fs";

const BASE = "https://cultural-capital-app.vercel.app";
const OUT = "/tmp/visual-audit";
fs.mkdirSync(OUT, { recursive: true });

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

const pages = [
  { name: "home", path: "/" },
  { name: "tour-detail", path: "/tours/old" },
  { name: "cart", path: "/cart" },
  { name: "admin-login", path: "/admin/login" },
];

for (const vp of viewports) {
  for (const p of pages) {
    test(`visual: ${p.name} @ ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const consoleErrors: string[] = [];
      page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`));
      page.on("console", (m) => {
        if (m.type() === "error") consoleErrors.push(`console.error: ${m.text()}`);
      });
      const resp = await page.goto(`${BASE}${p.path}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(400);
      await page.screenshot({
        path: `${OUT}/${p.name}-${vp.name}.jpg`,
        fullPage: true,
        type: "jpeg",
        quality: 85,
      });
      const meta = {
        status: resp?.status(),
        errors: consoleErrors,
        title: await page.title(),
      };
      fs.writeFileSync(`${OUT}/${p.name}-${vp.name}.json`, JSON.stringify(meta, null, 2));
    });
  }
}
