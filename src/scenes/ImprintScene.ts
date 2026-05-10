// I.1 — voir l'Empreinte (boost permanent par carte jouée)
import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../main";
import { GameState } from "../systems/GameState";
import { CARD_POOL } from "../data/cards";
import { audio } from "../systems/AudioSystem";

export class ImprintScene extends Phaser.Scene {
  constructor() { super("Imprint"); }

  create(): void {
    this.cameras.main.fadeIn(500, 0, 0, 0);

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0a06, 0x1a0a06, 0x2a1408, 0x2a1408, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add.text(GAME_WIDTH / 2, 50, "— L'EMPREINTE —", {
      fontFamily: "Georgia, serif", fontSize: "22px", color: "#d4a040", fontStyle: "italic",
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 80, "Une carte jouée 10× modifie ton axe de +5 permanent.", {
      fontFamily: "Georgia, serif", fontSize: "14px", color: "#a87a3a", fontStyle: "italic",
      wordWrap: { width: GAME_WIDTH - 60 }, align: "center",
    }).setOrigin(0.5);

    // Boosts permanents
    this.add.text(GAME_WIDTH / 2, 130, "Boosts permanents :", {
      fontFamily: "Georgia, serif", fontSize: "15px", color: "#88e0a0",
    }).setOrigin(0.5);
    let yo = 160;
    const boosts = Object.entries(GameState.imprint.permanentBoosts).filter(([, v]) => v > 0);
    if (boosts.length === 0) {
      this.add.text(GAME_WIDTH / 2, yo, "Aucun pour l'instant.", {
        fontFamily: "Georgia, serif", fontSize: "14px",
        color: "#c0c0c0", fontStyle: "italic",
      }).setOrigin(0.5);
      yo += 30;
    } else {
      boosts.forEach(([axis, val]) => {
        this.add.text(GAME_WIDTH / 2, yo, `${axis}  +${val}`, {
          fontFamily: "monospace", fontSize: "15px", color: "#88e0a0",
        }).setOrigin(0.5);
        yo += 22;
      });
    }

    // Stats par carte (top 10 cartes les plus utilisées)
    const usage = Object.entries(GameState.imprint.cardUsageTotal)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    if (usage.length > 0) {
      this.add.text(GAME_WIDTH / 2, yo + 20, "Cartes les plus jouées :", {
        fontFamily: "Georgia, serif", fontSize: "15px", color: "#d4a040",
      }).setOrigin(0.5);
      yo += 50;
      usage.forEach(([id, count]) => {
        const card = this.findCard(id);
        const name = card ? card.name : id;
        const next = 10 - (count % 10);
        this.add.text(GAME_WIDTH / 2, yo, `${name}  ${count}× (prochain boost dans ${next})`, {
          fontFamily: "monospace", fontSize: "13px", color: "#a87a3a",
        }).setOrigin(0.5);
        yo += 18;
      });
    }

    // Retour
    const back = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 60);
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

  private findCard(id: string) {
    for (const arr of Object.values(CARD_POOL)) {
      const c = arr.find((c: any) => c.id === id);
      if (c) return c;
    }
    return null;
  }
}
