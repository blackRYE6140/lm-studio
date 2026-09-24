// lm-studio — logique de l'éditeur. State = JSON unique, rendu = lib/render.mjs partagé.
import { renderLetterDoc, guards } from "./lib/render.mjs";
import { SEED_LETTER, blankLetter } from "./lib/seed.mjs";

const KEY = "lm-studio:v1";
const $ = (s) => document.querySelector(s);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js?v=4", { updateViaCache: "none" }).then((registration) => registration.update()).catch(() => {}));
}

let deferredInstallPrompt = null;
const isAndroid = /Android/i.test(navigator.userAgent);
const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
const installBanner = () => $("#pwa-install-banner");
const showInstallBanner = () => {
  if (!isAndroid || isStandalone() || localStorage.getItem("lm-studio:pwa-install-dismissed")) return;
  installBanner().hidden = false;
};
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  showInstallBanner();
});
window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  installBanner().hidden = true;
});
window.addEventListener("load", () => {
  if (isAndroid && !isStandalone()) setTimeout(showInstallBanner, 1500);
});
document.addEventListener("click", async (event) => {
  if (event.target.closest("#pwa-install-close")) {
    installBanner().hidden = true;
    localStorage.setItem("lm-studio:pwa-install-dismissed", "1");
    return;
  }
  if (!event.target.closest("#pwa-install")) return;
  if (!deferredInstallPrompt) {
    $("#status").textContent = "Utilise le menu du navigateur, puis « Ajouter à l'écran d'accueil ».";
    return;
  }
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installBanner().hidden = true;
});

const topbar = document.querySelector(".topbar");
const mobileMenu = document.querySelector("#mobile-tools");
const mobileMenuToggle = document.querySelector("#mobile-menu-toggle");
const closeMobileMenu = () => {
  topbar.classList.remove("menu-open");
  mobileMenuToggle.setAttribute("aria-expanded", "false");
  mobileMenuToggle.setAttribute("aria-label", "Afficher les outils");
};
document.addEventListener("pointerdown", (event) => {
  if (topbar.classList.contains("menu-open") && !topbar.contains(event.target)) closeMobileMenu();
});
document.addEventListener("click", (event) => {
  const toggle = event.target.closest("#mobile-menu-toggle");
  if (toggle) {
    const open = topbar.classList.toggle("menu-open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Masquer les outils" : "Afficher les outils");
    return;
  }
  if (topbar.classList.contains("menu-open") && (!mobileMenu.contains(event.target) || event.target.closest("button, a"))) closeMobileMenu();
});

const scrollJump = $("#scroll-jump");
const mobileFormToggle = $("#mobile-form-toggle");
const layout = $(".layout");
const topTemplateSelect = $("#template-select-top");

function syncModelChips() {
  const current = $("#template-select").value || "A";
  topTemplateSelect.value = current;
}

topTemplateSelect.addEventListener("change", (event) => {
  $("#template-select").value = event.target.value;
  $("#template-select").dispatchEvent(new Event("change", { bubbles: true }));
});

const updateScrollJump = () => {
  const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 80;
  const goTop = window.scrollY > 80 || atBottom;
  scrollJump.textContent = goTop ? "↑" : "↓";
  scrollJump.setAttribute("aria-label", goTop ? "Revenir en haut" : "Aller en bas");
  scrollJump.title = goTop ? "Revenir en haut" : "Aller en bas";
};

const syncMobileFormToggle = () => {
  const collapsed = layout.classList.contains("editor-collapsed");
  topbar.classList.toggle("form-collapsed", collapsed);
  mobileFormToggle.textContent = collapsed ? "✎" : "✕";
  mobileFormToggle.setAttribute("aria-expanded", String(!collapsed));
  mobileFormToggle.setAttribute("aria-label", collapsed ? "Afficher le formulaire" : "Masquer le formulaire");
  mobileFormToggle.title = collapsed ? "Afficher le formulaire" : "Masquer le formulaire";
};

mobileFormToggle.addEventListener("click", () => {
  const collapsed = layout.classList.toggle("editor-collapsed");
  syncMobileFormToggle();
  if (!collapsed) {
    document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
  }
});

scrollJump.addEventListener("click", () => {
  const goTop = window.scrollY > 80 || window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 80;
  window.scrollTo({ top: goTop ? 0 : document.documentElement.scrollHeight, behavior: "smooth" });
});
addEventListener("scroll", updateScrollJump, { passive: true });
addEventListener("resize", updateScrollJump);
addEventListener("load", () => {
  updateScrollJump();
  syncMobileFormToggle();
});

// ---------- état global ----------
let store = load();
function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (raw && Array.isArray(raw.docs) && raw.docs.length) return raw;
  } catch {}
  return {
    docs: [{ id: uid(), title: SEED_LETTER.meta.title, updatedAt: Date.now(), data: structuredClone(SEED_LETTER) }],
    currentId: null,
  };
}
let currentId = store.currentId || store.docs[0].id;
const cur = () => store.docs.find((d) => d.id === currentId);

