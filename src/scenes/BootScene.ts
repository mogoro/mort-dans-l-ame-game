import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../main";
import { audio } from "../systems/AudioSystem";
import { Settings, DEBUG } from "../systems/Settings";
import { loadStats, loadCurrentRun, clearCurrentRun } from "../systems/SaveSystem";

const VERSION = "0.2.0";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0a06, 0x1a0a06, 0x3a1f0c, 0x3a1f0c, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    [
      { x: 60, y: 100 }, { x: GAME_WIDTH - 60, y: 100 },
      { x: 60, y: GAME_HEIGHT - 100 }, { x: GAME_WIDTH - 60, y: GAME_HEIGHT - 100 },
    ].forEach((pos) => this.createCandle(pos.x, pos.y));

    // Titre
    const title = this.add.text(cx, cy - 120, "Mort dans l'âme", {
      fontFamily: "Georgia, serif",
      fontSize: "44px",
      color: "#d4a040",
      stroke: "#1a0a06",
      strokeThickness: 4,
    }).setOrigin(0.5);
    this.tweens.add({
      targets: title,
      alpha: { from: 0.7, to: 1.0 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
    });

    // Sous-titre
    this.add.text(cx, cy - 70, "Cercle I — Luxure", {
      fontFamily: "Georgia, serif",
      fontSize: "18px",
      color: "#a87a3a",
      fontStyle: "italic",
    }).setOrigin(0.5);

    // Description
    this.add.text(cx, cy - 30,
      "Tu vis. Tu meurs.\nTu es jugé(e) aux Enfers.",
      {
        fontFamily: "Georgia, serif",
        fontSize: "14px",
        color: "#6a5030",
        fontStyle: "italic",
        align: "center",
      }
    ).setOrigin(0.5);

    // Bouton commencer
    const startBtn = this.createButton(cx, cy + 50, "Commencer une vie", () => {
      audio.playPhase("ambient");
      clearCurrentRun();
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("Life"));
    }, 0x6a3018);

    // Reprendre run en cours si disponible
    const savedRun = loadCurrentRun();
    if (savedRun) {
      this.createButton(cx, cy + 110, "Reprendre la vie", () => {
        audio.playPhase("ambient");
        this.cameras.main.fadeOut(600, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("Life"));
      }, 0x4a3018);
    }

    // Stats rapides
    const stats = loadStats();
    if (stats.runsTotal > 0) {
      this.add.text(cx, cy + 175, `${stats.runsTotal} vies · ${stats.victories} victoires · score ${stats.bestScore}`, {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#806040",
      }).setOrigin(0.5);
    }

    // Boutons coin
    this.createCornerBtn(GAME_WIDTH - 30, 30, "🔊", () => {
      const enabled = audio.toggle();
      this.scene.restart();
    }, audio.enabled);

    this.createCornerBtn(GAME_WIDTH - 80, 30, "⚙", () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("Menu"));
    });

    // Version + debug
    const versionText = `v${VERSION}${DEBUG ? " · DEBUG" : ""}`;
    this.add.text(GAME_WIDTH - 6, GAME_HEIGHT - 6, versionText, {
      fontFamily: "monospace",
      fontSize: "9px",
      color: "#5a4030",
    }).setOrigin(1, 1);

    // Difficulté info
    if (Settings.difficulty !== "normal" || Settings.pacifist) {
      const opts: string[] = [];
      if (Settings.difficulty === "doux") opts.push("Doux");
      if (Settings.difficulty === "penible") opts.push("Pénible");
      if (Settings.pacifist) opts.push("Pacifique");
      this.add.text(6, GAME_HEIGHT - 6, opts.join(" · "), {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#a87a3a",
      }).setOrigin(0, 1);
    }
  }

  private createCandle(x: number, y: number): void {
    const halo = this.add.graphics();
    halo.fillStyle(0xffaa44, 0.25);
    halo.fillCircle(x, y, 70);
    halo.fillStyle(0xffcc77, 0.18);
    halo.fillCircle(x, y, 40);
    const flame = this.add.circle(x, y, 5, 0xffd870);
    this.tweens.add({
      targets: flame,
      scale: { from: 0.9, to: 1.3 },
      alpha: { from: 0.85, to: 1 },
      duration: 600 + Math.random() * 400,
      yoyo: true,
      repeat: -1,
    });
  }

  private createButton(x: number, y: number, label: string, onClick: () => void, color = 0x6a3018): Phaser.GameObjects.Container {
    const c = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 240, 48, color);
    bg.setStrokeStyle(2, 0xd4a040);
    c.add(bg);
    c.add(this.add.text(0, 0, label, {
      fontFamily: "Georgia, serif",
      fontSize: "16px",
      color: "#f0d8b0",
      fontStyle: "bold",
    }).setOrigin(0.5));

    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerover", () => bg.setFillStyle(color + 0x202020));
    bg.on("pointerout", () => bg.setFillStyle(color));
    bg.on("pointerdown", () => {
      this.tweens.add({
        targets: c,
        scale: { from: 1, to: 0.95 },
        duration: 80,
        yoyo: true,
        onComplete: onClick,
      });
    });
    return c;
  }

  private createCornerBtn(x: number, y: number, icon: string, onClick: () => void, active = false): void {
    const c = this.add.container(x, y);
    const bg = this.add.circle(0, 0, 20, 0x2a1810, 0.9);
    bg.setStrokeStyle(2, active ? 0xd4a040 : 0x8a5018);
    c.add(bg);
    c.add(this.add.text(0, 0, icon, { fontSize: "16px" }).setOrigin(0.5));
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerdown", onClick);
  }
}
