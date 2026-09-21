// Vercel serverless — génère le PDF avec un Chromium headless (rendu déterministe,
// identique depuis n'importe quel appareil) et renvoie le nombre de pages en en-tête.
import chromium from "@sparticuz/chromium";
import { chromium as pw } from "playwright-core";
import { PDFDocument } from "pdf-lib";
import { renderLetterDoc, guards } from "../lib/render.mjs";
import { FONT_B64 } from "../lib/_font-data.mjs";
import { existsSync } from "node:fs";

// Deux environnements d'exécution :
//  - Production Vercel (AWS Lambda) : le Chromium compacts de @sparticuz/chromium.
//  - Local (`vercel dev`, scripts de test) : le Chrome/Chromium du système.
async function browserTarget() {
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return { executablePath: await chromium.executablePath(), args: chromium.args };
  }
  const sys = [
    process.env.CHROME_PATH,
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean).find((p) => existsSync(p));
  if (!sys) throw new Error("Aucun navigateur pour la dev locale : installe Chrome ou définis CHROME_PATH");
  return { executablePath: sys, args: ["--headless=new", "--no-sandbox", "--disable-gpu"] };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method === "GET")
    return res.status(200).json({ ok: true, usage: "POST { data: <lm-contenu.json> } -> application/pdf" });
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  let browser;
  try {
    const { data, filename } = req.body || {};
    if (!data || typeof data !== "object") return res.status(400).json({ error: "Champ « data » manquant" });

    const fontFace = `@font-face { font-family: "Liberation Serif"; font-weight: normal; src: url(data:font/ttf;base64,${FONT_B64}) format("truetype"); }`;
    const { data: cleaned, warnings } = guards(data);
    const html = renderLetterDoc(cleaned, { fontFace });

    const { executablePath, args } = await browserTarget();
    browser = await pw.launch({ executablePath, args, headless: true });
    const page = await browser.newPage();
    await page.emulateMedia({ media: "print" });
    await page.setContent(html, { waitUntil: "load" });
    const buf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "25mm", bottom: "25mm", left: "25mm", right: "25mm" },
    });
    await browser.close();

    const doc = await PDFDocument.load(buf);
    const name = String(filename || "lettre.pdf").replace(/[^\w\-.\u00C0-\u017F ]+/g, "").trim() + (String(filename || "").endsWith(".pdf") ? "" : ".pdf");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(name)}"`);
    res.setHeader("X-Pages", String(doc.getPageCount()));
    res.setHeader("X-Warnings", encodeURIComponent(JSON.stringify(warnings)));
    return res.status(200).send(Buffer.from(buf));
  } catch (e) {
    try { await browser?.close(); } catch {}
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
