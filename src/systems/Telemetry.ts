// H.1 — logs anonymes opt-in
// H.2 — win-rate par carte
// H.3 — auto-équilibrage suggéré (interne)

import type { Axis } from "../data/events";

const TELEMETRY_KEY = "mortdansl-telemetry";
const OPTIN_KEY = "mortdansl-telemetry-optin";

export interface RunLog {
  ts: number;
  duration: number;
  result: "victory" | "defeat";
  cardsPlayed: string[];          // card ids
  cardsWonWith: string[];         // cards used in winning combats
  choices: Array<{ event: string; option: number }>;
  finalProfile: Record<Axis, number>;
  ending: string | null;
  difficulty: string;
}

export function isTelemetryOptin(): boolean {
  return localStorage.getItem(OPTIN_KEY) === "yes";
}

export function setTelemetryOptin(yes: boolean): void {
  localStorage.setItem(OPTIN_KEY, yes ? "yes" : "no");
}

export function logRun(log: RunLog): void {
  if (!isTelemetryOptin()) return;
  try {
    const raw = localStorage.getItem(TELEMETRY_KEY);
    const all: RunLog[] = raw ? JSON.parse(raw) : [];
    all.push(log);
    // Cap à 1000 runs locales pour pas exploser localStorage
    if (all.length > 1000) all.shift();
    localStorage.setItem(TELEMETRY_KEY, JSON.stringify(all));
  } catch {}
}

export function loadAllLogs(): RunLog[] {
  try {
    const raw = localStorage.getItem(TELEMETRY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// H.2 — win-rate par carte
export function computeCardWinRates(): Record<string, { plays: number; wins: number; rate: number }> {
  const logs = loadAllLogs();
  const stats: Record<string, { plays: number; wins: number; rate: number }> = {};
  logs.forEach((log) => {
    const cards = new Set(log.cardsPlayed);
    cards.forEach((id) => {
      if (!stats[id]) stats[id] = { plays: 0, wins: 0, rate: 0 };
      stats[id].plays++;
      if (log.result === "victory") stats[id].wins++;
    });
  });
  Object.keys(stats).forEach((id) => {
    const s = stats[id];
    s.rate = s.plays > 0 ? s.wins / s.plays : 0;
  });
  return stats;
}

// H.3 — suggestions équilibrage (>= 50 runs uniquement)
export function autoBalanceSuggestions(): Array<{ cardId: string; suggestion: string; reason: string }> {
  const stats = computeCardWinRates();
  const suggestions: Array<{ cardId: string; suggestion: string; reason: string }> = [];
  Object.entries(stats).forEach(([id, s]) => {
    if (s.plays < 20) return;
    if (s.rate > 0.75) {
      suggestions.push({
        cardId: id,
        suggestion: "+1 cost (peut-être trop forte)",
        reason: `WR ${(s.rate * 100).toFixed(0)}% sur ${s.plays} runs`,
      });
    } else if (s.rate < 0.25) {
      suggestions.push({
        cardId: id,
        suggestion: "-1 cost ou +1 ATK (peu jouée gagnante)",
        reason: `WR ${(s.rate * 100).toFixed(0)}% sur ${s.plays} runs`,
      });
    }
  });
  return suggestions;
}
