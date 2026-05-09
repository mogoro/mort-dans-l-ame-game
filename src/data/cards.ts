import type { Axis } from "./events";

// ============================================================================
// Sigils étendus (B.5 counter, B.7 chant, B.3 transform, G.5 gardienne, A.5 fatigue)
// ============================================================================
export type Sigil =
  | "bleed"       // 2.1 Inflige Saignement
  | "shield"      // 2.1 +2 bloc tour de pose
  | "swift"       // 2.1 Peut attaquer tour de pose
  | "vampire"     // 2.1 Vol de vie
  | "counter"     // B.5 face cachée, déclenche sur attaque ennemi
  | "chant"       // B.7 réutilisable au prochain tour si survit
  | "morph"       // B.3 transformation à la mort
  | "guardian"    // G.5 indestructible (1× par run)
  | "venom"       // B.1 Toxique : -1 HP/tour permanent
  | "freeze"      // B.1 Glacé : ne peut pas attaquer 1 tour
  | "burn";       // B.1 Inflammable : déclenche dégâts si frappé

export const SIGIL_LABELS: Record<Sigil, { label: string; icon: string; desc: string }> = {
  bleed:    { label: "Saignée",      icon: "🩸", desc: "Inflige Saignement (1 dmg/tour) à l'attaqué." },
  shield:   { label: "Bouclier",     icon: "🛡",  desc: "+2 bloc au tour de pose." },
  swift:    { label: "Rapide",       icon: "⚡", desc: "Peut attaquer le tour de pose." },
  vampire:  { label: "Vampire",      icon: "🦇", desc: "Vol de vie : récupère HP par dégât infligé." },
  counter:  { label: "Embuscade",    icon: "🪤", desc: "Face cachée : se révèle quand attaqué." },
  chant:    { label: "Cantique",     icon: "🎶", desc: "Si survit, peut être rejouée gratuitement au tour suivant." },
  morph:    { label: "Mue",          icon: "🪬", desc: "À la mort, devient autre chose." },
  guardian: { label: "Gardienne",    icon: "💎", desc: "Indestructible. Cœur de ta run." },
  venom:    { label: "Toxique",      icon: "🧪", desc: "Inflige Poison (perte HP cumulée chaque tour)." },
  freeze:   { label: "Glace",        icon: "❄", desc: "Inflige Glacé : la cible saute son prochain tour." },
  burn:     { label: "Brûlure",      icon: "🔥", desc: "Quand frappée, brûle l'attaquant." },
};

// ============================================================================
// Statuts (B.1)
// ============================================================================
export interface ActiveStatuses {
  bleeding?: number;    // dmg/tour pendant N tours
  block?: number;       // absorbé avant HP
  vulnerable?: number;  // +50% dmg reçus pendant N tours
  weak?: number;        // -25% ATK pendant N tours
  strong?: number;      // +25% ATK pendant N tours
  flammable?: number;   // brûle si frappé
  poisoned?: number;    // -X HP/tour cumulé
  frozen?: number;      // saute prochain tour
  lifelink?: number;    // chaque dmg infligé = 1 HP soigné, tours restants
}

// ============================================================================
// Card (étendue)
// ============================================================================
export interface Card {
  id: string;
  name: string;
  axis: Axis;
  cost: number;
  atk: number;
  hp: number;
  effect?: string;
  sigils?: Sigil[];
  emoji?: string;
  flavor?: string;
  // A.5 usure
  usesCount?: number;     // nombre de fois jouée dans cette run
  fatigued?: boolean;     // -1 ATK si trop utilisée
  // A.7 consécration
  consecrated?: boolean;  // version supérieure (+ATK +HP)
  // A.9 pacte rancune
  pactedReturn?: boolean; // sacrifiée → revient avec +ATK
  pactedAtkBonus?: number;
  // G.3 niveaux
  cardLevel?: number;     // 1, 2, 3 — augmente avec usesCount
  // G.5 gardienne
  isGuardian?: boolean;
  // A.1 coût narratif
  narrativeCost?: {
    type: "memory" | "axis_drop" | "npc_loss";
    value: number;
    label: string;
  };
  // A.8 anomalie
  anomaly?: "weeps" | "speaks" | "refuses" | "watches" | null;
  anomalyMessage?: string;
  // I.1 empreinte permanente
  imprintAxisBoost?: Axis;  // axe que cette carte renforce quand jouée 10×
}

