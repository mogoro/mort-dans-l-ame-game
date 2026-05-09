import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../main";
import { GameState } from "../systems/GameState";
import { AXIS_COLOR, type Card } from "../data/cards";
import type { Axis } from "../data/events";

interface BoardSlot {
  card: (Card & { currentHp: number; isBoss?: boolean }) | null;
  container?: Phaser.GameObjects.Container;
}

export class CombatScene extends Phaser.Scene {
  private axisPool: Record<Axis, number> = {} as any;
  private playerBoard: BoardSlot[] = [];
  private enemyBoard: BoardSlot[] = [];
  private hand: Card[] = [];
  private deck: Card[] = [];
  private discard: Card[] = [];
  private turn = 1;
  private finished = false;
  private bossHp = 30;
  private bossMaxHp = 30;
  private judgeBubble?: Phaser.GameObjects.Text;
  private handContainer?: Phaser.GameObjects.Container;
  private boardContainer?: Phaser.GameObjects.Container;
  private hudContainer?: Phaser.GameObjects.Container;
  private isAnimating = false;

  constructor() {
    super("Combat");
  }

  create(): void {
    this.cameras.main.fadeIn(800, 0, 0, 0);

    // Init pool axes (depuis profile)
    this.axisPool = { ...GameState.profile };
    // Plancher 10 par axe
    Object.keys(this.axisPool).forEach((a) => {
      if (this.axisPool[a as Axis] < 10) this.axisPool[a as Axis] = 10;
    });

    // Init deck
    this.deck = this.shuffle([...GameState.deck]);
    this.discard = [];
    this.hand = [];
    this.playerBoard = [
      { card: null }, { card: null }, { card: null }, { card: null },
    ];
    this.enemyBoard = [
      { card: null }, { card: null }, { card: null }, { card: null },
    ];

    // Spawn boss au centre
    this.enemyBoard[1] = {
      card: {
        id: "cleopatre",
        name: "Cléopâtre",
        axis: "Luxure",
        cost: 0,
        atk: 6,
        hp: 30,
        currentHp: 30,
        isBoss: true,
      },
    };
    this.bossHp = 30;
    this.bossMaxHp = 30;

    this.drawHand(4);
    this.turn = 1;
    this.finished = false;

    this.renderScene();
    this.setJudgeMessage("Tu entres dans le cercle. Le vent souffle. Tu vois passer ceux que tu as désirés.");
  }

  // =======================================================================
  // Rendering
  // =======================================================================

  private renderScene(): void {
    if (this.boardContainer) this.boardContainer.destroy();
    if (this.handContainer) this.handContainer.destroy();
    if (this.hudContainer) this.hudContainer.destroy();

    this.renderBackground();
    this.renderBoard();
    this.renderHand();
    this.renderHud();
  }

  private renderBackground(): void {
    // Background table en bois + halos bougies (refait à chaque renderScene)
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0a06, 0x1a0a06, 0x3a1c0a, 0x3a1c0a, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Halos bougies
    const candleColor = 0xffaa44;
    [
      { x: 50, y: 100 },
      { x: GAME_WIDTH - 50, y: 100 },
      { x: 50, y: GAME_HEIGHT - 100 },
      { x: GAME_WIDTH - 50, y: GAME_HEIGHT - 100 },
    ].forEach((p) => {
      const halo = this.add.graphics();
      halo.fillStyle(candleColor, 0.18);
      halo.fillCircle(p.x, p.y, 80);
      halo.fillStyle(0xffcc66, 0.12);
      halo.fillCircle(p.x, p.y, 50);
      const flame = this.add.circle(p.x, p.y, 4, 0xffd870);
      this.tweens.add({
        targets: flame,
        scale: { from: 0.85, to: 1.4 },
        duration: 500 + Math.random() * 400,
        yoyo: true,
        repeat: -1,
      });
    });

    // Texture de table en bois (lignes verticales)
    const woodGfx = this.add.graphics();
    woodGfx.fillStyle(0x2a1408, 0.4);
    for (let i = 0; i < GAME_WIDTH; i += 4) {
      if (i % 8 === 0) woodGfx.fillRect(i, 130, 2, GAME_HEIGHT - 280);
    }
  }

