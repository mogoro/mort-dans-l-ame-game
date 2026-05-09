import type { Axis } from "./events";

// Sigils Inscryption-like (item 2.1 simplifié)
export type Sigil = "bleed" | "shield" | "swift" | "vampire";

export const SIGIL_LABELS: Record<Sigil, { label: string; icon: string; desc: string }> = {
  bleed:   { label: "Saignée",   icon: "🩸", desc: "Inflige Saignement (1 dmg/tour) à l'attaqué." },
  shield:  { label: "Bouclier",  icon: "🛡",  desc: "+2 bloc au tour de pose." },
  swift:   { label: "Rapide",    icon: "⚡", desc: "Peut attaquer le tour de pose." },
  vampire: { label: "Vampire",   icon: "🦇", desc: "Vol de vie : récupère +1 HP par dégât infligé." },
};

export interface Card {
  id: string;
  name: string;
  axis: Axis;
  cost: number;
  atk: number;
  hp: number;
  effect?: string;
  sigils?: Sigil[];
  emoji?: string;     // Emoji unique par carte (pas générique de l'axe)
  flavor?: string;    // Texte d'ambiance
}

// Pool des monstres — chaque axe = 2 monstres incarnés
export const CARD_POOL: Record<Axis, Card[]> = {
  Luxure: [
    { id: "luxure-1", name: "L'Incube",         axis: "Luxure", cost: 12, atk: 5, hp: 3,
      effect: "Vol de vie.", sigils: ["vampire"], emoji: "🧛",
      flavor: "Il prend ce que tu as offert sans regarder à qui." },
    { id: "luxure-2", name: "La Suaire de Soie", axis: "Luxure", cost: 16, atk: 7, hp: 4,
      effect: "Inflige Saignement.", sigils: ["bleed"], emoji: "💋",
      flavor: "Ses étreintes laissent des traces sur la peau et l'âme." },
  ],
  Charite: [
    { id: "charite-1", name: "L'Offrante",   axis: "Charite", cost: 12, atk: 3, hp: 5,
      effect: "Pose un bouclier.", sigils: ["shield"], emoji: "🤲",
      flavor: "Ses mains sont toujours ouvertes." },
    { id: "charite-2", name: "Le Mécène",    axis: "Charite", cost: 16, atk: 2, hp: 8,
      effect: "Bouclier solide.", sigils: ["shield"], emoji: "🎁",
      flavor: "Donner sans attendre — son seul vice." },
  ],
  Colere: [
    { id: "colere-1", name: "Le Boucher",    axis: "Colere", cost: 12, atk: 6, hp: 2,
      effect: "Saignement.", sigils: ["bleed"], emoji: "🔪",
      flavor: "Il a appris à frapper avant d'apprendre à parler." },
    { id: "colere-2", name: "L'Enragé",      axis: "Colere", cost: 16, atk: 9, hp: 3,
      effect: "Frappe immédiate.", sigils: ["swift"], emoji: "💢",
      flavor: "La rage ne demande pas la permission." },
  ],
  Foi: [
    { id: "foi-1",   name: "L'Esprit-Souffle", axis: "Foi", cost: 8, atk: 2, hp: 3,
      effect: "Léger et rapide.", sigils: ["swift"], emoji: "👻",
      flavor: "Le premier souffle, comme le dernier." },
    { id: "foi-2",   name: "Le Gardien Juré",  axis: "Foi", cost: 16, atk: 4, hp: 6,
      effect: "Solide bouclier.", sigils: ["shield"], emoji: "⚜",
      flavor: "Il a juré. Il tient." },
  ],
  Prudence: [
    { id: "prudence-1", name: "Le Veilleur",    axis: "Prudence", cost: 8, atk: 1, hp: 4,
      effect: "Observe.", emoji: "👁",
      flavor: "Il regarde longtemps avant d'agir." },
    { id: "prudence-2", name: "L'Œil-qui-Voit", axis: "Prudence", cost: 12, atk: 3, hp: 5,
      effect: "Anticipe.", emoji: "🔮",
      flavor: "Il voit ce qui vient. Il s'y prépare." },
  ],
  Force: [
    { id: "force-1", name: "Le Frappeur",  axis: "Force", cost: 12, atk: 7, hp: 4,
      effect: "Frappe directe.", sigils: ["swift"], emoji: "👊",
      flavor: "Pas d'élégance. De l'efficacité." },
    { id: "force-2", name: "Le Roc",       axis: "Force", cost: 16, atk: 4, hp: 8,
      effect: "Bloc puissant.", sigils: ["shield"], emoji: "🗿",
      flavor: "Le temps glisse sur lui." },
  ],
  Temperance: [
    { id: "temperance-1", name: "L'Équilibriste", axis: "Temperance", cost: 12, atk: 4, hp: 6,
      effect: "Bloque jusqu'à 8.", emoji: "⚖",
      flavor: "Ni trop, ni trop peu. Juste assez." },
    { id: "temperance-2", name: "Le Médiateur",   axis: "Temperance", cost: 16, atk: 3, hp: 9,
      effect: "Annule statuts.", emoji: "🤝",
      flavor: "Il parle quand les autres crient." },
  ],
  Orgueil: [
    { id: "orgueil-1", name: "Le Couronné",   axis: "Orgueil", cost: 12, atk: 5, hp: 3,
      effect: "Vulnérable +1.", emoji: "👑",
      flavor: "Il regarde tout le monde de haut. Même Dieu." },
    { id: "orgueil-2", name: "Le Trône Vide", axis: "Orgueil", cost: 16, atk: 6, hp: 5,
      effect: "+2 énergie permanent.", emoji: "🪑",
      flavor: "Personne ne s'y assoit. Il l'attend, lui." },
  ],
  Avarice: [
    { id: "avarice-1", name: "Le Thésauriseur", axis: "Avarice", cost: 12, atk: 4, hp: 4,
      effect: "+2 énergie ce tour.", emoji: "💰",
      flavor: "Il compte. Il recompte. Il ne donne jamais." },
    { id: "avarice-2", name: "Le Verminé d'Or", axis: "Avarice", cost: 16, atk: 6, hp: 5,
      effect: "Pioche 4.", emoji: "🐀",
      flavor: "Sa richesse pue. Lui aussi." },
  ],
  Envie: [
    { id: "envie-1", name: "Le Chuchoteur", axis: "Envie", cost: 12, atk: 4, hp: 4,
      effect: "Vol de PV.", emoji: "🐍",
      flavor: "Sa langue est plus longue que toi." },
    { id: "envie-2", name: "Le Saboteur",   axis: "Envie", cost: 16, atk: 7, hp: 3,
      effect: "Ennemi rate son tour.", emoji: "💣",
      flavor: "Il préfère détruire que voir réussir." },
  ],
  Gourmandise: [
    { id: "gourmandise-1", name: "Le Festin", axis: "Gourmandise", cost: 12, atk: 3, hp: 6,
      effect: "Soigne 12.", emoji: "🍖",
      flavor: "Il mange ce qu'il aime jusqu'à le détester." },
    { id: "gourmandise-2", name: "Le Glouton", axis: "Gourmandise", cost: 16, atk: 5, hp: 7,
      effect: "Pioche 5.", emoji: "🍷",
      flavor: "Il vide. Il vide encore. Il ne se remplit jamais." },
  ],
  Paresse: [
    { id: "paresse-1", name: "L'Apathique", axis: "Paresse", cost: 8, atk: 2, hp: 5,
      effect: "Ennemi rate son tour.", emoji: "😴",
      flavor: "Il a renoncé. C'est presque reposant." },
    { id: "paresse-2", name: "Le Lâcheur",  axis: "Paresse", cost: 12, atk: 3, hp: 7,
      effect: "Bloque 14.", emoji: "🕸",
      flavor: "Il était là. Et puis il n'était plus." },
  ],
  Esperance: [
    { id: "esperance-1", name: "La Lueur",        axis: "Esperance", cost: 12, atk: 3, hp: 5,
      effect: "Soigne 4 + pioche 1.", emoji: "🌟",
      flavor: "Petite. Têtue. Suffisante." },
    { id: "esperance-2", name: "L'Annonciateur",  axis: "Esperance", cost: 16, atk: 4, hp: 7,
      effect: "Cartes -1 cost.", emoji: "🕊",
      flavor: "Il parle de ce qui n'est pas encore." },
  ],
  Justice: [
    { id: "justice-1", name: "Le Verdict", axis: "Justice", cost: 12, atk: 6, hp: 4,
      effect: "Inflige selon HP manquants.", emoji: "⚖",
      flavor: "Il rend à chacun ce qui lui revient. Sans pitié." },
    { id: "justice-2", name: "L'Arbitre",  axis: "Justice", cost: 16, atk: 5, hp: 6,
      effect: "Égalise les HP.", emoji: "📜",
      flavor: "Il pèse. Il tranche. Il ne regrette pas." },
  ],
};

