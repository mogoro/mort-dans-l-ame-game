import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../main";
import { GameState } from "../systems/GameState";
import { AXIS_COLOR, type Card } from "../data/cards";
import type { Axis } from "../data/events";
import { audio } from "../systems/AudioSystem";

interface BoardSlot {
  card: (Card & { currentHp: number; isBoss?: boolean; sickness?: boolean }) | null;
}

const VOICE_LINES = {
  enter: [
    "Tu entres dans le cercle. Le vent souffle.",
    "Cléopâtre te jauge.",
    "Tu vois passer ceux que tu as désirés. Ils ne te regardent plus.",
  ],
  cardSummoned: [
    "Tu poses ce que tu as eu pour pouvoir.",
    "Cette carte te ressemble.",
    "Comme à 14 ans, tu choisis.",
    "Chaque carte est un fragment de toi.",
  ],
  sacrifice: [
    "Tu sacrifies. Comme on a sacrifié pour toi.",
    "Le sang de tes morts paie ta carte.",
    "Os pour os, sang pour sang.",
  ],
  damage: [
    "Tu commences à m'atteindre.",
    "Pas mal. Mais pas assez.",
    "Un coup. Comme un autre.",
  ],
  endTurn: [
    "À mon tour.",
    "J'attendais.",
    "Voyons.",
  ],
  enemyAttack: [
    "Encaisse.",
    "Reçois.",
    "C'est dû.",
  ],
};