  private renderBoard(): void {
    this.boardContainer = this.add.container(0, 0);

    // Le Juge en haut (portrait + bulle)
    const judgeY = 100;
    const judgePortrait = this.add.container(70, judgeY);
    const judgeCircle = this.add.circle(0, 0, 35, 0x4a0a14);
    judgeCircle.setStrokeStyle(3, 0xc83838);
    judgePortrait.add(judgeCircle);
    judgePortrait.add(
      this.add.text(0, 0, "👸", { fontSize: "36px" }).setOrigin(0.5)
    );

    // Pulse halo Le Juge
    this.tweens.add({
      targets: judgeCircle,
      scale: { from: 1, to: 1.08 },
      duration: 1800,
      yoyo: true,
      repeat: -1,
    });

    this.boardContainer.add(judgePortrait);

    // Bulle de dialogue
    const bubbleBg = this.add.rectangle(140, judgeY - 18, GAME_WIDTH - 160, 70, 0x000000, 0.65);
    bubbleBg.setOrigin(0, 0);
    bubbleBg.setStrokeStyle(1, 0xd4a040, 0.6);
    this.boardContainer.add(bubbleBg);

    this.judgeBubble = this.add.text(150, judgeY - 8, "", {
      fontFamily: "Georgia, serif",
      fontSize: "12px",
      color: "#f0d8b0",
      fontStyle: "italic",
      wordWrap: { width: GAME_WIDTH - 180 },
    });
    this.boardContainer.add(this.judgeBubble);

    // Plateau ennemi (4 zones, vue de dessus)
    const enemyY = 240;
    const slotW = 90;
    const slotH = 120;
    const totalW = 4 * slotW + 3 * 8;
    const startX = (GAME_WIDTH - totalW) / 2 + slotW / 2;

    this.enemyBoard.forEach((slot, i) => {
      const x = startX + i * (slotW + 8);
      const c = this.renderSlot(x, enemyY, slot, slotW, slotH, false);
      this.boardContainer?.add(c);
      slot.container = c;
    });

    // Banner tour
    const banner = this.add.text(GAME_WIDTH / 2, 380, `— TOUR ${this.turn} · TA PHASE —`, {
      fontFamily: "Georgia, serif",
      fontSize: "12px",
      color: "#a87a3a",
      fontStyle: "italic",
    }).setOrigin(0.5);
    this.boardContainer.add(banner);

    // Plateau joueur
    const playerY = 470;
    this.playerBoard.forEach((slot, i) => {
      const x = startX + i * (slotW + 8);
      const c = this.renderSlot(x, playerY, slot, slotW, slotH, true);
      this.boardContainer?.add(c);
      slot.container = c;
    });
  }

  private renderSlot(
    x: number,
    y: number,
    slot: BoardSlot,
    w: number,
    h: number,
    isPlayer: boolean
  ): Phaser.GameObjects.Container {
    const c = this.add.container(x, y);

    if (!slot.card) {
      // Slot vide
      const bg = this.add.rectangle(0, 0, w, h, 0x000000, 0.3);
      bg.setStrokeStyle(2, 0x8a5018, 0.4);
      c.add(bg);
      if (isPlayer) {
        const txt = this.add.text(0, 0, "vide", {
          fontFamily: "Georgia, serif",
          fontSize: "10px",
          color: "#8a5018",
          fontStyle: "italic",
        }).setOrigin(0.5);
        c.add(txt);
      }
      return c;
    }

    // Carte sur le board
    const card = slot.card;
    const palette = card.isBoss
      ? { primary: 0x3a0a10, secondary: 0xc83838, accent: 0xf08080 }
      : (AXIS_COLOR[card.axis] || AXIS_COLOR.Foi);

    const bg = this.add.rectangle(0, 0, w, h, palette.primary);
    bg.setStrokeStyle(3, palette.secondary);
    c.add(bg);

    if (card.isBoss) {
      // Boss : grand emoji
      c.add(this.add.text(0, -20, "👸", { fontSize: "40px" }).setOrigin(0.5));
    } else {
      // Carte joueur posée
      const emoji = this.getCardEmoji(card.axis);
      c.add(this.add.text(0, -22, emoji, { fontSize: "28px" }).setOrigin(0.5));
    }

    // Nom
    c.add(
      this.add.text(0, h / 2 - 26, card.name, {
        fontFamily: "Georgia, serif",
        fontSize: "9px",
        color: "#" + palette.accent.toString(16).padStart(6, "0"),
        fontStyle: "bold",
        align: "center",
        wordWrap: { width: w - 6 },
      }).setOrigin(0.5)
    );

    // ATK / HP
    c.add(
      this.add.text(-w / 2 + 8, h / 2 - 6, `⚔${card.atk}`, {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#f08070",
        fontStyle: "bold",
      }).setOrigin(0, 1)
    );
    c.add(
      this.add.text(w / 2 - 8, h / 2 - 6, `❤${card.currentHp}`, {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#80c08f",
        fontStyle: "bold",
      }).setOrigin(1, 1)
    );

    return c;
  }

