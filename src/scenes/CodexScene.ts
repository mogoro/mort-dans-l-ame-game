// C.1 — Codex narratif (voir les pages débloquées)
import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../main";
import { GameState } from "../systems/GameState";
import { loadCodexPages, type CodexPage } from "../systems/Codex";
import { audio } from "../systems/AudioSystem";

export class CodexScene extends Phaser.Scene {
  private currentPage = 0;
  private pages: CodexPage[] = [];

  constructor() { super("Codex"); }

  create(): void {
    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.pages = loadCodexPages();
    this.renderScene();
  }

  private renderScene(): void {
    this.children.removeAll();
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0a06, 0x1a0a06, 0x2a1408, 0x2a1408, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add.text(GAME_WIDTH / 2, 50, "— CODEX —", {
      fontFamily: "Georgia, serif", fontSize: "22px", color: "#d4a040", fontStyle: "italic",
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 80, `${this.pages.length} / 100 pages`, {
      fontFamily: "monospace", fontSize: "14px", color: "#a87a3a",
    }).setOrigin(0.5);

    if (this.pages.length === 0) {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "Aucune page écrite.\nGagne pour révéler tes vies passées.", {
        fontFamily: "Georgia, serif", fontSize: "16px",
        color: "#a87a3a", fontStyle: "italic", align: "center",
      }).setOrigin(0.5);
    } else {
      const page = this.pages[this.currentPage];
      this.add.text(GAME_WIDTH / 2, 160, page.title, {
        fontFamily: "Georgia, serif", fontSize: "20px",
        color: "#d4a040", fontStyle: "bold italic",
        align: "center", wordWrap: { width: GAME_WIDTH - 60 },
      }).setOrigin(0.5);
      this.add.text(GAME_WIDTH / 2, 280, page.body, {
        fontFamily: "Georgia, serif", fontSize: "16px",
        color: "#f0d8b0", fontStyle: "italic",
        align: "center", wordWrap: { width: GAME_WIDTH - 80 },
      }).setOrigin(0.5);
      this.add.text(GAME_WIDTH / 2, 500, `Page ${this.currentPage + 1} / ${this.pages.length}`, {
        fontFamily: "monospace", fontSize: "14px", color: "#c0c0c0",
      }).setOrigin(0.5);

      // Nav
      if (this.currentPage > 0) {
        const prev = this.add.text(60, GAME_HEIGHT / 2, "‹", {
          fontFamily: "Georgia, serif", fontSize: "44px", color: "#d4a040",
        }).setOrigin(0.5);
        prev.setInteractive({ useHandCursor: true });
        prev.on("pointerdown", () => { this.currentPage--; this.renderScene(); });
      }
      if (this.currentPage < this.pages.length - 1) {
        const nxt = this.add.text(GAME_WIDTH - 60, GAME_HEIGHT / 2, "›", {
          fontFamily: "Georgia, serif", fontSize: "44px", color: "#d4a040",
        }).setOrigin(0.5);
        nxt.setInteractive({ useHandCursor: true });
        nxt.on("pointerdown", () => { this.currentPage++; this.renderScene(); });
      }
    }

    // Retour menu
    const back = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 80);
    const bgB = this.add.rectangle(0, 0, 180, 44, 0x2a1810);
    bgB.setStrokeStyle(2, 0x88a040);
    back.add(bgB);
    back.add(this.add.text(0, 0, "Retour", {
      fontFamily: "Georgia, serif", fontSize: "16px", color: "#88a040", fontStyle: "italic",
    }).setOrigin(0.5));
    bgB.setInteractive({ useHandCursor: true });
    bgB.on("pointerdown", () => {
      audio.sfx("click");
      this.scene.start("Boot");
    });
  }
}