export interface DeckCard extends Card {
  // copie en run avec compteurs
}

// ============================================================================
// Pool — 28 cartes (inchangées en signature)
// ============================================================================
export const CARD_POOL: Record<Axis, Card[]> = {
  Luxure: [
    { id: "luxure-1", name: "L'Incube",         axis: "Luxure", cost: 12, atk: 5, hp: 3,
      effect: "Vol de vie.", sigils: ["vampire"], emoji: "🧛",
      flavor: "Il prend ce que tu as offert sans regarder à qui.",
      imprintAxisBoost: "Luxure" },
    { id: "luxure-2", name: "La Suaire de Soie", axis: "Luxure", cost: 16, atk: 7, hp: 4,
      effect: "Inflige Saignement.", sigils: ["bleed"], emoji: "💋",
      flavor: "Ses étreintes laissent des traces sur la peau et l'âme.",
      imprintAxisBoost: "Luxure" },
  ],
  Charite: [
    { id: "charite-1", name: "L'Offrante",   axis: "Charite", cost: 12, atk: 3, hp: 5,
      effect: "Pose un bouclier.", sigils: ["shield"], emoji: "🤲",
      flavor: "Ses mains sont toujours ouvertes.",
      imprintAxisBoost: "Charite" },
    { id: "charite-2", name: "Le Mécène",    axis: "Charite", cost: 16, atk: 2, hp: 8,
      effect: "Bouclier solide.", sigils: ["shield"], emoji: "🎁",
      flavor: "Donner sans attendre — son seul vice.",
      imprintAxisBoost: "Charite" },
  ],
  Colere: [
    { id: "colere-1", name: "Le Boucher",    axis: "Colere", cost: 12, atk: 6, hp: 2,
      effect: "Saignement.", sigils: ["bleed"], emoji: "🔪",
      flavor: "Il a appris à frapper avant d'apprendre à parler.",
      imprintAxisBoost: "Colere" },
    { id: "colere-2", name: "L'Enragé",      axis: "Colere", cost: 16, atk: 9, hp: 3,
      effect: "Frappe immédiate.", sigils: ["swift", "burn"], emoji: "💢",
      flavor: "La rage ne demande pas la permission.",
      imprintAxisBoost: "Colere" },
  ],
  Foi: [
    { id: "foi-1",   name: "L'Esprit-Souffle", axis: "Foi", cost: 8, atk: 2, hp: 3,
      effect: "Léger et rapide.", sigils: ["swift", "chant"], emoji: "👻",
      flavor: "Le premier souffle, comme le dernier.",
      imprintAxisBoost: "Foi" },
    { id: "foi-2",   name: "Le Gardien Juré",  axis: "Foi", cost: 16, atk: 4, hp: 6,
      effect: "Solide bouclier.", sigils: ["shield", "counter"], emoji: "⚜",
      flavor: "Il a juré. Il tient.",
      imprintAxisBoost: "Foi" },
  ],
  Prudence: [
    { id: "prudence-1", name: "Le Veilleur",    axis: "Prudence", cost: 8, atk: 1, hp: 4,
      effect: "Observe.", sigils: ["counter"], emoji: "👁",
      flavor: "Il regarde longtemps avant d'agir.",
      imprintAxisBoost: "Prudence" },
    { id: "prudence-2", name: "L'Œil-qui-Voit", axis: "Prudence", cost: 12, atk: 3, hp: 5,
      effect: "Anticipe.", sigils: ["counter"], emoji: "🔮",
      flavor: "Il voit ce qui vient. Il s'y prépare.",
      imprintAxisBoost: "Prudence" },
  ],
  Force: [
    { id: "force-1", name: "Le Frappeur",  axis: "Force", cost: 12, atk: 7, hp: 4,
      effect: "Frappe directe.", sigils: ["swift"], emoji: "👊",
      flavor: "Pas d'élégance. De l'efficacité.",
      imprintAxisBoost: "Force" },
    { id: "force-2", name: "Le Roc",       axis: "Force", cost: 16, atk: 4, hp: 8,
      effect: "Bloc puissant.", sigils: ["shield"], emoji: "🗿",
      flavor: "Le temps glisse sur lui.",
      imprintAxisBoost: "Force" },
  ],
  Temperance: [
    { id: "temperance-1", name: "L'Équilibriste", axis: "Temperance", cost: 12, atk: 4, hp: 6,
      effect: "Bloque jusqu'à 8.", sigils: ["shield"], emoji: "⚖",
      flavor: "Ni trop, ni trop peu. Juste assez.",
      imprintAxisBoost: "Temperance" },
    { id: "temperance-2", name: "Le Médiateur",   axis: "Temperance", cost: 16, atk: 3, hp: 9,
      effect: "Annule statuts.", sigils: ["chant"], emoji: "🤝",
      flavor: "Il parle quand les autres crient.",
      imprintAxisBoost: "Temperance" },
  ],
  Orgueil: [
    { id: "orgueil-1", name: "Le Couronné",   axis: "Orgueil", cost: 12, atk: 5, hp: 3,
      effect: "Vulnérable +1.", emoji: "👑",
      flavor: "Il regarde tout le monde de haut. Même Dieu.",
      imprintAxisBoost: "Orgueil" },
    { id: "orgueil-2", name: "Le Trône Vide", axis: "Orgueil", cost: 16, atk: 6, hp: 5,
      effect: "+2 énergie permanent.", sigils: ["morph"], emoji: "🪑",
      flavor: "Personne ne s'y assoit. Il l'attend, lui.",
      imprintAxisBoost: "Orgueil" },
  ],
  Avarice: [
    { id: "avarice-1", name: "Le Thésauriseur", axis: "Avarice", cost: 12, atk: 4, hp: 4,
      effect: "+2 énergie ce tour.", emoji: "💰",
      flavor: "Il compte. Il recompte. Il ne donne jamais.",
      imprintAxisBoost: "Avarice" },
    { id: "avarice-2", name: "Le Verminé d'Or", axis: "Avarice", cost: 16, atk: 6, hp: 5,
      effect: "Pioche 4.", sigils: ["venom"], emoji: "🐀",
      flavor: "Sa richesse pue. Lui aussi.",
      imprintAxisBoost: "Avarice" },
  ],
  Envie: [
    { id: "envie-1", name: "Le Chuchoteur", axis: "Envie", cost: 12, atk: 4, hp: 4,
      effect: "Vol de PV.", sigils: ["vampire"], emoji: "🐍",
      flavor: "Sa langue est plus longue que toi.",
      imprintAxisBoost: "Envie" },
    { id: "envie-2", name: "Le Saboteur",   axis: "Envie", cost: 16, atk: 7, hp: 3,
      effect: "Ennemi rate son tour.", sigils: ["freeze"], emoji: "💣",
      flavor: "Il préfère détruire que voir réussir.",
      imprintAxisBoost: "Envie" },
  ],
  Gourmandise: [
    { id: "gourmandise-1", name: "Le Festin", axis: "Gourmandise", cost: 12, atk: 3, hp: 6,
      effect: "Soigne 12.", emoji: "🍖",
      flavor: "Il mange ce qu'il aime jusqu'à le détester.",
      imprintAxisBoost: "Gourmandise" },
    { id: "gourmandise-2", name: "Le Glouton", axis: "Gourmandise", cost: 16, atk: 5, hp: 7,
      effect: "Pioche 5.", emoji: "🍷",
      flavor: "Il vide. Il vide encore. Il ne se remplit jamais.",
      imprintAxisBoost: "Gourmandise" },
  ],
  Paresse: [
    { id: "paresse-1", name: "L'Apathique", axis: "Paresse", cost: 8, atk: 2, hp: 5,
      effect: "Ennemi rate son tour.", sigils: ["freeze"], emoji: "😴",
      flavor: "Il a renoncé. C'est presque reposant.",
      imprintAxisBoost: "Paresse" },
    { id: "paresse-2", name: "Le Lâcheur",  axis: "Paresse", cost: 12, atk: 3, hp: 7,
      effect: "Bloque 14.", sigils: ["shield"], emoji: "🕸",
      flavor: "Il était là. Et puis il n'était plus.",
      imprintAxisBoost: "Paresse" },
  ],
  Esperance: [
    { id: "esperance-1", name: "La Lueur",        axis: "Esperance", cost: 12, atk: 3, hp: 5,
      effect: "Soigne 4 + pioche 1.", sigils: ["chant"], emoji: "🌟",
      flavor: "Petite. Têtue. Suffisante.",
      imprintAxisBoost: "Esperance" },
    { id: "esperance-2", name: "L'Annonciateur",  axis: "Esperance", cost: 16, atk: 4, hp: 7,
      effect: "Cartes -1 cost.", sigils: ["chant"], emoji: "🕊",
      flavor: "Il parle de ce qui n'est pas encore.",
      imprintAxisBoost: "Esperance" },
  ],
  Justice: [
    { id: "justice-1", name: "Le Verdict", axis: "Justice", cost: 12, atk: 6, hp: 4,
      effect: "Inflige selon HP manquants.", emoji: "⚖",
      flavor: "Il rend à chacun ce qui lui revient. Sans pitié.",
      imprintAxisBoost: "Justice" },
    { id: "justice-2", name: "L'Arbitre",  axis: "Justice", cost: 16, atk: 5, hp: 6,
      effect: "Égalise les HP.", sigils: ["counter"], emoji: "📜",
      flavor: "Il pèse. Il tranche. Il ne regrette pas.",
      imprintAxisBoost: "Justice" },
  ],
};

