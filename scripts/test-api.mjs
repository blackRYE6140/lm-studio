// Test bout-en-bout LOCAL de la function api/pdf.js (via Chrome système),
// sans serveur : on simule la requête Vercel et on inspecte le PDF réponse.
// Usage : node scripts/test-api.mjs   (après npm install)
import handler from "../api/pdf.js";
import { SEED_LETTER } from "../lib/seed.mjs";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function mockRes() {
  const res = { code: 0, headers: {}, _body: null };
  res.setHeader = (k, v) => { res.headers[k] = v; };
  res.status = (c) => { res.code = c; return res; };
  res.json = (o) => { res._body = Buffer.from(JSON.stringify(o)); res.headers["Content-Type"] ||= "application/json"; return res; };
  res.send = (b) => { res._body = Buffer.from(b); return res; };
  res.end = () => res;
  return res;
}

const req = { method: "POST", body: { data: SEED_LETTER, filename: "LM DIGITALEO" } };
const res = mockRes();
await handler(req, res);

if (res.code !== 200) { console.error("ÉCHEC HTTP", res.code, res._body?.toString()); process.exit(1); }
const out = join(root, "out", "test-api.pdf");
writeFileSync(out, res._body);
console.log("✓ HTTP 200 —", res._body.length, "octets écrits dans out/test-api.pdf");
console.log("  X-Pages    :", res.headers["X-Pages"]);
console.log("  X-Warnings :", decodeURIComponent(res.headers["X-Warnings"] || "[]"));
console.log("  Fichier    :", res.headers["Content-Disposition"]);
