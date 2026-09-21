// Smoke test UI : sert le projet, charge index.html dans Chrome, vérifie que
// l'éditeur construit bien l'aperçu et qu'aucune erreur JS ne sort.
// Usage : node scripts/ui-smoke.mjs   (après npm install)
import { chromium as pw } from "playwright-core";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

const chrome = ["/usr/bin/google-chrome-stable", "/usr/bin/google-chrome"].find((p) => existsSync(p));
const server = spawn("python3", ["-m", "http.server", "8741", "--directory", new URL("..", import.meta.url).pathname], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 700));

const browser = await pw.launch({ executablePath: chrome, args: ["--headless=new", "--no-sandbox"], headless: true });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });

let ok = true;
const t = async (name, fn) => { try { const r = await fn(); console.log(`${r ? "✓" : "✗ ÉCHEC"}  ${name}`); if (!r) ok = false; } catch (e) { console.log(`✗ ÉCHEC  ${name} (${e.message.split("\n")[0]})`); ok = false; } };

await page.goto("http://127.0.0.1:8741/index.html", { waitUntil: "load" });

await t("formulaire initialisé (nom expéditeur)", async () => (await page.inputValue('[data-bind="expediteur.nom"]')).includes("Andry RAKOTO"));
await t("6 paragraphes affichés", async () => (await page.$$(".para-row")).length === 6);
await t("aperçu A4 construit", async () => {
  const frame = await page.$("#apercu");
  const body = await frame.contentFrame().then((f) => f.locator("body").innerText());
  return body.includes("Objet :") && body.includes("salutations distinguées");
});

// édition : changer l'objet -> aperçu suit ; supprimer un paragraphe -> compte à jour
await t("frappe -> aperçu synchronisé", async () => {
  await page.fill('[data-bind="objet"]', "Objet : TEST SYNCHRO 123");
  await page.waitForTimeout(600);
  const f = await (await page.$("#apercu")).contentFrame();
  return (await f.locator("body").innerText()).includes("TEST SYNCHRO 123");
});
await t("suppression d'un paragraphe", async () => {
  page.once("dialog", (d) => d.accept());
  await page.click('.para-row:nth-child(2) [data-act="del"]');
  await page.waitForTimeout(200);
  return (await page.$$(".para-row")).length === 5;
});
await t("bouton date du jour", async () => {
  await page.click("#btn-today");
  return (await page.inputValue('[data-bind="lieuDate"]')).startsWith("À Antananarivo, le ");
});
await t("garde-fou emdash signalé", async () => {
  await page.fill('[data-bind="objet"]', "Objet — avec tiret");
  await page.waitForTimeout(300);
  return (await page.$eval("#warnings", (e) => e.innerText)).includes("tiret");
});
await t("persistance localStorage", async () => {
  await page.waitForTimeout(800); // laisser la sauvegarde débouncée (400ms) se terminer
  await page.reload({ waitUntil: "load" });
  return (await page.inputValue('[data-bind="objet"]')).includes("avec tiret");
});
await t("aucune erreur JS", async () => {
  const js = errors.filter((e) => !e.includes("Failed to load resource"));
  js.forEach((e) => console.log("   " + e));
  return js.length === 0;
});

await browser.close(); server.kill();
console.log(ok ? "UI-SMOKE OK" : "UI-SMOKE EN ÉCHEC");
process.exit(ok ? 0 : 1);
