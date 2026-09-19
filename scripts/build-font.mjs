// Génère api/_font-data.mjs (police en base64, embarquée dans la function serverless).
// Usage : node scripts/build-font.mjs   (à relancer seulement si on change le fichier de police)
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ttf = readFileSync(join(root, "fonts", "LiberationSerif-Regular.ttf"));
const b64 = ttf.toString("base64");
writeFileSync(
  join(root, "api", "_font-data.mjs"),
  `// Généré par scripts/build-font.mjs — ne pas éditer à la main.\nexport const FONT_B64 = "${b64}";\n`
);
console.log(`api/_font-data.mjs écrit (${(b64.length / 1024).toFixed(0)} Ko base64, ${ttf.length} Ko ttf)`);