// ============================================================================
// Cartes maudites (E.5) — ajoutées au deck contre avantage permanent
// ============================================================================
export const CURSED_CARDS: Card[] = [
  { id: "curse-mirror", name: "Miroir Brisé", axis: "Envie", cost: 8, atk: 0, hp: 1,
    effect: "Inutile mais te suit.", emoji: "🪞", flavor: "Tu te vois. Tu détestes." },
  { id: "curse-vow", name: "Vœu Empoisonné", axis: "Foi", cost: 6, atk: 1, hp: 2,
    effect: "Ne peut être sacrifiée.", emoji: "🤐", flavor: "Tu as juré. Le serment t'enserre." },
  { id: "curse-debt", name: "Dette Ancienne", axis: "Avarice", cost: 4, atk: 0, hp: 1,
    effect: "Bloque une zone.", emoji: "📜", flavor: "Quelqu'un attend encore son dû." },
];

// ============================================================================
// Couleurs visuelles (inchangé)
// ============================================================================
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

// ============================================================================
// Helpers cartes
// ============================================================================

// G.3 — niveau de carte basé sur usesCount
export function cardLevelFromUses(uses: number): number {
  if (uses >= 10) return 3;
  if (uses >= 5) return 2;
  return 1;
}

// G.3 — applique buff de niveau
export function applyCardLevel(card: Card): Card {
  const lvl = cardLevelFromUses(card.usesCount || 0);
  if (lvl <= 1) return card;
  const bonus = lvl === 2 ? 1 : 2;
  return {
    ...card,
    atk: card.atk + bonus,
    hp: card.hp + bonus,
    cardLevel: lvl,
  };
}

// A.5 — applique fatigue si trop utilisée dans la run en cours
export function applyFatigue(card: Card, runUses: number): Card {
  if (runUses < 3) return card;
  return { ...card, atk: Math.max(0, card.atk - 1), fatigued: true };
}

// A.7 — consécration : trade-off sur axis
export function consecrate(card: Card): Card {
  return {
    ...card,
    atk: card.atk + 2,
    hp: card.hp + 2,
    consecrated: true,
    name: `${card.name} ✨`,
  };
}

// A.8 — chance d'avoir une anomalie
export function rollAnomaly(card: Card): Card {
  if (Math.random() > 0.01) return card; // 1%
  const anomalies: Array<{ type: "weeps" | "speaks" | "refuses" | "watches"; msg: string }> = [
    { type: "weeps",   msg: "Cette carte pleure quand tu la regardes." },
    { type: "speaks",  msg: "Cette carte t'a chuchoté ton prénom." },
    { type: "refuses", msg: "Cette carte se retourne dans ta main." },
    { type: "watches", msg: "Cette carte te regarde pendant que tu dors." },
  ];
  const a = anomalies[Math.floor(Math.random() * anomalies.length)];
  return { ...card, anomaly: a.type, anomalyMessage: a.msg };
}
