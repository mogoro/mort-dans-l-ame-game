// D.1 — 7 cercles dantesques avec règles vraiment uniques
// D.2 — boss qui change le board (Cerbère)
// D.3 — boss qui te trahit (Plutos)
// D.4 — boss qui efface ton profil (Acédie)
// D.5 — boss interactif (Phlégias)
// B.9 — phase 2 boss à 50% HP
import type { Axis } from "./events";

export type BossSpecial =
  | "destroy_board_slot"     // D.2 Cerbère : détruit 1 case par tour
  | "steal_card"             // D.3 Plutos : vole une carte
  | "drain_top_axis"         // D.4 Acédie : axe le plus fort baisse
  | "appeasable"             // D.5 Phlégias : Charité l'apaise
  | "summon_minions"         // B.8 invoque
  | "copy_strongest"         // Sœurs d'Envie
  | "phase_2_rage"           // B.9 phase 2 enrage (boost ATK)
  | "phase_2_heal"           // B.9 phase 2 régénère
  | "phase_2_swap"           // B.9 phase 2 change règle
  | null;

export interface CircleDef {
  id: number;
  name: string;
  axis: Axis;
  bossName: string;
  bossAtk: number;
  bossHp: number;
  bossEmoji: string;
  rule: string;
  flavor: string;
  bgTop: number;
  bgBot: number;
  // D.1 specials
  specials: BossSpecial[];
  // B.9 phase 2 description
  phase2Rule?: string;
}

export const CIRCLES: CircleDef[] = [
  {
    id: 0,
    name: "Luxure",
    axis: "Luxure",
    bossName: "Cléopâtre",
    bossAtk: 6,
    bossHp: 30,
    bossEmoji: "👸",
    rule: "Tes cartes Luxure peuvent t'attaquer (50% chance).",
    flavor: "Le vent souffle. Tu vois passer ceux que tu as désirés. Ils ne te regardent plus.",
    bgTop: 0x1a0a14,
    bgBot: 0x3a1428,
    specials: ["phase_2_rage"],
    phase2Rule: "À 50% HP : entre en transe et frappe deux fois par tour.",
  },
  {
    id: 1,
    name: "Gourmandise",
    axis: "Gourmandise",
    bossName: "Cerbère",
    bossAtk: 5,
    bossHp: 35,
    bossEmoji: "🐺",
    rule: "Détruit 1 case du plateau par tour.",
    flavor: "La pluie est sale. Tu marches dans la boue. Ton ventre te trahit.",
    bgTop: 0x1a1206,
    bgBot: 0x3a2818,
    specials: ["destroy_board_slot", "phase_2_swap"],
    phase2Rule: "À 50% HP : détruit 2 cases au lieu de 1.",
  },
  {
    id: 2,
    name: "Avarice",
    axis: "Avarice",
    bossName: "Plutos",
    bossAtk: 7,
    bossHp: 32,
    bossEmoji: "👹",
    rule: "Vole 1 carte de ta main au début du combat.",
    flavor: "L'or pèse. Tu te bats avec ce que tu n'as pas su lâcher.",
    bgTop: 0x1a1408,
    bgBot: 0x3a2810,
    specials: ["steal_card", "phase_2_heal"],
    phase2Rule: "À 50% HP : régénère 3 HP par tour.",
  },
  {
    id: 3,
    name: "Colère",
    axis: "Colere",
    bossName: "Phlégias",
    bossAtk: 4,
    bossHp: 40,
    bossEmoji: "😡",
    rule: "Cartes Charité l'apaisent et réduisent ses dégâts.",
    flavor: "Le fleuve bouillonne. Tu reconnais les cris.",
    bgTop: 0x1a0606,
    bgBot: 0x3a1414,
    specials: ["appeasable", "phase_2_rage"],
    phase2Rule: "À 50% HP : sa rage le rend insensible à la Charité.",
  },
  {
    id: 4,
    name: "Paresse",
    axis: "Paresse",
    bossName: "Acédie",
    bossAtk: 3,
    bossHp: 30,
    bossEmoji: "💀",
    rule: "Ton axe le plus fort baisse de 5 par tour.",
    flavor: "L'air est lourd. Tu pourrais juste t'asseoir. Ne fais surtout pas ça.",
    bgTop: 0x0e1a26,
    bgBot: 0x202c3a,
    specials: ["drain_top_axis", "phase_2_swap"],
    phase2Rule: "À 50% HP : tous tes axes perdent 3 par tour.",
  },
  {
    id: 5,
    name: "Envie",
    axis: "Envie",
    bossName: "Sœurs d'Envie",
    bossAtk: 6,
    bossHp: 36,
    bossEmoji: "🧙",
    rule: "Copient ta carte la plus puissante chaque tour.",
    flavor: "Elles te ressemblent. Elles te ressemblent trop.",
    bgTop: 0x0e1a14,
    bgBot: 0x1a3022,
    specials: ["copy_strongest", "summon_minions", "phase_2_rage"],
    phase2Rule: "À 50% HP : invoquent une troisième sœur.",
  },
  {
    id: 6,
    name: "Orgueil",
    axis: "Orgueil",
    bossName: "Lucifer",
    bossAtk: 8,
    bossHp: 60,
    bossEmoji: "😈",
    rule: "PV ×2. Le boss final.",
    flavor: "Tu t'inclines pour la première fois.",
    bgTop: 0x1a0a14,
    bgBot: 0x2a1428,
    specials: ["phase_2_rage", "phase_2_heal", "summon_minions"],
    phase2Rule: "À 50% HP : se transforme. Devient l'opposé de toi.",
  },
];

export function getCircle(idx: number): CircleDef {
  return CIRCLES[Math.max(0, Math.min(CIRCLES.length - 1, idx))];
}

// Pactes du Marché de l'Âme (legacy — kept for back-compat)
export interface PacteOffer {
  id: string;
  name: string;
  description: string;
  costAxis: Axis;
  costAmount: number;
  effect: "boostNextCircle" | "restoreWeakest" | "resetAllAxes";
  effectValue?: number;
}

export const MARCHE_OFFERS: PacteOffer[] = [
  {
    id: "pacte-vide",
    name: "Pacte du Vide",
    description: "Cartes coûtent -3 au prochain cercle.",
    costAxis: "Temperance",
    costAmount: 15,
    effect: "boostNextCircle",
    effectValue: 3,
  },
  {
    id: "souffle-air",
    name: "Souffle d'air",
    description: "Restaure +20 sur ton axe le plus faible.",
    costAxis: "Foi",
    costAmount: 10,
    effect: "restoreWeakest",
    effectValue: 20,
  },
  {
    id: "effacer-souvenir",
    name: "Effacer un souvenir",
    description: "Tous tes axes reviennent à 50. Tu oublies une carte.",
    costAxis: "Force",
    costAmount: 5,
    effect: "resetAllAxes",
  },
];
