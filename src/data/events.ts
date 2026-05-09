// Événements de Phase Vie — 30 répartis en 3 phases (Enfance, Adolescence, Adulte)
// Le système tire 1 événement aléatoire par phase (3 totaux par run)
// pour que chaque run soit différente.

export type Axis =
  | "Orgueil" | "Avarice" | "Luxure" | "Envie" | "Gourmandise" | "Colere" | "Paresse"
  | "Foi" | "Esperance" | "Charite" | "Prudence" | "Justice" | "Force" | "Temperance";

export const ALL_AXES: Axis[] = [
  "Orgueil", "Avarice", "Luxure", "Envie", "Gourmandise", "Colere", "Paresse",
  "Foi", "Esperance", "Charite", "Prudence", "Justice", "Force", "Temperance",
];

export const SINS: Axis[] = ["Orgueil", "Avarice", "Luxure", "Envie", "Gourmandise", "Colere", "Paresse"];
export const VIRTUES: Axis[] = ["Foi", "Esperance", "Charite", "Prudence", "Justice", "Force", "Temperance"];

export type Phase = "Enfance" | "Adolescence" | "AgeAdulte";

export interface OptionEvent {
  text: string;
  deltas: Partial<Record<Axis, number>>;
}

export interface LifeEvent {
  code: string;
  phase: Phase;
  trame: string;
  options: OptionEvent[];
}

