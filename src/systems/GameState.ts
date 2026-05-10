// Singleton GameState — partagé entre les scènes
import { ALL_AXES, type Axis } from "../data/events";
import type { Card } from "../data/cards";
import { CARD_POOL, applyCardLevel} from "../data/cards";

interface CharacterConfig {
  style: string;       // DiceBear style : personas / lorelei-neutral / pixel-art / miniavs
  seed: string;
  hairColor: string;
  skinColor: string;
  eyesColor: string;
}

// A.3 — dette inter-combat (déclenche au boss)
export interface DebtEntry {
  id: string;
  reason: string;          // "Tu as triché à ADO-04"
  trigger: "next_boss" | "any_combat";
  effect: "extra_enemy" | "axis_drain" | "force_sacrifice";
  resolved: boolean;
}

// I.1 — empreinte permanente : compteur global cartes × axe
export interface Imprint {
  cardUsageTotal: Record<string, number>;  // cardId -> total uses cross-runs
  permanentBoosts: Partial<Record<Axis, number>>;  // axe -> +pts permanents
}

// C.3 — arbre talents 5 disciplines
export type Discipline = "Guerre" | "Sagesse" | "Compassion" | "Calme" | "Foi";

export interface TalentState {
  points: number;
  unlocked: Record<Discipline, number>;  // niveau atteint dans chaque discipline 0..3
}

// F.3 — PNJ persistants
export interface NPC {
  id: string;
  name: string;
  relation: number;     // -100..+100
  alive: boolean;
  appearances: string[]; // codes events où le PNJ est apparu
}

// F.9 — choix qui marquent et impactent plus tard
export interface PersistentChoice {
  eventCode: string;
  optionIndex: number;
  tag: string;          // "menteur", "tricheur", "fidele", "lacheur"...
}

// A.6 — mémoire du Juge entre runs
export interface JudgeMemory {
  totalRuns: number;
  lastEnding: Ending | null;
  recentChoices: string[];   // tags des derniers choix
  combatLog: Array<{ circle: number; result: "victory" | "defeat" }>;
}

// A.10 — 4 fins
export type Ending = "Saint" | "Damne" | "Rebelle" | "Tiede";

// C.5 — verrouillage d'événements (mort permanente narrative)
export interface EventLock {
  eventCode: string;
  deathCount: number;     // nombre de fois où on est mort à cause de cet event
  locked: boolean;        // verrouillé une fois 3
}

// C.2 — reliques permanentes
export interface Relic {
  id: string;
  name: string;
  description: string;
  unlockedBy: string;       // achievement id
  active: boolean;
  effect: string;
}

// F.10 — PNJ rencontrés dans les cercles
export interface CirclePNJ {
  circleId: number;
  name: string;
  relation: string;     // "ton frère perdu", "ta première amante"
  message: string;
}

// E.5 — malédiction du deck
export interface Curse {
  id: string;
  name: string;
  effect: string;       // texte narratif
  permBoost: { axis: Axis; amount: number };
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
  // E.1 — or
  gold: number;
  // A.3 — dette
  debts: DebtEntry[];
  // I.1 — empreinte (persistante)
  imprint: Imprint;
  // C.3 — talents (persistant)
  talents: TalentState;
  // C.2 — reliques (persistant)
  relics: Relic[];
  // C.4 — NG+
  ngPlus: number;
  // A.10 — fin atteinte
  ending: Ending | null;
  // C.5 — verrous d'events
  eventLocks: EventLock[];
  // C.1 — pages du codex (persistant)
  codexPages: number;
  // A.6 — mémoire Juge (persistant)
  judgeMemory: JudgeMemory;
  // F.3 — PNJ persistants
  npcs: NPC[];
  // F.9 — choix marquants
  persistentChoices: PersistentChoice[];
  // F.10 — PNJ par cercle
  circlePnjs: CirclePNJ[];
  // E.5 — malédictions actives
  curses: Curse[];
  // currentCircle dans la run
  currentCircle: number;
}

const CHAR_DEFAULT: CharacterConfig = {
  style: "personas",
  seed: "joueur-1",
  hairColor: "8b4513",
  skinColor: "ecad80",
  eyesColor: "5c3a26",
};

const TALENT_DEFAULT: TalentState = {
  points: 0,
  unlocked: { Guerre: 0, Sagesse: 0, Compassion: 0, Calme: 0, Foi: 0 },
};

const IMPRINT_DEFAULT: Imprint = {
  cardUsageTotal: {},
  permanentBoosts: {},
};

const JUDGE_MEMORY_DEFAULT: JudgeMemory = {
  totalRuns: 0,
  lastEnding: null,
  recentChoices: [],
  combatLog: [],
};

// Wrapper safe pour Node/test sans localStorage
const ls = {
  getItem(key: string): string | null {
    try {
      if (typeof localStorage === "undefined") return null;
      return localStorage.getItem(key);
    } catch { return null; }
  },
  setItem(key: string, value: string): void {
    try {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(key, value);
    } catch {}
  },
  removeItem(key: string): void {
    try {
      if (typeof localStorage === "undefined") return;
      localStorage.removeItem(key);
    } catch {}
  },
};

