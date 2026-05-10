// E.3 — Marché à offres dynamiques (3 tirées dans pool de 20)
// E.4 — option combat élite à choisir
// E.5 — option de maudire son deck

import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../main";
import { GameState, snapshotRun } from "../systems/GameState";
import { rollMarketOffers, type MarketOffer, CURSE_OPTIONS, addDebt } from "../systems/Economy";
import { audio } from "../systems/AudioSystem";
import { CARD_POOL } from "../data/cards";
import type { Axis } from "../data/events";
import { saveCurrentRun } from "../systems/SaveSystem";

export class MarketScene extends Phaser.Scene {
  private offers: MarketOffer[] = [];
  private offerWasUsed = false;

  constructor() {
    super("Market");
  }

  create(): void {
    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.offers = rollMarketOffers(GameState.currentCircle);
    audio.playPhase("life");
    saveCurrentRun(snapshotRun("Market"));
    this.renderScene();
  }

  private renderScene(): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0a06, 0x1a0a06, 0x2a1408, 0x2a1408, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add.text(GAME_WIDTH / 2, 50, "— MARCHÉ DES ÂMES —", {
      fontFamily: "Georgia, serif", fontSize: "20px",
      color: "#d4a040", fontStyle: "italic",
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 80, `Or : ${GameState.gold}`, {
      fontFamily: "monospace", fontSize: "18px", color: "#ffd870",
    }).setOrigin(0.5);

    // 3 offres
    this.offers.forEach((offer, i) => {
      const y = 130 + i * 130;
      this.renderOffer(GAME_WIDTH / 2, y, offer);
    });

    // E.5 — bouton maudire
    this.renderCurseButton(GAME_WIDTH / 2, 540);

    // E.4 — élite : passe au prochain combat avec bonus
    this.renderEliteButton(GAME_WIDTH / 2, 620);

    // Bouton continuer
    const btn = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 80);
    const bgB = this.add.rectangle(0, 0, 240, 50, 0x2a1810);
    bgB.setStrokeStyle(2, 0x88a040);
    btn.add(bgB);
    btn.add(this.add.text(0, 0, "AU SUIVANT →", {
      fontFamily: "Georgia, serif", fontSize: "18px",
      color: "#88a040", fontStyle: "italic",
    }).setOrigin(0.5));
    bgB.setInteractive({ useHandCursor: true });
    bgB.on("pointerdown", () => {
      audio.sfx("click");
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("Combat", { circleIdx: GameState.currentCircle });
      });
    });
  }

  private renderOffer(x: number, y: number, offer: MarketOffer): void {
    const c = this.add.container(x, y);
    const w = GAME_WIDTH - 60;
    const h = 110;
    const bg = this.add.rectangle(0, 0, w, h, 0x2a1408);
    bg.setStrokeStyle(2, 0xa07020);
    c.add(bg);

    c.add(this.add.text(0, -30, offer.name, {
      fontFamily: "Georgia, serif", fontSize: "18px",
      color: "#f0d8b0", fontStyle: "bold",
    }).setOrigin(0.5));
    c.add(this.add.text(0, -8, offer.description, {
      fontFamily: "Georgia, serif", fontSize: "14px",
      color: "#a87a3a", fontStyle: "italic",
      wordWrap: { width: w - 40 }, align: "center",
    }).setOrigin(0.5));
    c.add(this.add.text(0, 30, `${offer.goldCost} or`, {
      fontFamily: "monospace", fontSize: "16px",
      color: GameState.gold >= offer.goldCost ? "#ffd870" : "#666666",
    }).setOrigin(0.5));

    if (GameState.gold >= offer.goldCost) {
      bg.setInteractive({ useHandCursor: true });
      bg.on("pointerdown", () => this.buyOffer(offer));
    }
  }

  private buyOffer(offer: MarketOffer): void {
    if (this.offerWasUsed) return;  // 1 achat par visite
    if (GameState.gold < offer.goldCost) return;
    GameState.gold -= offer.goldCost;
    audio.sfx("click");

    switch (offer.effect.type) {
      case "axis_boost": {
        const axis = offer.effect.axis as Axis;
        const amt = offer.effect.amount;
        GameState.profile[axis] = Math.min(100, GameState.profile[axis] + amt);
        break;
      }
      case "remove_card":
        if (GameState.deck.length > 0) GameState.deck.pop();
        break;
      case "consecrate_card":
        if (GameState.deck.length > 0) {
          const idx = Math.floor(Math.random() * GameState.deck.length);
          const c = GameState.deck[idx];
          GameState.deck[idx] = { ...c, atk: c.atk + 2, hp: c.hp + 2, consecrated: true };
        }
        break;
      case "heal_full":
        // Sera repris au prochain combat (playerHp reset)
        break;
      case "draw_more":
        (GameState as any).nextDrawBonus = ((GameState as any).nextDrawBonus || 0) + 1;
        break;
      case "discount_next":
        (GameState as any).nextCostDiscount = 2;
        break;
      case "duplicate_card":
        if (GameState.deck.length > 0) {
          GameState.deck.push({ ...GameState.deck[0] });
        }
        break;
      case "convert_axis": {
        const from = offer.effect.from;
        const to = offer.effect.to;
        const transfer = Math.min(10, GameState.profile[from]);
        GameState.profile[from] -= transfer;
        GameState.profile[to] = Math.min(100, GameState.profile[to] + transfer);
        break;
      }
      case "extra_relic_chance":
        (GameState as any).bonusRelicNextRun = true;
        break;
    }

    this.offerWasUsed = true;
    // Effet visuel
    const conf = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "✓ ACHETÉ", {
      fontFamily: "Georgia, serif", fontSize: "32px", color: "#88e0a0",
    }).setOrigin(0.5);
    this.tweens.add({
      targets: conf,
      alpha: 0, scale: 1.5,
      duration: 1500,
      onComplete: () => conf.destroy(),
    });
    // Re-render
    this.children.removeAll();
    this.renderScene();
  }

  // E.5 — maudire son deck
  private renderCurseButton(x: number, y: number): void {
    const c = this.add.container(x, y);
    const w = GAME_WIDTH - 60;
    const bg = this.add.rectangle(0, 0, w, 60, 0x4a0a14);
    bg.setStrokeStyle(2, 0xc83838);
    c.add(bg);
    c.add(this.add.text(0, -10, "MAUDIRE TON DECK", {
      fontFamily: "Georgia, serif", fontSize: "16px",
      color: "#ff8080", fontStyle: "bold",
    }).setOrigin(0.5));
    c.add(this.add.text(0, 12, "+1 carte maudite, +15 pts axe permanent run", {
      fontFamily: "Georgia, serif", fontSize: "13px",
      color: "#a87a3a", fontStyle: "italic",
    }).setOrigin(0.5));
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerdown", () => this.applyCurse());
  }

  private applyCurse(): void {
    const curse = CURSE_OPTIONS[Math.floor(Math.random() * CURSE_OPTIONS.length)];
    GameState.curses.push(curse);
    const axis = curse.permBoost.axis;
    GameState.profile[axis] = Math.min(100, GameState.profile[axis] + curse.permBoost.amount);
    // Ajout d'une carte maudite (mock)
    const cursed = { ...CARD_POOL[axis][0], id: `cursed-${curse.id}`, name: curse.name, atk: 0, hp: 1 };
    GameState.deck.push(cursed);
    audio.sfx("card_destroy");
    const conf = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "MAUDIT", {
      fontFamily: "Georgia, serif", fontSize: "40px", color: "#ff4040",
    }).setOrigin(0.5);
    this.tweens.add({ targets: conf, alpha: 0, duration: 1500, onComplete: () => conf.destroy() });
  }

  // E.4 — passe en combat élite
  private renderEliteButton(x: number, y: number): void {
    const c = this.add.container(x, y);
    const w = GAME_WIDTH - 60;
    const bg = this.add.rectangle(0, 0, w, 60, 0x3a0a3a);
    bg.setStrokeStyle(2, 0xa080d0);
    c.add(bg);
    c.add(this.add.text(0, -10, "COMBAT ÉLITE (risk/reward)", {
      fontFamily: "Georgia, serif", fontSize: "16px",
      color: "#e0a8e0", fontStyle: "bold",
    }).setOrigin(0.5));
    c.add(this.add.text(0, 12, "Boss +50% HP +30% ATK · 2× récompenses", {
      fontFamily: "Georgia, serif", fontSize: "13px",
      color: "#a87a3a", fontStyle: "italic",
    }).setOrigin(0.5));
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerdown", () => {
      audio.sfx("click");
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("Combat", { circleIdx: GameState.currentCircle, isElite: true });
      });
    });
  }
}
