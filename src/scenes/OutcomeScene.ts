import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../main";
import { GameState } from "../systems/GameState";

export class OutcomeScene extends Phaser.Scene {
  constructor() {
    super("Outcome");
  }

  create(): void {
    this.cameras.main.fadeIn(800, 0, 0, 0);
    const isVictory = GameState.outcome === "victory";

    // Background
    const bg = this.add.graphics();
    if (isVictory) {
      bg.fillGradientStyle(0x2a0a08, 0x2a0a08, 0x4a1a10, 0x4a1a10, 1);
    } else {
      bg.fillGradientStyle(0x1a0508, 0x1a0508, 0x3a0a14, 0x3a0a14, 1);
    }
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Titre
    const title = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 - 80,
      isVictory ? "VERDICT SUSPENDU" : "TU CHUTES PLUS PROFOND",
      {
        fontFamily: "Georgia, serif",
        fontSize: "32px",
        color: isVictory ? "#d4a040" : "#c83838",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
        align: "center",
        wordWrap: { width: GAME_WIDTH - 60 },
      }
    ).setOrigin(0.5);
    title.setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, duration: 1500 });

    // Message
    const msg = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 20,
      isVictory
        ? "Tu as vaincu Cléopâtre.\nLe premier cercle s'efface devant toi.\nLes six autres t'attendent encore."
        : "Cléopâtre te garde.\nLe procès continue plus bas.\nTu reviendras peut-être.",
      {
        fontFamily: "Georgia, serif",
        fontSize: "16px",
        color: "#a87a3a",
        fontStyle: "italic",
        align: "center",
        wordWrap: { width: GAME_WIDTH - 80 },
      }
    ).setOrigin(0.5);
    msg.setAlpha(0);
    this.tweens.add({ targets: msg, alpha: 1, duration: 1500, delay: 800 });

    // Bouton recommencer
    const btn = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 180).setAlpha(0);
    const btnBg = this.add.rectangle(0, 0, 240, 56, 0x6a1818);
    btnBg.setStrokeStyle(2, 0xc83838);
    btnBg.setInteractive({ useHandCursor: true });
    btn.add(btnBg);
    btn.add(
      this.add.text(0, 0, "Renaître →", {
        fontFamily: "Georgia, serif",
        fontSize: "18px",
        color: "#f0d8b0",
        fontStyle: "bold",
      }).setOrigin(0.5)
    );
    this.tweens.add({ targets: btn, alpha: 1, duration: 800, delay: 2000 });

    btnBg.on("pointerover", () => btnBg.setFillStyle(0x8a2828));
    btnBg.on("pointerout", () => btnBg.setFillStyle(0x6a1818));
    btnBg.on("pointerdown", () => {
      // Reset GameState pour nouvelle run
      Object.keys(GameState.profile).forEach((k) => {
        (GameState.profile as any)[k] = 50;
      });
      GameState.deck = [];
      GameState.outcome = undefined;

      this.cameras.main.fadeOut(800, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("Boot");
      });
    });
  }
}
