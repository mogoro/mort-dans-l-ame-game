// Singleton GameState — partagé entre les scènes
import { ALL_AXES, type Axis } from "../data/events";
import type { Card } from "../data/cards";
import { CARD_POOL } from "../data/cards";

interface GameStateData {
  profile: Record<Axis, number>;
  deck: Card[];
  outcome?: "victory" | "defeat";
  combatStats?: {
    turns: number;
    cardsSacrificed: number;
    axesRemaining: number;
  };
}

export const GameState: GameStateData = {
  profile: ALL_AXES.reduce((acc, a) => {
    acc[a] = 50;
    return acc;
  }, {} as Record<Axis, number>),
  deck: [],
};

export function applyDelta(axis: Axis, delta: number): void {
  GameState.profile[axis] = Math.max(0, Math.min(100, GameState.profile[axis] + delta));
}

export function buildInitialDeck(): Card[] {
  const distances = ALL_AXES.map((axis) => ({
    axis,
    score: GameState.profile[axis],
    distance: Math.abs(GameState.profile[axis] - 50),
  })).sort((a, b) => b.distance - a.distance);

  const top3 = distances.slice(0, 3);
  const deck: Card[] = [];
  top3.forEach(({ axis }) => {
    const pool = CARD_POOL[axis];
    if (pool && pool.length > 0) {
      deck.push(pool[0]);
      if (pool.length > 1) deck.push(pool[1]);
    }
  });

  // Compléter avec Foi/Souffle pour atteindre 5
  while (deck.length < 5) {
    deck.push({ ...CARD_POOL.Foi[0] });
  }

  return deck.slice(0, 5);
}
