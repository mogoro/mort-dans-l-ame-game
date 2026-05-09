import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../main";
import { pickRandomLifeEvents, letterFor, type LifeEvent, NPC_DEFS, type OptionEvent } from "../data/events";
import { GameState, applyDelta } from "../systems/GameState";
import { audio } from "../systems/AudioSystem";
import { animSpeed } from "../systems/Settings";
import { recordChoice } from "../systems/SaveSystem";
import { recordChoiceTag } from "../systems/Judge";
import { drawIllustration, getIllustrationKind } from "./LifeIllustrations";

export class LifeScene extends Phaser.Scene {
  private currentEventIdx = 0;
  private container?: Phaser.GameObjects.Container;
  private isAnimating = false;
  private lifeEvents: LifeEvent[] = [];
  private timerText?: Phaser.GameObjects.Text;
  private timerEvent?: Phaser.Time.TimerEvent;
  private timeLeft = 0;
  private chosenTags: string[] = [];

  constructor() { super("Life"); }

  create(): void {
    this.currentEventIdx = 0;

    // Init NPCs si pas déjà fait
    if (GameState.npcs.length === 0) {
      GameState.npcs = NPC_DEFS.map((n) => ({ ...n, appearances: [] }));
    }

    // F.2 — branches : tags déjà acquis dans cette run
    const seenTags = GameState.persistentChoices.map((c) => c.tag);
    // C.5 — events verrouillés
    const lockedCodes = GameState.eventLocks.filter((l) => l.locked).map((l) => l.eventCode);
    this.lifeEvents = pickRandomLifeEvents(seenTags, lockedCodes);

    audio.playPhase("life");
    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.renderEvent();
  }

