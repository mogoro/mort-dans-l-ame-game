// F.1 — 60 événements de Phase Vie (au lieu de 30)
// F.2 — branches narratives (events conditionnels selon code parent)
// F.3 — PNJ persistants (Marc, Sarah, Père)
// F.7 — choix avec délai (timed)
// F.8 — choix conditionnels (visible si axe > seuil)
// F.9 — conséquences long terme (event tag : impact ado/adulte)

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
  // F.2 — tag posé sur le profil quand cette option est choisie
  tag?: string;
  // F.9 — code event qu'on souhaite déclencher en priorité plus tard
  unlocks?: string;
  // F.8 — visible seulement si axe atteint un seuil
  requireAxis?: { axis: Axis; min?: number; max?: number };
  // F.3 — PNJ impacté
  npcImpact?: { id: string; deltaRelation: number; killed?: boolean };
  // F.6 — phrase qui marque le récit (sera utilisée dans la lettre de fin)
  memo?: string;
}

export interface LifeEvent {
  code: string;
  phase: Phase;
  trame: string;
  options: OptionEvent[];
  // F.7 — temps imparti en secondes (sinon paresse)
  timeoutSec?: number;
  // F.2 — n'apparaît que si tag présent dans les choix précédents
  requiresTag?: string;
  // F.2 — n'apparaît PAS si tag présent
  excludesTag?: string;
  // F.10 — PNJ associé qui peut apparaître au cercle
  npcId?: string;
}