  private renderHand(): void {
    this.handContainer = this.add.container(0, 0);

    // Background main
    const handBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 130, GAME_WIDTH - 20, 200, 0x000000, 0.5);
    handBg.setStrokeStyle(1, 0x8a5018, 0.6);
    this.handContainer.add(handBg);

    // Cartes en main
    const cardW = 80;
    const cardH = 120;
    const gap = 6;
    const totalW = this.hand.length * (cardW + gap) - gap;
    const startX = (GAME_WIDTH - totalW) / 2 + cardW / 2;
    const handY = GAME_HEIGHT - 140;

    this.hand.forEach((card, i) => {
      const x = startX + i * (cardW + gap);
      const palette = AXIS_COLOR[card.axis] || AXIS_COLOR.Foi;
      const available = this.axisPool[card.axis] || 0;
      const playable = available >= card.cost;

      const c = this.add.container(x, handY);

      const bg = this.add.rectangle(0, 0, cardW, cardH, palette.primary);
      bg.setStrokeStyle(3, palette.secondary);
      if (!playable) bg.setAlpha(0.4);
      c.add(bg);

      // Coût (cercle haut-gauche)
      const costColor = playable ? palette.secondary : 0x666666;
      const costCircle = this.add.circle(-cardW / 2 + 14, -cardH / 2 + 14, 11, costColor);
      costCircle.setStrokeStyle(2, palette.accent);
      c.add(costCircle);
      c.add(
        this.add.text(-cardW / 2 + 14, -cardH / 2 + 14, String(card.cost), {
          fontFamily: "monospace",
          fontSize: "10px",
          color: "#fff5dc",
          fontStyle: "bold",
        }).setOrigin(0.5)
      );

      // Emoji art au centre
      const emoji = this.getCardEmoji(card.axis);
      c.add(this.add.text(0, -18, emoji, { fontSize: "28px" }).setOrigin(0.5));

      // Nom
      c.add(
        this.add.text(0, cardH / 2 - 28, card.name, {
          fontFamily: "Georgia, serif",
          fontSize: "10px",
          color: "#" + palette.accent.toString(16).padStart(6, "0"),
          fontStyle: "bold",
          align: "center",
          wordWrap: { width: cardW - 6 },
        }).setOrigin(0.5)
      );

      // ATK / HP
      c.add(
        this.add.text(-cardW / 2 + 8, cardH / 2 - 6, `⚔${card.atk}`, {
          fontFamily: "monospace",
          fontSize: "10px",
          color: "#f08070",
          fontStyle: "bold",
        }).setOrigin(0, 1)
      );
      c.add(
        this.add.text(cardW / 2 - 8, cardH / 2 - 6, `❤${card.hp}`, {
          fontFamily: "monospace",
          fontSize: "10px",
          color: "#80c08f",
          fontStyle: "bold",
        }).setOrigin(1, 1)
      );

      // Drag & drop
      bg.setInteractive({ useHandCursor: true, draggable: playable });
      this.input.setDraggable(bg, playable);

      const startPos = { x, y: handY };
      let zoneHover: number | null = null;

      bg.on("pointerover", () => {
        if (playable && !c.getData("dragging")) {
          this.tweens.add({ targets: c, y: handY - 16, duration: 200 });
        }
      });
      bg.on("pointerout", () => {
        if (!c.getData("dragging")) {
          this.tweens.add({ targets: c, y: handY, duration: 200 });
        }
      });

      bg.on("dragstart", () => {
        c.setData("dragging", true);
        c.setDepth(100);
      });
      bg.on("drag", (_p: Phaser.Input.Pointer, dx: number, dy: number) => {
        c.x = startPos.x + dx;
        c.y = startPos.y + dy;
        // Détecter zone joueur la plus proche
        const playerY = 470;
        const slotW = 90;
        const totalW = 4 * slotW + 3 * 8;
        const playerStartX = (GAME_WIDTH - totalW) / 2 + slotW / 2;
        let closest = -1;
        let closestDist = 100;
        for (let z = 0; z < 4; z++) {
          if (this.playerBoard[z].card) continue;
          const sx = playerStartX + z * (slotW + 8);
          const d = Phaser.Math.Distance.Between(c.x, c.y, sx, playerY);
          if (d < closestDist) {
            closestDist = d;
            closest = z;
          }
        }
        zoneHover = closest;
      });
      bg.on("dragend", () => {
        c.setDepth(0);
        c.setData("dragging", false);
        if (zoneHover != null && zoneHover >= 0) {
          this.summonToZone(i, zoneHover);
        } else {
          // Retour main
          this.tweens.add({
            targets: c,
            x: startPos.x,
            y: startPos.y,
            duration: 200,
          });
        }
      });

      this.handContainer?.add(c);
    });

