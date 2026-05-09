// i18n minimal — item 9.7 : structure FR + EN
// Architecture extensible : ajouter d'autres langues = ajouter un dict.

type Lang = "fr" | "en";

const STRINGS: Record<Lang, Record<string, string>> = {
  fr: {
    "title": "Mort dans l'âme",
    "subtitle.circle1": "Cercle I — Luxure",
    "btn.start": "Commencer une vie",
    "btn.resume": "Reprendre la vie",
    "btn.continue": "Continuer",
    "btn.menu": "⚙ Menu",
    "btn.endTurn": "Fin du tour",
    "btn.reroll": "REROLL",
    "btn.touch_to_close": "Touche pour fermer",
    "btn.rebirth": "Renaître",
    "btn.stats": "Stats",
    "outcome.victory": "VERDICT SUSPENDU",
    "outcome.defeat": "TU CHUTES",
    "outcome.score": "SCORE",
    "label.turns": "Tours utilisés",
    "label.sacrificed": "Cartes sacrifiées",
    "label.soul": "Âme restante",
    "label.difficulty": "Difficulté",
    "menu.settings": "OPTIONS",
    "menu.tab.settings": "SETTINGS",
    "menu.tab.stats": "STATS",
    "menu.tab.achievements": "ACHIEVEMENTS",
    "menu.back": "← Retour",
    "menu.difficulty": "Difficulté",
    "menu.pacifist": "Mode pacifique (boss HP /2)",
    "menu.speedMode": "Speed mode (skip animations)",
    "menu.reduceFlashes": "Réduire flashes / camera shake",
    "menu.daltonian": "Mode daltonien",
    "menu.vibration": "Vibration (mobile)",
    "menu.subtitles": "Sous-titres voice lines",
    "menu.textSize": "Taille texte",
    "menu.volMaster": "Volume Master",
    "menu.volMusic": "Volume Music",
    "menu.volSfx": "Volume SFX",
  },
  en: {
    "title": "Dead in the Soul",
    "subtitle.circle1": "Circle I — Lust",
    "btn.start": "Begin a life",
    "btn.resume": "Resume life",
    "btn.continue": "Continue",
    "btn.menu": "⚙ Menu",
    "btn.endTurn": "End turn",
    "btn.reroll": "REROLL",
    "btn.touch_to_close": "Touch to close",
    "btn.rebirth": "Reborn",
    "btn.stats": "Stats",
    "outcome.victory": "VERDICT SUSPENDED",
    "outcome.defeat": "YOU FALL",
    "outcome.score": "SCORE",
    "label.turns": "Turns used",
    "label.sacrificed": "Cards sacrificed",
    "label.soul": "Soul remaining",
    "label.difficulty": "Difficulty",
    "menu.settings": "OPTIONS",
    "menu.tab.settings": "SETTINGS",
    "menu.tab.stats": "STATS",
    "menu.tab.achievements": "ACHIEVEMENTS",
    "menu.back": "← Back",
    "menu.difficulty": "Difficulty",
    "menu.pacifist": "Pacifist mode (boss HP /2)",
    "menu.speedMode": "Speed mode (skip animations)",
    "menu.reduceFlashes": "Reduce flashes / camera shake",
    "menu.daltonian": "Color-blind mode",
    "menu.vibration": "Vibration (mobile)",
    "menu.subtitles": "Voice line subtitles",
    "menu.textSize": "Text size",
    "menu.volMaster": "Volume Master",
    "menu.volMusic": "Volume Music",
    "menu.volSfx": "Volume SFX",
  },
};

let currentLang: Lang = (localStorage.getItem("mortdansl-lang") as Lang) || "fr";

export function getLang(): Lang {
  return currentLang;
}

export function setLang(lang: Lang): void {
  currentLang = lang;
  localStorage.setItem("mortdansl-lang", lang);
}

export function t(key: string): string {
  return STRINGS[currentLang][key] ?? STRINGS.fr[key] ?? key;
}
