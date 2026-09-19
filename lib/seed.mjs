// Contenu initial : la lettre DIGITALEO validée (12 septembre 2026).
export const SEED_LETTER = {
  meta: { title: "LM DIGITALEO", createdAt: "2026-09-12" },
  expediteur: {
    nom: "RAFALIMANANA Yannick Etan",
    adresse: "Andranomena, Antananarivo",
    tel: "+261 34 292 83 55",
    email: "rafalimananayannicketan@gmail.com",
    site: "https://rafalimananayannicketan.vercel.app/",
  },
  destinataire: ["À l'attention du service recrutement", "Agence DIGITALEO", "Antananarivo"],
  lieuDate: "À Antananarivo, le 12 septembre 2026",
  objet: "Objet : Candidature au poste de Chargé de Communication Digitale (SEO / SEA)",
  salutation: "Madame, Monsieur,",
  paragraphes: [
    {
      label: "intro",
      text: "Je termine cette année un Master 2 Marketing Digital en parallèle d'une formation d'ingénieur en traitement de données, et je souhaite aujourd'hui faire du référencement mon métier. C'est ce qui motive ma candidature au poste de chargé de communication digitale au sein de DIGITALEO.",
    },
    {
      label: "projet SEO",
      text: "J'ai réalisé cette année une stratégie SEO complète de repositionnement organique pour un site qui perdait de la visibilité. L'audit technique a été mené avec Screaming Frog et PageSpeed Insights, puis j'ai relié mes constats aux données de Google Search Console pour repérer les requêtes de deuxième page, les plus faciles à faire progresser. La partie sémantique s'est appuyée sur Ubersuggest et AnswerThePublic, avant l'élaboration d'un plan de contenu priorisé et d'une stratégie de netlinking. Ce travail m'a surtout appris qu'une analyse ne vaut que par les recommandations concrètes qui la suivent et par un suivi des résultats dans la durée.",
    },
    {
      label: "technique & data",
      text: "Je code moi-même mes sites en HTML, CSS et React, ce qui me permet d'appliquer directement les optimisations que je recommande. Le site vitrine que j'ai réalisé pour Laka Madagascar est d'ailleurs en ligne et indexé sur Google, ce que je vérifie régulièrement dans Google Search Console. Mon expérience en analyse de données (Python, Power BI) m'a aussi habitué à travailler les chiffres avec rigueur et à rédiger des rapports clairs. En publicité en ligne, j'ai déjà pratiqué le boost de publications Facebook, mais pas encore la gestion complète de campagnes Google Ads ou Meta en autonomie.",
    },
    {
      label: "pourquoi DIGITALEO",
      text: "Si je me tourne vers DIGITALEO, c'est parce que votre agence crée elle-même les sites de ses clients et que le référencement fait vraiment partie de votre cœur de métier. C'est aussi dans une équipe expérimentée comme la vôtre que j'apprendrai le plus vite, en commençant par contribuer sur ce que je maîtrise déjà.",
    },
    {
      label: "disponibilité",
      text: "Installé à Antananarivo, je recherche un CDI dans lequel je pourrai m'inscrire durablement. Je me tiens à votre entière disposition pour un entretien au cours duquel je pourrai vous présenter mon projet SEO plus en détail.",
    },
    {
      label: "formule finale",
      text: "Dans l'attente de votre retour, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.",
    },
  ],
  signature: "Yannick Etan RAFALIMANANA",
};

export function blankLetter(title = "Nouvelle lettre") {
  const d = JSON.parse(JSON.stringify(SEED_LETTER));
  d.meta = { title, createdAt: new Date().toISOString().slice(0, 10) };
  d.objet = "Objet : Candidature au poste de …";
  d.destinataire = ["À l'attention du service recrutement", "Nom de l'entreprise", "Ville"];
  d.paragraphes = d.paragraphes.map((p) => ({ ...p, text: "" })).slice(0, 4);
  return d;
}
