// Singleton GameState — partagé entre les scènes
import { ALL_AXES, type Axis } from "../data/events";
import type { Card } from "../data/cards";
import { CARD_POOL } from "../data/cards";

interface CharacterConfig {
  style: string;       // DiceBear style : personas / lorelei-neutral / pixel-art / miniavs
  seed: string;
  hairColor: string;   // hex sans #
  skinColor: string;
  eyesColor: string;
}

interface GameStateData {
  profile: Record<Axis, number>;
  deck: Card[];
  outcome?: "victory" | "defeat";
  combatStats?: {
    turns: number;
    cardsSacrificed: number;
    axesRemaining: number;
  };
  character: CharacterConfig;
}

const CHAR_DEFAULT: CharacterConfig = {
  style: "personas",
  seed: "joueur-1",
  hairColor: "8b4513",
  skinColor: "ecad80",
  eyesColor: "5c3a26",
};

// Restaure character config persisté
function loadCharacter(): CharacterConfig {
  try {
    const raw = localStorage.getItem("mortdansl-character");
    if (raw) return { ...CHAR_DEFAULT, ...JSON.parse(raw) };
  } catch {}
  return { ...CHAR_DEFAULT };
}

export const GameState: GameStateData = {
  profile: ALL_AXES.reduce((acc, a) => {
    acc[a] = 50;
    return acc;
  }, {} as Record<Axis, number>),
  deck: [],
  character: loadCharacter(),
};

export function persistCharacter(): void {
  try { localStorage.setItem("mortdansl-character", JSON.stringify(GameState.character)); } catch {}
}

export function buildAvatarUrl(size = 128): string {
  const c = GameState.character;
  const params = new URLSearchParams({
    seed: c.seed,
    backgroundColor: "transparent",
    size: String(size * 2),  // HD
  });
  if (c.style === "pixel-art") {
    params.append("hairColor", c.hairColor);
    params.append("skinColor", c.skinColor);
    params.append("eyesColor", c.eyesColor);
  } else if (c.style === "personas") {
    params.append("hairColor", c.hairColor);
    params.append("skinColor", c.skinColor);
  } else if (c.style === "lorelei-neutral") {
    params.append("hairColor", c.hairColor);
    params.append("skinColor", c.skinColor);
    params.append("eyesColor", c.eyesColor);
  }
  return `https://api.dicebear.com/9.x/${c.style}/png?${params.toString()}`;
}

// Détermine la "nature" du profil (positif/negatif/neutre)
export function getProfileNature(): "ombre" | "lumiere" | "neutre" {
  const SINS_LIST: Axis[] = ["Orgueil", "Avarice", "Luxure", "Envie", "Gourmandise", "Colere", "Paresse"];
  const VIRTUES_LIST: Axis[] = ["Foi", "Esperance", "Charite", "Prudence", "Justice", "Force", "Temperance"];
  const sinsTotal = SINS_LIST.reduce((s, a) => s + (GameState.profile[a] || 50), 0);
  const virtuesTotal = VIRTUES_LIST.reduce((s, a) => s + (GameState.profile[a] || 50), 0);
  const diff = sinsTotal - virtuesTotal;
  if (diff > 30) return "ombre";
  if (diff < -30) return "lumiere";
  return "neutre";
}

export function setNeutralProfile(): void {
  ALL_AXES.forEach((a) => { GameState.profile[a] = 55; });
}

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
