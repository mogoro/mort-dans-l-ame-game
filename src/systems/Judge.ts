// A.6 — mémoire du Juge entre runs
// F.5 — voice lines exactes selon profil + événement
// A.4 — profil évolutif pendant combat (helpers ici, application en CombatScene)

import { GameState, persistJudgeMemory } from "./GameState";
import type { Axis } from "../data/events";

const RECENT_LIMIT = 10;

export function recordChoiceTag(tag: string): void {
  GameState.judgeMemory.recentChoices.push(tag);
  if (GameState.judgeMemory.recentChoices.length > RECENT_LIMIT) {
    GameState.judgeMemory.recentChoices.shift();
  }
  persistJudgeMemory();
}

export function recordCombatResult(circle: number, result: "victory" | "defeat"): void {
  GameState.judgeMemory.combatLog.push({ circle, result });
  if (GameState.judgeMemory.combatLog.length > 50) {
    GameState.judgeMemory.combatLog.shift();
  }
  persistJudgeMemory();
}

// F.5 — voice line basée sur profil ET événements joués
export function judgeLineForAxis(axis: Axis): string {
  const lines: Record<Axis, string[]> = {
    Colere: [
      "Tu te souviens du jour où tu as crié sur ton père ?",
      "À 14 ans tu as cassé la fenêtre. Tu te rappelles ?",
      "La rage que tu apportes ici — tu l'avais déjà à 7 ans.",
    ],
    Luxure: [
      "Tu as embrassé qui n'aurait pas dû.",
      "Tu te souviens de cette nuit où tu as dit oui sans réfléchir ?",
      "Le désir t'a guidé même quand il fallait freiner.",
    ],
    Avarice: [
      "Tu as gardé. Tu as gardé encore.",
      "Le porte-monnaie trouvé — tu l'as gardé. Et après ?",
      "Tu as compté chaque pièce. Tu n'en as donné aucune.",
    ],
    Paresse: [
      "Tu as dormi quand il fallait être debout.",
      "Tu as détourné le regard quand il fallait voir.",
      "Tu pourrais juste t'asseoir. Et ne plus jamais te lever.",
    ],
    Envie: [
      "Tu voulais ce qu'il avait. Tu l'as brisé.",
      "Tu as filmé le harcelé. Pour les vues. Pour toi.",
      "Tu te ressemblais à elles. Tu te ressembles encore.",
    ],
    Gourmandise: [
      "Tu n'as jamais été rassasié.",
      "Tu as bu. Tu as encore bu. Tu te demandais pourquoi.",
      "La satiété ne t'a jamais visité.",
    ],
    Orgueil: [
      "Tu te crois meilleur. Tu l'as toujours cru.",
      "Tu as méprisé celui qui ne savait pas. Et après ?",
      "Le couronné, c'est toi. Devant le miroir.",
    ],
    Foi: [
      "Tu as cru. Cela ne t'a pas tout sauvé.",
      "Tu as juré. Tu as tenu. C'était assez.",
      "Tu as appelé. Personne n'a répondu. Tu as continué.",
    ],
    Esperance: [
      "Tu as espéré quand tout disait non.",
      "Petite. Têtue. Suffisante.",
      "Tu y croyais encore quand les autres avaient lâché.",
    ],
    Charite: [
      "Tu as donné. Tu n'as pas attendu.",
      "Tes mains étaient toujours ouvertes.",
      "Donner sans calculer — ton seul vice.",
    ],
    Prudence: [
      "Tu as regardé. Longuement. Avant d'agir.",
      "Tu as anticipé. Tu n'as pas tout évité.",
      "Tu observais quand d'autres se précipitaient.",
    ],
    Justice: [
      "Tu as rendu à chacun ce qui lui revenait.",
      "Tu as pesé. Tu as tranché. Sans pitié.",
      "Tu as accepté la punition. Même la tienne.",
    ],
    Force: [
      "Tu n'as pas lâché. Pas même au bout.",
      "Tu as encaissé. Tu es resté debout.",
      "Pas d'élégance. De l'efficacité. Toi.",
    ],
    Temperance: [
      "Ni trop, ni trop peu. Toujours juste assez.",
      "Tu as parlé quand les autres criaient.",
      "L'équilibre — c'est tout ce que tu as voulu.",
    ],
  };
  const arr = lines[axis] || ["Je te connais."];
  return arr[Math.floor(Math.random() * arr.length)];
}

// A.6 — voix Juge contextualisée par historique
export function judgeRecallsLastRun(): string | null {
  const mem = GameState.judgeMemory;
  if (mem.totalRuns === 0) return null;
  if (mem.lastEnding === "Saint") return "Tu reviens. Saint la dernière fois — la fierté est un piège.";
  if (mem.lastEnding === "Damne") return "Tu reviens. Damné. Encore une chance ?";
  if (mem.lastEnding === "Tiede") return "Tu reviens. Tu n'as pas choisi la dernière fois. Cette fois ?";
  if (mem.lastEnding === "Rebelle") return "Tu reviens. Tu as résisté. Tu vas recommencer ?";
  return "Je te reconnais. Tu es déjà passé.";
}

// F.5 — voice lines combat liées au profil dominant
export function judgeOpeningLine(): string {
  const sorted = (Object.entries(GameState.profile) as [Axis, number][])
    .sort((a, b) => b[1] - a[1]);
  const top = sorted[0][0];
  return judgeLineForAxis(top);
}

// A.4 — pendant le combat, jouer une carte renforce l'axe (modulé)
export function applyAxisShift(axis: Axis, magnitude: number): void {
  const before = GameState.profile[axis] || 50;
  GameState.profile[axis] = Math.max(0, Math.min(100, before + magnitude));
}
