// G.1 pioche stratégique : choisir 1 carte sur 3 (pour la 5e)
// G.5 — désigner une gardienne
// A.7 — consacrer une carte (trade-off)
import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../main";
import { GameState, buildInitialDeck, snapshotRun } from "../systems/GameState";
import { AXIS_COLOR, CARD_POOL, type Card, consecrate } from "../data/cards";
import { ALL_AXES, type Axis } from "../data/events";
import { audio } from "../systems/AudioSystem";
import { hasRelic } from "../systems/Relics";
import { saveCurrentRun } from "../systems/SaveSystem";

export class DeckRevealScene extends Phaser.Scene {
  private step: "reveal" | "pick" | "guardian" | "consecrate" | "done" = "reveal";
  private pickChoices: Card[] = [];

  constructor() { super("DeckReveal"); }

  create(): void {
    GameState.deck = buildInitialDeck();

    // C.2 relique pièce de Charon : +10 or
    if (hasRelic("start_gold_10")) GameState.gold += 10;

    this.cameras.main.fadeIn(1000, 0, 0, 0);
    saveCurrentRun(snapshotRun("DeckReveal"));
    this.renderReveal();
  }

  private renderReveal(): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0508, 0x1a0508, 0x4a141a, 0x4a141a, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const title = this.add.text(GAME_WIDTH / 2, 100, "Tu meurs.", {
      fontFamily: "Georgia, serif", fontSize: "32px",
      color: "#c83838", fontStyle: "italic",
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, duration: 2000 });

    const subtitle = this.add.text(GAME_WIDTH / 2, 145, "Les Enfers t'attendent.", {
      fontFamily: "Georgia, serif", fontSize: "18px",
      color: "#a85858", fontStyle: "italic",
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: subtitle, alpha: 1, duration: 2000, delay: 1000 });

    const deckTitle = this.add.text(GAME_WIDTH / 2, 220, "TON DECK INITIAL", {
      fontFamily: "Georgia, serif", fontSize: "16px",
      color: "#d4a040", fontStyle: "bold",
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: deckTitle, alpha: 1, duration: 800, delay: 2200 });

    this.renderDeckCards(GameState.deck, 380);

    // Bouton aller à pick si > 0 cartes, sinon direct
    const continueBtn = this.add.container(GAME_WIDTH / 2, 600).setAlpha(0);
    const btnBg = this.add.rectangle(0, 0, 240, 56, 0x6a1818);
    btnBg.setStrokeStyle(2, 0xc83838);
    btnBg.setInteractive({ useHandCursor: true });
    const btnText = this.add.text(0, 0, "Choisir une carte bonus →", {
      fontFamily: "Georgia, serif", fontSize: "16px",
      color: "#f0d8b0", fontStyle: "bold",
    }).setOrigin(0.5);
    continueBtn.add([btnBg, btnText]);
    this.tweens.add({ targets: continueBtn, alpha: 1, duration: 800, delay: 4500 });

