// C.3 — arbre de talents 5 disciplines
import { GameState, persistTalents, type Discipline } from "./GameState";

export interface TalentNode {
  discipline: Discipline;
  level: number;
  name: string;
  description: string;
  effect: string;
}

export const TALENT_TREE: TalentNode[] = [
  // GUERRE
  { discipline: "Guerre", level: 1, name: "Bras ferme",   description: "+1 ATK aux cartes Force",
    effect: "force_atk_1" },
  { discipline: "Guerre", level: 2, name: "Sans pitié",   description: "+15% dégâts au boss",
    effect: "boss_damage_15" },
  { discipline: "Guerre", level: 3, name: "Maître d'arme", description: "Toutes cartes -1 cost",
    effect: "all_cost_minus_1" },
  // SAGESSE
  { discipline: "Sagesse", level: 1, name: "Œil clair",   description: "Pioche +1 au début",
    effect: "draw_plus_1" },
  { discipline: "Sagesse", level: 2, name: "Lecture du ciel", description: "Voir 2 cartes pioche au lieu de 1",
    effect: "draw_choice_2" },
  { discipline: "Sagesse", level: 3, name: "Prescience",  description: "Voir 3 cartes pioche",
    effect: "draw_choice_3" },
  // COMPASSION
  { discipline: "Compassion", level: 1, name: "Main tendue", description: "+5 HP départ combat",
    effect: "start_hp_5" },
  { discipline: "Compassion", level: 2, name: "Cœur vaste", description: "+10 HP départ combat",
    effect: "start_hp_10" },
  { discipline: "Compassion", level: 3, name: "Ouverture",  description: "Soigne 2 par carte alliée jouée",
    effect: "heal_per_card" },
  // CALME
  { discipline: "Calme", level: 1, name: "Souffle",       description: "Reroll +1 par combat",
    effect: "reroll_plus_1" },
  { discipline: "Calme", level: 2, name: "Recul",         description: "1 carte rejouée gratis si survit",
    effect: "free_replay_1" },
  { discipline: "Calme", level: 3, name: "Rayonnement",   description: "Boss perd 5% HP/tour",
    effect: "boss_decay_5" },
  // FOI
  { discipline: "Foi", level: 1, name: "Lueur",           description: "+5 dans l'axe le plus faible",
    effect: "weakest_plus_5" },
  { discipline: "Foi", level: 2, name: "Promesse",        description: "Reviens à 1 HP la première fois que tu meurs (1×/run)",
    effect: "second_chance" },
  { discipline: "Foi", level: 3, name: "Grâce",           description: "Évite la dette de la prochaine défaite",
    effect: "no_debt_next" },
];

// C.3 — gain de points de talent en victoire
export function awardTalentPoint(): void {
  GameState.talents.points++;
  persistTalents();
}

// C.3 — dépense un point dans une discipline
export function spendTalent(discipline: Discipline): boolean {
  if (GameState.talents.points <= 0) return false;
  const current = GameState.talents.unlocked[discipline];
  if (current >= 3) return false;
  GameState.talents.unlocked[discipline]++;
  GameState.talents.points--;
  persistTalents();
  return true;
}

// C.3 — vérifie si un effet est actif
export function hasTalentEffect(effect: string): boolean {
  return TALENT_TREE.some((t) =>
    t.effect === effect &&
    GameState.talents.unlocked[t.discipline] >= t.level
  );
}

// C.3 — récupère niveau dans discipline
export function talentLevel(discipline: Discipline): number {
  return GameState.talents.unlocked[discipline];
}
