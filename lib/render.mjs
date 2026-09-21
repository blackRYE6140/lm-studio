// lm-studio — moteur de rendu unique de la lettre.
// Source de vérité partagée : aperçu navigateur (url /fonts/...) ET function PDF (data: URI).
// Mise en page calée sur le modèle Word validé : TNR 12pt, interligne 1,5 Word = 20,7pt, marges 25mm.

export function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// ---- Garde-fous : renvoie { data: cleaned, warnings: [] } -------------------
export function guards(input) {
  const warnings = [];
  const data = JSON.parse(JSON.stringify(input || {}));

  const fixDashes = (s) => {
    const n = (String(s || "").match(/—|–/g) || []).length;
    if (n) warnings.push(`${n} tiret(s) long(s) « — » corrigé(s) en « - »`);
    return String(s || "").replace(/—|–/g, "-");
  };
  const stripBold = (s) => {
    const n = (String(s || "").match(/\*\*[^*]+\*\*/g) || []).length;
    if (n) warnings.push(`${n} marque(s) de gras retirée(s)`);
    return String(s || "").replace(/\*\*([^*]+)\*\*/g, "$1");
  };
  const clean = (s) => stripBold(fixDashes(s));

  const e = (data.expediteur ||= {});
  e.nom = clean(e.nom); e.adresse = clean(e.adresse); e.tel = clean(e.tel);
  e.email = clean(e.email).trim(); e.site = clean(e.site).trim();
  e.github = clean(e.github).trim(); e.linkedin = clean(e.linkedin).trim();

  data.destinataire = (Array.isArray(data.destinataire) ? data.destinataire : [])
    .map(clean).filter((l) => l.trim() !== "");
  data.lieuDate = clean(data.lieuDate);
  data.objet = clean(data.objet);
  data.salutation = clean(data.salutation) || "Madame, Monsieur,";
  data.signature = clean(data.signature);
  data.paragraphes = (Array.isArray(data.paragraphes) ? data.paragraphes : [])
    .map((p) => ({ label: clean(p?.label || ""), text: clean(p?.text || "") }))
    .filter((p) => p.text.trim() !== "");

  if (data.paragraphes.length < 3) warnings.push("Moins de 3 paragraphes : vérifier la structure");
  if (e.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e.email)) warnings.push("Format d'email douteux");
  if (!data.objet.trim()) warnings.push("Objet manquant");

  return { data, warnings };
}

// ---- Liens cliquables -------------------------------------------------------
export function telHref(display) {
  const raw = String(display || "").replace(/[^\d+]/g, "");
  return raw ? `tel:${raw}` : "";
}
export function siteHref(display) {
  const s = String(display || "").trim();
  if (!s) return "";
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}
export function mailHref(display) {
  const s = String(display || "").trim();
  return s && s.includes("@") ? `mailto:${s}` : "";
}

// ---- CSS du rendu (partagé navigateur / PDF) --------------------------------
export function letterCss(fontFaceCss, extraCss = "") {
  return `
${fontFaceCss}
@page { size: A4; margin: 25mm; }
* { font-weight: normal !important; }
body {
  font-family: "Times New Roman", serif;
  font-size: 12pt !important;
  line-height: 20.7pt !important;
  color: #111111;
  margin: 0;
}
p, div { margin: 0; }
a, a:visited { color: #111111; text-decoration: none; }
.expediteur { margin-bottom: 6mm; }
.destinataire { margin-left: auto; width: fit-content; margin-bottom: 6mm; }
.lieu { margin: 0 0 6mm 0; }
.objet { margin: 0 0 6mm 12.5mm; }
.p { text-align: justify; margin: 0 0 12pt 0; }
.bloc-sig { margin-top: 8mm; }
${extraCss}
`;
}

// ---- Rendu du document complet ----------------------------------------------
// opts.fontFace : chaine @font-face (browser: url('/fonts/...'); API: data: URI)
// opts.preview : marges 25mm appliquées à l'écran (l'aperçu montre alors le vrai cadrage du PDF)
export function renderLetterDoc(data, opts = {}) {
  const { data: d } = guards(data);
  const fontFace = opts.fontFace ?? `@font-face { font-family: "Times New Roman"; src: url("/fonts/LiberationSerif-Regular.ttf") format("truetype"); } @font-face { font-family: "Liberation Serif"; src: url("/fonts/LiberationSerif-Regular.ttf") format("truetype"); }`;
  const extraCss = opts.preview ? "body { margin: 25mm; width: 160mm; min-height: 247mm; }" : "";
  const lines = (arr) => arr.map((l) => `${escapeHtml(l)}<br>`).join("").replace(/<br>$/, "");
  const para = (text) =>
    String(text).split(/\n+/).map((t) => escapeHtml(t.trim())).filter(Boolean).join("<br>");

  const contactTel = d.expediteur.tel
    ? `<a href="${escapeHtml(telHref(d.expediteur.tel))}">${escapeHtml(d.expediteur.tel)}</a><br>` : "";
  const contactMail = d.expediteur.email
    ? `<a href="${escapeHtml(mailHref(d.expediteur.email))}">${escapeHtml(d.expediteur.email)}</a><br>` : "";
  const contactSite = d.expediteur.site
    ? `<a href="${escapeHtml(siteHref(d.expediteur.site))}">${escapeHtml(d.expediteur.site)}</a>` : "";
  const contactGithub = d.expediteur.github
    ? `<br><a href="${escapeHtml(siteHref(d.expediteur.github))}">${escapeHtml(d.expediteur.github)}</a>` : "";
  const contactLinkedin = d.expediteur.linkedin
    ? `<br><a href="${escapeHtml(siteHref(d.expediteur.linkedin))}">${escapeHtml(d.expediteur.linkedin)}</a>` : "";

  const body = `
<div class="expediteur">${escapeHtml(d.expediteur.nom)}<br>${escapeHtml(d.expediteur.adresse)}<br>${contactTel}${contactMail}${contactSite}${contactGithub}${contactLinkedin}</div>
<div class="destinataire">${lines(d.destinataire)}</div>
<div class="lieu">${escapeHtml(d.lieuDate)}</div>
<div class="objet">${escapeHtml(d.objet)}</div>
<p class="p">${para(d.salutation)}</p>
${d.paragraphes.map((p) => `<p class="p">${para(p.text)}</p>`).join("\n")}
<p class="bloc-sig">${escapeHtml(d.signature)}</p>`.trim();

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(d.meta?.title || "Lettre de motivation")}</title>
<style>${letterCss(fontFace, extraCss)}</style>
</head>
<body>
${body}
</body>
</html>`;
}
