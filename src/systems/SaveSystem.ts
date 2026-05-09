// Save/Stats persistance (items 7.1 save, 7.2 stats globales, 7.4 achievements, 7.9 score)
import type { Axis } from "../data/events";

const STATS_KEY = "mortdansl-stats";
const ACH_KEY = "mortdansl-achievements";

export interface GlobalStats {
  runsTotal: number;
  victories: number;
  defeats: number;
  totalChoices: number;
  axesCumulated: Record<Axis, number>;
  lastScore: number;
  bestScore: number;
}

const DEFAULT_STATS: GlobalStats = {
  runsTotal: 0,
  victories: 0,
  defeats: 0,
  totalChoices: 0,
  axesCumulated: {} as any,
  lastScore: 0,
  bestScore: 0,
};

export function loadStats(): GlobalStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { ...DEFAULT_STATS, axesCumulated: {} as any };
    return { ...DEFAULT_STATS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_STATS, axesCumulated: {} as any };
  }
}

export function saveStats(stats: GlobalStats): void {
  try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch {}
}

export function recordRunResult(result: "victory" | "defeat", profile: Record<Axis, number>, score: number): void {
  const s = loadStats();
  s.runsTotal++;
  if (result === "victory") s.victories++;
  else s.defeats++;
  s.lastScore = score;
  if (score > s.bestScore) s.bestScore = score;
  Object.entries(profile).forEach(([axis, val]) => {
    s.axesCumulated[axis as Axis] = (s.axesCumulated[axis as Axis] || 0) + val;
  });
  saveStats(s);
  checkAchievements(result, profile, score);
}

export function recordChoice(): void {
  const s = loadStats();
  s.totalChoices++;
  saveStats(s);
}

// Score calculation (7.9)
export function computeScore(opts: {
  victory: boolean;
  turnsUsed: number;
  cardsSacrificed: number;
  axesRemaining: number;
  difficulty: string;
}): number {
  let score = 0;
  if (opts.victory) score += 1000;
  score += Math.max(0, 200 - opts.turnsUsed * 10);
  score -= opts.cardsSacrificed * 30;
  score += opts.axesRemaining;
  if (opts.difficulty === "penible") score *= 1.5;
  if (opts.difficulty === "doux") score *= 0.7;
  return Math.round(score);
}

// Achievements (7.4 - 10 achievements)
export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
}

const ACHIEVEMENTS_DEFS: Omit<Achievement, "unlocked">[] = [
  { id: "first-run",     name: "Première vie",       description: "Termine ta première run." },
  { id: "first-victory", name: "Verdict suspendu",   description: "Vaincs Cléopâtre une fois." },
  { id: "no-sacrifice",  name: "Pas un de plus",     description: "Vaincs un boss sans sacrifier." },
  { id: "pure-saint",    name: "Le Saint",           description: "Termine avec 3 vertus à plus de 80." },
  { id: "pure-coupable", name: "Le Coupable",        description: "Termine avec 3 péchés à plus de 80." },
  { id: "pacifist",      name: "Pacifique",          description: "Vaincs Cléopâtre en mode pacifique." },
  { id: "penible",       name: "Pénible",            description: "Vaincs Cléopâtre en mode pénible." },
  { id: "five-runs",     name: "5 vies",             description: "Joue 5 runs." },
  { id: "twenty-runs",   name: "20 vies",            description: "Joue 20 runs." },
  { id: "all-balance",   name: "Le Tiède",           description: "Termine avec tous les axes entre 40 et 60." },
];

export function loadAchievements(): Achievement[] {
  try {
    const raw = localStorage.getItem(ACH_KEY);
    const unlockedIds: string[] = raw ? JSON.parse(raw) : [];
    return ACHIEVEMENTS_DEFS.map((a) => ({ ...a, unlocked: unlockedIds.includes(a.id) }));
  } catch {
    return ACHIEVEMENTS_DEFS.map((a) => ({ ...a, unlocked: false }));
  }
}

export function unlockAchievement(id: string): boolean {
  try {
    const raw = localStorage.getItem(ACH_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    if (ids.includes(id)) return false;
    ids.push(id);
    localStorage.setItem(ACH_KEY, JSON.stringify(ids));
    return true;
  } catch {
    return false;
  }
}

function checkAchievements(result: string, profile: Record<Axis, number>, score: number): string[] {
  const newly: string[] = [];
  const stats = loadStats();

  if (stats.runsTotal === 1 && unlockAchievement("first-run")) newly.push("Première vie");
  if (result === "victory" && unlockAchievement("first-victory")) newly.push("Verdict suspendu");
  if (stats.runsTotal >= 5 && unlockAchievement("five-runs")) newly.push("5 vies");
  if (stats.runsTotal >= 20 && unlockAchievement("twenty-runs")) newly.push("20 vies");

  const SINS = ["Orgueil", "Avarice", "Luxure", "Envie", "Gourmandise", "Colere", "Paresse"];
  const VIRTUES = ["Foi", "Esperance", "Charite", "Prudence", "Justice", "Force", "Temperance"];
  const sinsHigh = SINS.filter((a) => (profile[a as Axis] || 0) > 80).length;
  const virtuesHigh = VIRTUES.filter((a) => (profile[a as Axis] || 0) > 80).length;
  if (virtuesHigh >= 3 && unlockAchievement("pure-saint")) newly.push("Le Saint");
  if (sinsHigh >= 3 && unlockAchievement("pure-coupable")) newly.push("Le Coupable");

  const allBalanced = Object.values(profile).every((v) => v >= 40 && v <= 60);
  if (allBalanced && unlockAchievement("all-balance")) newly.push("Le Tiède");

  return newly;
}

// Save/Load run en cours (7.1 — basique)
const RUN_KEY = "mortdansl-current-run";
export function saveCurrentRun(state: any): void {
  try { localStorage.setItem(RUN_KEY, JSON.stringify(state)); } catch {}
}
export function loadCurrentRun(): any | null {
  try {
    const raw = localStorage.getItem(RUN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
export function clearCurrentRun(): void {
  try { localStorage.removeItem(RUN_KEY); } catch {}
}
