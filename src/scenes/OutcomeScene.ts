import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../main";
import { GameState } from "../systems/GameState";
import { Settings } from "../systems/Settings";
import { recordRunResult, computeScore, clearCurrentRun } from "../systems/SaveSystem";
import { audio } from "../systems/AudioSystem";

export class OutcomeScene extends Phaser.Scene {
  constructor() {
    super("Outcome");
  }

  create(): void {
    this.cameras.main.fadeIn(800, 0, 0, 0);
    const isVictory = GameState.outcome === "victory";
    const stats = GameState.combatStats || { turns: 1, cardsSacrificed: 0, axesRemaining: 0 };

    // 7.9 Score calculation
    const score = computeScore({
      victory: isVictory,
      turnsUsed: stats.turns,
      cardsSacrificed: stats.cardsSacrificed,
      axesRemaining: stats.axesRemaining,
      difficulty: Settings.difficulty,
    });

    // 7.2 Record stats globales + 7.4 unlock achievements
    recordRunResult(GameState.outcome!, GameState.profile, score);
    clearCurrentRun();

    audio.playPhase(isVictory ? "victory" : "defeat");

    // Background
    const bg = this.add.graphics();
    if (isVictory) {
      bg.fillGradientStyle(0x2a0a08, 0x2a0a08, 0x4a1a10, 0x4a1a10, 1);
    } else {
      bg.fillGradientStyle(0x1a0508, 0x1a0508, 0x3a0a14, 0x3a0a14, 1);
    }
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const cx = GAME_WIDTH / 2;

    // Titre
    const title = this.add.text(cx, 130,
      isVictory ? "VERDICT SUSPENDU" : "TU CHUTES",
      {
        fontFamily: "Georgia, serif",
        fontSize: "32px",
        color: isVictory ? "#d4a040" : "#c83838",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
      }
    ).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, duration: 1500 });

    // Message
    const msg = this.add.text(cx, 200,
      isVictory
        ? "Tu as vaincu Cléopâtre.\nLe premier cercle s'efface."
        : "Cléopâtre te garde.\nLe procès continue.",
      {
        fontFamily: "Georgia, serif",
        fontSize: "15px",
        color: "#a87a3a",
        fontStyle: "italic",
        align: "center",
      }
    ).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: msg, alpha: 1, duration: 1500, delay: 500 });

    // Stats du run
    let y = 320;
    const statLines = [
      ["Tours utilisés", stats.turns],
      ["Cartes sacrifiées", stats.cardsSacrificed],
      ["Âme restante", stats.axesRemaining],
      ["Difficulté", Settings.difficulty + (Settings.pacifist ? " · pacifique" : "")],
    ];
    statLines.forEach(([label, val], i) => {
      const t1 = this.add.text(cx - 100, y + i * 22, String(label), {
        fontFamily: "Georgia, serif",
        fontSize: "13px",
        color: "#a87a3a",
      }).setAlpha(0);
      const t2 = this.add.text(cx + 100, y + i * 22, String(val), {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#f0d8b0",
        fontStyle: "bold",
      }).setOrigin(1, 0).setAlpha(0);
      this.tweens.add({ targets: [t1, t2], alpha: 1, duration: 500, delay: 1500 + i * 200 });
    });

    // Score
    y = 440;
    const scoreLabel = this.add.text(cx, y, "SCORE", {
      fontFamily: "Georgia, serif",
      fontSize: "12px",
      color: "#806040",
      fontStyle: "italic",
    }).setOrigin(0.5).setAlpha(0);
    const scoreText = this.add.text(cx, y + 24, "0", {
      fontFamily: "monospace",
      fontSize: "44px",
      color: isVictory ? "#d4a040" : "#a87a3a",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: [scoreLabel, scoreText], alpha: 1, duration: 800, delay: 2400 });

    // Score qui compte
    let displayScore = 0;
    this.time.addEvent({
      delay: 30,
      repeat: 50,
      callback: () => {
        displayScore = Math.min(score, displayScore + Math.ceil(score / 50));
        scoreText.setText(String(displayScore));
      },
    });

    // Boutons
    const btnY = 580;
    this.createButton(cx - 100, btnY, "Renaître", () => {
      Object.keys(GameState.profile).forEach((k) => { (GameState.profile as any)[k] = 50; });
      GameState.deck = [];
      GameState.outcome = undefined;
      GameState.combatStats = undefined;
      this.cameras.main.fadeOut(800, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("Boot"));
    }, 0x6a3018);

    this.createButton(cx + 100, btnY, "Stats", () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("Menu"));
    }, 0x4a3018);

    // Profil final (top 3)
    const sortedAxes = Object.entries(GameState.profile)
      .sort((a, b) => Math.abs(b[1] - 50) - Math.abs(a[1] - 50))
      .slice(0, 3);
    y = 660;
    this.add.text(cx, y, "Ce que tu es devenu", {
      fontFamily: "Georgia, serif",
      fontSize: "11px",
      color: "#806040",
      fontStyle: "italic",
    }).setOrigin(0.5);
    sortedAxes.forEach(([axis, val], i) => {
      this.add.text(cx, y + 22 + i * 18, `${axis}  ${val}`, {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#a87a3a",
      }).setOrigin(0.5);
    });
  }

  private createButton(x: number, y: number, label: string, onClick: () => void, color = 0x6a3018): void {
    const c = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 160, 44, color);
    bg.setStrokeStyle(2, 0xd4a040);
    c.add(bg);
    c.add(this.add.text(0, 0, label, {
      fontFamily: "Georgia, serif",
      fontSize: "14px",
      color: "#f0d8b0",
      fontStyle: "bold",
    }).setOrigin(0.5));
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerover", () => bg.setFillStyle(color + 0x202020));
    bg.on("pointerout", () => bg.setFillStyle(color));
    bg.on("pointerdown", () => {
      this.tweens.add({ targets: c, scale: 0.95, duration: 80, yoyo: true, onComplete: onClick });
    });
  }
}