// ============================================================================
// 60 événements
// ============================================================================
export const LIFE_EVENTS: LifeEvent[] = [
  // ============== ENFANCE (20) ==============
  {
    code: "ENF-01", phase: "Enfance",
    trame: "Tu as 7 ans. Tu casses un objet précieux de ta mère. Personne n'a vu. Elle entre dans la pièce.",
    options: [
      { text: "Avouer immédiatement.", deltas: { Foi: +10, Justice: +8 }, tag: "honnete-enf",
        memo: "À 7 ans, tu as choisi la vérité." },
      { text: "Mentir et accuser un frère.", deltas: { Colere: +8, Foi: -8 }, tag: "menteur-enf",
        memo: "À 7 ans, tu as menti et accusé un frère." },
      { text: "Pleurer sans rien dire.", deltas: { Paresse: +6, Temperance: +4 }, tag: "tu-de-enf" },
      { text: "Cacher l'objet.", deltas: { Luxure: +6, Foi: -6 }, tag: "rusé-enf" },
    ],
  },
  {
    code: "ENF-02", phase: "Enfance",
    trame: "Dans la cour de récré, on désigne un autre enfant que tu dois rejeter du groupe.",
    options: [
      { text: "Refuser et aller jouer avec lui.", deltas: { Charite: +12, Force: +6 }, tag: "courage-enf",
        npcImpact: { id: "marc", deltaRelation: +20 } },
      { text: "Faire semblant de l'exclure.", deltas: { Prudence: +8, Charite: +4 } },
      { text: "L'humilier pour t'imposer.", deltas: { Orgueil: +10, Charite: -8 }, tag: "cruel-enf",
        npcImpact: { id: "marc", deltaRelation: -30 } },
      { text: "L'éviter sans choisir.", deltas: { Paresse: +8 } },
    ],
  },
  {
    code: "ENF-03", phase: "Enfance",
    trame: "Quelqu'un que tu aimes — un grand-parent — tombe malade. Les adultes te tiennent à distance.",
    options: [
      { text: "Forcer pour aller le voir.", deltas: { Charite: +10, Force: +6 } },
      { text: "Lui écrire ou dessiner.", deltas: { Charite: +8, Esperance: +6 }, memo: "Tu lui as écrit une lettre." },
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
      { text: "Demander pourquoi sans cesse.", deltas: { Foi: +8 }, tag: "questionneur" },
      { text: "Faire comme si rien.", deltas: { Paresse: +10, Temperance: -6 } },
    ],
  },
  {
    code: "ENF-06", phase: "Enfance",
    trame: "Tu trouves un porte-monnaie dans la rue. Il y a beaucoup d'argent.",
    options: [
      { text: "Le rapporter au commissariat.", deltas: { Justice: +12, Foi: +6 }, tag: "honnete-enf" },
      { text: "Le garder en secret.", deltas: { Avarice: +10, Foi: -8 }, tag: "voleur-enf",
        memo: "Tu as gardé l'argent." },
      { text: "Acheter des bonbons puis le rendre vide.", deltas: { Avarice: +6, Justice: -4 } },
      { text: "Le donner à un mendiant.", deltas: { Charite: +10 } },
    ],
  },
  {
    code: "ENF-07", phase: "Enfance",
    trame: "Ta mère te demande de mentir au téléphone à quelqu'un.",
    options: [
      { text: "Mentir comme demandé.", deltas: { Charite: +6, Foi: -8 } },
      { text: "Refuser net.", deltas: { Justice: +10, Foi: +6 }, tag: "rebelle-enf" },
      { text: "Donner le téléphone à ta mère sans répondre.", deltas: { Prudence: +10 } },
      { text: "Mentir mais en pleurant.", deltas: { Foi: -4, Temperance: +4 } },
    ],
  },
  {
    code: "ENF-08", phase: "Enfance",
    trame: "Un ami te raconte un secret terrible qu'il vit à la maison.",
    options: [
      { text: "Le dire à un adulte de confiance.", deltas: { Charite: +10, Justice: +6 }, tag: "rapporteur",
        npcImpact: { id: "sarah", deltaRelation: -10 } },
      { text: "Garder le secret comme promis.", deltas: { Foi: +10, Charite: -4 }, tag: "fidele-enf",
        npcImpact: { id: "sarah", deltaRelation: +20 } },
      { text: "Lui conseiller de parler.", deltas: { Prudence: +8, Charite: +4 } },
      { text: "Faire semblant de ne pas avoir entendu.", deltas: { Paresse: +12, Charite: -8 } },
    ],
  },
  {
    code: "ENF-09", phase: "Enfance",
    trame: "Tu es premier en classe. La maîtresse te le dit fort, devant les autres.",
    options: [
      { text: "Sourire fier.", deltas: { Orgueil: +10 }, tag: "fier-enf" },
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
      { text: "Lui tirer dessus avec un caillou.", deltas: { Colere: +12, Charite: -10 }, tag: "violent-enf",
        memo: "Tu as fait du mal à un animal." },
    ],
  },
  // 10 nouveaux events enfance (F.1)
  {
    code: "ENF-11", phase: "Enfance",
    trame: "Tu vois ton père pleurer pour la première fois. Il ne sait pas que tu regardes.",
    options: [
      { text: "Aller le serrer.", deltas: { Charite: +12, Foi: +6 }, npcImpact: { id: "pere", deltaRelation: +20 } },
      { text: "Reculer doucement.", deltas: { Prudence: +6 } },
      { text: "Détourner le regard.", deltas: { Paresse: +6 } },
      { text: "En parler à ta mère.", deltas: { Foi: +6, Charite: -2 } },
    ],
  },
  {
    code: "ENF-12", phase: "Enfance",
    trame: "Une voisine âgée te demande d'arroser ses plantes pendant l'été.",
    options: [
      { text: "Accepter avec sérieux.", deltas: { Charite: +8, Justice: +6 } },
      { text: "Accepter mais oublier.", deltas: { Paresse: +10, Charite: -6 } },
      { text: "Demander combien.", deltas: { Avarice: +8 } },
      { text: "Refuser poliment.", deltas: { Temperance: +4 } },
    ],
  },
  {
    code: "ENF-13", phase: "Enfance",
    trame: "Ta sœur cadette se fait disputer pour quelque chose que tu as fait.",
    options: [
      { text: "Avouer pour la sauver.", deltas: { Charite: +10, Foi: +8 }, tag: "honnete-enf" },
      { text: "Garder le silence.", deltas: { Paresse: +8, Foi: -4 } },
      { text: "Aggraver son cas en mentant.", deltas: { Envie: +10, Charite: -10 } },
      { text: "Raconter une vérité partielle.", deltas: { Prudence: +6 } },
    ],
  },
  {
    code: "ENF-14", phase: "Enfance",
    trame: "Un copain casse un objet chez toi. Ta mère arrive et accuse l'objet d'être tombé seul.",
    options: [
      { text: "Soutenir le mensonge.", deltas: { Charite: +6, Foi: -4 } },
      { text: "Avouer pour ton ami.", deltas: { Justice: +10 }, tag: "honnete-enf" },
      { text: "Proposer de payer avec ton argent.", deltas: { Charite: +8, Avarice: -4 } },
      { text: "Accuser ton ami.", deltas: { Envie: +10, Charite: -8 } },
    ],
  },
  {
    code: "ENF-15", phase: "Enfance",
    trame: "Un adulte étrange te parle dans la rue et te propose un bonbon.",
    options: [
      { text: "Refuser et partir vite.", deltas: { Prudence: +14, Force: +6 } },
      { text: "Accepter par politesse.", deltas: { Paresse: +6, Prudence: -8 } },
      { text: "Crier.", deltas: { Force: +8 } },
      { text: "Aller le dire à un adulte.", deltas: { Justice: +10, Prudence: +6 } },
    ],
  },
  {
    code: "ENF-16", phase: "Enfance",
    trame: "À l'école, on demande qui a écrit un mot grossier au tableau. Ce n'est pas toi mais tu sais qui.",
    options: [
      { text: "Te lever et dire le nom.", deltas: { Justice: +10, Charite: -4 }, tag: "rapporteur" },
      { text: "Te taire.", deltas: { Foi: +6 }, tag: "fidele-enf" },
      { text: "Te désigner pour protéger l'autre.", deltas: { Charite: +12, Foi: +8 } },
      { text: "Hausser les épaules.", deltas: { Paresse: +8 } },
    ],
  },
  {
    code: "ENF-17", phase: "Enfance",
    trame: "Tu trouves le journal intime de ta sœur. Personne ne saura que tu l'as lu.",
    options: [
      { text: "Le lire entièrement.", deltas: { Envie: +12, Charite: -6 }, memo: "Tu as lu son journal." },
      { text: "Le remettre.", deltas: { Temperance: +10, Foi: +8 } },
      { text: "Lire juste la première page.", deltas: { Envie: +6 } },
      { text: "Le brûler.", deltas: { Colere: +10, Envie: +6 } },
    ],
  },
  {
    code: "ENF-18", phase: "Enfance",
    trame: "À l'anniversaire d'un copain, tu manges trois parts de gâteau. Il en restait à peine pour les autres.",
    options: [
      { text: "Les laisser, gêné.", deltas: { Temperance: +10 } },
      { text: "T'en servir une 4e.", deltas: { Gourmandise: +14 } },
      { text: "T'excuser.", deltas: { Charite: +6, Temperance: +4 } },
      { text: "Voler une part pour la maison.", deltas: { Avarice: +8, Gourmandise: +6 } },
    ],
  },
  {
    code: "ENF-19", phase: "Enfance",
    trame: "Tu dois faire un exposé sur \"ce que tu veux devenir\". Ta classe va t'écouter.",
    options: [
      { text: "Dire un métier prestigieux.", deltas: { Orgueil: +10 } },
      { text: "Dire que tu veux aider les autres.", deltas: { Charite: +10, Foi: +6 } },
      { text: "Dire la vérité simple : \"Je sais pas\".", deltas: { Foi: +6, Temperance: +6 } },
      { text: "Refuser de faire l'exposé.", deltas: { Paresse: +12 } },
    ],
  },
  {
    code: "ENF-20", phase: "Enfance",
    trame: "Tu vois un sans-abri qui dort sur un banc. Tu as ton goûter.",
    options: [
      { text: "Lui donner ton goûter.", deltas: { Charite: +14, Foi: +6 }, memo: "Tu as donné ton goûter à un sans-abri." },
      { text: "Aller chercher de l'aide.", deltas: { Prudence: +6, Charite: +6 } },
      { text: "Continuer ton chemin.", deltas: { Paresse: +6 } },
      { text: "Le regarder longtemps.", deltas: { Temperance: +6 } },
    ],
  },

  // ============== ADOLESCENCE (20) ==============
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
      { text: "Filmer pour les réseaux.", deltas: { Envie: +10, Charite: -8 }, memo: "Tu as filmé pour les vues." },
      { text: "Détourner le regard.", deltas: { Paresse: +10, Justice: -6 } },
    ],
  },
  {
    code: "ADO-04", phase: "Adolescence",
    trame: "Examen important. Tu as l'occasion de tricher sans risque.",
    options: [
      { text: "Tricher sans hésiter.", deltas: { Avarice: +6, Foi: -8 }, tag: "tricheur",
        memo: "Tu as triché." },
      { text: "Refuser net.", deltas: { Justice: +10, Foi: +8 } },
      { text: "Aider un ami à tricher mais pas toi.", deltas: { Charite: +6, Foi: -2 } },
      { text: "Faire semblant de tricher pour ne pas être marginal.", deltas: { Paresse: +6, Foi: -4 } },
      // F.8 — choix conditionnel : seulement si fier-enf
      { text: "Dénoncer le système devant la classe.", deltas: { Justice: +14, Orgueil: +6 },
        requireAxis: { axis: "Orgueil", min: 60 } },
    ],
    timeoutSec: 30,  // F.7 timed
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
      { text: "Accepter le baiser.", deltas: { Luxure: +10, Foi: -6 }, tag: "trahisseur",
        npcImpact: { id: "marc", deltaRelation: -40 } },
      { text: "Refuser pour ton ami.", deltas: { Charite: +10, Foi: +6 } },
      { text: "Accepter mais ne rien dire.", deltas: { Luxure: +8, Foi: -10 } },
      { text: "En parler avec ton ami avant.", deltas: { Foi: +12, Prudence: +6 } },
    ],
    requiresTag: "courage-enf",  // F.2 — branche : seulement si tu as été courageux à l'enfance
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
    timeoutSec: 25,
  },
  {
    code: "ADO-09", phase: "Adolescence",
    trame: "Ton père perd son emploi. La maison est tendue.",
    options: [
      { text: "Lui parler longuement.", deltas: { Charite: +10, Foi: +6 }, npcImpact: { id: "pere", deltaRelation: +30 } },
      { text: "Travailler en secret pour aider.", deltas: { Force: +10, Charite: +8 } },
      { text: "Te faire le plus discret possible.", deltas: { Prudence: +6, Paresse: +4 } },
      { text: "L'éviter, c'est trop pesant.", deltas: { Paresse: +10, Charite: -6 },
        npcImpact: { id: "pere", deltaRelation: -30 } },
    ],
  },
  {
    code: "ADO-10", phase: "Adolescence",
    trame: "Un prof injuste t'humilie devant la classe.",
    options: [
      { text: "Te défendre fermement.", deltas: { Force: +10, Justice: +8 } },
      { text: "Encaisser en silence.", deltas: { Temperance: +8, Paresse: +4 } },
      { text: "Pleurer.", deltas: { Foi: -4 } },
      { text: "Saboter sa voiture.", deltas: { Colere: +12, Justice: -8 }, tag: "vandale" },
    ],
  },
  // 10 nouveaux ado
  {
    code: "ADO-11", phase: "Adolescence",
    trame: "Marc te demande de l'argent. Il insiste. Il dit qu'il en a vraiment besoin.",
    options: [
      { text: "Lui en donner sans conditions.", deltas: { Charite: +10 }, npcImpact: { id: "marc", deltaRelation: +20 } },
      { text: "Lui en donner mais en attendant un retour.", deltas: { Avarice: +6, Charite: +4 } },
      { text: "Refuser fermement.", deltas: { Avarice: +8, Charite: -6 }, npcImpact: { id: "marc", deltaRelation: -20 } },
      { text: "Lui demander pourquoi.", deltas: { Prudence: +8 } },
    ],
    requiresTag: "courage-enf",
  },
  {
    code: "ADO-12", phase: "Adolescence",
    trame: "Sarah te raconte qu'elle veut quitter le pays. Personne d'autre ne sait.",
    options: [
      { text: "L'écouter et garder le secret.", deltas: { Foi: +8, Charite: +6 },
        npcImpact: { id: "sarah", deltaRelation: +20 } },
      { text: "Tenter de la dissuader.", deltas: { Charite: +6, Force: +4 } },
      { text: "Le dire à ses parents.", deltas: { Justice: +6, Charite: -8 },
        npcImpact: { id: "sarah", deltaRelation: -40 } },
      { text: "Lui proposer de partir avec elle.", deltas: { Foi: +12, Force: +10 } },
    ],
    requiresTag: "fidele-enf",
  },
  {
    code: "ADO-13", phase: "Adolescence",
    trame: "Ton groupe d'amis exclut publiquement quelqu'un sur les réseaux.",
    options: [
      { text: "Quitter le groupe en silence.", deltas: { Force: +10, Charite: +8 } },
      { text: "Défendre publiquement la personne.", deltas: { Justice: +12, Force: +8 } },
      { text: "Suivre le mouvement.", deltas: { Paresse: +10, Charite: -8 } },
      { text: "Liker discrètement les attaques.", deltas: { Envie: +10, Foi: -6 } },
    ],
  },
  {
    code: "ADO-14", phase: "Adolescence",
    trame: "Tu vois ton frère se cacher pour pleurer. Tu n'as rien fait quand il a été humilié plus tôt.",
    options: [
      { text: "Aller le voir et t'excuser.", deltas: { Charite: +12, Foi: +8 } },
      { text: "Faire semblant de ne pas l'avoir vu.", deltas: { Paresse: +12, Charite: -8 } },
      { text: "Crier sur ceux qui l'ont humilié.", deltas: { Colere: +10, Justice: +6 } },
      { text: "Lui écrire un mot.", deltas: { Charite: +8, Foi: +4 } },
    ],
  },
  {
    code: "ADO-15", phase: "Adolescence",
    trame: "Une fête immense est organisée. Tes parents partent en week-end.",
    options: [
      { text: "Faire la fête raisonnablement.", deltas: { Temperance: +10 } },
      { text: "Inviter tout le lycée.", deltas: { Luxure: +12, Orgueil: +8 } },
      { text: "Refuser de la faire.", deltas: { Foi: +8, Force: +4 } },
      { text: "Voler de l'alcool dans la cave.", deltas: { Gourmandise: +10, Avarice: -2 } },
    ],
  },
  {
    code: "ADO-16", phase: "Adolescence",
    trame: "On te propose de voler dans un magasin pour rejoindre un groupe.",
    options: [
      { text: "Refuser et t'éloigner.", deltas: { Justice: +12, Force: +8 } },
      { text: "Voler quelque chose de petit.", deltas: { Avarice: +8, Foi: -8 } },
      { text: "Voler quelque chose de gros.", deltas: { Avarice: +14, Force: +6, Foi: -10 } },
      { text: "Faire semblant et jeter.", deltas: { Prudence: +8 } },
    ],
  },
  {
    code: "ADO-17", phase: "Adolescence",
    trame: "Tu pourrais embrasser le copain de ta meilleure amie. Il en a envie aussi.",
    options: [
      { text: "Refuser net.", deltas: { Foi: +12, Charite: +8 } },
      { text: "Accepter en secret.", deltas: { Luxure: +14, Foi: -10 }, tag: "trahisseur" },
      { text: "Le dire à ton amie.", deltas: { Foi: +14, Force: +8 } },
      { text: "Hésiter longtemps.", deltas: { Prudence: +6 } },
    ],
  },
  {
    code: "ADO-18", phase: "Adolescence",
    trame: "Tu découvres que ta mère a un amant. Ton père ne sait pas.",
    options: [
      { text: "Confronter ta mère.", deltas: { Justice: +10, Force: +8 } },
      { text: "Le dire à ton père.", deltas: { Foi: +8, Charite: -6 } },
      { text: "Te taire.", deltas: { Paresse: +10, Foi: -6 } },
      { text: "En parler avec un adulte de confiance.", deltas: { Prudence: +10, Charite: +6 } },
    ],
  },
  {
    code: "ADO-19", phase: "Adolescence",
    trame: "À 17 ans, tu as l'occasion de partir 1 an à l'étranger seul. Mais tes parents préféreraient que tu restes.",
    options: [
      { text: "Partir malgré tout.", deltas: { Force: +12, Foi: +6 } },
      { text: "Rester par devoir.", deltas: { Charite: +10, Force: +4 } },
      { text: "Négocier 6 mois.", deltas: { Prudence: +10 } },
      { text: "Renoncer définitivement.", deltas: { Paresse: +10, Foi: -4 } },
    ],
  },
  {
    code: "ADO-20", phase: "Adolescence",
    trame: "Tu écris une lettre anonyme. Tu peux la donner à ton père qui le mérite, ou la déchirer.",
    options: [
      { text: "La donner.", deltas: { Justice: +10, Colere: +6 } },
      { text: "La déchirer.", deltas: { Temperance: +10, Foi: +6 } },
      { text: "La garder.", deltas: { Prudence: +6 } },
      { text: "La poster anonymement.", deltas: { Envie: +10, Foi: -6 } },
    ],
    requiresTag: "menteur-enf",  // F.9 — branche conséquence à long terme
  },

  // ============== ÂGE ADULTE (20) ==============
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
      { text: "Le saboter sans pitié.", deltas: { Envie: +14, Foi: -10 }, tag: "saboteur" },
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
      { text: "Lui révéler ta propre infidélité.", deltas: { Foi: +14, Force: +6 },
        requireAxis: { axis: "Foi", min: 65 } },  // F.8 conditionnel
    ],
    excludesTag: "trahisseur",  // F.9 — pas dispo si on a déjà trahi
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
      { text: "L'accueillir chez toi.", deltas: { Charite: +14, Force: +8 }, npcImpact: { id: "pere", deltaRelation: +20 } },
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
  // 10 nouveaux adulte
  {
    code: "ADU-11", phase: "AgeAdulte",
    trame: "Marc, perdu de vue depuis 20 ans, te recontacte. Il a besoin d'argent.",
    options: [
      { text: "Lui donner sans conditions.", deltas: { Charite: +14 }, npcImpact: { id: "marc", deltaRelation: +30 } },
      { text: "Lui prêter avec contrat.", deltas: { Prudence: +10, Charite: +4 } },
      { text: "Refuser, trop de temps a passé.", deltas: { Avarice: +10 }, npcImpact: { id: "marc", deltaRelation: -20 } },
      { text: "Lui proposer un emploi.", deltas: { Charite: +12, Force: +6 } },
    ],
    requiresTag: "courage-enf",
  },
  {
    code: "ADU-12", phase: "AgeAdulte",
    trame: "À l'enterrement d'un proche, tu vois quelqu'un que tu détestes. La famille s'attend à ce que tu lui parles.",
    options: [
      { text: "Lui parler poliment.", deltas: { Temperance: +10 } },
      { text: "L'ignorer ostensiblement.", deltas: { Orgueil: +8, Colere: +6 } },
      { text: "Lui pardonner publiquement.", deltas: { Charite: +14, Foi: +8 } },
      { text: "Faire un esclandre.", deltas: { Colere: +14, Justice: -6 } },
    ],
  },
  {
    code: "ADU-13", phase: "AgeAdulte",
    trame: "Tu reçois un email d'une vieille connaissance. Tu pourrais ne jamais répondre.",
    options: [
      { text: "Répondre chaleureusement.", deltas: { Charite: +8 } },
      { text: "Répondre brièvement.", deltas: { Temperance: +6 } },
      { text: "Ne pas répondre.", deltas: { Paresse: +10, Charite: -4 } },
      { text: "Bloquer l'expéditeur.", deltas: { Colere: +6, Charite: -8 } },
    ],
  },
  {
    code: "ADU-14", phase: "AgeAdulte",
    trame: "Tu pourrais voler une œuvre d'art chez ton patron qui ne s'en apercevrait pas.",
    options: [
      { text: "Refuser net.", deltas: { Justice: +12, Foi: +8 } },
      { text: "Le faire sans regret.", deltas: { Avarice: +14, Foi: -12 } },
      { text: "Y penser longtemps.", deltas: { Envie: +6, Prudence: +4 } },
      { text: "En parler à un ami.", deltas: { Foi: +6 } },
    ],
  },
  {
    code: "ADU-15", phase: "AgeAdulte",
    trame: "Un vieil ami se confie : il a fait quelque chose de grave qu'il regrette.",
    options: [
      { text: "L'écouter sans juger.", deltas: { Charite: +12, Foi: +8 } },
      { text: "Le pousser à se dénoncer.", deltas: { Justice: +10, Charite: +4 } },
      { text: "Couper le contact.", deltas: { Force: +6, Charite: -8 } },
      { text: "Lui dire que tu as fait pire.", deltas: { Foi: +10, Temperance: +6 } },
    ],
  },
  {
    code: "ADU-16", phase: "AgeAdulte",
    trame: "Ton enfant choisit une orientation que tu trouves catastrophique.",
    options: [
      { text: "Le soutenir absolument.", deltas: { Charite: +12, Foi: +8 } },
      { text: "Le contrer fermement.", deltas: { Force: +8, Charite: -6 } },
      { text: "Lui demander un test d'1 an.", deltas: { Prudence: +12 } },
      { text: "Lui couper les vivres.", deltas: { Avarice: +10, Charite: -10 } },
    ],
  },
  {
    code: "ADU-17", phase: "AgeAdulte",
    trame: "À 50 ans, tu pourrais publier un livre de ta vie. Personne n'a demandé. Personne n'attend.",
    options: [
      { text: "Le faire pour toi.", deltas: { Foi: +10, Force: +6 } },
      { text: "Le faire pour le succès.", deltas: { Orgueil: +12, Avarice: +6 } },
      { text: "Renoncer par humilité.", deltas: { Temperance: +10, Foi: +4 } },
      { text: "Le commencer puis abandonner.", deltas: { Paresse: +10 } },
    ],
  },
  {
    code: "ADU-18", phase: "AgeAdulte",
    trame: "Tu hérites d'une grosse somme. Ton frère, qui vit dans la misère, n'a rien reçu.",
    options: [
      { text: "Tout partager équitablement.", deltas: { Charite: +14, Justice: +10 } },
      { text: "Lui donner une partie.", deltas: { Charite: +8, Avarice: +4 } },
      { text: "Garder selon le testament.", deltas: { Avarice: +12, Justice: +4 } },
      { text: "Donner tout à une œuvre.", deltas: { Charite: +16, Force: +8 } },
    ],
  },
  {
    code: "ADU-19", phase: "AgeAdulte",
    trame: "Tu pourrais reprendre contact avec ton père, brouillé depuis 20 ans.",
    options: [
      { text: "Lui écrire.", deltas: { Charite: +10, Foi: +8 }, npcImpact: { id: "pere", deltaRelation: +30 } },
      { text: "Aller le voir physiquement.", deltas: { Force: +12, Charite: +10 } },
      { text: "Attendre qu'il fasse le premier pas.", deltas: { Orgueil: +8, Paresse: +6 } },
      { text: "Le bloquer définitivement.", deltas: { Colere: +12, Charite: -10 } },
    ],
    requiresTag: "rebelle-enf",
  },
  {
    code: "ADU-20", phase: "AgeAdulte",
    trame: "Sur ton lit, ton dernier souffle. Quelqu'un te demande \"Aurais-tu fait pareil ?\"",
    options: [
      { text: "Oui, sans rien changer.", deltas: { Foi: +10, Orgueil: +6 } },
      { text: "Non, j'aurais aimé être plus tendre.", deltas: { Charite: +14, Temperance: +8 } },
      { text: "Non, j'aurais aimé être plus libre.", deltas: { Force: +14, Foi: +8 } },
      { text: "Je n'ai jamais su.", deltas: { Temperance: +12, Foi: +6 } },
    ],
  },
];

