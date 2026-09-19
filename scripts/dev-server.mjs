// Serveur de dev local SANS Vercel CLI : sert l'éditeur ET exécute la vraie
// fonction api/pdf.js dans le même process (chemin « navigateur système »).
// Usage : npm run serve  →  http://localhost:5173
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, normalize } from "node:path";
import handler from "../api/pdf.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".ttf": "font/ttf", ".png": "image/png", ".svg": "image/svg+xml" };
const FORBIDDEN = [/^\/api\/(?!$)/, /^\/(scripts|out|node_modules)\//, /^\/package/, /^\/vercel/, /^\/\./];

function mockRes(raw) {
  const m = {
    setHeader: (k, v) => { try { raw.setHeader(k, v); } catch {} },
    status: (c) => { raw.statusCode = c; return m; },
    json: (o) => { if (!raw.writableEnded) raw.end(JSON.stringify(o)); return m; },
    send: (b) => { if (!raw.writableEnded) raw.end(Buffer.isBuffer(b) ? b : Buffer.from(b)); return m; },
    end: (b) => { if (!raw.writableEnded) raw.end(b); return m; },
  };
  return m;
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/api/pdf" && req.method === "POST") {
      let body = ""; for await (const c of req) body += c;
      return handler({ method: "POST", body: JSON.parse(body || "{}") }, mockRes(res));
    }
    if (url.pathname === "/api/pdf") return res.writeHead(405, { "Content-Type": "application/json" }).end('{"error":"POST attendu"}');

    let p = decodeURIComponent(normalize(url.pathname)).replace(/^(\.\.[/\\])+/, "");
    if (p === "/" || p === "\\") p = "/index.html";
    if (FORBIDDEN.some((rx) => rx.test(p))) { res.writeHead(403); return res.end("403"); }
    const file = join(root, p);
    if (!file.startsWith(root) || !(await stat(file)).isFile()) { res.writeHead(404); return res.end("404"); }
    res.writeHead(200, { "Content-Type": MIME[file.slice(file.lastIndexOf("."))] || "application/octet-stream" });
    res.end(await readFile(file));
  } catch { res.writeHead(500); res.end("500"); }
});

server.listen(5173, () => console.log("lm-studio → http://localhost:5173  (Ctrl+C pour arrêter)"));