  private renderEvent(): void {
    if (this.container) this.container.destroy();
    this.container = this.add.container(0, 0);
    if (this.timerEvent) { this.timerEvent.remove(); this.timerEvent = undefined; }

    const evt = this.lifeEvents[this.currentEventIdx];

    const colors = [
      [0x1a2a3a, 0x2a4a5a],
      [0x1a2540, 0x28385a],
      [0x2a1f10, 0x3a2818],
    ];
    const [c1, c2] = colors[this.currentEventIdx] || colors[0];
    const bg = this.add.graphics();
    bg.fillGradientStyle(c1, c1, c2, c2, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.container.add(bg);

    const header = this.add.text(GAME_WIDTH / 2, 60, `— ${evt.phase} —`, {
      fontFamily: "Georgia, serif", fontSize: "22px",
      color: "#d4a040", fontStyle: "italic",
    }).setOrigin(0.5);
    this.container.add(header);

    // Progress bar
    const progY = 95;
    for (let i = 0; i < this.lifeEvents.length; i++) {
      const seg = this.add.rectangle(
        GAME_WIDTH / 2 + (i - 1) * 60, progY, 50, 4,
        i <= this.currentEventIdx ? 0xd4a040 : 0x444444
      );
      this.container.add(seg);
    }

    const code = this.add.text(GAME_WIDTH / 2, 120, evt.code, {
      fontFamily: "monospace", fontSize: "11px", color: "#806040",
    }).setOrigin(0.5);
    this.container.add(code);

    // F.7 — timer si timeoutSec
    if (evt.timeoutSec) {
      this.timeLeft = evt.timeoutSec;
      this.timerText = this.add.text(GAME_WIDTH - 20, 60, `${this.timeLeft}s`, {
        fontFamily: "monospace", fontSize: "16px",
        color: "#ff8080", fontStyle: "bold",
      }).setOrigin(1, 0.5);
      this.container.add(this.timerText);
      this.timerEvent = this.time.addEvent({
        delay: 1000,
        repeat: this.timeLeft - 1,
        callback: () => {
          this.timeLeft--;
          if (this.timerText) this.timerText.setText(`${this.timeLeft}s`);
          if (this.timeLeft <= 0) this.handleTimeout();
        },
      });
    }

    const illustW = Math.min(GAME_WIDTH - 40, 360);
    const illustH = 160;
    const illustY = 220;
    const illustContainer = this.add.container(GAME_WIDTH / 2, illustY);
    illustContainer.setAlpha(0);
    drawIllustration(this, illustContainer, getIllustrationKind(evt.code), illustW, illustH);
    this.container.add(illustContainer);
    this.tweens.add({ targets: illustContainer, alpha: 1, duration: 700 });

    const trame = this.add.text(GAME_WIDTH / 2, illustY + illustH / 2 + 20, evt.trame, {
      fontFamily: "Georgia, serif", fontSize: "16px",
      color: "#f0d8b0", fontStyle: "italic",
      align: "center", wordWrap: { width: GAME_WIDTH - 60 },
    }).setOrigin(0.5, 0);
    trame.setAlpha(0);
    this.container.add(trame);
    this.tweens.add({ targets: trame, alpha: 1, duration: 800 });

    // F.8 — filtrer options conditionnelles
    const visibleOptions = evt.options.filter((opt) => {
      if (!opt.requireAxis) return true;
      const a = opt.requireAxis.axis;
      const val = GameState.profile[a];
      if (opt.requireAxis.min && val < opt.requireAxis.min) return false;
      if (opt.requireAxis.max && val > opt.requireAxis.max) return false;
      return true;
    });

    const optionsStartY = trame.y + trame.height + 40;
    const buttonHeight = visibleOptions.length > 4 ? 60 : 76;
    const buttonGap = visibleOptions.length > 4 ? 70 : 90;

    visibleOptions.forEach((opt, idx) => {
      const y = optionsStartY + idx * buttonGap;
      const btn = this.createOptionButton(GAME_WIDTH / 2, y, opt.text, buttonHeight, () => {
        if (this.isAnimating) return;
        this.isAnimating = true;
        this.applyOption(opt);
      }, !!opt.requireAxis);
      btn.setAlpha(0);
      this.container?.add(btn);
      this.tweens.add({
        targets: btn,
        alpha: 1, delay: 800 + idx * 150, duration: 400,
      });
    });
  }

  // F.7 — timeout : applique paresse +deltas
  private handleTimeout(): void {
    if (this.isAnimating) return;
    this.isAnimating = true;
    if (this.timerEvent) this.timerEvent.remove();
    this.applyOption({
      text: "(temps écoulé)",
      deltas: { Paresse: +12 },
      tag: "indecis",
    });
  }

  private createOptionButton(
    x: number, y: number, text: string, height: number,
    onClick: () => void, isConditional = false
  ): Phaser.GameObjects.Container {
    const c = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, GAME_WIDTH - 60, height,
      isConditional ? 0x3a2818 : 0x2a1810);
    bg.setStrokeStyle(2, isConditional ? 0xd4a040 : 0x8a5018);
    bg.setInteractive({ useHandCursor: true });
    c.add(bg);

    const t = this.add.text(0, 0, text, {
      fontFamily: "Georgia, serif", fontSize: "14px",
      color: "#f0d8b0", align: "center",
      wordWrap: { width: GAME_WIDTH - 90 },
    }).setOrigin(0.5);
    c.add(t);

    if (isConditional) {
      c.add(this.add.text(0, height / 2 - 10, "★ trait acquis", {
        fontFamily: "Georgia, serif", fontSize: "9px",
        color: "#d4a040", fontStyle: "italic",
      }).setOrigin(0.5, 1));
    }

    bg.on("pointerover", () => {
      bg.setFillStyle(isConditional ? 0x5a3818 : 0x4a2818);
      bg.setStrokeStyle(2, 0xd4a040);
    });
    bg.on("pointerout", () => {
      bg.setFillStyle(isConditional ? 0x3a2818 : 0x2a1810);
      bg.setStrokeStyle(2, isConditional ? 0xd4a040 : 0x8a5018);
    });
    bg.on("pointerdown", () => {
      bg.setFillStyle(0x6a4828);
      this.tweens.add({
        targets: c, scale: { from: 1, to: 0.95 },
        duration: 100, yoyo: true, onComplete: onClick,
      });
    });
    return c;
  }