// F.3 — PNJ persistants : init au début de la run
export const NPC_DEFS = [
  { id: "marc",   name: "Marc",   relation: 0, alive: true, appearances: [] },
  { id: "sarah",  name: "Sarah",  relation: 0, alive: true, appearances: [] },
  { id: "pere",   name: "Ton père", relation: 0, alive: true, appearances: [] },
];

// F.2 — picker qui filtre selon les tags déjà acquis
export function pickRandomLifeEvents(seenTags: string[] = [], lockedCodes: string[] = []): LifeEvent[] {
  const byPhase: Record<Phase, LifeEvent[]> = {
    Enfance: LIFE_EVENTS.filter((e) => e.phase === "Enfance"),
    Adolescence: LIFE_EVENTS.filter((e) => e.phase === "Adolescence"),
    AgeAdulte: LIFE_EVENTS.filter((e) => e.phase === "AgeAdulte"),
  };
  const phases: Phase[] = ["Enfance", "Adolescence", "AgeAdulte"];
  return phases.map((p) => {
    let pool = byPhase[p];
    pool = pool.filter((e) => !lockedCodes.includes(e.code));
    pool = pool.filter((e) => !e.requiresTag || seenTags.includes(e.requiresTag));
    pool = pool.filter((e) => !e.excludesTag || !seenTags.includes(e.excludesTag));
    if (pool.length === 0) pool = byPhase[p].filter((e) => !lockedCodes.includes(e.code));
    if (pool.length === 0) pool = byPhase[p];
    return pool[Math.floor(Math.random() * pool.length)];
  });
}

