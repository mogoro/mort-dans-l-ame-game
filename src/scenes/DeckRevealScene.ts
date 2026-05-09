import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../main";
import { GameState, buildInitialDeck } from "../systems/GameState";
import { AXIS_COLOR } from "../data/cards";

export class DeckRevealScene extends Phaser.Scene {
  constructor() {
    super("DeckReveal");
  }

  create(): void {
    GameState.deck = buildInitialDeck();
    this.cameras.main.fadeIn(1000, 0, 0, 0);

    // Background mort/enfers
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0508, 0x1a0508, 0x4a141a, 0x4a141a, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Titre cinématique
    const title = this.add.text(GAME_WIDTH / 2, 100, "Tu meurs.", {
      fontFamily: "Georgia, serif",
      fontSize: "32px",
      color: "#c83838",
      fontStyle: "italic",
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, duration: 2000 });

    const subtitle = this.add.text(GAME_WIDTH / 2, 145, "Les Enfers t'attendent.", {
      fontFamily: "Georgia, serif",
      fontSize: "18px",
      color: "#a85858",
      fontStyle: "italic",
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: subtitle, alpha: 1, duration: 2000, delay: 1000 });

    // Reveal du deck
    const deckTitle = this.add.text(GAME_WIDTH / 2, 220, "TON DECK INITIAL", {
      fontFamily: "Georgia, serif",
      fontSize: "16px",
      color: "#d4a040",
      fontStyle: "bold",
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: deckTitle, alpha: 1, duration: 800, delay: 2200 });

    // Cartes en grille
    const cards = GameState.deck;
    const cardsY = 380;
    const cardW = 90;
    const cardH = 130;
    const gap = 8;
    const totalWidth = cards.length * (cardW + gap) - gap;
    const startX = (GAME_WIDTH - totalWidth) / 2 + cardW / 2;

    cards.forEach((card, i) => {
      const x = startX + i * (cardW + gap);
      const palette = AXIS_COLOR[card.axis] || AXIS_COLOR.Foi;

      const cardContainer = this.add.container(x, cardsY).setScale(0).setAlpha(0);

      // Ombre
      cardContainer.add(this.add.rectangle(2, 3, cardW, cardH, 0x000000, 0.5));

      // Carte fond
      const bg = this.add.rectangle(0, 0, cardW, cardH, palette.primary);
      bg.setStrokeStyle(3, palette.secondary);
      cardContainer.add(bg);

      // Halo radial qui pulse
      const halo = this.add.graphics();
      halo.fillStyle(palette.secondary, 0.4);
      halo.fillCircle(0, -cardH / 4, 26);
      halo.fillStyle(palette.accent, 0.25);
      halo.fillCircle(0, -cardH / 4, 16);
      cardContainer.add(halo);
      this.tweens.add({
        targets: halo,
        alpha: { from: 0.6, to: 1 },
        duration: 1500 + Math.random() * 600,
        yoyo: true,
        repeat: -1,
      });

      // Ornements coins
      const orn = this.add.graphics();
      orn.lineStyle(1, palette.accent, 0.7);
      [-1, 1].forEach((sx) => [-1, 1].forEach((sy) => {
        const px = sx * (cardW / 2 - 4);
        const py = sy * (cardH / 2 - 4);
        orn.lineBetween(px, py + sy * 8, px, py);
        orn.lineBetween(px, py, px + sx * 8, py);
      }));
      cardContainer.add(orn);

      // Emoji spécifique
      const emoji = card.emoji || "✦";
      const emojiText = this.add.text(0, -cardH / 4, emoji, { fontSize: "32px" }).setOrigin(0.5);
      cardContainer.add(emojiText);
      this.tweens.add({
        targets: emojiText,
        scale: { from: 1, to: 1.08 },
        duration: 1700,
        yoyo: true,
        repeat: -1,
      });

      // Coût en cercle
      const costCircle = this.add.circle(-cardW / 2 + 16, -cardH / 2 + 16, 12, palette.secondary);
      costCircle.setStrokeStyle(2, palette.accent);
      cardContainer.add(costCircle);
      cardContainer.add(
        this.add.text(-cardW / 2 + 16, -cardH / 2 + 16, String(card.cost), {
          fontFamily: "monospace",
          fontSize: "11px",
          color: "#fff5dc",
          fontStyle: "bold",
        }).setOrigin(0.5)
      );

      // Nom
      cardContainer.add(
        this.add.text(0, cardH / 2 - 28, card.name, {
          fontFamily: "Georgia, serif",
          fontSize: "11px",
          color: "#" + palette.accent.toString(16).padStart(6, "0"),
          fontStyle: "bold",
          align: "center",
          wordWrap: { width: cardW - 8 },
        }).setOrigin(0.5)
      );

      // ATK / HP
      cardContainer.add(
        this.add.text(-cardW / 2 + 14, cardH / 2 - 8, `⚔${card.atk}`, {
          fontFamily: "monospace",
          fontSize: "11px",
          color: "#f08070",
          fontStyle: "bold",
        }).setOrigin(0, 1)
      );
      cardContainer.add(
        this.add.text(cardW / 2 - 14, cardH / 2 - 8, `❤${card.hp}`, {
          fontFamily: "monospace",
          fontSize: "11px",
          color: "#80c08f",
          fontStyle: "bold",
        }).setOrigin(1, 1)
      );

      // Axe label
      cardContainer.add(
        this.add.text(0, -cardH / 2 + 32, card.axis, {
          fontFamily: "Georgia, serif",
          fontSize: "9px",
          color: "#" + palette.accent.toString(16).padStart(6, "0"),
        }).setOrigin(0.5)
      );

      // Animation flip
      this.tweens.add({
        targets: cardContainer,
        scale: 1,
        alpha: 1,
        duration: 400,
        delay: 3000 + i * 200,
        ease: "Back.easeOut",
      });
    });

    // Bouton continuer
    const continueBtn = this.add.container(GAME_WIDTH / 2, 600).setAlpha(0);
    const btnBg = this.add.rectangle(0, 0, 240, 56, 0x6a1818);
    btnBg.setStrokeStyle(2, 0xc83838);
    btnBg.setInteractive({ useHandCursor: true });
    const btnText = this.add.text(0, 0, "Tomber dans les Enfers →", {
      fontFamily: "Georgia, serif",
      fontSize: "16px",
      color: "#f0d8b0",
      fontStyle: "bold",
    }).setOrigin(0.5);
    continueBtn.add([btnBg, btnText]);
    this.tweens.add({ targets: continueBtn, alpha: 1, duration: 800, delay: 4500 });

    btnBg.on("pointerover", () => btnBg.setFillStyle(0x8a2828));
    btnBg.on("pointerout", () => btnBg.setFillStyle(0x6a1818));
    btnBg.on("pointerdown", () => {
      this.cameras.main.fadeOut(800, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("Combat");
      });
    });
  }
}
