// Settings persistés (localStorage). Couvre items :
// 8.1 difficulté · 9.1 daltonien · 9.2 taille texte · 9.3 speed mode
// 9.5 reduce flashes · 4.9 audio sliders · 8.8 mode pacifique · 10.1 debug
// 8.10 health bar run · 6.10 orientation lock prompt · 9.6 auto-pause

export type Difficulty = "doux" | "normal" | "penible";
export type TextSize = "small" | "medium" | "large";

export interface SettingsData {
  difficulty: Difficulty;
  pacifist: boolean;        // 8.8 - boss HP /2
  speedMode: boolean;       // 9.3 - skip animations
  reduceFlashes: boolean;   // 9.5 - réduit camera shake et flash
  textSize: TextSize;       // 9.2
  daltonian: boolean;       // 9.1 - palette alternative
  volMaster: number;        // 0-1
  volMusic: number;
  volSfx: number;
  vibration: boolean;       // 1.9
  showSubtitles: boolean;   // 9.4
}

const DEFAULTS: SettingsData = {
  difficulty: "normal",
  pacifist: false,
  speedMode: false,
  reduceFlashes: false,
  textSize: "medium",
  daltonian: false,
  volMaster: 0.5,
  volMusic: 0.6,
  volSfx: 0.8,
  vibration: true,
  showSubtitles: true,
};

const KEY = "mortdansl-settings";

function load(): SettingsData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

function persist(data: SettingsData): void {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
}

export const Settings: SettingsData = load();

export function updateSetting<K extends keyof SettingsData>(key: K, value: SettingsData[K]): void {
  Settings[key] = value;
  persist(Settings);
}

// Debug mode (?debug=1 in URL) — item 10.1
export const DEBUG = new URLSearchParams(window.location.search).get("debug") === "1";

// Vibration helper (1.9)
export function vibrate(pattern: number | number[]): void {
  if (!Settings.vibration) return;
  if (navigator.vibrate) navigator.vibrate(pattern);
}

// Multiplicateur de durée animations selon speed mode (9.3)
export function animSpeed(): number {
  return Settings.speedMode ? 0.4 : 1.0;
}

// Camera shake intensity selon reduceFlashes (9.5)
export function shakeFactor(): number {
  return Settings.reduceFlashes ? 0.2 : 1.0;
}

// Difficulté multipliers (8.1)
export function difficultyMul(): { bossHp: number; bossAtk: number; playerStartHp: number } {
  switch (Settings.difficulty) {
    case "doux":   return { bossHp: 0.7, bossAtk: 0.7, playerStartHp: 1.3 };
    case "penible": return { bossHp: 1.4, bossAtk: 1.3, playerStartHp: 0.85 };
    default:       return { bossHp: 1.0, bossAtk: 1.0, playerStartHp: 1.0 };
  }
}

// Texte size multiplier (9.2)
export function textScale(): number {
  switch (Settings.textSize) {
    case "small":  return 0.85;
    case "large":  return 1.2;
    default:       return 1.0;
  }
}