// Couleurs visuelles par axe (palette pixel art chaude/sombre)
export const AXIS_COLOR: Record<Axis, { primary: number; secondary: number; accent: number }> = {
  Orgueil:     { primary: 0x3a1f4a, secondary: 0x8a4ed0, accent: 0xc8a0f0 },
  Avarice:     { primary: 0x3a2a10, secondary: 0xa07020, accent: 0xe0c878 },
  Luxure:      { primary: 0x3a1430, secondary: 0xa04088, accent: 0xe8a0d0 },
  Envie:       { primary: 0x1a3320, secondary: 0x3a8050, accent: 0x88d098 },
  Gourmandise: { primary: 0x3a2418, secondary: 0x88582a, accent: 0xd8a878 },
  Colere:      { primary: 0x4a1818, secondary: 0xc83838, accent: 0xf08080 },
  Paresse:     { primary: 0x1f2a3a, secondary: 0x506888, accent: 0xa8b8d0 },
  Foi:         { primary: 0x3a3018, secondary: 0xb89028, accent: 0xf0d878 },
  Esperance:   { primary: 0x1a2a3a, secondary: 0x4080a0, accent: 0x90c0e0 },
  Charite:     { primary: 0x3a2810, secondary: 0xc88040, accent: 0xf0c080 },
  Prudence:    { primary: 0x2a2a30, secondary: 0x6a6a80, accent: 0xb8b8c8 },
  Justice:     { primary: 0x1a1a40, secondary: 0x3838a0, accent: 0x7878d0 },
  Force:       { primary: 0x3a1f10, secondary: 0xa05030, accent: 0xe09870 },
  Temperance:  { primary: 0x1a3030, secondary: 0x408080, accent: 0x80c0c0 },
};
