// I.2 — Pacte du Conteur : modifier le récit en échange d'un pouvoir mais perdre les cartes liées
import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../main";
import { GameState, pactDuConteur } from "../systems/GameState";
import { ALL_AXES, type Axis } from "../data/events";
import { audio } from "../systems/AudioSystem";

export class PacteConteurScene extends Phaser.Scene {
  constructor() { super("PacteConteur"); }

  create(): void {
    this.cameras.main.fadeIn(400, 0, 0, 0);

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a14, 0x0a0a14, 0x1a1428, 0x1a1428, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add.text(GAME_WIDTH / 2, 60, "— LE PACTE DU CONTEUR —", {
      fontFamily: "Georgia, serif", fontSize: "20px", color: "#d4a040", fontStyle: "italic",
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 130,
      "Une voix — pas la tienne — te propose : « Je peux réécrire le passé. Choisis un trait que tu n'as jamais eu. Mais perd les cartes qui en sont nées. »",
      {
        fontFamily: "Georgia, serif", fontSize: "15px",
        color: "#a87a3a", fontStyle: "italic",
        align: "center", wordWrap: { width: GAME_WIDTH - 60 },
      }).setOrigin(0.5);

    // Top 3 axes (qu'on peut effacer)
    const top3 = (Object.entries(GameState.profile) as [Axis, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    top3.forEach(([axis, val], i) => {
      const y = 280 + i * 90;
      this.renderOption(axis, val, y);
    });

    // Skip
    const skip = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 80);
    const bgB = this.add.rectangle(0, 0, 200, 44, 0x2a1810);
    bgB.setStrokeStyle(2, 0x666666);
    skip.add(bgB);
    skip.add(this.add.text(0, 0, "Refuser le pacte", {
      fontFamily: "Georgia, serif", fontSize: "15px",
      color: "#c0c0c0", fontStyle: "italic",
    }).setOrigin(0.5));
    bgB.setInteractive({ useHandCursor: true });
    bgB.on("pointerdown", () => {
      audio.sfx("click");
      this.scene.start("Market");
    });
  }

  private renderOption(axis: Axis, val: number, y: number): void {
    const c = this.add.container(GAME_WIDTH / 2, y);
    const w = GAME_WIDTH - 60;
    const bg = this.add.rectangle(0, 0, w, 70, 0x1a1428);
    bg.setStrokeStyle(2, 0xa080d0);
    c.add(bg);
    c.add(this.add.text(0, -20, `« Tu n'as jamais été ${axis}. »`, {
      fontFamily: "Georgia, serif", fontSize: "15px",
      color: "#e0a8e0", fontStyle: "italic", align: "center",
    }).setOrigin(0.5));
    const linkedCards = GameState.deck.filter((c) => c.axis === axis).length;
    c.add(this.add.text(0, 4, `Pouvoir : -30 ${axis}, +50 sur les autres axes liés`, {
      fontFamily: "Georgia, serif", fontSize: "14px",
      color: "#88e0a0", fontStyle: "italic",
    }).setOrigin(0.5));
    c.add(this.add.text(0, 22, `Coût : ${linkedCards} carte(s) effacée(s)`, {
      fontFamily: "monospace", fontSize: "13px", color: "#ff8080",
    }).setOrigin(0.5));

    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerdown", () => {
      const r = pactDuConteur(axis);
      audio.sfx("card_destroy");
      const conf = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, r.powerGained, {
        fontFamily: "Georgia, serif", fontSize: "20px",
        color: "#a080d0", fontStyle: "italic",
        align: "center", wordWrap: { width: GAME_WIDTH - 60 },
      }).setOrigin(0.5);
      this.tweens.add({
        targets: conf, alpha: 0, duration: 2500,
        onComplete: () => this.scene.start("Market"),
      });
    });
  }
}
