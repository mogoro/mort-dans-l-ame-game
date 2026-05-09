// C.2 — reliques permanentes débloquées par achievements
import { GameState, persistRelics, type Relic } from "./GameState";

export const RELICS_DEFS: Omit<Relic, "active">[] = [
  { id: "relic-coin",       name: "Pièce de Charon",
    description: "+10 or au début de chaque run.",
    unlockedBy: "first-victory",
    effect: "start_gold_10" },
  { id: "relic-feather",    name: "Plume d'argent",
    description: "Premier combat de la run : pioche +1.",
    unlockedBy: "five-runs",
    effect: "first_combat_draw_1" },
  { id: "relic-skull",      name: "Crâne Mémoriel",
    description: "+1 page Codex par victoire.",
    unlockedBy: "twenty-runs",
    effect: "extra_codex_page" },
  { id: "relic-thread",     name: "Fil rouge",
    description: "Permet de garder 1 carte d'une run vaincue dans la suivante.",
    unlockedBy: "no-sacrifice",
    effect: "carry_over_card" },
  { id: "relic-ring",       name: "Anneau du Tiède",
    description: "Si tous tes axes sont équilibrés, +20 HP combat.",
    unlockedBy: "all-balance",
    effect: "balanced_hp_20" },
  { id: "relic-crown",      name: "Couronne du Saint",
    description: "Tes vertus comptent +5 supplémentaires.",
    unlockedBy: "pure-saint",
    effect: "virtues_plus_5" },
  { id: "relic-fang",       name: "Croc du Damné",
    description: "Tes péchés comptent +5 supplémentaires.",
    unlockedBy: "pure-coupable",
    effect: "sins_plus_5" },
];

// C.2 — débloque une relique sur achievement
export function unlockRelic(achId: string): Relic | null {
  const def = RELICS_DEFS.find((r) => r.unlockedBy === achId);
  if (!def) return null;
  if (GameState.relics.find((r) => r.id === def.id)) return null;
  const relic: Relic = { ...def, active: true };
  GameState.relics.push(relic);
  persistRelics();
  return relic;
}

// C.2 — vérifie si une relique active a un effet
export function hasRelic(effect: string): boolean {
  return GameState.relics.some((r) => r.active && r.effect === effect);
}
