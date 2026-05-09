import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../main";
import { pickRandomLifeEvents, type LifeEvent } from "../data/events";
import { GameState, applyDelta } from "../systems/GameState";
import { audio } from "../systems/AudioSystem";
import { animSpeed } from "../systems/Settings";
import { recordChoice } from "../systems/SaveSystem";

export class LifeScene extends Phaser.Scene {
  private currentEventIdx = 0;
  private container?: Phaser.GameObjects.Container;
  private isAnimating = false;
  private lifeEvents: LifeEvent[] = [];

  constructor() {
    super("Life");
  }

  create(): void {
    this.currentEventIdx = 0;
    this.lifeEvents = pickRandomLifeEvents();
    audio.playPhase("life");
    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.renderEvent();
  }

  private renderEvent(): void {
    if (this.container) this.container.destroy();
    this.container = this.add.container(0, 0);

    const evt = this.lifeEvents[this.currentEventIdx];

    // Background dégradé selon phase (Enfance bleu, Ado violet, Adulte ocre)
    const colors = [
      [0x1a2a3a, 0x2a4a5a], // ENF
      [0x1a2540, 0x28385a], // ADO
      [0x2a1f10, 0x3a2818], // ADU
    ];
    const [c1, c2] = colors[this.currentEventIdx] || colors[0];
    const bg = this.add.graphics();
    bg.fillGradientStyle(c1, c1, c2, c2, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.container.add(bg);

    // Header phase
    const header = this.add.text(GAME_WIDTH / 2, 60, `— ${evt.phase} —`, {
      fontFamily: "Georgia, serif",
      fontSize: "22px",
      color: "#d4a040",
      fontStyle: "italic",
    }).setOrigin(0.5);
    this.container.add(header);

    // Progress bar (3 segments)
    const progY = 95;
    for (let i = 0; i < this.lifeEvents.length; i++) {
      const seg = this.add.rectangle(
        GAME_WIDTH / 2 + (i - 1) * 60,
        progY,
        50,
        4,
        i <= this.currentEventIdx ? 0xd4a040 : 0x444444
      );
      this.container.add(seg);
    }

    // Event code
    const code = this.add.text(GAME_WIDTH / 2, 120, evt.code, {
      fontFamily: "monospace",
      fontSize: "11px",
      color: "#806040",
    }).setOrigin(0.5);
    this.container.add(code);

    // Trame (avec word wrap)
    const trame = this.add.text(GAME_WIDTH / 2, 180, evt.trame, {
      fontFamily: "Georgia, serif",
      fontSize: "16px",
      color: "#f0d8b0",
      fontStyle: "italic",
      align: "center",
      wordWrap: { width: GAME_WIDTH - 60 },
    }).setOrigin(0.5, 0);
    trame.setAlpha(0);
    this.container.add(trame);

    this.tweens.add({
      targets: trame,
      alpha: 1,
      duration: 800,
    });

    // Options sous forme de boutons
    const optionsStartY = trame.y + trame.height + 40;
    evt.options.forEach((opt, idx) => {
      const y = optionsStartY + idx * 90;
      const btn = this.createOptionButton(GAME_WIDTH / 2, y, opt.text, () => {
        if (this.isAnimating) return;
        this.isAnimating = true;
        this.applyOption(opt);
      });
      btn.setAlpha(0);
      this.container?.add(btn);
      this.tweens.add({
        targets: btn,
        alpha: 1,
        delay: 800 + idx * 150,
        duration: 400,
      });
    });
  }

  private createOptionButton(
    x: number,
    y: number,
    text: string,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const c = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, GAME_WIDTH - 60, 76, 0x2a1810);
    bg.setStrokeStyle(2, 0x8a5018);
    bg.setInteractive({ useHandCursor: true });
    c.add(bg);

    const t = this.add.text(0, 0, text, {
      fontFamily: "Georgia, serif",
      fontSize: "14px",
      color: "#f0d8b0",
      align: "center",
      wordWrap: { width: GAME_WIDTH - 90 },
    }).setOrigin(0.5);
    c.add(t);

    bg.on("pointerover", () => {
      bg.setFillStyle(0x4a2818);
      bg.setStrokeStyle(2, 0xd4a040);
    });
    bg.on("pointerout", () => {
      bg.setFillStyle(0x2a1810);
      bg.setStrokeStyle(2, 0x8a5018);
    });
    bg.on("pointerdown", () => {
      bg.setFillStyle(0x6a4828);
      this.tweens.add({
        targets: c,
        scale: { from: 1, to: 0.95 },
        duration: 100,
        yoyo: true,
        onComplete: onClick,
      });
    });

    return c;
  }

  private applyOption(opt: { deltas: Record<string, number> }): void {
    // Appliquer deltas
    Object.entries(opt.deltas).forEach(([axis, val]) => {
      applyDelta(axis as any, val);
    });

    // Show floating deltas
    Object.entries(opt.deltas).forEach(([axis, val], i) => {
      const sign = val > 0 ? "+" : "";
      const color = val > 0 ? "#88e0a0" : "#e08080";
      const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + i * 30, `${sign}${val} ${axis}`, {
        fontFamily: "monospace",
        fontSize: "20px",
        color,
        stroke: "#000000",
        strokeThickness: 3,
      }).setOrigin(0.5);
      this.tweens.add({
        targets: text,
        y: text.y - 80,
        alpha: { from: 1, to: 0 },
        duration: 1500,
        ease: "Cubic.easeOut",
      });
    });

    // Pause + advance
    this.time.delayedCall(1700, () => {
      this.currentEventIdx++;
      if (this.currentEventIdx >= this.lifeEvents.length) {
        this.cameras.main.fadeOut(800, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.start("DeckReveal");
        });
      } else {
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.cameras.main.fadeIn(400, 0, 0, 0);
          this.isAnimating = false;
          this.renderEvent();
        });
      }
    });
  }
}