function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
let saveTimer;
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const d = cur(); d.updatedAt = Date.now(); d.data.meta.title = d.title;
    store.currentId = currentId;
    localStorage.setItem(KEY, JSON.stringify(store));
    $("#save-state").textContent = "enregistré ✓ " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }, 400);
}

// ---------- accès par chemin ("expediteur.tel", "paragraphes.2.text") ----------
function getPath(o, p) { return p.split(".").reduce((x, k) => (x == null ? x : Array.isArray(x) ? x[+k] : x[k]), o); }
function setPath(o, p, v) {
  const ks = p.split("."); const last = ks.pop();
  let t = o; for (const k of ks) t = Array.isArray(t) ? (t[+k] ??= {}) : (t[k] ??= {});
  t[last] = v;
}

// ---------- rendu du formulaire ----------
function fillForm() {
  const d = cur();
  $("#template-select").value = d.data.template || "A";
  syncModelChips();
  $("#doc-select").innerHTML = store.docs.map(x =>
    `<option value="${x.id}"${x.id === currentId ? " selected" : ""}>${esc(x.title)}</option>`).join("");
  $("#doc-title").value = d.title;

  document.querySelectorAll("[data-bind]").forEach((el) => {
    const path = el.dataset.bind;
    if (path === "destinataireLines") el.value = getPath(d.data, "destinataire").join("\n");
    else el.value = getPath(d.data, path) ?? "";
  });
  renderParagraphes();
  renderWarnings(d.data);
  renderPreview();
}

$("#template-select").addEventListener("change", (event) => {
  cur().data.template = event.target.value;
  scheduleSave();
  renderPreview();
  syncModelChips();
});

function renderParagraphes() {
  const ps = cur().data.paragraphes;
  const wrap = $("#paragraphes");
  wrap.innerHTML = "";
  ps.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "para-row";
    row.innerHTML = `
      <div class="para-head">
        <input value="${esc(p.label || "")}" data-para="${i}.label" placeholder="rôle du paragraphe (intro, SEO…)">
        <span class="wc">${wordCount(p.text)} mots</span>
        <span class="move">
          <button data-act="up" data-i="${i}" ${i === 0 ? "disabled" : ""} title="Monter">↑</button>
          <button data-act="down" data-i="${i}" ${i === ps.length - 1 ? "disabled" : ""} title="Descendre">↓</button>
          <button data-act="del" data-i="${i}" title="Supprimer">✕</button>
        </span>
      </div>
      <textarea data-para="${i}.text">${esc(p.text)}</textarea>`;
    wrap.appendChild(row);
  });
  $("#para-count").textContent = `(${ps.length}) — total ${ps.reduce((n, p) => n + wordCount(p.text), 0)} mots`;
}
const wordCount = (s) => (String(s).trim().match(/\S+/g) || []).length;
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

function renderWarnings(data) {
  const { warnings } = guards(structuredClone(data));
  $("#warnings").innerHTML = warnings.map((w) => `<span>⚠ ${esc(w)}</span>`).join("");
}

// ---------- aperçu A4 ----------
function renderPreview() {
  const html = renderLetterDoc(cur().data, { preview: true });
  const fr = $("#apercu").contentDocument;
  fr.open(); fr.write(html); fr.close();
  requestAnimationFrame(() => {
    const h = Math.max(fr.body.scrollHeight + 40, 1123);
    $("#apercu").style.height = h + "px";
    fitPreview();
  });
}
function fitPreview() {
  const panel = $(".preview-panel");
  const baseWidth = 794;
  const available = Math.max(220, panel.clientWidth - 12);
  const scale = Math.min(1, available / baseWidth);
  const el = $("#apercu");
  el.style.width = `${baseWidth}px`;
  el.style.maxWidth = "none";
  el.style.transform = `scale(${scale})`;
  el.parentElement.style.height = `${Math.max(320, Math.ceil(el.offsetHeight * scale))}px`;
}
addEventListener("resize", () => { fitPreview(); });

// ---------- liaison des entrées ----------
document.addEventListener("input", (e) => {
  const t = e.target;
  const d = cur().data;
  if (t.id === "doc-title") { cur().title = t.value; syncSelect(); scheduleSave(); return; }
  if (t.dataset.bind) {
    const p = t.dataset.bind;
    if (p === "destinataireLines") setPath(d, "destinataire", t.value.split("\n"));
    else setPath(d, p, t.value);
  } else if (t.dataset.para) {
    setPath(d, "paragraphes." + t.dataset.para, t.value);
    if (t.dataset.para.endsWith(".text")) {
      const wc = t.closest(".para-row").querySelector(".wc");
      if (wc) wc.textContent = wordCount(t.value) + " mots";
      $("#para-count").textContent = `(${d.paragraphes.length}) — total ${d.paragraphes.reduce((n, x) => n + wordCount(x.text), 0)} mots`;
    }
  } else return;
  renderWarnings(d);
  scheduleSave();
  debouncedPreview();
});
let pvTimer;
function debouncedPreview() { clearTimeout(pvTimer); pvTimer = setTimeout(renderPreview, 350); }
function syncSelect() {
  const opt = $(`#doc-select option[value="${currentId}"]`);
  if (opt) opt.textContent = cur().title;
}

