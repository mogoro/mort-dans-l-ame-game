// Échelle typographique centrale — couplée à Settings.textSize (mode large)
// Plancher absolu : 12px pour tout texte lisible. Sub-12 réservé aux indicateurs ultra-compacts (compteurs ATK/HP).
import { textScale } from "./Settings";

export const FONT = {
  /** Indicateurs très compacts uniquement (compteurs sur cartes 76x116) */
  micro: () => Math.round(11 * textScale()),
  /** Texte secondaire (labels, footer) — ancien 11px */
  xs:   () => Math.round(13 * textScale()),
  /** Texte courant compact — ancien 12-13px */
  sm:   () => Math.round(14 * textScale()),
  /** Texte courant — ancien 14px */
  base: () => Math.round(16 * textScale()),
  /** Sous-titres / event trame */
  md:   () => Math.round(18 * textScale()),
  /** Titres section */
  lg:   () => Math.round(22 * textScale()),
  /** Titres scène */
  xl:   () => Math.round(28 * textScale()),
  /** Titres cinématiques */
  xxl:  () => Math.round(36 * textScale()),
  /** Score/marqueurs hero */
  hero: () => Math.round(48 * textScale()),
};

/** Helper pour fontSize Phaser (string "Npx") */
export function fs(level: keyof typeof FONT): string {
  return `${FONT[level]()}px`;
}
