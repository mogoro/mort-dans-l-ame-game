// E.2 — repos : -X axe pour +50% HP au prochain combat
import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../main";
import { GameState } from "../systems/GameState";
import { ALL_AXES, type Axis } from "../data/events";
import { takeRest } from "../systems/Economy";
import { audio } from "../systems/AudioSystem";

export class RestScene extends Phaser.Scene {
  constructor() { super("Rest"); }

  create(): void {
    this.cameras.main.fadeIn(500, 0, 0, 0);

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a1418, 0x0a1418, 0x1a2a30, 0x1a2a30, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add.text(GAME_WIDTH / 2, 80, "— LE REPOS —", {
      fontFamily: "Georgia, serif", fontSize: "22px",
      color: "#a0c0e0", fontStyle: "italic",
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 130, "Choisis un axe à dépenser pour récupérer.", {
      fontFamily: "Georgia, serif", fontSize: "13px",
      color: "#80a0b0", fontStyle: "italic",
      wordWrap: { width: GAME_WIDTH - 60 }, align: "center",
    }).setOrigin(0.5);

    // Sort : top axes (consommables)
    const sorted = (Object.entries(GameState.profile) as [Axis, number][])
      .sort((a, b) => b[1] - a[1])
      .filter(([, val]) => val >= 8);

    sorted.slice(0, 6).forEach(([axis, val], i) => {
      const y = 200 + i * 70;
      this.renderAxisOption(GAME_WIDTH / 2, y, axis, val);
    });

    // Skip
    const btn = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 80);
    const bgB = this.add.rectangle(0, 0, 200, 44, 0x2a1810);
    bgB.setStrokeStyle(2, 0x666666);
    btn.add(bgB);
    btn.add(this.add.text(0, 0, "Continuer sans repos", {
      fontFamily: "Georgia, serif", fontSize: "14px",
      color: "#a0a0a0", fontStyle: "italic",
    }).setOrigin(0.5));
    bgB.setInteractive({ useHandCursor: true });
    bgB.on("pointerdown", () => {
      audio.sfx("click");
      this.scene.start("Market");
    });
  }

  private renderAxisOption(x: number, y: number, axis: Axis, val: number): void {
    const c = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, GAME_WIDTH - 60, 56, 0x1a2a30);
    bg.setStrokeStyle(2, 0x4080a0);
    c.add(bg);
    c.add(this.add.text(-200, 0, axis, {
      fontFamily: "Georgia, serif", fontSize: "14px",
      color: "#a0c0e0", fontStyle: "bold",
    }).setOrigin(0, 0.5));
    c.add(this.add.text(0, 0, `${val} → ${val - 8}`, {
      fontFamily: "monospace", fontSize: "13px",
      color: "#80a0c0",
    }).setOrigin(0.5));
    c.add(this.add.text(180, 0, "+50% HP", {
      fontFamily: "Georgia, serif", fontSize: "12px",
      color: "#80c0a0", fontStyle: "italic",
    }).setOrigin(1, 0.5));

    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerdown", () => {
      const r = takeRest(axis);
      if (r.applied) {
        (GameState as any).nextHpHeal = r.healPct;
        audio.sfx("victory");
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("Market"));
      }
    });
  }
}