function pickLine(category: keyof typeof VOICE_LINES): string {
  const lines = VOICE_LINES[category];
  return lines[Math.floor(Math.random() * lines.length)];
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
  private bossMaxHp = 30;
  private isAnimating = false;
  private particles?: Phaser.GameObjects.Particles.ParticleEmitter;
  private bloodParticles?: Phaser.GameObjects.Particles.ParticleEmitter;

  // sacrifice : index du monstre joueur sélectionné comme sacrifice + carte qui attend
  private pendingSummon: { handIdx: number; targetZone: number } | null = null;

  // UI refs
  private bossHpText?: Phaser.GameObjects.Text;
  private bossHpFill?: Phaser.GameObjects.Rectangle;
  private judgeBubble?: Phaser.GameObjects.Text;
  private bellContainer?: Phaser.GameObjects.Container;
  private handContainer?: Phaser.GameObjects.Container;
  private boardContainer?: Phaser.GameObjects.Container;
  private hudContainer?: Phaser.GameObjects.Container;
  private candleFlames: Phaser.GameObjects.Arc[] = [];

  constructor() {
    super("Combat");
  }

  create(): void {
    this.cameras.main.fadeIn(800, 0, 0, 0);

    this.axisPool = { ...GameState.profile };
    Object.keys(this.axisPool).forEach((a) => {
      if (this.axisPool[a as Axis] < 10) this.axisPool[a as Axis] = 10;
    });

    this.deck = this.shuffle([...GameState.deck]);
    this.discard = [];
    this.hand = [];
    this.playerBoard = [{ card: null }, { card: null }, { card: null }, { card: null }];
    this.enemyBoard = [{ card: null }, { card: null }, { card: null }, { card: null }];

    // Boss
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
    this.bossMaxHp = 30;

    this.drawHand(4);
    this.turn = 1;
    this.finished = false;
    this.pendingSummon = null;

    this.renderBackground();
    this.createParticles();
    this.renderScene();

    audio.playPhase("combat");
    this.setJudgeMessage(pickLine("enter"));
  }

  // ============================================================================
  // Particles & camera FX
  // ============================================================================

  private createParticles(): void {
    // Sang : petits squares rouges
    const bloodTex = this.makePixelTexture("blood", 4, 4, 0xc83838);
    this.bloodParticles = this.add.particles(0, 0, bloodTex, {
      lifespan: { min: 400, max: 800 },
      speed: { min: 80, max: 200 },
      scale: { start: 1.5, end: 0 },
      alpha: { start: 1, end: 0 },
      gravityY: 300,
      emitting: false,
    });
    this.bloodParticles.setDepth(500);

    // Étoiles dorées (succès / heal)
    const goldTex = this.makePixelTexture("gold", 3, 3, 0xffd870);
    this.particles = this.add.particles(0, 0, goldTex, {
      lifespan: { min: 600, max: 1200 },
      speed: { min: 30, max: 100 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 1, end: 0 },
      emitting: false,
    });
    this.particles.setDepth(500);
  }

  private makePixelTexture(key: string, w: number, h: number, color: number): string {
    if (this.textures.exists(key)) return key;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(color);
    g.fillRect(0, 0, w, h);
    g.generateTexture(key, w, h);
    g.destroy();
    return key;
  }

  private spawnBlood(x: number, y: number, count = 15): void {
    if (this.bloodParticles) {
      this.bloodParticles.emitParticleAt(x, y, count);
    }
  }

  private spawnGold(x: number, y: number, count = 12): void {
    if (this.particles) {
      this.particles.emitParticleAt(x, y, count);
    }
  }

  private cameraShake(intensity = 0.005, duration = 200): void {
    this.cameras.main.shake(duration, intensity);
  }

  // ============================================================================
  // Background statique (n'est pas redessiné à chaque renderScene)
  // ============================================================================

  private renderBackground(): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0a06, 0x1a0a06, 0x3a1c0a, 0x3a1c0a, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.setDepth(-100);

    // Bougies aux 4 coins
    const positions = [
      { x: 50, y: 80 },
      { x: GAME_WIDTH - 50, y: 80 },
      { x: 50, y: GAME_HEIGHT - 80 },
      { x: GAME_WIDTH - 50, y: GAME_HEIGHT - 80 },
    ];
    positions.forEach((pos) => {
      const halo = this.add.graphics();
      halo.fillStyle(0xffaa44, 0.18);
      halo.fillCircle(pos.x, pos.y, 80);
      halo.fillStyle(0xffcc66, 0.12);
      halo.fillCircle(pos.x, pos.y, 50);
      halo.setDepth(-50);

      const flame = this.add.circle(pos.x, pos.y, 4, 0xffd870);
      flame.setDepth(-40);
      this.tweens.add({
        targets: flame,
        scale: { from: 0.8, to: 1.4 },
        duration: 500 + Math.random() * 400,
        yoyo: true,
        repeat: -1,
      });
      this.candleFlames.push(flame);
    });

    // Texture table en bois
    const wood = this.add.graphics();
    wood.fillStyle(0x2a1408, 0.4);
    for (let x = 0; x < GAME_WIDTH; x += 4) {
      if (x % 8 === 0) wood.fillRect(x, 130, 2, GAME_HEIGHT - 280);
    }
    wood.setDepth(-30);
  }

  // ============================================================================
  // Render scène (board + hand + hud)
  // ============================================================================

  private renderScene(): void {
    if (this.boardContainer) this.boardContainer.destroy();
    if (this.handContainer) this.handContainer.destroy();
    if (this.hudContainer) this.hudContainer.destroy();
    if (this.bellContainer) this.bellContainer.destroy();

    this.renderBoard();
    this.renderHand();
    this.renderBell();
    this.renderHud();
  }

  private renderBoard(): void {
    this.boardContainer = this.add.container(0, 0);

    // Le Juge (haut)
    const judgeY = 90;
    const judgePortrait = this.add.container(60, judgeY);
    const judgeCircle = this.add.circle(0, 0, 32, 0x4a0a14);
    judgeCircle.setStrokeStyle(3, 0xc83838);
    judgePortrait.add(judgeCircle);
    judgePortrait.add(this.add.text(0, 0, "👸", { fontSize: "32px" }).setOrigin(0.5));
    this.tweens.add({
      targets: judgeCircle,
      scale: { from: 1, to: 1.1 },
      duration: 1800,
      yoyo: true,
      repeat: -1,
    });
    this.boardContainer.add(judgePortrait);

    // Bulle de dialogue
    const bubbleBg = this.add.rectangle(120, judgeY - 18, GAME_WIDTH - 140, 64, 0x000000, 0.7);
    bubbleBg.setOrigin(0, 0);
    bubbleBg.setStrokeStyle(1, 0xd4a040, 0.6);
    this.boardContainer.add(bubbleBg);
    this.judgeBubble = this.add.text(130, judgeY - 8, "", {
      fontFamily: "Georgia, serif",
      fontSize: "11px",
      color: "#f0d8b0",
      fontStyle: "italic",
      wordWrap: { width: GAME_WIDTH - 160 },
    });
    this.boardContainer.add(this.judgeBubble);

    // Plateau ennemi
    const enemyY = 230;
    const slotW = 90;
    const slotH = 120;
    const totalW = 4 * slotW + 3 * 8;
    const startX = (GAME_WIDTH - totalW) / 2 + slotW / 2;

    this.enemyBoard.forEach((slot, i) => {
      const x = startX + i * (slotW + 8);
      this.boardContainer?.add(this.renderSlot(x, enemyY, slot, slotW, slotH, false, i));
    });

    // Banner tour
    const banner = this.add.text(GAME_WIDTH / 2, 360, `— TOUR ${this.turn} ${this.pendingSummon ? "· SACRIFICE" : "· TA PHASE"} —`, {
      fontFamily: "Georgia, serif",
      fontSize: "11px",
      color: this.pendingSummon ? "#ff8888" : "#a87a3a",
      fontStyle: "italic",
    }).setOrigin(0.5);
    this.boardContainer.add(banner);

    // Plateau joueur
    const playerY = 460;
    this.playerBoard.forEach((slot, i) => {
      const x = startX + i * (slotW + 8);
      this.boardContainer?.add(this.renderSlot(x, playerY, slot, slotW, slotH, true, i));
    });
  }

  private renderSlot(
    x: number,
    y: number,
    slot: BoardSlot,
    w: number,
    h: number,
    isPlayer: boolean,
    zoneIdx: number
  ): Phaser.GameObjects.Container {
    const c = this.add.container(x, y);

    if (!slot.card) {
      const bg = this.add.rectangle(0, 0, w, h, 0x000000, 0.3);
      bg.setStrokeStyle(2, 0x8a5018, 0.4);

      // Si en mode "drag" en cours, hilite zones libres joueur
      const draggingFromHand = this.hand.length > 0 && (this as any).dragSourceIdx != null;
      if (isPlayer && draggingFromHand) {
        bg.setStrokeStyle(2, 0xffcc66, 0.9);
        this.tweens.add({
          targets: bg,
          alpha: { from: 0.3, to: 0.7 },
          duration: 700,
          yoyo: true,
          repeat: -1,
        });
      }

      // Si on est en mode pendingSummon (sacrifice), permettre clic sur monstres joueur
      c.add(bg);
      if (isPlayer) {
        c.add(this.add.text(0, 0, "vide", {
          fontFamily: "Georgia, serif",
          fontSize: "10px",
          color: "#8a5018",
          fontStyle: "italic",
        }).setOrigin(0.5));
      }
      return c;
    }

    const card = slot.card;
    const palette = card.isBoss
      ? { primary: 0x3a0a10, secondary: 0xc83838, accent: 0xf08080 }
      : (AXIS_COLOR[card.axis] || AXIS_COLOR.Foi);

    const bg = this.add.rectangle(0, 0, w, h, palette.primary);
    bg.setStrokeStyle(3, palette.secondary);
    c.add(bg);

    // Sickness visuelle (transparence)
    if (card.sickness && !card.isBoss) {
      bg.setAlpha(0.6);
    }

    // En mode pendingSummon : rendre les cartes joueur cliquables comme sacrifice
    if (isPlayer && this.pendingSummon != null && !card.isBoss) {
      bg.setStrokeStyle(3, 0xff8888);
      this.tweens.add({
        targets: bg,
        alpha: { from: 0.6, to: 1 },
        duration: 600,
        yoyo: true,
        repeat: -1,
      });
      bg.setInteractive({ useHandCursor: true });
      bg.on("pointerdown", () => this.confirmSacrifice(zoneIdx));
    }

    // Emoji art
    const emoji = card.isBoss ? "👸" : this.getCardEmoji(card.axis);
    c.add(this.add.text(0, -22, emoji, { fontSize: card.isBoss ? "40px" : "28px" }).setOrigin(0.5));

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
    c.add(this.add.text(-w / 2 + 8, h / 2 - 6, `⚔${card.atk}`, {
      fontFamily: "monospace",
      fontSize: "11px",
      color: "#f08070",
      fontStyle: "bold",
    }).setOrigin(0, 1));

    c.add(this.add.text(w / 2 - 8, h / 2 - 6, `❤${card.currentHp}`, {
      fontFamily: "monospace",
      fontSize: "11px",
      color: card.currentHp < card.hp ? "#ff8080" : "#80c08f",
      fontStyle: "bold",
    }).setOrigin(1, 1));

    return c;
  }

  // ============================================================================
  // Bell (cloche fin de tour Inscryption-style)
  // ============================================================================

  private renderBell(): void {
    this.bellContainer = this.add.container(GAME_WIDTH - 60, GAME_HEIGHT - 40);

    // Bell shape (CSS-like en Phaser : ellipse + triangle)
    const bellGfx = this.add.graphics();
    bellGfx.fillStyle(0xc09040);
    bellGfx.fillEllipse(0, 0, 50, 40);
    bellGfx.fillStyle(0xa07020);
    bellGfx.fillRect(-2, -22, 4, 8); // anse
    bellGfx.fillStyle(0xe0c060);
    bellGfx.fillCircle(0, 12, 4); // battant
    this.bellContainer.add(bellGfx);

    // Texte sous la cloche
    this.bellContainer.add(
      this.add.text(0, 30, "FIN", {
        fontFamily: "Georgia, serif",
        fontSize: "9px",
        color: "#d4a040",
        fontStyle: "italic",
      }).setOrigin(0.5)
    );

    // Hit area
    const hit = this.add.circle(0, 0, 32, 0x000000, 0.001);
    hit.setInteractive({ useHandCursor: true });
    this.bellContainer.add(hit);

    hit.on("pointerover", () => {
      this.tweens.add({ targets: bellGfx, scale: 1.1, duration: 200 });
    });
    hit.on("pointerout", () => {
      this.tweens.add({ targets: bellGfx, scale: 1, duration: 200 });
    });
    hit.on("pointerdown", () => {
      // Animation cloche qui sonne
      this.tweens.add({
        targets: bellGfx,
        angle: { from: -15, to: 15 },
        duration: 100,
        yoyo: true,
        repeat: 2,
      });
      audio.sfx("bell");
      this.endTurn();
    });
  }

  // ============================================================================
  // Hand
  // ============================================================================

  private renderHand(): void {
    this.handContainer = this.add.container(0, 0);

    // Background main
    const handBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 130, GAME_WIDTH - 20, 200, 0x000000, 0.5);
    handBg.setStrokeStyle(1, 0x8a5018, 0.6);
    this.handContainer.add(handBg);

    const cardW = 76;
    const cardH = 116;
    const gap = 6;
    const totalW = this.hand.length * (cardW + gap) - gap;
    const startX = (GAME_WIDTH - totalW) / 2 + cardW / 2;
    const handY = GAME_HEIGHT - 140;

    this.hand.forEach((card, i) => {
      const x = startX + i * (cardW + gap);
      const palette = AXIS_COLOR[card.axis] || AXIS_COLOR.Foi;
      const available = this.axisPool[card.axis] || 0;
      const playable = available >= card.cost && !this.pendingSummon;

      const c = this.add.container(x, handY);
      c.setData("startX", x);
      c.setData("startY", handY);
      c.setData("handIdx", i);

      const bg = this.add.rectangle(0, 0, cardW, cardH, palette.primary);
      bg.setStrokeStyle(3, palette.secondary);
      if (!playable) bg.setAlpha(0.4);
      c.add(bg);

      // Coût (cercle haut-gauche)
      const costColor = playable ? palette.secondary : 0x666666;
      const costCircle = this.add.circle(-cardW / 2 + 13, -cardH / 2 + 13, 11, costColor);
      costCircle.setStrokeStyle(2, palette.accent);
      c.add(costCircle);
      c.add(this.add.text(-cardW / 2 + 13, -cardH / 2 + 13, String(card.cost), {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#fff5dc",
        fontStyle: "bold",
      }).setOrigin(0.5));

      // Emoji
      c.add(this.add.text(0, -16, this.getCardEmoji(card.axis), { fontSize: "26px" }).setOrigin(0.5));

      // Nom
      c.add(this.add.text(0, cardH / 2 - 26, card.name, {
        fontFamily: "Georgia, serif",
        fontSize: "9px",
        color: "#" + palette.accent.toString(16).padStart(6, "0"),
        fontStyle: "bold",
        align: "center",
        wordWrap: { width: cardW - 6 },
      }).setOrigin(0.5));

      // ATK / HP
      c.add(this.add.text(-cardW / 2 + 8, cardH / 2 - 6, `⚔${card.atk}`, {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#f08070",
        fontStyle: "bold",
      }).setOrigin(0, 1));
      c.add(this.add.text(cardW / 2 - 8, cardH / 2 - 6, `❤${card.hp}`, {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#80c08f",
        fontStyle: "bold",
      }).setOrigin(1, 1));

      // Drag setup
      bg.setInteractive({ useHandCursor: true, draggable: playable });
      this.input.setDraggable(bg, playable);

      bg.on("pointerover", () => {
        if (!playable || c.getData("dragging") || this.pendingSummon) return;
        this.tweens.add({ targets: c, y: handY - 18, duration: 150 });
      });
      bg.on("pointerout", () => {
        if (c.getData("dragging")) return;
        this.tweens.add({ targets: c, y: handY, duration: 150 });
      });

      bg.on("dragstart", () => {
        c.setData("dragging", true);
        c.setDepth(100);
        (this as any).dragSourceIdx = i;
        this.renderBoard(); // re-render pour highlight zones
        audio.sfx("click");
      });
      bg.on("drag", (_p: Phaser.Input.Pointer, dx: number, dy: number) => {
        c.x = c.getData("startX") + dx;
        c.y = c.getData("startY") + dy;
      });
      bg.on("dragend", () => {
        c.setDepth(0);
        c.setData("dragging", false);
        (this as any).dragSourceIdx = null;

        // Détecter zone joueur la plus proche
        const playerY = 460;
        const slotW = 90;
        const totalW = 4 * slotW + 3 * 8;
        const playerStartX = (GAME_WIDTH - totalW) / 2 + slotW / 2;
        let closest = -1;
        let closestDist = 80;
        for (let z = 0; z < 4; z++) {
          if (this.playerBoard[z].card) continue;
          const sx = playerStartX + z * (slotW + 8);
          const d = Phaser.Math.Distance.Between(c.x, c.y, sx, playerY);
          if (d < closestDist) {
            closestDist = d;
            closest = z;
          }
        }
        if (closest >= 0) {
          this.tryAttemptSummon(i, closest);
        } else {
          // Retour à la main
          this.tweens.add({
            targets: c,
            x: c.getData("startX"),
            y: c.getData("startY"),
            duration: 200,
          });
          this.renderBoard();
        }
      });

      this.handContainer?.add(c);
    });
  }

  // ============================================================================
  // HUD : pool axes + boss HP
  // ============================================================================

  private renderHud(): void {
    this.hudContainer = this.add.container(0, 0);

    // Boss HP bar
    const bossBarY = 175;
    const barW = GAME_WIDTH - 180;
    const bossBarBg = this.add.rectangle(GAME_WIDTH / 2, bossBarY, barW, 14, 0x000000, 0.7);
    bossBarBg.setStrokeStyle(1, 0xc83838);
    this.hudContainer.add(bossBarBg);

    const boss = this.enemyBoard.find((s) => s.card?.isBoss)?.card;
    const bossHp = boss?.currentHp ?? 0;
    const hpPct = Math.max(0, bossHp / this.bossMaxHp);
    const fillW = barW * hpPct;
    this.bossHpFill = this.add.rectangle(
      GAME_WIDTH / 2 - barW / 2 + fillW / 2,
      bossBarY,
      fillW,
      12,
      0xc83838
    );
    this.hudContainer.add(this.bossHpFill);
    this.bossHpText = this.add.text(GAME_WIDTH / 2, bossBarY, `Cléopâtre  ${bossHp}/${this.bossMaxHp}`, {
      fontFamily: "monospace",
      fontSize: "10px",
      color: "#fff5dc",
      fontStyle: "bold",
    }).setOrigin(0.5);
    this.hudContainer.add(this.bossHpText);

    // Pool d'âme (top 4 axes)
    const top = (Object.entries(this.axisPool) as [Axis, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    const panelW = 130;
    const panelH = 64;
    const px = GAME_WIDTH - panelW - 8;
    const py = 200;
    const bg2 = this.add.rectangle(px, py, panelW, panelH, 0x000000, 0.6);
    bg2.setOrigin(0, 0);
    bg2.setStrokeStyle(1, 0x8a5018, 0.5);
    this.hudContainer.add(bg2);

    this.hudContainer.add(this.add.text(px + 6, py + 4, "ÂME", {
      fontFamily: "monospace",
      fontSize: "9px",
      color: "#d4a040",
    }));

    top.forEach((entry, i) => {
      const [axis, val] = entry;
      const palette = AXIS_COLOR[axis];
      const yo = py + 16 + i * 11;
      this.hudContainer?.add(this.add.circle(px + 8, yo + 4, 3, palette.secondary));
      this.hudContainer?.add(this.add.text(px + 14, yo, `${axis} ${val}`, {
        fontFamily: "monospace",
        fontSize: "8px",
        color: "#" + palette.accent.toString(16).padStart(6, "0"),
      }));
    });
  }

  // ============================================================================
  // Logique
  // ============================================================================

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
    audio.sfx("draw");
  }

  // Tente une invocation : si le joueur a assez de points, pose direct.
  // Sinon, propose le sacrifice : "il faut sacrifier un de tes monstres pour invoquer"
  private tryAttemptSummon(handIdx: number, zoneIdx: number): void {
    const card = this.hand[handIdx];
    if (!card) return;
    if (this.playerBoard[zoneIdx].card !== null) {
      this.renderHand();
      return;
    }

    const cost = card.cost;
    const axis = card.axis;
    const available = this.axisPool[axis] || 0;

    if (available >= cost) {
      // Direct summon, pas de sacrifice
      this.directSummon(handIdx, zoneIdx);
      return;
    }

    // Pas assez : peut-être qu'un sacrifice de monstre déjà sur le board peut compenser
    const playerMonsters = this.playerBoard.filter((s) => s.card && !s.card.isBoss).length;
    if (playerMonsters > 0) {
      // Mode sacrifice : on demande au joueur de cliquer un de ses monstres pour le sacrifier
      this.pendingSummon = { handIdx, targetZone: zoneIdx };
      this.setJudgeMessage(`Pas assez de ${axis}. Sacrifie un de tes monstres pour combler.`);
      // Re-render pour highlight
      this.renderScene();
    } else {
      // Vraiment pas possible
      this.setJudgeMessage(`Tu n'as pas assez de ${axis} (${available}/${cost}).`);
      // Animation de retour
      this.renderHand();
    }
  }

  private directSummon(handIdx: number, zoneIdx: number): void {
    const card = this.hand[handIdx];
    const axis = card.axis;
    this.axisPool[axis] = (this.axisPool[axis] || 0) - card.cost;

    this.playerBoard[zoneIdx] = {
      card: { ...card, currentHp: card.hp, sickness: true },
    };
    this.hand.splice(handIdx, 1);
    this.discard.push(card);

    audio.sfx("card_play");
    this.setJudgeMessage(pickLine("cardSummoned"));

    // Particules dorées sur la zone d'invocation
    const playerY = 460;
    const slotW = 90;
    const totalW = 4 * slotW + 3 * 8;
    const startX = (GAME_WIDTH - totalW) / 2 + slotW / 2;
    const x = startX + zoneIdx * (slotW + 8);
    this.spawnGold(x, playerY, 12);

    this.renderScene();
  }

  private confirmSacrifice(sacrificeZoneIdx: number): void {
    if (!this.pendingSummon) return;
    const sacrificed = this.playerBoard[sacrificeZoneIdx].card;
    if (!sacrificed || sacrificed.isBoss) return;

    // Le sacrifice rend X points d'axe (les points qu'avait coûté la carte sacrifiée)
    const refund = sacrificed.cost;
    this.axisPool[sacrificed.axis] = (this.axisPool[sacrificed.axis] || 0) + refund;

    // Effet visuel sang sur le sacrifice
    const playerY = 460;
    const slotW = 90;
    const totalW = 4 * slotW + 3 * 8;
    const startX = (GAME_WIDTH - totalW) / 2 + slotW / 2;
    const sx = startX + sacrificeZoneIdx * (slotW + 8);
    this.spawnBlood(sx, playerY, 20);
    audio.sfx("card_destroy");
    this.cameraShake(0.005, 200);

    // Retire le monstre sacrifié
    this.discard.push(sacrificed);
    this.playerBoard[sacrificeZoneIdx] = { card: null };

    this.setJudgeMessage(pickLine("sacrifice"));

    // Réessaie le summon
    const { handIdx, targetZone } = this.pendingSummon;
    this.pendingSummon = null;

    // Vérif maintenant
    const card = this.hand[handIdx];
    if (card && this.axisPool[card.axis] >= card.cost) {
      this.directSummon(handIdx, targetZone);
    } else {
      this.setJudgeMessage("Encore. Sacrifie davantage.");
      // Reset pendingSummon mais le joueur peut redrag la carte
      this.renderScene();
    }
  }

  private endTurn(): void {
    if (this.isAnimating) return;
    if (this.pendingSummon) {
      this.pendingSummon = null;
      this.renderScene();
    }
    this.isAnimating = true;
    this.setJudgeMessage("Voyons ce que tes morts feront pour toi.");

    this.time.delayedCall(700, () => this.battlePhase());
  }

  private battlePhase(): void {
    let bossDestroyed = false;
    const playerY = 460;
    const slotW = 90;
    const totalW = 4 * slotW + 3 * 8;
    const startX = (GAME_WIDTH - totalW) / 2 + slotW / 2;

    // Iterate avec setTimeout entre chaque pour anim
    let i = 0;
    const next = () => {
      if (i >= 4) {
        // Reset summoning sickness joueur
        this.playerBoard.forEach((s) => {
          if (s.card) s.card.sickness = false;
        });
        // Vérif boss mort
        if (bossDestroyed) {
          this.endCombat("victory");
          return;
        }
        // Tour ennemi
        this.time.delayedCall(500, () => this.enemyTurn());
        return;
      }

      const myMon = this.playerBoard[i].card;
      if (!myMon || myMon.sickness) {
        i++;
        next();
        return;
      }
      const enemy = this.enemyBoard[i].card;
      if (enemy) {
        enemy.currentHp -= myMon.atk;
        const ex = startX + i * (slotW + 8);
        const ey = 230;
        this.spawnBlood(ex, ey, 12);
        this.cameraShake(0.004, 150);
        audio.sfx("damage");
        this.flashFlying(`-${myMon.atk}`, ex, ey, "#f08070");
        if (Math.random() < 0.4) this.setJudgeMessage(pickLine("damage"));
        if (enemy.currentHp <= 0) {
          this.enemyBoard[i].card = null;
          if (enemy.isBoss) bossDestroyed = true;
        }
      } else {
        // Direct sur le boss
        const bossZone = this.enemyBoard.findIndex((s) => s.card?.isBoss);
        if (bossZone !== -1 && this.enemyBoard[bossZone].card) {
          const boss = this.enemyBoard[bossZone].card!;
          boss.currentHp -= myMon.atk;
          this.spawnBlood(GAME_WIDTH / 2, 175, 15);
          this.cameraShake(0.006, 200);
          audio.sfx("damage");
          this.flashFlying(`-${myMon.atk}`, GAME_WIDTH / 2, 195, "#f08070");
          if (boss.currentHp <= 0) {
            bossDestroyed = true;
            this.enemyBoard[bossZone].card = null;
          }
        }
      }

      this.renderScene();
      i++;
      this.time.delayedCall(450, next);
    };
    next();
  }

  private enemyTurn(): void {
    this.setJudgeMessage(pickLine("endTurn"));
    audio.sfx("click");

    let i = 0;
    const next = () => {
      if (i >= 4) {
        // Pioche fin de tour
        this.turn++;
        this.drawHand(2);

        const total = (Object.values(this.axisPool) as number[]).reduce((s, v) => s + v, 0);
        if (total < 5) {
          this.endCombat("defeat");
          return;
        }
        this.isAnimating = false;
        this.renderScene();
        return;
      }

      const enemy = this.enemyBoard[i].card;
      if (!enemy) {
        i++;
        next();
        return;
      }
      const myMon = this.playerBoard[i].card;
      const slotW = 90;
      const totalW = 4 * slotW + 3 * 8;
      const playerStartX = (GAME_WIDTH - totalW) / 2 + slotW / 2;
      const px = playerStartX + i * (slotW + 8);

      if (myMon) {
        myMon.currentHp -= enemy.atk;
        this.spawnBlood(px, 460, 12);
        this.cameraShake(0.004, 150);
        audio.sfx("damage");
        this.flashFlying(`-${enemy.atk}`, px, 460, "#e08080");
        if (myMon.currentHp <= 0) {
          this.playerBoard[i].card = null;
        }
      } else {
        // Attaque directe sur le pool axe Luxure
        this.axisPool["Luxure"] = Math.max(0, this.axisPool["Luxure"] - enemy.atk);
        this.cameraShake(0.008, 250);
        audio.sfx("damage");
        this.flashFlying(`-${enemy.atk} Luxure`, GAME_WIDTH / 2, 700, "#e08080");
        if (Math.random() < 0.5) this.setJudgeMessage(pickLine("enemyAttack"));
      }

      this.renderScene();
      i++;
      this.time.delayedCall(500, next);
    };
    next();
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
      duration: 1100,
      ease: "Cubic.easeOut",
      onComplete: () => t.destroy(),
    });
  }

  private endCombat(result: "victory" | "defeat"): void {
    this.finished = true;
    GameState.outcome = result;
    audio.sfx(result);
    this.cameraShake(result === "victory" ? 0.01 : 0.02, 600);

    this.time.delayedCall(800, () => {
      this.cameras.main.fadeOut(1000, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("Outcome");
      });
    });
  }
}