    // Bouton fin de tour
    const endBtn = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 24);
    const endBg = this.add.rectangle(0, 0, 200, 36, 0x6a1818);
    endBg.setStrokeStyle(2, 0xc83838);
    endBg.setInteractive({ useHandCursor: true });
    endBtn.add(endBg);
    endBtn.add(
      this.add.text(0, 0, "Fin du tour", {
        fontFamily: "Georgia, serif",
        fontSize: "14px",
        color: "#f0d8b0",
        fontStyle: "bold",
      }).setOrigin(0.5)
    );
    endBg.on("pointerover", () => endBg.setFillStyle(0x8a2828));
    endBg.on("pointerout", () => endBg.setFillStyle(0x6a1818));
    endBg.on("pointerdown", () => this.endTurn());
    this.handContainer.add(endBtn);
  }

  private renderHud(): void {
    this.hudContainer = this.add.container(0, 0);

    // Mini panel pool d'âme (petit, en haut à droite ou compact)
    const top3 = (Object.entries(this.axisPool) as [Axis, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    const panelW = 140;
    const panelH = 70;
    const px = GAME_WIDTH - panelW - 10;
    const py = 175;

    const bg = this.add.rectangle(px, py, panelW, panelH, 0x000000, 0.6);
    bg.setOrigin(0, 0);
    bg.setStrokeStyle(1, 0x8a5018, 0.5);
    this.hudContainer.add(bg);

    this.hudContainer.add(
      this.add.text(px + 6, py + 4, "POOL D'ÂME", {
        fontFamily: "monospace",
        fontSize: "9px",
        color: "#d4a040",
      })
    );

    top3.forEach((entry, i) => {
      const [axis, val] = entry;
      const palette = AXIS_COLOR[axis];
      const yoff = py + 18 + i * 12;
      this.hudContainer?.add(
        this.add.circle(px + 8, yoff + 4, 3, palette.secondary)
      );
      this.hudContainer?.add(
        this.add.text(px + 14, yoff, `${axis} ${val}`, {
          fontFamily: "monospace",
          fontSize: "9px",
          color: "#" + palette.accent.toString(16).padStart(6, "0"),
        })
      );
    });

    // Boss HP bar (en haut, plein écran sous bulle)
    const bossBarY = 180;
    const bossBarBg = this.add.rectangle(GAME_WIDTH / 2, bossBarY, GAME_WIDTH - 200, 14, 0x000000, 0.7);
    bossBarBg.setStrokeStyle(1, 0xc83838);
    this.hudContainer.add(bossBarBg);
    const hpPct = Math.max(0, this.bossHp / this.bossMaxHp);
    const fillW = (GAME_WIDTH - 200) * hpPct;
    const hpFill = this.add.rectangle(
      GAME_WIDTH / 2 - (GAME_WIDTH - 200) / 2 + fillW / 2,
      bossBarY,
      fillW,
      12,
      0xc83838
    );
    this.hudContainer.add(hpFill);
    this.hudContainer.add(
      this.add.text(GAME_WIDTH / 2, bossBarY, `Cléopâtre  ${this.bossHp}/${this.bossMaxHp}`, {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#fff5dc",
        fontStyle: "bold",
      }).setOrigin(0.5)
    );
  }

  // =======================================================================
  // Logique
  // =======================================================================

  private setJudgeMessage(msg: string): void {
    if (this.judgeBubble) {
      this.judgeBubble.setText(msg);
      this.tweens.add({
        targets: this.judgeBubble,
        alpha: { from: 0.3, to: 1 },
        duration: 400,
      });
    }
  }

  private getCardEmoji(axis: Axis): string {
    const map: Record<Axis, string> = {
      Orgueil: "👑", Avarice: "💰", Luxure: "🌹", Envie: "🐍",
      Gourmandise: "🍷", Colere: "🔥", Paresse: "🌫️",
      Foi: "✨", Esperance: "🕊️", Charite: "🤲", Prudence: "👁",
      Justice: "⚖", Force: "⚔", Temperance: "🧿",
    };
    return map[axis] || "✦";
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  private drawHand(n: number): void {
    for (let i = 0; i < n; i++) {
      if (this.deck.length === 0) {
        if (this.discard.length === 0) break;
        this.deck = this.shuffle(this.discard);
        this.discard = [];
      }
      const c = this.deck.pop();
      if (c) this.hand.push(c);
    }
  }

  private summonToZone(handIdx: number, zoneIdx: number): void {
    const card = this.hand[handIdx];
    if (!card) return;
    if (this.playerBoard[zoneIdx].card !== null) return;

    const cost = card.cost;
    const axis = card.axis;
    const available = this.axisPool[axis] || 0;
    if (available < cost) return;

    this.axisPool[axis] = available - cost;

    // Pose le monstre
    this.playerBoard[zoneIdx] = {
      card: { ...card, currentHp: card.hp },
    };
    this.hand.splice(handIdx, 1);
    this.discard.push(card);

    // Voice line
    const lines = [
      "Tu poses ce que tu as eu pour pouvoir.",
      "Cette carte te ressemble.",
      "Comme à 14 ans, tu choisis.",
      "Chaque carte est un fragment de toi.",
    ];
    this.setJudgeMessage(lines[Math.floor(Math.random() * lines.length)]);

    this.renderScene();
  }

  private endTurn(): void {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.setJudgeMessage("Voyons ce que tes morts feront pour toi.");

    this.time.delayedCall(800, () => this.battlePhase());
  }

  private battlePhase(): void {
    // Tes monstres frappent en face
    let bossDestroyed = false;
    for (let i = 0; i < 4; i++) {
      const myMon = this.playerBoard[i].card;
      if (!myMon) continue;
      const enemy = this.enemyBoard[i].card;
      if (enemy) {
        enemy.currentHp -= myMon.atk;
        if (enemy.currentHp <= 0) {
          this.playerBoard[i].card = null; // optionnel
          this.enemyBoard[i].card = null;
          if (enemy.isBoss) bossDestroyed = true;
        }
      } else {
        // Direct sur le boss s'il est ailleurs
        const bossZone = this.enemyBoard.findIndex((s) => s.card?.isBoss);
        if (bossZone !== -1) {
          const boss = this.enemyBoard[bossZone].card!;
          boss.currentHp -= myMon.atk;
          this.bossHp = boss.currentHp;
          this.flashFlying(`-${myMon.atk}`, GAME_WIDTH / 2, 220, "#f08070");
          if (boss.currentHp <= 0) {
            bossDestroyed = true;
            this.enemyBoard[bossZone].card = null;
          }
        }
      }
    }

    // Re-render après bataille
    this.bossHp = this.enemyBoard.find((s) => s.card?.isBoss)?.card?.currentHp ?? 0;
    this.renderScene();

    if (bossDestroyed || this.bossHp <= 0) {
      this.endCombat("victory");
      return;
    }

    // Tour ennemi
    this.time.delayedCall(800, () => this.enemyTurn());
  }

  private enemyTurn(): void {
    this.setJudgeMessage("À mon tour. Voyons.");

    let totalDamage = 0;
    for (let i = 0; i < 4; i++) {
      const enemy = this.enemyBoard[i].card;
      if (!enemy) continue;
      const myMon = this.playerBoard[i].card;
      if (myMon) {
        myMon.currentHp -= enemy.atk;
        if (myMon.currentHp <= 0) {
          this.playerBoard[i].card = null;
        }
      } else {
        // Attaque directe sur le pool axe Luxure
        this.axisPool["Luxure"] = Math.max(0, this.axisPool["Luxure"] - enemy.atk);
        totalDamage += enemy.atk;
        this.flashFlying(`-${enemy.atk} Luxure`, GAME_WIDTH / 2, 600, "#e08080");
      }
    }

    // Reset summoning sickness, pioche
    this.turn++;
    this.drawHand(2);

    // Vérif défaite : total des axes < 5
    const total = (Object.values(this.axisPool) as number[]).reduce((s, v) => s + v, 0);
    if (total < 5) {
      this.endCombat("defeat");
      return;
    }

    this.isAnimating = false;
    this.renderScene();
  }

  private flashFlying(text: string, x: number, y: number, color: string): void {
    const t = this.add.text(x, y, text, {
      fontFamily: "monospace",
      fontSize: "20px",
      color,
      stroke: "#000000",
      strokeThickness: 3,
      fontStyle: "bold",
    }).setOrigin(0.5);
    t.setDepth(1000);
    this.tweens.add({
      targets: t,
      y: y - 60,
      alpha: { from: 1, to: 0 },
      duration: 1000,
      ease: "Cubic.easeOut",
      onComplete: () => t.destroy(),
    });
  }

  private endCombat(result: "victory" | "defeat"): void {
    this.finished = true;
    GameState.outcome = result;
    this.cameras.main.fadeOut(1000, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("Outcome");
    });
  }
}
