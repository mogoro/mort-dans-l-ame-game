import type { Axis } from "./events";

// Sigils Inscryption-like (item 2.1 simplifié) :
// - bleed: l'attaqué reçoit Saignement
// - shield: bloc 2 au tour de pose
// - swift: peut attaquer le tour de pose (no sickness)
// - vampire: vol de vie (récupère HP = dégâts infligés)
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
  sigils?: Sigil[];  // 2.1 sigils sur certaines cartes
}

// Pool minimal proto Cercle Luxure
export const CARD_POOL: Record<Axis, Card[]> = {
  Luxure: [
    { id: "luxure-1", name: "Tentation",  axis: "Luxure", cost: 12, atk: 5, hp: 3, effect: "Vol de vie.", sigils: ["vampire"] },
    { id: "luxure-2", name: "Étreinte",   axis: "Luxure", cost: 16, atk: 7, hp: 4, effect: "Inflige 7. Saignement.", sigils: ["bleed"] },
  ],
  Charite: [
    { id: "charite-1", name: "Main tendue", axis: "Charite", cost: 12, atk: 3, hp: 5, effect: "Bouclier au tour de pose.", sigils: ["shield"] },
    { id: "charite-2", name: "Don",         axis: "Charite", cost: 16, atk: 2, hp: 8, effect: "Bouclier solide.", sigils: ["shield"] },
  ],
  Colere: [
    { id: "colere-1", name: "Saignée",     axis: "Colere", cost: 12, atk: 6, hp: 2, effect: "Saignement.", sigils: ["bleed"] },
    { id: "colere-2", name: "Charge",      axis: "Colere", cost: 16, atk: 9, hp: 3, effect: "Frappe immédiate.", sigils: ["swift"] },
  ],
  Foi: [
    { id: "foi-1",     name: "Souffle",   axis: "Foi", cost: 8,  atk: 2, hp: 3, effect: "Carte légère et rapide.", sigils: ["swift"] },
    { id: "foi-2",     name: "Serment",   axis: "Foi", cost: 16, atk: 4, hp: 6, effect: "Solide bouclier.", sigils: ["shield"] },
  ],
  Prudence: [
    { id: "prudence-1", name: "Réflexion", axis: "Prudence", cost: 8,  atk: 1, hp: 4, effect: "Scry 4." },
    { id: "prudence-2", name: "Anticipation", axis: "Prudence", cost: 12, atk: 3, hp: 5, effect: "Vois l'intent ennemi." },
  ],
  Force: [
    { id: "force-1", name: "Coup direct",  axis: "Force", cost: 12, atk: 7, hp: 4, effect: "Frappe directe.", sigils: ["swift"] },
    { id: "force-2", name: "Endurance",    axis: "Force", cost: 16, atk: 4, hp: 8, effect: "Bloc puissant.", sigils: ["shield"] },
  ],
  Temperance: [
    { id: "temperance-1", name: "Équilibre", axis: "Temperance", cost: 12, atk: 4, hp: 6, effect: "Bloque jusqu'à 8." },
    { id: "temperance-2", name: "Médiation", axis: "Temperance", cost: 16, atk: 3, hp: 9, effect: "Annule statuts." },
  ],
  Orgueil: [
    { id: "orgueil-1", name: "Mépris",  axis: "Orgueil", cost: 12, atk: 5, hp: 3, effect: "Vulnérable +1." },
    { id: "orgueil-2", name: "Trône",   axis: "Orgueil", cost: 16, atk: 6, hp: 5, effect: "+2 énergie permanent." },
  ],
  Avarice: [
    { id: "avarice-1", name: "Thésaurisation", axis: "Avarice", cost: 12, atk: 4, hp: 4, effect: "+2 énergie ce tour." },
    { id: "avarice-2", name: "Avidité",        axis: "Avarice", cost: 16, atk: 6, hp: 5, effect: "Pioche 4." },
  ],
  Envie: [
    { id: "envie-1", name: "Murmure jaloux", axis: "Envie", cost: 12, atk: 4, hp: 4, effect: "Vole 4 PV." },
    { id: "envie-2", name: "Sabotage",       axis: "Envie", cost: 16, atk: 7, hp: 3, effect: "Ennemi rate son tour." },
  ],
  Gourmandise: [
    { id: "gourmandise-1", name: "Festin", axis: "Gourmandise", cost: 12, atk: 3, hp: 6, effect: "Soigne 12." },
    { id: "gourmandise-2", name: "Excès",  axis: "Gourmandise", cost: 16, atk: 5, hp: 7, effect: "Pioche 5." },
  ],
  Paresse: [
    { id: "paresse-1", name: "Indifférence", axis: "Paresse", cost: 8,  atk: 2, hp: 5, effect: "Ennemi rate son tour." },
    { id: "paresse-2", name: "Lâcher-prise", axis: "Paresse", cost: 12, atk: 3, hp: 7, effect: "Bloque 14." },
  ],
  Esperance: [
    { id: "esperance-1", name: "Lueur",     axis: "Esperance", cost: 12, atk: 3, hp: 5, effect: "Soigne 4 + pioche 1." },
    { id: "esperance-2", name: "Promesse",  axis: "Esperance", cost: 16, atk: 4, hp: 7, effect: "Cartes -1 cost." },
  ],
  Justice: [
    { id: "justice-1", name: "Verdict", axis: "Justice", cost: 12, atk: 6, hp: 4, effect: "Inflige selon HP manquants." },
    { id: "justice-2", name: "Équité",  axis: "Justice", cost: 16, atk: 5, hp: 6, effect: "Égalise les HP." },
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
