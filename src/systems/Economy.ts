// Économie de run — E.1 or, E.2 repos, E.3 marchés dyn, E.4 risk/reward, E.5 maudire, A.3 dette
import { GameState, type DebtEntry, type Curse } from "./GameState";
import type { Axis } from "../data/events";

// E.1 — gain d'or par victoire (modulé par cercle)
export function awardGold(circleIdx: number, victory: boolean): number {
  if (!victory) return 0;
  const base = 15 + circleIdx * 5;
  const variance = Math.floor(Math.random() * 8);
  const gain = base + variance;
  GameState.gold += gain;
  return gain;
}

// E.2 — repos : -X axe pour +50% HP au prochain combat
export function takeRest(axisToSpend: Axis): { applied: boolean; healPct: number } {
  const cost = 8;
  if (GameState.profile[axisToSpend] < cost) return { applied: false, healPct: 0 };
  GameState.profile[axisToSpend] -= cost;
  return { applied: true, healPct: 0.5 };
}

// E.3 — marchés dynamiques : pool de 20 offres, 3 tirées
export interface MarketOffer {
  id: string;
  name: string;
  description: string;
  goldCost: number;
  effect:
    | { type: "axis_boost"; axis: Axis; amount: number }
    | { type: "remove_card"; index?: number }
    | { type: "consecrate_card" }
    | { type: "heal_full" }
    | { type: "draw_more" }
    | { type: "discount_next" }
    | { type: "extra_relic_chance" }
    | { type: "duplicate_card" }
    | { type: "convert_axis"; from: Axis; to: Axis };
}

export const MARKET_POOL: MarketOffer[] = [
  { id: "m1", name: "Souffle d'âme",     description: "+10 sur ton axe le plus faible.", goldCost: 10,
    effect: { type: "axis_boost", axis: "Foi", amount: 10 } },
  { id: "m2", name: "Oubli de soi",      description: "Retire une carte du deck.",       goldCost: 12,
    effect: { type: "remove_card" } },
  { id: "m3", name: "Consécration",      description: "Consacre une carte (+ATK +HP).",  goldCost: 25,
    effect: { type: "consecrate_card" } },
  { id: "m4", name: "Bain rituel",       description: "Soigne complètement.",            goldCost: 15,
    effect: { type: "heal_full" } },
  { id: "m5", name: "Verre vu",          description: "Pioche +1 par tour combat suivant.", goldCost: 18,
    effect: { type: "draw_more" } },
  { id: "m6", name: "Ristourne du Marchand", description: "-2 coût toutes cartes prochain combat.", goldCost: 14,
    effect: { type: "discount_next" } },
  { id: "m7", name: "Talisman volé",     description: "+10 Force.",                      goldCost: 8,
    effect: { type: "axis_boost", axis: "Force", amount: 10 } },
  { id: "m8", name: "Larme partagée",    description: "+10 Charité.",                    goldCost: 8,
    effect: { type: "axis_boost", axis: "Charite", amount: 10 } },
  { id: "m9", name: "Couronne d'épines", description: "+15 Foi mais -5 Orgueil.",        goldCost: 6,
    effect: { type: "axis_boost", axis: "Foi", amount: 15 } },
  { id: "m10", name: "Sceau d'Or",       description: "Duplique une carte du deck.",     goldCost: 30,
    effect: { type: "duplicate_card" } },
  { id: "m11", name: "Relique Mineure",  description: "Tirage de relique faible.",       goldCost: 20,
    effect: { type: "extra_relic_chance" } },
  { id: "m12", name: "Conversion d'âme", description: "Transfert 10pts entre 2 axes.",   goldCost: 12,
    effect: { type: "convert_axis", from: "Paresse", to: "Force" } },
  { id: "m13", name: "Chant d'Hespérie", description: "+10 Espérance.",                  goldCost: 8,
    effect: { type: "axis_boost", axis: "Esperance", amount: 10 } },
  { id: "m14", name: "Sang noir",        description: "+10 Colère.",                     goldCost: 6,
    effect: { type: "axis_boost", axis: "Colere", amount: 10 } },
  { id: "m15", name: "Sceau de Justice", description: "+10 Justice.",                    goldCost: 8,
    effect: { type: "axis_boost", axis: "Justice", amount: 10 } },
  { id: "m16", name: "Pacte du Vide",    description: "+10 Tempérance, -3 sur tous les autres.", goldCost: 6,
    effect: { type: "axis_boost", axis: "Temperance", amount: 10 } },
  { id: "m17", name: "Vœu de pauvreté",  description: "+15 Foi (ne peut être annulé).",  goldCost: 4,
    effect: { type: "axis_boost", axis: "Foi", amount: 15 } },
  { id: "m18", name: "Lame brisée",      description: "+12 Force, deck +1 carte maudite.", goldCost: 5,
    effect: { type: "axis_boost", axis: "Force", amount: 12 } },
  { id: "m19", name: "Œil aiguisé",      description: "+10 Prudence.",                   goldCost: 7,
    effect: { type: "axis_boost", axis: "Prudence", amount: 10 } },
  { id: "m20", name: "Coupe partagée",   description: "Heal complet + +5 Charité.",      goldCost: 22,
    effect: { type: "heal_full" } },
];

// E.3 — tire 3 offres aléatoires en filtrant par cercle
export function rollMarketOffers(circleIdx: number): MarketOffer[] {
  const pool = [...MARKET_POOL];
  // Cercles élevés = offres plus chères
  const adjusted = pool.map((o) => ({
    ...o,
    goldCost: Math.round(o.goldCost * (1 + circleIdx * 0.1)),
  }));
  // Shuffle + tirage 3
  for (let i = adjusted.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [adjusted[i], adjusted[j]] = [adjusted[j], adjusted[i]];
  }
  return adjusted.slice(0, 3);
}

// E.4 — risk/reward : combat élite
export interface EliteEncounter {
  bossHpMul: number;
  bossAtkMul: number;
  rewards: number;       // 1 = normal, 2 = élite
  goldBonus: number;
}

export function rollEliteOption(): EliteEncounter {
  return {
    bossHpMul: 1.5,
    bossAtkMul: 1.3,
    rewards: 2,
    goldBonus: 25,
  };
}

// E.5 — maudire son deck pour gagner avantage permanent dans la run
export const CURSE_OPTIONS: Array<Omit<Curse, "id"> & { id: string }> = [
  { id: "curse-vow",    name: "Vœu Empoisonné",  effect: "+15 Foi permanent run.",
    permBoost: { axis: "Foi", amount: 15 } },
  { id: "curse-debt",   name: "Dette ancienne",  effect: "+15 Avarice permanent run.",
    permBoost: { axis: "Avarice", amount: 15 } },
  { id: "curse-mirror", name: "Miroir brisé",    effect: "+15 Envie permanent run.",
    permBoost: { axis: "Envie", amount: 15 } },
];

// A.3 — ajoute une dette (déclenche au prochain boss)
export function addDebt(reason: string, effect: DebtEntry["effect"]): void {
  GameState.debts.push({
    id: `debt-${Date.now()}-${Math.random()}`,
    reason,
    trigger: "next_boss",
    effect,
    resolved: false,
  });
}

// A.3 — récupère les dettes actives pour un combat
export function pullActiveDebts(): DebtEntry[] {
  const active = GameState.debts.filter((d) => !d.resolved);
  return active;
}

// A.3 — résout une dette
export function resolveDebt(debtId: string): void {
  const d = GameState.debts.find((x) => x.id === debtId);
  if (d) d.resolved = true;
}
