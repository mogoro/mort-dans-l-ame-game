// A.1 — coût narratif : certaines cartes coûtent un PNJ allié, un souvenir, un trait du profil
import { GameState, type NPC } from "./GameState";
import type { Card } from "../data/cards";
import type { Axis } from "../data/events";

export interface NarrativeCostPayment {
  paid: boolean;
  message: string;
}

export function tryPayNarrativeCost(card: Card): NarrativeCostPayment {
  if (!card.narrativeCost) return { paid: true, message: "" };

  const cost = card.narrativeCost;
  switch (cost.type) {
    case "axis_drop": {
      const axis = card.axis;
      if (GameState.profile[axis] < cost.value) {
        return { paid: false, message: `Pas assez de ${axis} pour cette carte.` };
      }
      GameState.profile[axis] -= cost.value;
      return { paid: true, message: `${axis} -${cost.value} : ${cost.label}` };
    }
    case "npc_loss": {
      const npc = GameState.npcs.find((n) => n.alive);
      if (!npc) return { paid: false, message: "Personne à qui dire adieu." };
      npc.alive = false;
      return { paid: true, message: `${npc.name} a disparu. Pour cette carte.` };
    }
    case "memory": {
      // Souvenir = -1 page de codex (tu effaces une page pour jouer)
      if (GameState.codexPages <= 0) {
        return { paid: false, message: "Tu n'as plus rien à oublier." };
      }
      GameState.codexPages--;
      try { localStorage.setItem("mortdansl-codex-pages", String(GameState.codexPages)); } catch {}
      return { paid: true, message: `Un souvenir s'efface. ${cost.label}` };
    }
    default:
      return { paid: true, message: "" };
  }
}

// A.1 — applique un coût narratif à une carte (cartes spéciales du shop)
export function applyNarrativeCost(card: Card, type: "memory" | "axis_drop" | "npc_loss"): Card {
  const labels: Record<typeof type, { value: number; label: string }> = {
    memory:    { value: 1,  label: "Coûte un souvenir." },
    axis_drop: { value: 10, label: "Coûte 10 pts de l'axe." },
    npc_loss:  { value: 1,  label: "Coûte un PNJ allié." },
  };
  return {
    ...card,
    narrativeCost: { type, ...labels[type] },
  };
}