  private applyOption(opt: OptionEvent): void {
    if (this.timerEvent) this.timerEvent.remove();
    recordChoice();
    const evt = this.lifeEvents[this.currentEventIdx];

    Object.entries(opt.deltas).forEach(([axis, val]) => {
      applyDelta(axis as any, val as number);
    });

    // F.2 — store tag pour les events suivants
    if (opt.tag) {
      this.chosenTags.push(opt.tag);
      GameState.persistentChoices.push({
        eventCode: evt.code,
        optionIndex: evt.options.indexOf(opt),
        tag: opt.tag,
      });
      recordChoiceTag(opt.tag);
    }

    // F.3 — impact PNJ
    if (opt.npcImpact) {
      const npc = GameState.npcs.find((n) => n.id === opt.npcImpact!.id);
      if (npc) {
        npc.relation += opt.npcImpact.deltaRelation;
        npc.appearances.push(evt.code);
        if (opt.npcImpact.killed) npc.alive = false;
      }
    }

    // Floating deltas
    Object.entries(opt.deltas).forEach(([axis, val], i) => {
      const v = val as number;
      const sign = v > 0 ? "+" : "";
      const color = v > 0 ? "#88e0a0" : "#e08080";
      const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + i * 30, `${sign}${v} ${axis}`, {
        fontFamily: "monospace", fontSize: "20px",
        color, stroke: "#000000", strokeThickness: 3,
      }).setOrigin(0.5);
      this.tweens.add({
        targets: text, y: text.y - 80,
        alpha: { from: 1, to: 0 }, duration: 1500, ease: "Cubic.easeOut",
      });
    });

    this.time.delayedCall(1700, () => {
      // F.4 — lettre interstitielle si tag déclencheur
      const trigger = opt.tag;
      const letter = trigger ? letterFor(trigger) : null;
      this.currentEventIdx++;
      if (this.currentEventIdx >= this.lifeEvents.length) {
        this.cameras.main.fadeOut(800, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          if (letter) {
            this.scene.start("Letter", { text: letter, nextScene: "DeckReveal" });
          } else {
            this.scene.start("DeckReveal");
          }
        });
      } else if (letter && Math.random() < 0.5) {
        // 50% chance d'insérer une lettre entre 2 events
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.start("Letter", { text: letter, nextScene: "Life" });
          // Mais on perd le state...
        });
        // Fix : intermède inline plutôt
        this.showLetterInline(letter);
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

  // F.4 — lettre inline (overlay)
  private showLetterInline(text: string): void {
    const overlay = this.add.container(0, 0);
    overlay.setDepth(2000);
    const dim = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.85);
    dim.setInteractive();
    overlay.add(dim);
    const paper = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 80, GAME_HEIGHT * 0.4, 0xf0d8a0);
    paper.setStrokeStyle(3, 0x8a5018);
    paper.setRotation(-0.02);
    overlay.add(paper);
    const t = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, text, {
      fontFamily: "Georgia, serif", fontSize: "15px",
      color: "#3a2810", fontStyle: "italic",
      align: "center", wordWrap: { width: GAME_WIDTH - 130 },
    }).setOrigin(0.5);
    t.setRotation(-0.02);
    overlay.add(t);
    overlay.add(this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 100, "Touche pour continuer", {
      fontFamily: "Georgia, serif", fontSize: "11px",
      color: "#a87a3a", fontStyle: "italic",
    }).setOrigin(0.5));

    dim.on("pointerdown", () => {
      audio.sfx("click");
      overlay.destroy();
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.cameras.main.fadeIn(400, 0, 0, 0);
        this.isAnimating = false;
        this.renderEvent();
      });
    });
  }
}