// F.4 — lettres reçues entre événements (mini-mots qui déforment le contexte)
export const LETTERS: Array<{ trigger: string; text: string }> = [
  { trigger: "menteur-enf",   text: "« Je sais que ce n'était pas ton frère. Pourquoi ? — Ta mère »" },
  { trigger: "courage-enf",   text: "« Tu es venu avec moi quand personne ne le faisait. Je ne l'oublie pas. — Marc »" },
  { trigger: "tricheur",      text: "« On a découvert. Tu seras convoqué lundi. — Le Proviseur »" },
  { trigger: "trahisseur",    text: "« Je ne te parle plus. — Marc »" },
  { trigger: "voleur-enf",    text: "« J'ai cherché ce porte-monnaie longtemps. — Quelqu'un que tu ne connais pas »" },
  { trigger: "rebelle-enf",   text: "« Tu as toujours été dur avec moi. Je ne t'en veux pas. — Ton père »" },
  { trigger: "violent-enf",   text: "« Le chat noir avait des petits. Maintenant, ils n'ont plus de mère. — Une voisine »" },
  { trigger: "saboteur",      text: "« Je sais ce que tu as fait. Je n'ai rien dit. Pour l'instant. — Un collègue »" },
  { trigger: "rapporteur",    text: "« Tu m'as trahi. — Sarah »" },
  { trigger: "fidele-enf",    text: "« Tu as gardé. Je ne l'oublie pas. — Sarah »" },
];

export function letterFor(tag: string): string | null {
  return LETTERS.find((l) => l.trigger === tag)?.text || null;
}