export const LIFE_EVENTS: LifeEvent[] = [
  // ============== ENFANCE (10) ==============
  {
    code: "ENF-01", phase: "Enfance",
    trame: "Tu as 7 ans. Tu casses un objet précieux de ta mère. Personne n'a vu. Elle entre dans la pièce.",
    options: [
      { text: "Avouer immédiatement.", deltas: { Foi: +10, Justice: +8 } },
      { text: "Mentir et accuser un frère.", deltas: { Colere: +8, Foi: -8 } },
      { text: "Pleurer sans rien dire.", deltas: { Paresse: +6, Temperance: +4 } },
      { text: "Cacher l'objet.", deltas: { Luxure: +6, Foi: -6 } },
    ],
  },
  {
    code: "ENF-02", phase: "Enfance",
    trame: "Dans la cour de récré, on désigne un autre enfant que tu dois rejeter du groupe.",
    options: [
      { text: "Refuser et aller jouer avec lui.", deltas: { Charite: +12, Force: +6 } },
      { text: "Faire semblant de l'exclure.", deltas: { Prudence: +8, Charite: +4 } },
      { text: "L'humilier pour t'imposer.", deltas: { Orgueil: +10, Charite: -8 } },
      { text: "L'éviter sans choisir.", deltas: { Paresse: +8 } },
    ],
  },
  {
    code: "ENF-03", phase: "Enfance",
    trame: "Quelqu'un que tu aimes — un grand-parent — tombe malade. Les adultes te tiennent à distance.",
    options: [
      { text: "Forcer pour aller le voir.", deltas: { Charite: +10, Force: +6 } },
      { text: "Lui écrire ou dessiner.", deltas: { Charite: +8, Esperance: +6 } },
      { text: "Te détourner par peur.", deltas: { Paresse: +6, Charite: -4 } },
      { text: "Te taire et observer.", deltas: { Temperance: +8, Foi: +4 } },
    ],
  },
  {
    code: "ENF-04", phase: "Enfance",
    trame: "Tu reçois un cadeau qui te déçoit profondément, devant celui qui te l'a offert.",
    options: [
      { text: "Sourire et remercier vraiment.", deltas: { Charite: +10, Temperance: +6 } },
      { text: "Sourire mais ranger sans rien.", deltas: { Temperance: +8 } },
      { text: "Dire ta déception franchement.", deltas: { Foi: +6, Charite: -6 } },
      { text: "Bouder.", deltas: { Orgueil: +10, Colere: +4 } },
    ],
  },
  {
    code: "ENF-05", phase: "Enfance",
    trame: "Tu apprends la mort d'un proche. Les adultes te disent qu'il \"est parti\".",
    options: [
      { text: "Pleurer à voix haute.", deltas: { Temperance: +8, Charite: +4 } },
      { text: "Rester silencieux.", deltas: { Force: +6, Paresse: +4 } },
      { text: "Demander pourquoi sans cesse.", deltas: { Foi: +8 } },
      { text: "Faire comme si rien.", deltas: { Paresse: +10, Temperance: -6 } },
    ],
  },
  {
    code: "ENF-06", phase: "Enfance",
    trame: "Tu trouves un porte-monnaie dans la rue. Il y a beaucoup d'argent.",
    options: [
      { text: "Le rapporter au commissariat.", deltas: { Justice: +12, Foi: +6 } },
      { text: "Le garder en secret.", deltas: { Avarice: +10, Foi: -8 } },
      { text: "Acheter des bonbons puis le rendre vide.", deltas: { Avarice: +6, Justice: -4 } },
      { text: "Le donner à un mendiant.", deltas: { Charite: +10 } },
    ],
  },
  {
    code: "ENF-07", phase: "Enfance",
    trame: "Ta mère te demande de mentir au téléphone à quelqu'un.",
    options: [
      { text: "Mentir comme demandé.", deltas: { Charite: +6, Foi: -8 } },
      { text: "Refuser net.", deltas: { Justice: +10, Foi: +6 } },
      { text: "Donner le téléphone à ta mère sans répondre.", deltas: { Prudence: +10 } },
      { text: "Mentir mais en pleurant.", deltas: { Foi: -4, Temperance: +4 } },
    ],
  },
  {
    code: "ENF-08", phase: "Enfance",
    trame: "Un ami te raconte un secret terrible qu'il vit à la maison.",
    options: [
      { text: "Le dire à un adulte de confiance.", deltas: { Charite: +10, Justice: +6 } },
      { text: "Garder le secret comme promis.", deltas: { Foi: +10, Charite: -4 } },
      { text: "Lui conseiller de parler.", deltas: { Prudence: +8, Charite: +4 } },
      { text: "Faire semblant de ne pas avoir entendu.", deltas: { Paresse: +12, Charite: -8 } },
    ],
  },
  {
    code: "ENF-09", phase: "Enfance",
    trame: "Tu es premier en classe. La maîtresse te le dit fort, devant les autres.",
    options: [
      { text: "Sourire fier.", deltas: { Orgueil: +10 } },
      { text: "Aller aider les derniers.", deltas: { Charite: +12, Force: +4 } },
      { text: "Détourner le regard, gêné.", deltas: { Temperance: +6 } },
      { text: "Dire que tu as triché.", deltas: { Foi: +8, Temperance: +4 } },
    ],
  },
  {
    code: "ENF-10", phase: "Enfance",
    trame: "Un animal blessé sur le bord de la route. Personne autour.",
    options: [
      { text: "Le prendre dans tes bras pour l'aider.", deltas: { Charite: +12, Force: +4 } },
      { text: "Aller chercher un adulte.", deltas: { Prudence: +8, Charite: +6 } },
      { text: "Continuer ton chemin.", deltas: { Paresse: +8 } },
      { text: "Lui tirer dessus avec un caillou.", deltas: { Colere: +12, Charite: -10 } },
    ],
  },

  // ============== ADOLESCENCE (10) ==============
  {
    code: "ADO-01", phase: "Adolescence",
    trame: "Quelqu'un te déclare son amour. Tu sens son fragilité.",
    options: [
      { text: "Dire oui sans réfléchir.", deltas: { Luxure: +12, Prudence: -6 } },
      { text: "Refuser pour le protéger.", deltas: { Charite: +10, Temperance: +6 } },
      { text: "Accepter \"à voir\".", deltas: { Luxure: +8, Paresse: +4 } },
      { text: "Différer en honnêteté.", deltas: { Prudence: +8, Foi: +6 } },
    ],
  },
  {
    code: "ADO-02", phase: "Adolescence",
    trame: "À la soirée, on te tend ta première cigarette. Ton groupe regarde.",
    options: [
      { text: "Refuser sereinement.", deltas: { Force: +8, Temperance: +6 } },
      { text: "L'accepter pour faire comme eux.", deltas: { Paresse: +6, Foi: -4 } },
      { text: "Dire \"je verrai plus tard\".", deltas: { Prudence: +6 } },
      { text: "L'allumer fier.", deltas: { Orgueil: +8, Luxure: +4 } },
    ],
  },
  {
    code: "ADO-03", phase: "Adolescence",
    trame: "Tu vois un camarade être harcelé dans le couloir.",
    options: [
      { text: "Intervenir physiquement.", deltas: { Force: +10, Justice: +8 } },
      { text: "Aller chercher un prof.", deltas: { Prudence: +6, Charite: +6 } },
      { text: "Filmer pour les réseaux.", deltas: { Envie: +10, Charite: -8 } },
      { text: "Détourner le regard.", deltas: { Paresse: +10, Justice: -6 } },
    ],
  },
  {
    code: "ADO-04", phase: "Adolescence",
    trame: "Examen important. Tu as l'occasion de tricher sans risque.",
    options: [
      { text: "Tricher sans hésiter.", deltas: { Avarice: +6, Foi: -8 } },
      { text: "Refuser net.", deltas: { Justice: +10, Foi: +8 } },
      { text: "Aider un ami à tricher mais pas toi.", deltas: { Charite: +6, Foi: -2 } },
      { text: "Faire semblant de tricher pour ne pas être marginal.", deltas: { Paresse: +6, Foi: -4 } },
    ],
  },
  {
    code: "ADO-05", phase: "Adolescence",
    trame: "Tes parents se disputent violemment. Ta sœur plus jeune pleure dans la chambre.",
    options: [
      { text: "Aller la consoler.", deltas: { Charite: +12, Force: +4 } },
      { text: "Crier sur tes parents.", deltas: { Colere: +10, Justice: +4 } },
      { text: "Mettre la musique fort.", deltas: { Paresse: +10 } },
      { text: "Sortir de la maison.", deltas: { Force: +6, Paresse: +4 } },
    ],
  },
  {
    code: "ADO-06", phase: "Adolescence",
    trame: "Premier baiser. La personne te plaît, mais ton meilleur ami l'aime aussi.",
    options: [
      { text: "Accepter le baiser.", deltas: { Luxure: +10, Foi: -6 } },
      { text: "Refuser pour ton ami.", deltas: { Charite: +10, Foi: +6 } },
      { text: "Accepter mais ne rien dire.", deltas: { Luxure: +8, Foi: -10 } },
      { text: "En parler avec ton ami avant.", deltas: { Foi: +12, Prudence: +6 } },
    ],
  },
  {
    code: "ADO-07", phase: "Adolescence",
    trame: "Tu reçois une bourse importante. Un ami plus pauvre que toi en avait besoin aussi.",
    options: [
      { text: "L'accepter sans culpabilité.", deltas: { Avarice: +6, Justice: +4 } },
      { text: "L'accepter et lui en donner une part.", deltas: { Charite: +12 } },
      { text: "La refuser pour qu'il l'ait.", deltas: { Charite: +14, Force: +6 } },
      { text: "L'accepter en cachette.", deltas: { Avarice: +10, Foi: -6 } },
    ],
  },
  {
    code: "ADO-08", phase: "Adolescence",
    trame: "On te propose des drogues à une fête. Le groupe attend.",
    options: [
      { text: "Refuser et partir.", deltas: { Force: +8, Temperance: +8 } },
      { text: "Accepter par curiosité.", deltas: { Luxure: +6, Foi: -4 } },
      { text: "Faire semblant et jeter discrètement.", deltas: { Prudence: +10 } },
      { text: "Accepter pour faire le malin.", deltas: { Orgueil: +8, Luxure: +4 } },
    ],
  },
  {
    code: "ADO-09", phase: "Adolescence",
    trame: "Ton père perd son emploi. La maison est tendue.",
    options: [
      { text: "Lui parler longuement.", deltas: { Charite: +10, Foi: +6 } },
      { text: "Travailler en secret pour aider.", deltas: { Force: +10, Charite: +8 } },
      { text: "Te faire le plus discret possible.", deltas: { Prudence: +6, Paresse: +4 } },
      { text: "L'éviter, c'est trop pesant.", deltas: { Paresse: +10, Charite: -6 } },
    ],
  },
  {
    code: "ADO-10", phase: "Adolescence",
    trame: "Un prof injuste t'humilie devant la classe.",
    options: [
      { text: "Te défendre fermement.", deltas: { Force: +10, Justice: +8 } },
      { text: "Encaisser en silence.", deltas: { Temperance: +8, Paresse: +4 } },
      { text: "Pleurer.", deltas: { Foi: -4 } },
      { text: "Saboter sa voiture.", deltas: { Colere: +12, Justice: -8 } },
    ],
  },

  // ============== ÂGE ADULTE (10) ==============
  {
    code: "ADU-01", phase: "AgeAdulte",
    trame: "Tu rencontres quelqu'un qui te ressemble profondément. Tu es marié(e) avec enfants.",
    options: [
      { text: "Couper net.", deltas: { Temperance: +12, Foi: +8 } },
      { text: "Maintenir une amitié distante.", deltas: { Temperance: +6, Prudence: +6 } },
      { text: "Avoir une aventure brève.", deltas: { Luxure: +14, Foi: -8 } },
      { text: "Tout quitter pour cette personne.", deltas: { Luxure: +16, Charite: -10 } },
    ],
  },
  {
    code: "ADU-02", phase: "AgeAdulte",
    trame: "Promotion. Pour l'avoir, tu dois saboter discrètement un collègue.",
    options: [
      { text: "Refuser et travailler plus dur.", deltas: { Force: +12, Foi: +8 } },
      { text: "Le saboter sans pitié.", deltas: { Envie: +14, Foi: -10 } },
      { text: "Démissionner.", deltas: { Force: +8, Orgueil: +6 } },
      { text: "Accepter en culpabilisant.", deltas: { Avarice: +8, Foi: -6 } },
    ],
  },
  {
    code: "ADU-03", phase: "AgeAdulte",
    trame: "Tu apprends que ton entreprise pollue gravement. Tu peux dénoncer ou te taire.",
    options: [
      { text: "Dénoncer publiquement.", deltas: { Justice: +14, Force: +8 } },
      { text: "Démissionner sans rien dire.", deltas: { Prudence: +6, Force: +4 } },
      { text: "Te taire pour le confort.", deltas: { Paresse: +10, Justice: -8 } },
      { text: "Faire pression interne.", deltas: { Justice: +8, Prudence: +6 } },
    ],
  },
  {
    code: "ADU-04", phase: "AgeAdulte",
    trame: "Ton partenaire te demande pardon pour une trahison passée que tu ignorais.",
    options: [
      { text: "Pardonner immédiatement.", deltas: { Charite: +12, Foi: +8 } },
      { text: "Rompre.", deltas: { Force: +8, Foi: +4 } },
      { text: "Pardonner mais avec colère sourde.", deltas: { Colere: +8 } },
      { text: "Demander du temps.", deltas: { Prudence: +10, Temperance: +4 } },
    ],
  },
  {
    code: "ADU-05", phase: "AgeAdulte",
    trame: "Ton enfant adolescent fait une bêtise grave. Le directeur t'appelle.",
    options: [
      { text: "Le défendre absolument.", deltas: { Charite: +10 } },
      { text: "Accepter les sanctions et lui parler.", deltas: { Justice: +8, Charite: +6 } },
      { text: "Le rejeter, c'est trop.", deltas: { Charite: -10, Colere: +8 } },
      { text: "Payer pour étouffer.", deltas: { Avarice: +10, Justice: -6 } },
    ],
  },
  {
    code: "ADU-06", phase: "AgeAdulte",
    trame: "Maladie longue d'un parent. Plusieurs années de soins à donner.",
    options: [
      { text: "L'accueillir chez toi.", deltas: { Charite: +14, Force: +8 } },
      { text: "Payer une aide à domicile.", deltas: { Avarice: -2, Prudence: +8 } },
      { text: "Visiter sans déménager.", deltas: { Charite: +6, Temperance: +4 } },
      { text: "Te défausser sur tes frères.", deltas: { Paresse: +10, Charite: -8 } },
    ],
  },
  {
    code: "ADU-07", phase: "AgeAdulte",
    trame: "Crise économique. Toi tu as encore ton emploi. Un voisin proche est ruiné.",
    options: [
      { text: "Lui prêter sans conditions.", deltas: { Charite: +12 } },
      { text: "Lui prêter avec un contrat.", deltas: { Prudence: +8, Charite: +4 } },
      { text: "Refuser.", deltas: { Avarice: +10, Charite: -6 } },
      { text: "Lui offrir tout ce que tu as.", deltas: { Charite: +16, Force: +8 } },
    ],
  },
  {
    code: "ADU-08", phase: "AgeAdulte",
    trame: "Une cause à laquelle tu crois échoue après des années d'engagement.",
    options: [
      { text: "Persister envers et contre tout.", deltas: { Foi: +12, Force: +8 } },
      { text: "Lâcher dans le silence.", deltas: { Paresse: +10, Foi: -6 } },
      { text: "Continuer mais accepter de perdre.", deltas: { Esperance: +10, Temperance: +6 } },
      { text: "Devenir cynique militant.", deltas: { Colere: +8, Orgueil: +6 } },
    ],
  },
  {
    code: "ADU-09", phase: "AgeAdulte",
    trame: "À 45 ans, tu peux te reconvertir. Voie passion mais beaucoup moins d'argent.",
    options: [
      { text: "Sauter le pas.", deltas: { Foi: +10, Force: +8 } },
      { text: "Préparer en parallèle 2 ans.", deltas: { Prudence: +10 } },
      { text: "Renoncer pour la stabilité.", deltas: { Avarice: +6, Prudence: +4 } },
      { text: "Envier en silence.", deltas: { Envie: +10, Paresse: +4 } },
    ],
  },
  {
    code: "ADU-10", phase: "AgeAdulte",
    trame: "On te propose de mener une campagne d'aide aux sans-abri dans ta ville.",
    options: [
      { text: "Accepter et mener.", deltas: { Force: +10, Charite: +10 } },
      { text: "Aider sans diriger.", deltas: { Charite: +10, Temperance: +6 } },
      { text: "Refuser, pas mon rôle.", deltas: { Paresse: +8 } },
      { text: "Accepter pour la visibilité.", deltas: { Orgueil: +10, Envie: +6 } },
    ],
  },
];

// Tirer 3 événements aléatoires (1 par phase) — 3.10
export function pickRandomLifeEvents(): LifeEvent[] {
  const byPhase: Record<Phase, LifeEvent[]> = {
    Enfance: LIFE_EVENTS.filter((e) => e.phase === "Enfance"),
    Adolescence: LIFE_EVENTS.filter((e) => e.phase === "Adolescence"),
    AgeAdulte: LIFE_EVENTS.filter((e) => e.phase === "AgeAdulte"),
  };
  const phases: Phase[] = ["Enfance", "Adolescence", "AgeAdulte"];
  return phases.map((p) => {
    const pool = byPhase[p];
    return pool[Math.floor(Math.random() * pool.length)];
  });
}
