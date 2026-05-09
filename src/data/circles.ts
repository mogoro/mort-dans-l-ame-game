// Les 7 cercles dantesques avec règles asymétriques + boss
import type { Axis } from "./events";

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
  // Couleurs background dégradé
  bgTop: number;
  bgBot: number;
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
    rule: "Tes cartes Luxure t'attaquent au lieu d'attaquer.",
    flavor: "Le vent souffle. Tu vois passer ceux que tu as désirés. Ils ne te regardent plus.",
    bgTop: 0x1a0a14,
    bgBot: 0x3a1428,
  },
  {
    id: 1,
    name: "Gourmandise",
    axis: "Gourmandise",
    bossName: "Cerbère",
    bossAtk: 5,
    bossHp: 35,
    bossEmoji: "🐺",
    rule: "Tu défausses 1 carte par tour qu'il dévore (+1 ATK).",
    flavor: "La pluie est sale. Tu marches dans la boue. Ton ventre te trahit.",
    bgTop: 0x1a1206,
    bgBot: 0x3a2818,
  },
  {
    id: 2,
    name: "Avarice",
    axis: "Avarice",
    bossName: "Plutos",
    bossAtk: 7,
    bossHp: 32,
    bossEmoji: "👹",
    rule: "Tes points de Charité gelés à 0 jusqu'à le vaincre.",
    flavor: "L'or pèse. Tu te bats avec ce que tu n'as pas su lâcher.",
    bgTop: 0x1a1408,
    bgBot: 0x3a2810,
  },
  {
    id: 3,
    name: "Colère",
    axis: "Colere",
    bossName: "Phlégias",
    bossAtk: 4,
    bossHp: 40,
    bossEmoji: "😡",
    rule: "Sa colère monte : +1 ATK à chaque carte que tu joues.",
    flavor: "Le fleuve bouillonne. Tu reconnais les cris.",
    bgTop: 0x1a0606,
    bgBot: 0x3a1414,
  },
  {
    id: 4,
    name: "Paresse",
    axis: "Paresse",
    bossName: "Acédie",
    bossAtk: 3,
    bossHp: 30,
    bossEmoji: "💀",
    rule: "Tu pioches 1 carte de moins par tour.",
    flavor: "L'air est lourd. Tu pourrais juste t'asseoir. Ne fais surtout pas ça.",
    bgTop: 0x0e1a26,
    bgBot: 0x202c3a,
  },
  {
    id: 5,
    name: "Envie",
    axis: "Envie",
    bossName: "Sœurs d'Envie",
    bossAtk: 6,
    bossHp: 36,
    bossEmoji: "🧙",
    rule: "Elles copient ta carte la plus puissante chaque tour.",
    flavor: "Elles te ressemblent. Elles te ressemblent trop.",
    bgTop: 0x0e1a14,
    bgBot: 0x1a3022,
  },
  {
    id: 6,
    name: "Orgueil",
    axis: "Orgueil",
    bossName: "Lucifer",
    bossAtk: 8,
    bossHp: 60,
    bossEmoji: "😈",
    rule: "PV ×4. Le boss final. Tu t'inclines pour la première fois.",
    flavor: "Tu t'inclines pour la première fois.",
    bgTop: 0x1a0a14,
    bgBot: 0x2a1428,
  },
];

export function getCircle(idx: number): CircleDef {
  return CIRCLES[Math.max(0, Math.min(CIRCLES.length - 1, idx))];
}

// Pactes du Marché de l'Âme (3.6, 3.7)
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
