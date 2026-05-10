import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../main";
import { Settings, updateSetting } from "../systems/Settings";
import { audio } from "../systems/AudioSystem";
import { loadStats, loadAchievements } from "../systems/SaveSystem";

export class MenuScene extends Phaser.Scene {
  private currentTab: "settings" | "stats" | "achievements" = "settings";

  constructor() {
    super("Menu");
  }

  create(): void {
    this.cameras.main.fadeIn(300, 0, 0, 0);

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0a06, 0x1a0a06, 0x2a1408, 0x2a1408, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Titre
    this.add.text(GAME_WIDTH / 2, 50, "OPTIONS", {
      fontFamily: "Georgia, serif",
      fontSize: "24px",
      color: "#d4a040",
      fontStyle: "bold",
    }).setOrigin(0.5);

    // Bouton retour
    const back = this.add.text(20, 25, "← Retour", {
      fontFamily: "Georgia, serif",
      fontSize: "16px",
      color: "#a87a3a",
    });
    back.setInteractive({ useHandCursor: true });
    back.on("pointerdown", () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("Boot");
      });
    });

    // Tabs
    const tabs = ["settings", "stats", "achievements"] as const;
    tabs.forEach((tab, i) => {
      const x = (GAME_WIDTH / 3) * (i + 0.5);
      const t = this.add.text(x, 100, tab.toUpperCase(), {
        fontFamily: "Georgia, serif",
        fontSize: "15px",
        color: this.currentTab === tab ? "#d4a040" : "#806040",
        fontStyle: this.currentTab === tab ? "bold" : "normal",
      }).setOrigin(0.5);
      t.setInteractive({ useHandCursor: true });
      t.on("pointerdown", () => {
        this.currentTab = tab;
        this.scene.restart();
      });
    });

    // Contenu de l'onglet
    if (this.currentTab === "settings") this.renderSettings();
    else if (this.currentTab === "stats") this.renderStats();
    else this.renderAchievements();
  }

  // ============== SETTINGS ==============

  private renderSettings(): void {
    const startY = 150;
    let y = startY;

    // Difficulté
    y = this.addSelector(y, "Difficulté", ["doux", "normal", "penible"], Settings.difficulty,
      (v: string) => updateSetting("difficulty", v as any));

    // Mode pacifique
    y = this.addToggle(y, "Mode pacifique (boss HP /2)", Settings.pacifist,
      (v: boolean) => updateSetting("pacifist", v));

    // Speed mode
    y = this.addToggle(y, "Speed mode (skip animations)", Settings.speedMode,
      (v: boolean) => updateSetting("speedMode", v));

    // Reduce flashes
    y = this.addToggle(y, "Réduire flashes / camera shake", Settings.reduceFlashes,
      (v: boolean) => updateSetting("reduceFlashes", v));

    // Daltonien
    y = this.addToggle(y, "Mode daltonien (palette alt.)", Settings.daltonian,
      (v: boolean) => updateSetting("daltonian", v));

    // Vibration
    y = this.addToggle(y, "Vibration (mobile)", Settings.vibration,
      (v: boolean) => updateSetting("vibration", v));

    // Subtitles
    y = this.addToggle(y, "Sous-titres voice lines", Settings.showSubtitles,
      (v: boolean) => updateSetting("showSubtitles", v));

    // Text size
    y = this.addSelector(y, "Taille texte", ["small", "medium", "large"], Settings.textSize,
      (v: string) => updateSetting("textSize", v as any));

    // Volumes
    y = this.addSlider(y, "Volume Master", Settings.volMaster, (v: number) => {
      updateSetting("volMaster", v);
      audio.setVolume(v);
    });
    y = this.addSlider(y, "Volume Music", Settings.volMusic, (v: number) => updateSetting("volMusic", v));
    y = this.addSlider(y, "Volume SFX", Settings.volSfx, (v: number) => updateSetting("volSfx", v));
  }

  private addToggle(y: number, label: string, value: boolean, onChange: (v: boolean) => void): number {
    this.add.text(40, y, label, {
      fontFamily: "Georgia, serif",
      fontSize: "15px",
      color: "#f0d8b0",
    });
    const toggle = this.add.rectangle(GAME_WIDTH - 70, y + 7, 50, 20, value ? 0x6a8040 : 0x4a2820);
    toggle.setStrokeStyle(2, value ? 0x88c060 : 0x8a4818);
    toggle.setInteractive({ useHandCursor: true });
    const dot = this.add.circle(value ? GAME_WIDTH - 56 : GAME_WIDTH - 84, y + 7, 7, 0xfff5dc);
    toggle.on("pointerdown", () => {
      onChange(!value);
      this.scene.restart();
    });
    return y + 35;
  }

  private addSelector(y: number, label: string, options: string[], value: string, onChange: (v: string) => void): number {
    this.add.text(40, y, label, {
      fontFamily: "Georgia, serif",
      fontSize: "15px",
      color: "#f0d8b0",
    });
    const totalW = 200;
    const segW = totalW / options.length;
    options.forEach((opt, i) => {
      const x = GAME_WIDTH - totalW + i * segW;
      const isActive = opt === value;
      const r = this.add.rectangle(x + segW / 2, y + 7, segW - 2, 20, isActive ? 0xa07020 : 0x2a1810);
      r.setStrokeStyle(1, 0x8a5018);
      r.setInteractive({ useHandCursor: true });
      const t = this.add.text(x + segW / 2, y + 7, opt, {
        fontFamily: "Georgia, serif",
        fontSize: "13px",
        color: isActive ? "#fff5dc" : "#a87a3a",
        fontStyle: isActive ? "bold" : "normal",
      }).setOrigin(0.5);
      r.on("pointerdown", () => {
        onChange(opt);
        this.scene.restart();
      });
    });
    return y + 35;
  }

  private addSlider(y: number, label: string, value: number, onChange: (v: number) => void): number {
    this.add.text(40, y, label, {
      fontFamily: "Georgia, serif",
      fontSize: "15px",
      color: "#f0d8b0",
    });
    const sliderX = GAME_WIDTH - 200;
    const sliderW = 130;
    const track = this.add.rectangle(sliderX + sliderW / 2, y + 7, sliderW, 4, 0x4a2820);
    const fill = this.add.rectangle(sliderX, y + 7, sliderW * value, 4, 0xa07020).setOrigin(0, 0.5);
    const handle = this.add.circle(sliderX + sliderW * value, y + 7, 8, 0xd4a040);
    handle.setStrokeStyle(2, 0xfff5dc);

    const valLabel = this.add.text(GAME_WIDTH - 30, y + 7, `${Math.round(value * 100)}%`, {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#d4a040",
    }).setOrigin(1, 0.5);

    handle.setInteractive({ draggable: true, useHandCursor: true });
    this.input.setDraggable(handle);
    handle.on("drag", (_p: Phaser.Input.Pointer, dx: number) => {
      const newX = Phaser.Math.Clamp(dx, sliderX, sliderX + sliderW);
      handle.x = newX;
      const newVal = (newX - sliderX) / sliderW;
      fill.width = sliderW * newVal;
      valLabel.setText(`${Math.round(newVal * 100)}%`);
      onChange(newVal);
    });
    return y + 30;
  }

  // ============== STATS ==============

  private renderStats(): void {
    const stats = loadStats();
    let y = 160;
    const lines = [
      ["Runs jouées", stats.runsTotal],
      ["Victoires", stats.victories],
      ["Défaites", stats.defeats],
      ["Choix de vie", stats.totalChoices],
      ["Dernier score", stats.lastScore],
      ["Meilleur score", stats.bestScore],
    ];
    lines.forEach(([label, val]) => {
      this.add.text(40, y, String(label), { fontFamily: "Georgia, serif", fontSize: "16px", color: "#f0d8b0" });
      this.add.text(GAME_WIDTH - 40, y, String(val), {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#d4a040",
        fontStyle: "bold",
      }).setOrigin(1, 0);
      y += 28;
    });

    if (Object.keys(stats.axesCumulated).length > 0) {
      this.add.text(40, y + 16, "Axes accumulés (lifetime)", {
        fontFamily: "Georgia, serif",
        fontSize: "14px",
        color: "#a87a3a",
      });
      y += 40;
      const sorted = Object.entries(stats.axesCumulated).sort((a, b) => b[1] - a[1]);
      sorted.slice(0, 5).forEach(([axis, val]) => {
        this.add.text(50, y, `${axis}`, { fontFamily: "monospace", fontSize: "14px", color: "#f0d8b0" });
        this.add.text(GAME_WIDTH - 40, y, String(val), {
          fontFamily: "monospace",
          fontSize: "14px",
          color: "#d4a040",
        }).setOrigin(1, 0);
        y += 18;
      });
    }
  }

  // ============== ACHIEVEMENTS ==============

  private renderAchievements(): void {
    const list = loadAchievements();
    let y = 150;
    const unlocked = list.filter((a) => a.unlocked).length;

    this.add.text(GAME_WIDTH / 2, y, `${unlocked} / ${list.length} débloqués`, {
      fontFamily: "Georgia, serif",
      fontSize: "15px",
      color: "#a87a3a",
    }).setOrigin(0.5);
    y += 30;

    list.forEach((a) => {
      const c = a.unlocked ? "#d4a040" : "#5a4030";
      this.add.text(40, y, a.unlocked ? "★" : "☆", {
        fontFamily: "Georgia, serif",
        fontSize: "18px",
        color: c,
      });
      this.add.text(70, y, a.name, {
        fontFamily: "Georgia, serif",
        fontSize: "15px",
        color: c,
        fontStyle: a.unlocked ? "bold" : "normal",
      });
      this.add.text(70, y + 16, a.description, {
        fontFamily: "Georgia, serif",
        fontSize: "13px",
        color: a.unlocked ? "#a87a3a" : "#4a3020",
        fontStyle: "italic",
      });
      y += 42;
    });
  }
}