    btnBg.on("pointerover", () => btnBg.setFillStyle(0x8a2828));
    btnBg.on("pointerout", () => btnBg.setFillStyle(0x6a1818));
    btnBg.on("pointerdown", () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => this.renderPick());
    });
  }

  // G.1 — choisir 1 carte sur 3
  private renderPick(): void {
    this.children.removeAll();
    this.cameras.main.fadeIn(400, 0, 0, 0);

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0a14, 0x1a0a14, 0x2a1428, 0x2a1428, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add.text(GAME_WIDTH / 2, 60, "— PIOCHE STRATÉGIQUE —", {
      fontFamily: "Georgia, serif", fontSize: "20px",
      color: "#d4a040", fontStyle: "italic",
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 90, "Choisis 1 carte sur 3 pour rejoindre ton deck.", {
      fontFamily: "Georgia, serif", fontSize: "12px",
      color: "#a87a3a", fontStyle: "italic",
    }).setOrigin(0.5);

    // Tire 3 cartes random parmi top 5 axes du joueur
    const sortedAxes = (Object.entries(GameState.profile) as [Axis, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const pool: Card[] = [];
    sortedAxes.forEach(([axis]) => pool.push(...CARD_POOL[axis]));
    this.pickChoices = this.shuffle(pool).slice(0, 3);

    this.pickChoices.forEach((card, i) => {
      const x = GAME_WIDTH / 2 + (i - 1) * 130;
      const y = GAME_HEIGHT / 2;
      this.renderPickCard(x, y, card, () => {
        GameState.deck.push({ ...card, usesCount: 0 });
        audio.sfx("victory");
        this.renderGuardian();
      });
    });

    // Skip
    const skip = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 60);
    const sBg = this.add.rectangle(0, 0, 200, 40, 0x2a1810);
    sBg.setStrokeStyle(1, 0x666666);
    skip.add(sBg);
    skip.add(this.add.text(0, 0, "Refuser le bonus", {
      fontFamily: "Georgia, serif", fontSize: "12px",
      color: "#a0a0a0", fontStyle: "italic",
    }).setOrigin(0.5));
    sBg.setInteractive({ useHandCursor: true });
    sBg.on("pointerdown", () => this.renderGuardian());
  }

  // G.5 — choisir une gardienne (indestructible)
  private renderGuardian(): void {
    this.children.removeAll();
    this.cameras.main.fadeIn(300, 0, 0, 0);

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x10141a, 0x10141a, 0x202838, 0x202838, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add.text(GAME_WIDTH / 2, 60, "— LA GARDIENNE —", {
      fontFamily: "Georgia, serif", fontSize: "20px",
      color: "#80c0e0", fontStyle: "italic",
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 90, "Désigne 1 carte indestructible (cœur de ta run).", {
      fontFamily: "Georgia, serif", fontSize: "12px",
      color: "#80a0c0", fontStyle: "italic",
      wordWrap: { width: GAME_WIDTH - 60 }, align: "center",
    }).setOrigin(0.5);

    GameState.deck.forEach((card, i) => {
      const x = (i % 3) * 140 + 100;
      const y = 200 + Math.floor(i / 3) * 180;
      this.renderPickCard(x, y, card, () => {
        const sigils = card.sigils || [];
        if (!sigils.includes("guardian")) sigils.push("guardian");
        GameState.deck[i] = { ...card, sigils, isGuardian: true };
        audio.sfx("victory");
        this.renderConsecrate();
      });
    });

    // Skip
    const skip = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 60);
    const sBg = this.add.rectangle(0, 0, 200, 40, 0x2a1810);
    sBg.setStrokeStyle(1, 0x666666);
    skip.add(sBg);
    skip.add(this.add.text(0, 0, "Pas de gardienne", {
      fontFamily: "Georgia, serif", fontSize: "12px",
      color: "#a0a0a0", fontStyle: "italic",
    }).setOrigin(0.5));
    sBg.setInteractive({ useHandCursor: true });
    sBg.on("pointerdown", () => this.renderConsecrate());
  }

  // A.7 — consécration : trade-off (1× par run)
  private renderConsecrate(): void {
    this.children.removeAll();
    this.cameras.main.fadeIn(300, 0, 0, 0);

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1408, 0x1a1408, 0x2a2010, 0x2a2010, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add.text(GAME_WIDTH / 2, 60, "— CONSÉCRATION —", {
      fontFamily: "Georgia, serif", fontSize: "20px",
      color: "#f0d878", fontStyle: "italic",
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 90, "Consacre 1 carte (+ATK +HP). Coût : -10 sur l'axe lié.", {
      fontFamily: "Georgia, serif", fontSize: "12px",
      color: "#a87a3a", fontStyle: "italic",
      wordWrap: { width: GAME_WIDTH - 60 }, align: "center",
    }).setOrigin(0.5);

    GameState.deck.forEach((card, i) => {
      const x = (i % 3) * 140 + 100;
      const y = 200 + Math.floor(i / 3) * 180;
      this.renderPickCard(x, y, card, () => {
        if (GameState.profile[card.axis] < 10) return;
        GameState.profile[card.axis] -= 10;
        GameState.deck[i] = consecrate(card);
        audio.sfx("victory");
        this.goToCombat();
      });
    });

    const skip = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 60);
    const sBg = this.add.rectangle(0, 0, 200, 40, 0x2a1810);
    sBg.setStrokeStyle(1, 0x666666);
    skip.add(sBg);
    skip.add(this.add.text(0, 0, "Pas de consécration", {
      fontFamily: "Georgia, serif", fontSize: "12px",
      color: "#a0a0a0", fontStyle: "italic",
    }).setOrigin(0.5));
    sBg.setInteractive({ useHandCursor: true });
    sBg.on("pointerdown", () => this.goToCombat());
  }

  private goToCombat(): void {
    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      GameState.currentCircle = 0;
      this.scene.start("Combat", { circleIdx: 0 });
    });
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  private renderDeckCards(cards: Card[], cardsY: number): void {
    const cardW = 90;
    const cardH = 130;
    const gap = 8;
    const totalWidth = cards.length * (cardW + gap) - gap;
    const startX = (GAME_WIDTH - totalWidth) / 2 + cardW / 2;

    cards.forEach((card, i) => {
      const x = startX + i * (cardW + gap);
      const palette = AXIS_COLOR[card.axis] || AXIS_COLOR.Foi;
      const cardContainer = this.add.container(x, cardsY).setScale(0).setAlpha(0);

      cardContainer.add(this.add.rectangle(2, 3, cardW, cardH, 0x000000, 0.5));
      const bg = this.add.rectangle(0, 0, cardW, cardH, palette.primary);
      bg.setStrokeStyle(3, palette.secondary);
      cardContainer.add(bg);

      const halo = this.add.graphics();
      halo.fillStyle(palette.secondary, 0.4);
      halo.fillCircle(0, -cardH / 4, 26);
      halo.fillStyle(palette.accent, 0.25);
      halo.fillCircle(0, -cardH / 4, 16);
      cardContainer.add(halo);
      this.tweens.add({
        targets: halo, alpha: { from: 0.6, to: 1 },
        duration: 1500 + Math.random() * 600, yoyo: true, repeat: -1,
      });

      const orn = this.add.graphics();
      orn.lineStyle(1, palette.accent, 0.7);
      [-1, 1].forEach((sx) => [-1, 1].forEach((sy) => {
        const px = sx * (cardW / 2 - 4);
        const py = sy * (cardH / 2 - 4);
        orn.lineBetween(px, py + sy * 8, px, py);
        orn.lineBetween(px, py, px + sx * 8, py);
      }));
      cardContainer.add(orn);

      const emoji = card.emoji || "✦";
      const emojiText = this.add.text(0, -cardH / 4, emoji, { fontSize: "32px" }).setOrigin(0.5);
      cardContainer.add(emojiText);

      const costCircle = this.add.circle(-cardW / 2 + 16, -cardH / 2 + 16, 12, palette.secondary);
      costCircle.setStrokeStyle(2, palette.accent);
      cardContainer.add(costCircle);
      cardContainer.add(this.add.text(-cardW / 2 + 16, -cardH / 2 + 16, String(card.cost), {
        fontFamily: "monospace", fontSize: "11px", color: "#fff5dc", fontStyle: "bold",
      }).setOrigin(0.5));

      cardContainer.add(this.add.text(0, cardH / 2 - 28, card.name, {
        fontFamily: "Georgia, serif", fontSize: "11px",
        color: "#" + palette.accent.toString(16).padStart(6, "0"),
        fontStyle: "bold", align: "center", wordWrap: { width: cardW - 8 },
      }).setOrigin(0.5));

      cardContainer.add(this.add.text(-cardW / 2 + 14, cardH / 2 - 8, `⚔${card.atk}`, {
        fontFamily: "monospace", fontSize: "11px", color: "#f08070", fontStyle: "bold",
      }).setOrigin(0, 1));
      cardContainer.add(this.add.text(cardW / 2 - 14, cardH / 2 - 8, `❤${card.hp}`, {
        fontFamily: "monospace", fontSize: "11px", color: "#80c08f", fontStyle: "bold",
      }).setOrigin(1, 1));

      this.tweens.add({
        targets: cardContainer, scale: 1, alpha: 1,
        duration: 400, delay: 3000 + i * 200, ease: "Back.easeOut",
      });
    });
  }

  private renderPickCard(x: number, y: number, card: Card, onClick: () => void): void {
    const palette = AXIS_COLOR[card.axis] || AXIS_COLOR.Foi;
    const cardW = 110;
    const cardH = 160;
    const c = this.add.container(x, y);
    c.add(this.add.rectangle(2, 3, cardW, cardH, 0x000000, 0.5));
    const bg = this.add.rectangle(0, 0, cardW, cardH, palette.primary);
    bg.setStrokeStyle(3, palette.secondary);
    c.add(bg);

    c.add(this.add.text(0, -cardH / 4, card.emoji || "✦", { fontSize: "40px" }).setOrigin(0.5));
    c.add(this.add.text(0, cardH / 2 - 32, card.name, {
      fontFamily: "Georgia, serif", fontSize: "11px",
      color: "#" + palette.accent.toString(16).padStart(6, "0"),
      fontStyle: "bold", align: "center", wordWrap: { width: cardW - 10 },
    }).setOrigin(0.5));
    c.add(this.add.text(-cardW / 2 + 14, cardH / 2 - 10, `⚔${card.atk}`, {
      fontFamily: "monospace", fontSize: "12px", color: "#f08070", fontStyle: "bold",
    }).setOrigin(0, 1));
    c.add(this.add.text(cardW / 2 - 14, cardH / 2 - 10, `❤${card.hp}`, {
      fontFamily: "monospace", fontSize: "12px", color: "#80c08f", fontStyle: "bold",
    }).setOrigin(1, 1));

    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerover", () => {
      this.tweens.add({ targets: c, scale: 1.08, duration: 200 });
    });
    bg.on("pointerout", () => {
      this.tweens.add({ targets: c, scale: 1, duration: 200 });
    });
    bg.on("pointerdown", () => {
      this.tweens.add({
        targets: c, scale: 0.9,
        duration: 100, yoyo: true,
        onComplete: onClick,
      });
    });
  }
}
