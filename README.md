# lm-studio

Éditeur de lettres de motivation : **formulaire en blocs → aperçu A4 en direct → PDF déterministe sur Vercel** (Chromium serverless). Le rendu est le même depuis n'importe quel appareil.

## Mise en page (gelée, calée sur `model lm.pdf`)
- Times New Roman 12pt (police embarquée : *Liberation Serif*, clone métriquement identique, licence libre avec exception d'embed)
- Interligne Word « 1,5 » = **20,7 pt par ligne** (valeur absolue, indépendante du moteur)
- Marges **25 mm**, pas d'alinéa, 12 pt entre paragraphes, `Objet` indenté, destinataire à droite
- **Zéro gras forcé** (CSS `font-weight: normal !important` + strip `**gras**`)
- **Tirets longs « —/– » automatiquement corrigés** en `-` avec warning
- Liens `tel:` / `mailto:` / `https:` **cliquables** dans le PDF final
- Quatre modèles disponibles : **A** classique, **B** avec signature alignée à droite, **C** avec expéditeur et destinataire alignés en tête sur deux colonnes, **D** avec cette tête et la signature à droite

## Structure
```
lm-studio/
├── index.html / app.js / styles.css   ← éditeur (formulaire + aperçu)
├── lib/render.mjs                     ← MOTEUR UNIQUE : template + garde-fous
├── lib/seed.mjs                       ← ta lettre DIGITALEO validée (contenu par défaut)
├── fonts/LiberationSerif-Regular.ttf  ← police source
├── api/pdf.js                         ← function Vercel (Playwright + @sparticuz/chromium)
├── api/_font-data.mjs                 ← police en base64 (générée, ne pas éditer)
├── scripts/build-font.mjs             ← régénère _font-data.mjs si police changée
└── scripts/selftest.mjs               ← `npm run check` (garde-fous, rendu, liens)
```
> **Règle d'or** : on n'édite **jamais** le PDF ni le HTML de sortie — tout part du
> formulaire (ou du JSON) et le PDF est un produit régénéré. Les documents sont
> stockés dans le navigateur (localStorage) + exportables en `.json` pour voyager.

## Utilisation locale
```bash
npm install          # deps de la function PDF
npm run serve        # http://localhost:5173 — éditeur + VRAIE fonction /api/pdf (via Chrome système)
npm run check        # tests du moteur
```
Pas de Vercel CLI nécessaire en local : `scripts/dev-server.mjs` sert les fichiers
statiques et exécute `api/pdf.js` dans le même process (hors Lambda, la fonction
utilise automatiquement le Chrome/Chromium installé, ou `CHROME_PATH`).
Hors connexion : bouton **🖨 Imprimer (secours)** → marges « Par défaut » dans la boîte d'impression.

## Déploiement (GitHub → Vercel)
```bash
cd lm-studio
git init && git add -A && git commit -m "lm-studio v1"
git branch -M main
git remote add origin git@github.com:<ton-compte>/lm-studio.git
git push -u origin main
```
Puis sur vercel.com : **Add New Project → Import** le dépôt GitHub → Framework:
**Other** (rien à configurer, `vercel.json` porte déjà runtime/mémoire/durée) → Deploy.
La function `/api/pdf` s'appuie sur `@sparticuz/chromium` : plan **Hobby gratuit**
largement suffisant pour un usage personnel. (Optionnel : `npx vercel dev` marche aussi —
le script `dev` récursif a été retiré de `package.json`.)

## Vérifié (tests exécutés le 12/09/2026)
- ✅ Moteur de rendu + garde-fous + liens : **15/15** (`npm run check`)
- ✅ Template conforme au `model lm.pdf` : interligne **20,7pt**, marges **25mm**, police TNR-compatible embarquée
- ✅ **Function `/api/pdf` exécutée de bout en bout** (`npm run test:api`, via le Chrome système) :
  HTTP 200 → PDF 2 pages, X-Pages correct, 3 annotations cliquables (tel/mailto/https), police embarquée depuis le base64
- ✅ **Éditeur testé en navigateur réel** (`npm run test:ui`) : 9/9 — init formulaire, aperçu synchronisé,
  ajout/déplacement/suppression de paragraphes, garde-fou signalé, persistance localStorage, zéro erreur JS
- ⚠️ Ce qui reste à valider au premier déploiement : le chemin **Lambda** (`@sparticuz/chromium`,
  non exécutable sous Ubuntu — c'est le code de production Vercel) : import GitHub → Deploy sur Vercel, puis bouton « Générer le PDF » en ligne.

## Commandes
```bash
npm install      # 24 paquets
npm run serve    # local complet sur http://localhost:5173
npm run check    # tests du moteur (rapides, sans Chrome)
npm run test:api # génère out/test-api.pdf avec le Chrome installé
npm run test:ui  # smoke test de l'éditeur (Chrome + http.server)
```
