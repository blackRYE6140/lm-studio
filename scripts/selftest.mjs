// Auto-tests du moteur : garde-fous, rendu, liens. À lancer : npm run check
import { renderLetterDoc, guards, telHref, siteHref, mailHref } from "../lib/render.mjs";
import { SEED_LETTER } from "../lib/seed.mjs";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let fails = 0;
const t = (name, ok) => { console.log(`${ok ? "✓" : "✗ ÉCHEC"}  ${name}`); if (!ok) fails++; };

// 1) hrefs
t("tel: normalisé",      telHref("+261 34 292 83 55") === "tel:+261342928355");
t("mailto:",             mailHref("a@b.mg") === "mailto:a@b.mg");
t("https:// ajouté",     siteHref("rafalimananayannicketan.vercel.app") === "https://rafalimananayannicketan.vercel.app");
t("https conservé",      siteHref("https://x.mg/") === "https://x.mg/");

// 2) garde-fous
const dirty = structuredClone(SEED_LETTER);
dirty.paragraphes[0].text = "texte **gras** avec — un tiret — et – un autre.";
const g = guards(dirty);
t("emdash retirés",      !g.data.paragraphes[0].text.includes("—") && !g.data.paragraphes[0].text.includes("–"));
t("gras markdown retiré", !g.data.paragraphes[0].text.includes("**"));
t("warnings émis",       g.warnings.length >= 2);

// 3) rendu complet de la lettre seed
const html = renderLetterDoc(SEED_LETTER);
t("12pt + 20.7pt",       html.includes("font-size: 12pt") && html.includes("line-height: 20.7pt"));
t("marges 25mm",         html.includes("margin: 25mm"));
t("police TNR->Liberation", html.includes('"Times New Roman"') && html.includes("Liberation Serif"));
t("5 liens actifs",      html.includes("tel:+261340000000") && html.includes("mailto:andry.rakoto@exemple.mg") && html.includes("https://andryrakoto.dev") && html.includes("https://github.com/andryrakoto") && html.includes("https://linkedin.com/in/andryrakoto"));
t("pas de <strong>",     !/<strong|<b>/i.test(html));
t("pas d'emdash",        !html.includes("—"));
t("6 paragraphes rendus", (html.match(/class="p"/g) || []).length === 7); // 6 + salutation
t("XSS neutralisé",      !renderLetterDoc({ ...SEED_LETTER, objet: "<script>bad</script>" }).includes("<script>bad"));
t("destinataire ancré à droite", html.includes("margin-left: auto; width: fit-content"));
t("modèle A par défaut", html.includes('class="template-A"'));
t("modèle B signature à droite", renderLetterDoc({ ...SEED_LETTER, template: "B" }).includes(".template-B .bloc-sig { text-align: right; }"));
t("modèle C tête en deux colonnes", renderLetterDoc({ ...SEED_LETTER, template: "C" }).includes(".template-C .letter-head { display: grid; grid-template-columns: 1fr 1fr;") && renderLetterDoc({ ...SEED_LETTER, template: "C" }).includes('class="letter-head"'));
t("modèle D tête alignée + signature à droite", renderLetterDoc({ ...SEED_LETTER, template: "D" }).includes(".template-D .bloc-sig { text-align: right; }") && renderLetterDoc({ ...SEED_LETTER, template: "D" }).includes(".template-D .letter-head { display: grid; grid-template-columns: 1fr 1fr;"));
t("aperçu: corps margé 25mm", renderLetterDoc(SEED_LETTER, { preview: true }).includes("body { margin: 25mm; width: 160mm;"));
t("PDF: corps sans marge (géré par page.pdf)", !html.includes("body { margin: 25mm;"));

// 4) artefact de dev pour inspection visuelle
writeFileSync(join(root, "out", "preview.html"), renderLetterDoc(SEED_LETTER));
console.log("\nout/preview.html écrit — smoke test : soffice --convert-to pdf out/preview.html");
process.exit(fails ? 1 : 0);
