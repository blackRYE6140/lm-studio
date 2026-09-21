// Contenu initial : lettre adaptée au profil d'Andry RAKOTO.
export const SEED_LETTER = {
  meta: { title: "LM Andry RAKOTO", createdAt: "2026-09-21" },
  expediteur: {
    nom: "Andry RAKOTO",
    adresse: "Antananarivo",
    tel: "+261 34 00 000 00",
    email: "andry.rakoto@exemple.mg",
    site: "https://andryrakoto.dev",
    github: "https://github.com/andryrakoto",
    linkedin: "https://linkedin.com/in/andryrakoto",
  },
  destinataire: ["À l'attention du service recrutement", "Votre entreprise", "Antananarivo"],
  lieuDate: "À Antananarivo, le 21 septembre 2026",
  objet: "Objet : Candidature au poste de Développeur Full Stack",
  salutation: "Madame, Monsieur,",
  paragraphes: [
    {
      label: "intro",
      text: "Développeur full stack avec cinq ans d'expérience, je conçois des produits web rapides, testés et maintenables, des interfaces React aux API Node.js, en passant par les bases de données et le déploiement cloud. Je souhaite mettre cette expérience au service de votre équipe en tant que Développeur Full Stack.",
    },
    {
      label: "expérience full stack",
      text: "Chez TechCorp, j'ai développé une application SaaS utilisée par 12 000 utilisateurs avec React, Node.js et PostgreSQL. J'ai également réduit de 45 % le temps de chargement des pages grâce à l'optimisation des requêtes, au cache et au lazy loading. Ces réalisations illustrent ma capacité à intervenir sur l'ensemble de la chaîne technique et à mesurer concrètement l'impact de mes choix.",
    },
    {
      label: "frontend & qualité",
      text: "Lors de mon expérience chez Agence Digitale Nova, j'ai construit plus de 20 interfaces React pour des clients e-commerce et bancaires, puis mis en place une bibliothèque de composants documentée avec Storybook et adoptée par trois équipes. Je m'appuie sur TypeScript, Next.js, HTML, CSS et Tailwind, ainsi que sur Jest et Playwright pour livrer des interfaces fiables.",
    },
    {
      label: "backend & projets",
      text: "J'ai aussi créé une API REST Node.js/Express et un tableau de bord d'administration chez StartUp Labs, ainsi qu'une application complète de gestion de bibliothèque avec React et Firebase. Mes compétences en Python, Django, PostgreSQL, MongoDB, Git, Docker et CI/CD me permettent de contribuer efficacement aux décisions d'architecture comme au développement quotidien.",
    },
    {
      label: "formation & motivation",
      text: "Titulaire d'un Master Informatique - Génie Logiciel de l'Université d'Antananarivo, je travaille avec une approche Agile Scrum et une attention particulière portée à la maintenabilité. Je serais heureux d'échanger avec vous sur vos projets et sur la manière dont je pourrais contribuer à leur réussite.",
    },
    {
      label: "formule finale",
      text: "Dans l'attente de votre retour, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.",
    },
  ],
  signature: "Andry RAKOTO",
};

export function blankLetter(title = "Nouvelle lettre") {
  const d = JSON.parse(JSON.stringify(SEED_LETTER));
  d.meta = { title, createdAt: new Date().toISOString().slice(0, 10) };
  d.objet = "Objet : Candidature au poste de …";
  d.destinataire = ["À l'attention du service recrutement", "Nom de l'entreprise", "Ville"];
  d.paragraphes = d.paragraphes.map((p) => ({ ...p, text: "" })).slice(0, 4);
  return d;
}
