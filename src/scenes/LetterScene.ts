// F.4 — lettre interstitielle (entre événements ou après combat)
import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../main";
import { audio } from "../systems/AudioSystem";

export class LetterScene extends Phaser.Scene {
  private text: string = "";
  private nextScene: string = "Boot";

  constructor() { super("Letter"); }

  init(data?: { text: string; nextScene?: string }): void {
    this.text = data?.text || "« Pas de message. »";
    this.nextScene = data?.nextScene || "Boot";
  }

  create(): void {
    this.cameras.main.fadeIn(400, 0, 0, 0);

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0a06, 0x1a0a06, 0x2a1408, 0x2a1408, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Papier vieilli
    const paper = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 80, GAME_HEIGHT * 0.5, 0xf0d8a0);
    paper.setStrokeStyle(3, 0x8a5018);
    paper.setRotation(-0.02);

    const t = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, this.text, {
      fontFamily: "Georgia, serif", fontSize: "18px",
      color: "#3a2810", fontStyle: "italic",
      align: "center", wordWrap: { width: GAME_WIDTH - 130 },
    }).setOrigin(0.5);
    t.setRotation(-0.02);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 100, "Touche pour continuer", {
      fontFamily: "Georgia, serif", fontSize: "14px", color: "#a87a3a", fontStyle: "italic",
    }).setOrigin(0.5);

    this.input.once("pointerdown", () => {
      audio.sfx("click");
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start(this.nextScene));
    });
  }
}