// Restaure character config persisté
function loadCharacter(): CharacterConfig {
  try {
    const raw = ls.getItem("mortdansl-character");
    if (raw) return { ...CHAR_DEFAULT, ...JSON.parse(raw) };
  } catch {}
  return { ...CHAR_DEFAULT };
}

function loadPersistent<T>(key: string, fallback: T): T {
  try {
    const raw = ls.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

function loadArray<T>(key: string): T[] {
  try {
    const raw = ls.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const GameState: GameStateData = {
  profile: ALL_AXES.reduce((acc, a) => {
    acc[a] = 50;
    return acc;
  }, {} as Record<Axis, number>),
  deck: [],
  character: loadCharacter(),
  gold: 0,
  debts: [],
  imprint: loadPersistent("mortdansl-imprint", IMPRINT_DEFAULT),
  talents: loadPersistent("mortdansl-talents", TALENT_DEFAULT),
  relics: loadArray("mortdansl-relics"),
  ngPlus: parseInt(ls.getItem("mortdansl-ngplus") || "0", 10),
  ending: null,
  eventLocks: loadArray("mortdansl-event-locks"),
  codexPages: parseInt(ls.getItem("mortdansl-codex-pages") || "0", 10),
  judgeMemory: loadPersistent("mortdansl-judge-memory", JUDGE_MEMORY_DEFAULT),
  npcs: [],
  persistentChoices: [],
  circlePnjs: [],
  curses: [],
  currentCircle: 0,
};

export function persistCharacter(): void {
  ls.setItem("mortdansl-character", JSON.stringify(GameState.character));
}

// I.1 — sauvegarde empreinte cumulée
export function persistImprint(): void {
  ls.setItem("mortdansl-imprint", JSON.stringify(GameState.imprint));
}

// C.3 — sauvegarde talents
export function persistTalents(): void {
  ls.setItem("mortdansl-talents", JSON.stringify(GameState.talents));
}

// C.2 — sauvegarde reliques
export function persistRelics(): void {
  ls.setItem("mortdansl-relics", JSON.stringify(GameState.relics));
}

// C.4 — incrémente NG+
export function incrementNGPlus(): void {
  GameState.ngPlus++;
  ls.setItem("mortdansl-ngplus", String(GameState.ngPlus));
}

// C.5 — verrouillage event
export function recordDeathFromEvent(eventCode: string): void {
  let lock = GameState.eventLocks.find((l) => l.eventCode === eventCode);
  if (!lock) {
    lock = { eventCode, deathCount: 0, locked: false };
    GameState.eventLocks.push(lock);
  }
  lock.deathCount++;
  if (lock.deathCount >= 3) lock.locked = true;
  ls.setItem("mortdansl-event-locks", JSON.stringify(GameState.eventLocks));
}

// C.1 — incrémente codex page
export function addCodexPage(): void {
  GameState.codexPages++;
  ls.setItem("mortdansl-codex-pages", String(GameState.codexPages));
}

// A.6 — persistance mémoire Juge
export function persistJudgeMemory(): void {
  ls.setItem("mortdansl-judge-memory", JSON.stringify(GameState.judgeMemory));
}

export function buildAvatarUrl(size = 128): string {
  const c = GameState.character;
  const params = new URLSearchParams({
    seed: c.seed,
    backgroundColor: "transparent",
    size: String(size * 2),
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

// Détermine la "nature" du profil
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

// A.10 — détermine la fin
export function computeEnding(): Ending {
  const SINS: Axis[] = ["Orgueil", "Avarice", "Luxure", "Envie", "Gourmandise", "Colere", "Paresse"];
  const VIRTUES: Axis[] = ["Foi", "Esperance", "Charite", "Prudence", "Justice", "Force", "Temperance"];
  const sinsHigh = SINS.filter((a) => GameState.profile[a] > 75).length;
  const virtuesHigh = VIRTUES.filter((a) => GameState.profile[a] > 75).length;
  const allBalanced = ALL_AXES.every((a) => GameState.profile[a] >= 40 && GameState.profile[a] <= 60);

  if (virtuesHigh >= 4) return "Saint";
  if (sinsHigh >= 4) return "Damne";
  if (allBalanced) return "Tiede";
  return "Rebelle";
}

export function setNeutralProfile(): void {
  ALL_AXES.forEach((a) => { GameState.profile[a] = 55; });
}

export function applyDelta(axis: Axis, delta: number): void {
  // I.1 — appliquer aussi le boost permanent d'empreinte
  const imprintBonus = GameState.imprint.permanentBoosts[axis] || 0;
  const max = 100 + imprintBonus;
  GameState.profile[axis] = Math.max(0, Math.min(max, GameState.profile[axis] + delta));
}

// I.1 — registre une carte jouée et update l'empreinte permanente
export function registerCardPlay(card: Card): void {
  const id = card.id;
  GameState.imprint.cardUsageTotal[id] = (GameState.imprint.cardUsageTotal[id] || 0) + 1;
  const total = GameState.imprint.cardUsageTotal[id];
  // Toutes les 10 utilisations cumulées : +5 perm sur l'axe lié
  if (total > 0 && total % 10 === 0 && card.imprintAxisBoost) {
    const axis = card.imprintAxisBoost;
    GameState.imprint.permanentBoosts[axis] = (GameState.imprint.permanentBoosts[axis] || 0) + 5;
  }
  persistImprint();
}

// G.2 — limite deck à 15
export const DECK_MAX_SIZE = 15;

// I.2 — Pacte du Conteur : retire toutes les cartes liées à un axe
export function pactDuConteur(axisToErase: Axis): { lostCards: number; powerGained: string } {
  const before = GameState.deck.length;
  GameState.deck = GameState.deck.filter((c) => c.axis !== axisToErase);
  const lost = before - GameState.deck.length;
  // Compense le profil
  GameState.profile[axisToErase] = 30;
  return {
    lostCards: lost,
    powerGained: `Tu n'as jamais été ${axisToErase}.`,
  };
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
      deck.push({ ...pool[0], usesCount: 0 });
      if (pool.length > 1) deck.push({ ...pool[1], usesCount: 0 });
    }
  });

  // Compléter avec Foi pour atteindre 5
  while (deck.length < 5) {
    deck.push({ ...CARD_POOL.Foi[0], usesCount: 0 });
  }

  // I.1 — appliquer niveaux d'empreinte (ici on copie usesCount cumulés)
  return deck.slice(0, 5).map((c) => {
    const totalUses = GameState.imprint.cardUsageTotal[c.id] || 0;
    const withLevel = applyCardLevel({ ...c, usesCount: totalUses });
    return withLevel;
  });
}

// G.4 — synthèse de 2 cartes en 1
export function synthesizeCards(cardA: Card, cardB: Card): Card {
  const sigils = Array.from(new Set([...(cardA.sigils || []), ...(cardB.sigils || [])])).slice(0, 3) as any;
  return {
    id: `synth-${cardA.id}-${cardB.id}`,
    name: `${cardA.name.split(" ")[0]} ${cardB.name.split(" ")[1] || cardB.name}`,
    axis: cardA.axis,
    cost: Math.round((cardA.cost + cardB.cost) / 2) + 2,
    atk: Math.max(cardA.atk, cardB.atk) + 1,
    hp: Math.max(cardA.hp, cardB.hp) + 1,
    effect: "Synthèse — combine les sigils des deux cartes.",
    sigils,
    emoji: cardA.emoji,
    flavor: "Deux ne sont qu'une.",
  };
}

// Snapshot de l'état de run (pour save complet)
export function snapshotRun(resumeAt: "Life" | "DeckReveal" | "Combat" | "Outcome" | "Rest" | "Market") {
  return {
    resumeAt,
    ts: Date.now(),
    profile: { ...GameState.profile },
    deck: GameState.deck.map((c) => ({ ...c })),
    gold: GameState.gold,
    debts: [...GameState.debts],
    npcs: GameState.npcs.map((n) => ({ ...n })),
    persistentChoices: [...GameState.persistentChoices],
    circlePnjs: [...GameState.circlePnjs],
    curses: [...GameState.curses],
    currentCircle: GameState.currentCircle,
    outcome: GameState.outcome,
  };
}

// Restaure une run depuis un snapshot
export function restoreRun(snap: any): void {
  if (!snap) return;
  if (snap.profile) GameState.profile = { ...GameState.profile, ...snap.profile };
  if (snap.deck) GameState.deck = snap.deck;
  if (typeof snap.gold === "number") GameState.gold = snap.gold;
  if (snap.debts) GameState.debts = snap.debts;
  if (snap.npcs) GameState.npcs = snap.npcs;
  if (snap.persistentChoices) GameState.persistentChoices = snap.persistentChoices;
  if (snap.circlePnjs) GameState.circlePnjs = snap.circlePnjs;
  if (snap.curses) GameState.curses = snap.curses;
  if (typeof snap.currentCircle === "number") GameState.currentCircle = snap.currentCircle;
  if (snap.outcome) GameState.outcome = snap.outcome;
}

// Reset à la fin d'une run (mais conserve persistants : codex, talents, reliques, ngPlus, judgeMemory, imprint)
export function resetForNewRun(): void {
  GameState.gold = 0;
  GameState.debts = [];
  GameState.npcs = [];
  GameState.persistentChoices = [];
  GameState.circlePnjs = [];
  GameState.curses = [];
  GameState.currentCircle = 0;
  GameState.outcome = undefined;
  GameState.combatStats = undefined;
  GameState.ending = null;
  GameState.deck = [];
  // Profile reset
  ALL_AXES.forEach((a) => { GameState.profile[a] = 50; });
  // Clean run cache
  delete (GameState as any).lastCombatCards;
  delete (GameState as any).nextDrawBonus;
  delete (GameState as any).nextCostDiscount;
  delete (GameState as any).nextHpHeal;
  delete (GameState as any).bonusRelicNextRun;
}