// paragraphes : réorganisation / suppression / ajout (délégation sur clic)
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  const ps = cur().data.paragraphes; const i = +b.dataset.i;
  if (b.dataset.act === "del") { if (confirm("Supprimer ce paragraphe ?")) ps.splice(i, 1); }
  if (b.dataset.act === "up" && i > 0) [ps[i - 1], ps[i]] = [ps[i], ps[i - 1]];
  if (b.dataset.act === "down" && i < ps.length - 1) [ps[i + 1], ps[i]] = [ps[i], ps[i + 1]];
  renderParagraphes(); renderWarnings(cur().data); scheduleSave(); renderPreview();
});

$("#btn-add-para").addEventListener("click", () => {
  cur().data.paragraphes.push({ label: "", text: "" });
  renderParagraphes(); scheduleSave(); renderPreview();
  const rows = document.querySelectorAll(".para-row textarea");
  rows[rows.length - 1]?.focus();
});

$("#doc-select").addEventListener("change", (e) => { currentId = e.target.value; fillForm(); });

$("#btn-new").addEventListener("click", () => {
  const title = prompt("Titre de la nouvelle lettre :", "LM " + new Date().toLocaleDateString("fr-FR"));
  if (title === null) return;
  const doc = { id: uid(), title: title || "Sans titre", updatedAt: Date.now(), data: blankLetter(title) };
  store.docs.push(doc); currentId = doc.id; fillForm(); scheduleSave();
});
$("#btn-dup").addEventListener("click", () => {
  const d = cur();
  const copy = { id: uid(), title: d.title + " (copie)", updatedAt: Date.now(), data: structuredClone(d.data) };
  store.docs.push(copy); currentId = copy.id; fillForm(); scheduleSave();
});
$("#btn-del").addEventListener("click", () => {
  if (store.docs.length === 1) return alert("Il faut garder au moins une lettre.");
  if (!confirm("Supprimer définitivement cette lettre ?")) return;
  store.docs = store.docs.filter((x) => x.id !== currentId);
  currentId = store.docs[0].id; fillForm(); scheduleSave();
});

$("#btn-today").addEventListener("click", () => {
  const dt = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const input = document.querySelector('[data-bind="lieuDate"]');
  input.value = `À Antananarivo, le ${dt}`;
  cur().data.lieuDate = input.value; scheduleSave(); renderPreview();
});

// ---------- PDF serveur ----------
document.getElementById("btn-pdf-mobile").addEventListener("click", () => $("#btn-pdf").click());
document.getElementById("btn-print-mobile").addEventListener("click", () => $("#btn-print").click());
document.getElementById("btn-json-mobile").addEventListener("click", () => $("#btn-json").click());

$("#btn-pdf").addEventListener("click", async () => {
  const st = $("#status");
  st.textContent = "génération en cours…";
  try {
    const r = await fetch("api/pdf", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: cur().data, filename: cur().title }),
    });
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "HTTP " + r.status);
    const pages = r.headers.get("X-Pages") || "?";
    const blob = await r.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (cur().title.replace(/[\\/:*?"<>|]/g, "") || "lettre") + ".pdf";
    a.click(); URL.revokeObjectURL(a.href);
    st.textContent = `✓ PDF généré — ${pages} page(s), liens cliquables inclus.`;
  } catch (e) {
    st.innerHTML = `✗ ${esc(e.message)} — <em>pas de serveur ? ouvre cette page via « vercel dev » ou « vercel deploy », ou utilise 🖨 Imprimer.</em>`;
  }
});

// ---------- secours hors ligne : impression navigateur ----------
$("#btn-print").addEventListener("click", () => {
  const w = window.open("", "_blank");
  w.document.write(renderLetterDoc(cur().data));
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 400);
});

// ---------- export / import ----------
$("#btn-export").addEventListener("click", () => {
  download("lm-studio-documents.json", JSON.stringify(store, null, 2), "application/json");
});
$("#btn-json").addEventListener("click", () => {
  download("lm-contenu.json", JSON.stringify(cur().data, null, 2), "application/json");
});
$("#btn-import").addEventListener("click", () => $("#file-import").click());
$("#file-import").addEventListener("change", async (e) => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const j = JSON.parse(await f.text());
    if (j.docs && Array.isArray(j.docs)) {
      // fichier « tous documents » : fusion par id
      for (const d of j.docs) {
        const i = store.docs.findIndex((x) => x.id === d.id);
        if (i >= 0) store.docs[i] = d; else store.docs.push(d);
      }
    } else if (j.expediteur) {
      store.docs.push({ id: uid(), title: (j.meta && j.meta.title) || f.name, updatedAt: Date.now(), data: j });
      currentId = store.docs[store.docs.length - 1].id;
    } else throw new Error("structure non reconnue");
    fillForm(); scheduleSave(); $("#status").textContent = "✓ import réussi";
  } catch (err) { alert("Import impossible : " + err.message); }
  e.target.value = "";
});
function download(name, text, type) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name; a.click(); URL.revokeObjectURL(a.href);
}

// ---------- go ----------
fillForm();
