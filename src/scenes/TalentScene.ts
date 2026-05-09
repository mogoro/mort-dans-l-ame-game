// C.3 — Arbre de talents
import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../main";
import { GameState, type Discipline } from "../systems/GameState";
import { TALENT_TREE, spendTalent, talentLevel } from "../systems/Talents";
import { audio } from "../systems/AudioSystem";

const DISC_COLORS: Record<Discipline, { primary: number; accent: number }> = {
  Guerre: { primary: 0x4a1818, accent: 0xff8080 },
  Sagesse: { primary: 0x1a2a3a, accent: 0x90c0e0 },
  Compassion: { primary: 0x3a2810, accent: 0xf0c080 },
  Calme: { primary: 0x1a3030, accent: 0x80c0c0 },
  Foi: { primary: 0x3a3018, accent: 0xf0d878 },
};

export class TalentScene extends Phaser.Scene {
  constructor() { super("Talent"); }

  create(): void {
    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.renderScene();
  }

  private renderScene(): void {
    this.children.removeAll();
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0a06, 0x1a0a06, 0x2a1408, 0x2a1408, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add.text(GAME_WIDTH / 2, 50, "— DISCIPLINES —", {
      fontFamily: "Georgia, serif", fontSize: "22px", color: "#d4a040", fontStyle: "italic",
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 80, `Points : ${GameState.talents.points}`, {
      fontFamily: "monospace", fontSize: "14px", color: "#ffd870",
    }).setOrigin(0.5);

    const disciplines: Discipline[] = ["Guerre", "Sagesse", "Compassion", "Calme", "Foi"];
    disciplines.forEach((disc, i) => {
      const y = 130 + i * 130;
      this.renderDiscipline(disc, GAME_WIDTH / 2, y);
    });

    const back = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 60);
    const bgB = this.add.rectangle(0, 0, 180, 44, 0x2a1810);
    bgB.setStrokeStyle(2, 0x88a040);
    back.add(bgB);
    back.add(this.add.text(0, 0, "Retour", {
      fontFamily: "Georgia, serif", fontSize: "14px", color: "#88a040", fontStyle: "italic",
    }).setOrigin(0.5));
    bgB.setInteractive({ useHandCursor: true });
    bgB.on("pointerdown", () => {
      audio.sfx("click");
      this.scene.start("Boot");
    });
  }

  private renderDiscipline(disc: Discipline, x: number, y: number): void {
    const palette = DISC_COLORS[disc];
    const c = this.add.container(x, y);
    const w = GAME_WIDTH - 40;
    const h = 110;
    const bg = this.add.rectangle(0, 0, w, h, palette.primary);
    bg.setStrokeStyle(2, palette.accent);
    c.add(bg);

    c.add(this.add.text(-w / 2 + 16, -h / 2 + 12, disc, {
      fontFamily: "Georgia, serif", fontSize: "16px", color: "#" + palette.accent.toString(16).padStart(6, "0"), fontStyle: "bold",
    }));

    const lvl = talentLevel(disc);
    c.add(this.add.text(w / 2 - 16, -h / 2 + 12, `Niveau ${lvl}/3`, {
      fontFamily: "monospace", fontSize: "11px", color: "#a87a3a",
    }).setOrigin(1, 0));

    // 3 niveaux avec descriptions
    [1, 2, 3].forEach((nLevel, idx) => {
      const node = TALENT_TREE.find((t) => t.discipline === disc && t.level === nLevel);
      if (!node) return;
      const ny = -h / 2 + 32 + idx * 22;
      const unlocked = lvl >= nLevel;
      const color = unlocked ? "#" + palette.accent.toString(16).padStart(6, "0") : "#666666";
      c.add(this.add.text(-w / 2 + 16, ny, `${unlocked ? "✓" : "○"} ${node.name}`, {
        fontFamily: "Georgia, serif", fontSize: "11px", color, fontStyle: unlocked ? "bold" : "italic",
      }));
      c.add(this.add.text(160, ny, node.description, {
        fontFamily: "Georgia, serif", fontSize: "10px",
        color: unlocked ? "#a87a3a" : "#666666",
        wordWrap: { width: w - 200 }, fontStyle: "italic",
      }));
    });

    // Bouton dépense
    if (GameState.talents.points > 0 && lvl < 3) {
      const btn = this.add.text(w / 2 - 16, h / 2 - 12, "[ Investir 1 pt ]", {
        fontFamily: "Georgia, serif", fontSize: "11px",
        color: "#88e0a0", fontStyle: "bold italic",
      }).setOrigin(1, 1);
      btn.setInteractive({ useHandCursor: true });
      btn.on("pointerdown", () => {
        if (spendTalent(disc)) {
          audio.sfx("victory");
          this.renderScene();
        }
      });
      c.add(btn);
    }
  }
}
