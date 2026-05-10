import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../main";
import { GameState, getProfileNature, registerCardPlay, snapshotRun } from "../systems/GameState";
import { saveCurrentRun } from "../systems/SaveSystem";
import { AXIS_COLOR, type Card, type Sigil, applyFatigue } from "../data/cards";
import type { Axis } from "../data/events";
import { CIRCLES, type CircleDef, type BossSpecial } from "../data/circles";
import { audio } from "../systems/AudioSystem";
import { Settings, animSpeed, shakeFactor, difficultyMul, vibrate } from "../systems/Settings";
import { judgeOpeningLine, judgeLineForAxis, applyAxisShift, recordCombatResult } from "../systems/Judge";
import { hasTalentEffect } from "../systems/Talents";
import { hasRelic } from "../systems/Relics";
import { pullActiveDebts, resolveDebt } from "../systems/Economy";

interface BoardSlot {
  card: (Card & {
    currentHp: number;
    maxHpAtPlay?: number;
    isBoss?: boolean;
    sickness?: boolean;
    bleeding?: number;
    block?: number;
    vulnerable?: number;
    weak?: number;       // -25% atk
    strong?: number;     // +25% atk
    poisoned?: number;
    flammable?: number;
    frozen?: number;
    facedown?: boolean;  // B.5 counter
    chantReady?: boolean; // B.7
    boundCircle?: number;
    bossPhase?: 1 | 2;
  }) | null;
}

const HAND_LIMIT = 6;

const VOICE_LINES = {
  enter: [
    "Tu entres dans le cercle. Le vent souffle.",
    "Le boss te jauge.",
    "Cette fois, tu ne fuiras pas.",
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

const RANDOM_EVENTS: Array<{ msg: string; effect: string }> = [
  { msg: "Un cri d'oiseau. Une carte gagne +1 ATK.", effect: "buff_atk" },
  { msg: "Un vent froid. Une carte gagne +1 HP.", effect: "buff_hp" },
  { msg: "Une étincelle. Une zone vide brûle.", effect: "burn_zone" },
  { msg: "Le silence. Le boss saute son attaque.", effect: "boss_skip" },
  { msg: "Ta mère t'appelle. Pioche +1.", effect: "draw_extra" },
];

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

  private pendingSummon: { handIdx: number; targetZone: number } | null = null;
  private rerollUsed = false;
  private rerollMaxUses = 1;
  private cardsSacrificed = 0;
  private cardsPlayedThisCombat: string[] = []; // pour telemetry
  private playerHp = 30;
  private playerMaxHp = 30;
  private playerHpBar?: Phaser.GameObjects.Rectangle;
  private playerHpText?: Phaser.GameObjects.Text;

  private bossHpText?: Phaser.GameObjects.Text;
  private bossHpFill?: Phaser.GameObjects.Rectangle;
  private judgeBubble?: Phaser.GameObjects.Text;
  private bellContainer?: Phaser.GameObjects.Container;
  private handContainer?: Phaser.GameObjects.Container;
  private boardContainer?: Phaser.GameObjects.Container;
  private hudContainer?: Phaser.GameObjects.Container;
  private candleFlames: Phaser.GameObjects.Arc[] = [];
  private cardZoomOverlay?: Phaser.GameObjects.Container;
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;

  // B.9 — phase 2 du boss
  private bossPhase: 1 | 2 = 1;
  private bossAxis: Axis = "Justice";
  private circleDef!: CircleDef;
  private bossSpecials: BossSpecial[] = [];
  private appeaseStacks = 0;  // D.5

  // E.4 — élite ?
  private isElite = false;
  // pioche stratégique G.1
  private drawPick: Card[] | null = null;

  constructor() {
    super("Combat");
  }

  create(data?: { circleIdx?: number; isElite?: boolean }): void {
    this.cameras.main.fadeIn(400, 0, 0, 0);

    const circleIdx = data?.circleIdx ?? GameState.currentCircle ?? 0;
    this.isElite = !!data?.isElite;
    this.circleDef = CIRCLES[circleIdx % CIRCLES.length];
    this.bossSpecials = this.circleDef.specials;
    this.bossAxis = this.circleDef.axis;
    this.bossPhase = 1;

    // Pool d'axe = profile du joueur, min 10
    this.axisPool = { ...GameState.profile };
    Object.keys(this.axisPool).forEach((a) => {
      if (this.axisPool[a as Axis] < 10) this.axisPool[a as Axis] = 10;
    });

    // Deck
    this.deck = this.shuffle([...GameState.deck]);
    this.discard = [];
    this.hand = [];
    this.playerBoard = [{ card: null }, { card: null }, { card: null }, { card: null }];
    this.enemyBoard = [{ card: null }, { card: null }, { card: null }, { card: null }];

    // Boss
    const dm = difficultyMul();
    let bossHp = this.circleDef.bossHp * dm.bossHp;
    let bossAtk = this.circleDef.bossAtk * dm.bossAtk;
    if (this.isElite) {
      bossHp *= 1.5;
      bossAtk *= 1.3;
    }
    if (Settings.pacifist) bossHp /= 2;
    bossHp = Math.round(bossHp);
    bossAtk = Math.round(bossAtk);

    this.enemyBoard[1] = {
      card: {
        id: this.circleDef.bossName.toLowerCase(),
        name: this.circleDef.bossName,
        axis: this.circleDef.axis,
        cost: 0,
        atk: bossAtk,
        hp: bossHp,
        currentHp: bossHp,
        maxHpAtPlay: bossHp,
        isBoss: true,
        emoji: this.circleDef.bossEmoji,
        bossPhase: 1,
      } as any,
    };
    this.bossMaxHp = bossHp;
    this.cardsSacrificed = 0;
    this.cardsPlayedThisCombat = [];
    this.rerollUsed = false;
    // talent Calme niveau 1 = +1 reroll
    this.rerollMaxUses = hasTalentEffect("reroll_plus_1") ? 2 : 1;

    // HP joueur (modulé par difficulté + reliques + talents)
    let baseHp = 30;
    if (hasTalentEffect("start_hp_5")) baseHp += 5;
    if (hasTalentEffect("start_hp_10")) baseHp += 10;
    // C.2 anneau du tiède
    if (hasRelic("balanced_hp_20")) {
      const balanced = (Object.values(GameState.profile) as number[]).every((v) => v >= 40 && v <= 60);
      if (balanced) baseHp += 20;
    }
    this.playerMaxHp = Math.round(baseHp * dm.playerStartHp);
    this.playerHp = this.playerMaxHp;

    // Pioche initiale (modulée par talent)
    let drawCount = 4;
    if (hasTalentEffect("draw_plus_1")) drawCount++;
    // C.2 plume d'argent au premier combat
    if (circleIdx === 0 && hasRelic("first_combat_draw_1")) drawCount++;

    this.drawHand(drawCount);
    this.turn = 1;
    this.finished = false;
    this.pendingSummon = null;

    // D.3 — Plutos vole une carte au début
    if (this.bossSpecials.includes("steal_card") && this.hand.length > 0) {
      const idx = Math.floor(Math.random() * this.hand.length);
      const stolen = this.hand.splice(idx, 1)[0];
      this.time.delayedCall(1500, () => {
        this.setJudgeMessage(`${this.circleDef.bossName} te vole « ${stolen.name} ».`);
      });
    }

    // A.3 — dettes héritées
    const debts = pullActiveDebts();
    debts.forEach((d) => {
      if (d.effect === "extra_enemy") {
        // Spawn un minion supplémentaire
        const enemyMinion: Card = {
          id: "debt-minion",
          name: "Dette",
          axis: this.bossAxis,
          cost: 0, atk: 3, hp: 5,
          emoji: "💀",
          flavor: d.reason,
        };
        const freeSlot = this.enemyBoard.findIndex((s) => !s.card);
        if (freeSlot >= 0) {
          this.enemyBoard[freeSlot] = {
            card: { ...enemyMinion, currentHp: 5 } as any,
          };
        }
      }
      if (d.effect === "axis_drain") {
        Object.keys(this.axisPool).forEach((a) => {
          this.axisPool[a as Axis] = Math.max(5, this.axisPool[a as Axis] - 5);
        });
      }
      resolveDebt(d.id);
    });

    this.renderBackground();
    this.createParticles();
    this.renderScene();

    audio.playPhase("combat");

    // Save snapshot pré-combat (permet reprise au début du combat)
    saveCurrentRun(snapshotRun("Combat"));

    // F.5 — voice line basée sur profil
    const opener = judgeOpeningLine();
    this.setJudgeMessage(opener);
  }

  // ============================================================================
  // FX
  // ============================================================================
  private createParticles(): void {
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
    if (this.bloodParticles) this.bloodParticles.emitParticleAt(x, y, count);
  }

  private spawnGold(x: number, y: number, count = 12): void {
    if (this.particles) this.particles.emitParticleAt(x, y, count);
  }

  private cameraShake(intensity = 0.005, duration = 200): void {
    if (Settings.reduceFlashes && intensity > 0.005) intensity *= shakeFactor();
    this.cameras.main.shake(duration * animSpeed(), intensity * shakeFactor());
  }

  // ============================================================================
  // BG
  // ============================================================================
  private renderBackground(): void {
    const c1 = this.circleDef.bgTop;
    const c2 = this.circleDef.bgBot;
    const bg = this.add.graphics();
    bg.fillGradientStyle(c1, c1, c2, c2, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.setDepth(-100);

    const vignette = this.add.graphics();
    vignette.setDepth(2000);
    const center = { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 };
    for (let r = 200; r < GAME_WIDTH; r += 30) {
      const alpha = Math.min(0.5, (r - 200) / 600);
      vignette.fillStyle(0x000000, alpha * 0.04);
      vignette.fillCircle(center.x, center.y, r);
    }
    const edge = this.add.graphics();
    edge.setDepth(1500);
    edge.fillStyle(0x000000, 0.3);
    edge.fillRect(0, 0, GAME_WIDTH, 30);
    edge.fillRect(0, GAME_HEIGHT - 30, GAME_WIDTH, 30);
    edge.fillRect(0, 0, 20, GAME_HEIGHT);
    edge.fillRect(GAME_WIDTH - 20, 0, 20, GAME_HEIGHT);

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

    const wood = this.add.graphics();
    wood.fillStyle(0x2a1408, 0.4);
    for (let x = 0; x < GAME_WIDTH; x += 4) {
      if (x % 8 === 0) wood.fillRect(x, 130, 2, GAME_HEIGHT - 280);
    }
    wood.setDepth(-30);
  }

  // ============================================================================
  // Render
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

    const judgeY = 90;
    const judgePortrait = this.add.container(60, judgeY);
    const judgeCircle = this.add.circle(0, 0, 32, 0x4a0a14);
    judgeCircle.setStrokeStyle(3, 0xc83838);
    judgePortrait.add(judgeCircle);
    judgePortrait.add(this.add.text(0, 0, this.circleDef.bossEmoji, { fontSize: "32px" }).setOrigin(0.5));
    this.tweens.add({
      targets: judgeCircle,
      scale: { from: 1, to: 1.1 },
      duration: 1800,
      yoyo: true,
      repeat: -1,
    });
    this.boardContainer.add(judgePortrait);

    const bubbleBg = this.add.rectangle(120, judgeY - 18, GAME_WIDTH - 140, 64, 0x000000, 0.7);
    bubbleBg.setOrigin(0, 0);
    bubbleBg.setStrokeStyle(1, 0xd4a040, 0.6);
    this.boardContainer.add(bubbleBg);
    this.judgeBubble = this.add.text(130, judgeY - 8, "", {
      fontFamily: "Georgia, serif",
      fontSize: "14px",
      color: "#f0d8b0",
      fontStyle: "italic",
      wordWrap: { width: GAME_WIDTH - 160 },
    });
    this.boardContainer.add(this.judgeBubble);

    const enemyY = 230;
    const slotW = 90;
    const slotH = 120;
    const totalW = 4 * slotW + 3 * 8;
    const startX = (GAME_WIDTH - totalW) / 2 + slotW / 2;

    this.enemyBoard.forEach((slot, i) => {
      const x = startX + i * (slotW + 8);
      this.boardContainer?.add(this.renderSlot(x, enemyY, slot, slotW, slotH, false, i));
    });

    const phaseTag = this.bossPhase === 2 ? "  · ENRAGÉ" : "";
    const banner = this.add.text(GAME_WIDTH / 2, 360, `— TOUR ${this.turn} ${this.pendingSummon ? "· SACRIFICE" : "· TA PHASE"}${phaseTag} —`, {
      fontFamily: "Georgia, serif",
      fontSize: "14px",
      color: this.pendingSummon ? "#ff8888" : (this.bossPhase === 2 ? "#ff4040" : "#a87a3a"),
      fontStyle: "italic",
    }).setOrigin(0.5);
    this.boardContainer.add(banner);

    const playerY = 460;
    this.playerBoard.forEach((slot, i) => {
      const x = startX + i * (slotW + 8);
      this.boardContainer?.add(this.renderSlot(x, playerY, slot, slotW, slotH, true, i));
    });
  }

  private renderSlot(x: number, y: number, slot: BoardSlot, w: number, h: number, isPlayer: boolean, zoneIdx: number): Phaser.GameObjects.Container {
    const c = this.add.container(x, y);

    if (!slot.card) {
      const bg = this.add.rectangle(0, 0, w, h, 0x000000, 0.3);
      bg.setStrokeStyle(2, 0x8a5018, 0.4);
      const draggingFromHand = this.hand.length > 0 && (this as any).dragSourceIdx != null;
      if (isPlayer && draggingFromHand) {
        bg.setStrokeStyle(3, 0xffcc66, 1);
        bg.setFillStyle(0x4a3818, 0.5);
        // Glow plus marqué autour de la zone (drop target)
        const glow = this.add.graphics();
        glow.lineStyle(4, 0xffd870, 0.4);
        glow.strokeRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8);
        c.add(glow);
        this.tweens.add({
          targets: glow,
          alpha: { from: 0.3, to: 1 },
          duration: 500,
          yoyo: true,
          repeat: -1,
        });
        this.tweens.add({
          targets: bg,
          alpha: { from: 0.4, to: 0.8 },
          duration: 700,
          yoyo: true,
          repeat: -1,
        });
        // Indicateur "DÉPOSER ICI"
        c.add(this.add.text(0, -10, "↓", {
          fontFamily: "Georgia, serif", fontSize: "20px",
          color: "#ffd870", fontStyle: "bold",
        }).setOrigin(0.5));
        c.add(this.add.text(0, 14, "déposer", {
          fontFamily: "Georgia, serif", fontSize: "12px",
          color: "#ffd870", fontStyle: "italic",
        }).setOrigin(0.5));
      } else {
        c.add(bg);
        if (isPlayer) {
          c.add(this.add.text(0, 0, "vide", {
            fontFamily: "Georgia, serif",
            fontSize: "13px",
            color: "#8a5018",
            fontStyle: "italic",
          }).setOrigin(0.5));
        }
      }
      return c;
    }

    const card = slot.card;
    // B.5 — face cachée
    if (card.facedown) {
      const bg = this.add.rectangle(0, 0, w, h, 0x1a1408);
      bg.setStrokeStyle(2, 0xa87a3a, 0.7);
      c.add(bg);
      c.add(this.add.text(0, 0, "?", {
        fontSize: "40px",
        color: "#a87a3a",
      }).setOrigin(0.5));
      return c;
    }

    const palette = card.isBoss
      ? { primary: 0x3a0a10, secondary: 0xc83838, accent: 0xf08080 }
      : (AXIS_COLOR[card.axis] || AXIS_COLOR.Foi);

    const shadow = this.add.rectangle(2, 3, w, h, 0x000000, 0.5);
    c.add(shadow);

    const bg = this.add.rectangle(0, 0, w, h, palette.primary);
    bg.setStrokeStyle(3, palette.secondary);
    c.add(bg);

    // Ornement extra si phase 2 boss
    if (card.isBoss && this.bossPhase === 2) {
      const phaseRing = this.add.graphics();
      phaseRing.lineStyle(3, 0xff4040, 0.8);
      phaseRing.strokeRect(-w / 2 - 3, -h / 2 - 3, w + 6, h + 6);
      this.tweens.add({
        targets: phaseRing,
        alpha: { from: 0.5, to: 1 },
        duration: 600,
        yoyo: true,
        repeat: -1,
      });
      c.add(phaseRing);
    }

    const halo = this.add.graphics();
    halo.fillStyle(palette.secondary, 0.4);
    halo.fillCircle(0, -h / 2 + 50, 30);
    halo.fillStyle(palette.accent, 0.25);
    halo.fillCircle(0, -h / 2 + 50, 20);
    c.add(halo);
    this.tweens.add({
      targets: halo,
      alpha: { from: 0.6, to: 1.0 },
      duration: 1500 + Math.random() * 800,
      yoyo: true,
      repeat: -1,
    });

    const orn = this.add.graphics();
    orn.lineStyle(1, palette.accent, 0.7);
    orn.lineBetween(-w/2 + 4, -h/2 + 12, -w/2 + 4, -h/2 + 4);
    orn.lineBetween(-w/2 + 4, -h/2 + 4, -w/2 + 12, -h/2 + 4);
    orn.lineBetween(w/2 - 4, -h/2 + 12, w/2 - 4, -h/2 + 4);
    orn.lineBetween(w/2 - 4, -h/2 + 4, w/2 - 12, -h/2 + 4);
    orn.lineBetween(-w/2 + 4, h/2 - 12, -w/2 + 4, h/2 - 4);
    orn.lineBetween(-w/2 + 4, h/2 - 4, -w/2 + 12, h/2 - 4);
    orn.lineBetween(w/2 - 4, h/2 - 12, w/2 - 4, h/2 - 4);
    orn.lineBetween(w/2 - 4, h/2 - 4, w/2 - 12, h/2 - 4);
    c.add(orn);

    if (card.sickness && !card.isBoss) bg.setAlpha(0.6);

    // A.7 — consacrée : aura dorée
    if (card.consecrated) {
      const aura = this.add.graphics();
      aura.lineStyle(2, 0xffd870, 0.7);
      aura.strokeRect(-w / 2 - 2, -h / 2 - 2, w + 4, h + 4);
      c.add(aura);
      this.tweens.add({
        targets: aura, alpha: { from: 0.4, to: 1 },
        duration: 1200, yoyo: true, repeat: -1,
      });
    }
    // G.5 — gardienne : aura bleue
    if (card.isGuardian || (card.sigils || []).includes("guardian")) {
      const aura = this.add.graphics();
      aura.lineStyle(2, 0x80c0ff, 0.6);
      aura.strokeRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8);
      c.add(aura);
      this.tweens.add({
        targets: aura, alpha: { from: 0.5, to: 1 },
        duration: 1500, yoyo: true, repeat: -1,
      });
    }
    // A.5 — fatiguée : indicateur rouge
    if (card.fatigued) {
      const fatigBg = this.add.rectangle(0, h / 2 - 10, w - 8, 12, 0x4a1010, 0.7);
      c.add(fatigBg);
      c.add(this.add.text(0, h / 2 - 10, "FATIGUÉE", {
        fontFamily: "Georgia, serif", fontSize: "12px",
        color: "#ff8080", fontStyle: "italic bold",
      }).setOrigin(0.5));
    }

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

    const emoji = card.isBoss ? this.circleDef.bossEmoji : this.getCardEmoji(card.axis, card);
    const emojiText = this.add.text(0, -h / 2 + 50, emoji, {
      fontSize: card.isBoss ? "44px" : "30px",
    }).setOrigin(0.5);
    c.add(emojiText);
    this.tweens.add({
      targets: emojiText,
      scale: { from: 1, to: 1.06 },
      duration: 1800 + Math.random() * 600,
      yoyo: true,
      repeat: -1,
    });

    let nameText = card.name;
    if (card.consecrated) nameText += " ✨";
    if (card.fatigued) nameText += " · fatiguée";
    c.add(
      this.add.text(0, h / 2 - 26, nameText, {
        fontFamily: "Georgia, serif",
        fontSize: "12px",
        color: "#" + palette.accent.toString(16).padStart(6, "0"),
        fontStyle: "bold",
        align: "center",
        wordWrap: { width: w - 6 },
      }).setOrigin(0.5)
    );

    c.add(this.add.text(-w / 2 + 8, h / 2 - 6, `⚔${card.atk}`, {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#f08070",
      fontStyle: "bold",
    }).setOrigin(0, 1));

    c.add(this.add.text(w / 2 - 8, h / 2 - 6, `❤${card.currentHp}`, {
      fontFamily: "monospace",
      fontSize: "14px",
      color: card.currentHp < card.hp ? "#ff8080" : "#80c08f",
      fontStyle: "bold",
    }).setOrigin(1, 1));

    // Sigils
    const sigilIcons: Record<string, string> = {
      bleed: "🩸", shield: "🛡", swift: "⚡", vampire: "🦇",
      counter: "🪤", chant: "🎶", morph: "🪬", guardian: "💎",
      venom: "🧪", freeze: "❄", burn: "🔥",
    };
    if (card.sigils && card.sigils.length > 0) {
      card.sigils.slice(0, 3).forEach((sig, idx) => {
        c.add(this.add.text(w / 2 - 4 - idx * 14, -h / 2 + 4, sigilIcons[sig] || "✦", {
          fontSize: "14px",
        }).setOrigin(1, 0));
      });
    }

    // Statuts visibles
    let sty = -h / 2 + 4;
    if ((card.bleeding || 0) > 0) {
      c.add(this.add.text(-w / 2 + 4, sty, `🩸${card.bleeding}`, { fontSize: "12px", color: "#ff6060" }).setOrigin(0, 0));
      sty += 11;
    }
    if ((card.block || 0) > 0) {
      c.add(this.add.text(-w / 2 + 4, sty, `🛡${card.block}`, { fontSize: "12px", color: "#60a0e0" }).setOrigin(0, 0));
      sty += 11;
    }
    if ((card.poisoned || 0) > 0) {
      c.add(this.add.text(-w / 2 + 4, sty, `🧪${card.poisoned}`, { fontSize: "12px", color: "#80f080" }).setOrigin(0, 0));
      sty += 11;
    }
    if ((card.frozen || 0) > 0) {
      c.add(this.add.text(-w / 2 + 4, sty, `❄${card.frozen}`, { fontSize: "12px", color: "#a0d8f0" }).setOrigin(0, 0));
      sty += 11;
    }
    if ((card.weak || 0) > 0) {
      c.add(this.add.text(-w / 2 + 4, sty, `⬇${card.weak}`, { fontSize: "12px", color: "#a08080" }).setOrigin(0, 0));
      sty += 11;
    }
    if ((card.strong || 0) > 0) {
      c.add(this.add.text(-w / 2 + 4, sty, `⬆${card.strong}`, { fontSize: "12px", color: "#f0c080" }).setOrigin(0, 0));
    }

    return c;
  }

  // ============================================================================
  // Bell
  // ============================================================================
  private renderBell(): void {
    this.bellContainer = this.add.container(GAME_WIDTH - 60, GAME_HEIGHT - 40);
    const bellGfx = this.add.graphics();
    bellGfx.fillStyle(0xc09040);
    bellGfx.fillEllipse(0, 0, 50, 40);
    bellGfx.fillStyle(0xa07020);
    bellGfx.fillRect(-2, -22, 4, 8);
    bellGfx.fillStyle(0xe0c060);
    bellGfx.fillCircle(0, 12, 4);
    this.bellContainer.add(bellGfx);
    this.bellContainer.add(this.add.text(0, 30, "FIN", {
      fontFamily: "Georgia, serif", fontSize: "12px", color: "#d4a040", fontStyle: "italic",
    }).setOrigin(0.5));

    const hit = this.add.circle(0, 0, 32, 0x000000, 0.001);
    hit.setInteractive({ useHandCursor: true });
    this.bellContainer.add(hit);
    hit.on("pointerover", () => { this.tweens.add({ targets: bellGfx, scale: 1.1, duration: 200 }); });
    hit.on("pointerout", () => { this.tweens.add({ targets: bellGfx, scale: 1, duration: 200 }); });
    hit.on("pointerdown", () => {
      this.tweens.add({
        targets: bellGfx,
        angle: { from: -15, to: 15 },
        duration: 100, yoyo: true, repeat: 2,
      });
      audio.sfx("bell");
      vibrate(20);
      this.endTurn();
    });

    const rerollsLeft = this.rerollMaxUses - (this.rerollUsed ? 1 : 0);
    if (rerollsLeft > 0) {
      const rerollC = this.add.container(60, GAME_HEIGHT - 40);
      // 22→30 rayon (hit > 44)
      const rBg = this.add.circle(0, 0, 30, 0x2a1810, 0.95);
      rBg.setStrokeStyle(2, 0x88a040);
      rerollC.add(rBg);
      rerollC.add(this.add.text(0, 0, "🔄", { fontSize: "26px" }).setOrigin(0.5));
      rerollC.add(this.add.text(0, 42, `REROLL ${rerollsLeft}`, {
        fontFamily: "Georgia, serif", fontSize: "13px", color: "#88a040", fontStyle: "italic",
      }).setOrigin(0.5));
      rBg.setInteractive({ useHandCursor: true });
      rBg.on("pointerdown", () => this.rerollHand());
      this.bellContainer?.add(rerollC);
    }
  }

  private rerollHand(): void {
    if (this.rerollUsed) return;
    this.rerollUsed = true;
    audio.sfx("draw");
    vibrate(15);
    this.discard.push(...this.hand);
    this.hand = [];
    this.deck = this.shuffle([...this.deck, ...this.discard]);
    this.discard = [];
    this.drawHand(4);
    this.setJudgeMessage("Tu reprends ton souffle. La pioche change.");
    this.renderScene();
  }

  // ============================================================================
  // Hand render
  // ============================================================================
  private renderHand(): void {
    this.handContainer = this.add.container(0, 0);

    const handBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 130, GAME_WIDTH - 20, 200, 0x000000, 0.5);
    handBg.setStrokeStyle(1, 0x8a5018, 0.6);
    this.handContainer.add(handBg);

    // Cartes en main agrandies (76→90, 116→136) — lisibilité mobile
    // Avec HAND_LIMIT=6 : 6×90 + 5×4 = 560 → tout juste en 540, on ajuste à 6 cartes
    const cardW = this.hand.length >= 6 ? 82 : 90;
    const cardH = 136;
    const gap = 4;
    const totalW = this.hand.length * (cardW + gap) - gap;
    const startX = (GAME_WIDTH - totalW) / 2 + cardW / 2;
    const handY = GAME_HEIGHT - 150;

    this.hand.forEach((card, i) => {
      const x = startX + i * (cardW + gap);
      const palette = AXIS_COLOR[card.axis] || AXIS_COLOR.Foi;
      const available = this.axisPool[card.axis] || 0;
      const playable = available >= card.cost && !this.pendingSummon;

      const c = this.add.container(x, handY);
      c.setData("startX", x);
      c.setData("startY", handY);
      c.setData("handIdx", i);

      const shadow = this.add.rectangle(2, 3, cardW, cardH, 0x000000, 0.5);
      c.add(shadow);

      const bg = this.add.rectangle(0, 0, cardW, cardH, palette.primary);
      bg.setStrokeStyle(3, palette.secondary);
      if (!playable) bg.setAlpha(0.4);
      c.add(bg);

      // A.8 — anomalie : effet visuel particulier
      if (card.anomaly === "weeps") {
        const tear = this.add.text(0, -cardH / 2 + 40, "💧", { fontSize: "13px" }).setOrigin(0.5);
        c.add(tear);
        this.tweens.add({ targets: tear, y: tear.y + 30, alpha: 0, duration: 1500, repeat: -1 });
      }

      if (playable) {
        const halo = this.add.graphics();
        halo.fillStyle(palette.secondary, 0.4);
        halo.fillCircle(0, -cardH / 2 + 38, 24);
        halo.fillStyle(palette.accent, 0.25);
        halo.fillCircle(0, -cardH / 2 + 38, 16);
        c.add(halo);
        this.tweens.add({
          targets: halo,
          alpha: { from: 0.6, to: 1.0 },
          duration: 1500 + Math.random() * 800,
          yoyo: true,
          repeat: -1,
        });
      }

      const orn = this.add.graphics();
      orn.lineStyle(1, palette.accent, 0.7);
      [-1, 1].forEach((sx) => [-1, 1].forEach((sy) => {
        const cx = sx * (cardW / 2 - 4);
        const cy = sy * (cardH / 2 - 4);
        orn.lineBetween(cx, cy + sy * 8, cx, cy);
        orn.lineBetween(cx, cy, cx + sx * 8, cy);
      }));
      c.add(orn);

      const costColor = playable ? palette.secondary : 0x666666;
      const costCircle = this.add.circle(-cardW / 2 + 13, -cardH / 2 + 13, 11, costColor);
      costCircle.setStrokeStyle(2, palette.accent);
      c.add(costCircle);
      c.add(this.add.text(-cardW / 2 + 13, -cardH / 2 + 13, String(card.cost), {
        fontFamily: "monospace", fontSize: "13px", color: "#fff5dc", fontStyle: "bold",
      }).setOrigin(0.5));

      // Niveau de carte (G.3)
      if (card.cardLevel && card.cardLevel > 1) {
        c.add(this.add.text(cardW / 2 - 13, -cardH / 2 + 13, "★".repeat(card.cardLevel - 1), {
          fontSize: "12px", color: "#ffd870",
        }).setOrigin(0.5));
      }

      const emojiText = this.add.text(0, -cardH / 2 + 38, this.getCardEmoji(card.axis, card), {
        fontSize: "28px",
      }).setOrigin(0.5);
      c.add(emojiText);
      if (playable) {
        this.tweens.add({
          targets: emojiText,
          scale: { from: 1, to: 1.06 },
          duration: 1800 + Math.random() * 600,
          yoyo: true, repeat: -1,
        });
      }

      let nm = card.name;
      if (card.consecrated) nm += "✨";
      c.add(this.add.text(0, cardH / 2 - 26, nm, {
        fontFamily: "Georgia, serif", fontSize: "12px",
        color: "#" + palette.accent.toString(16).padStart(6, "0"),
        fontStyle: "bold", align: "center", wordWrap: { width: cardW - 6 },
      }).setOrigin(0.5));

      c.add(this.add.text(-cardW / 2 + 8, cardH / 2 - 6, `⚔${card.atk}`, {
        fontFamily: "monospace", fontSize: "13px", color: "#f08070", fontStyle: "bold",
      }).setOrigin(0, 1));
      c.add(this.add.text(cardW / 2 - 8, cardH / 2 - 6, `❤${card.hp}`, {
        fontFamily: "monospace", fontSize: "13px", color: "#80c08f", fontStyle: "bold",
      }).setOrigin(1, 1));

      const sigilIconsHand: Record<string, string> = {
        bleed: "🩸", shield: "🛡", swift: "⚡", vampire: "🦇",
        counter: "🪤", chant: "🎶", morph: "🪬", guardian: "💎",
        venom: "🧪", freeze: "❄", burn: "🔥",
      };
      if (card.sigils && card.sigils.length > 0) {
        card.sigils.slice(0, 3).forEach((sig, idx) => {
          c.add(this.add.text(cardW / 2 - 4 - idx * 12, -cardH / 2 + 4, sigilIconsHand[sig] || "✦", {
            fontSize: "13px",
          }).setOrigin(1, 0));
        });
      }

      bg.setInteractive({ useHandCursor: true, draggable: playable });
      this.input.setDraggable(bg, playable);

      if (playable && !this.pendingSummon) {
        this.tweens.add({
          targets: c,
          scaleX: { from: 1, to: 1.04 },
          scaleY: { from: 1, to: 1.04 },
          duration: 1500, yoyo: true, repeat: -1,
        });
      }

      bg.on("pointerover", () => {
        if (!playable || c.getData("dragging") || this.pendingSummon) return;
        this.tweens.add({ targets: c, y: handY - 18, duration: 150 });
      });
      bg.on("pointerout", () => {
        if (c.getData("dragging")) return;
        this.tweens.add({ targets: c, y: handY, duration: 150 });
      });

      bg.on("dragstart", () => {
        if (this.longPressTimer) { clearTimeout(this.longPressTimer); this.longPressTimer = null; }
        c.setData("dragging", true);
        c.setDepth(100);
        (this as any).dragSourceIdx = i;
        this.renderBoard();
        audio.sfx("click");
        vibrate(8);
        bg.setAlpha(0.7);
      });

      bg.on("pointerdown", () => {
        if (this.longPressTimer) clearTimeout(this.longPressTimer);
        this.longPressTimer = setTimeout(() => {
          if (!c.getData("dragging")) this.showCardZoom(card);
        }, 350);
      });
      bg.on("pointerup", () => {
        if (this.longPressTimer) { clearTimeout(this.longPressTimer); this.longPressTimer = null; }
      });
      bg.on("drag", (_p: Phaser.Input.Pointer, dx: number, dy: number) => {
        c.x = c.getData("startX") + dx;
        c.y = c.getData("startY") + dy;
      });
      bg.on("dragend", () => {
        c.setDepth(0);
        c.setData("dragging", false);
        (this as any).dragSourceIdx = null;
        bg.setAlpha(playable ? 1 : 0.4);

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
          if (d < closestDist) { closestDist = d; closest = z; }
        }
        if (closest >= 0) {
          this.tryAttemptSummon(i, closest);
        } else {
          this.tweens.add({
            targets: c,
            x: c.getData("startX"), y: c.getData("startY"),
            duration: 200,
          });
          this.renderBoard();
        }
      });

      this.handContainer?.add(c);
    });
  }

  // ============================================================================
  // HUD
  // ============================================================================
  private renderHud(): void {
    this.hudContainer = this.add.container(0, 0);

    const bossBarY = 175;
    const barW = GAME_WIDTH - 180;
    const bossBarBg = this.add.rectangle(GAME_WIDTH / 2, bossBarY, barW, 14, 0x000000, 0.7);
    bossBarBg.setStrokeStyle(1, 0xc83838);
    this.hudContainer.add(bossBarBg);

    const boss = this.enemyBoard.find((s) => s.card?.isBoss)?.card;
    const bossHp = boss?.currentHp ?? 0;
    const hpPct = Math.max(0, bossHp / this.bossMaxHp);
    const fillW = barW * hpPct;
    const fillColor = this.bossPhase === 2 ? 0xff4040 : 0xc83838;
    this.bossHpFill = this.add.rectangle(
      GAME_WIDTH / 2 - barW / 2 + fillW / 2,
      bossBarY, fillW, 12, fillColor
    );
    this.hudContainer.add(this.bossHpFill);
    // Marker 50% phase 2
    const halfX = GAME_WIDTH / 2 - barW / 2 + barW / 2;
    const marker = this.add.rectangle(halfX, bossBarY, 2, 18, 0xffffff, 0.5);
    this.hudContainer.add(marker);

    this.bossHpText = this.add.text(GAME_WIDTH / 2, bossBarY, `${this.circleDef.bossName}  ${bossHp}/${this.bossMaxHp}`, {
      fontFamily: "monospace", fontSize: "13px", color: "#fff5dc", fontStyle: "bold",
    }).setOrigin(0.5);
    this.hudContainer.add(this.bossHpText);

    const playerHpY = GAME_HEIGHT - 250;
    const pBarBg = this.add.rectangle(GAME_WIDTH / 2, playerHpY, barW, 16, 0x000000, 0.75);
    pBarBg.setStrokeStyle(2, 0x88c060);
    this.hudContainer.add(pBarBg);
    const pPct = Math.max(0, this.playerHp / this.playerMaxHp);
    const pFillW = barW * pPct;
    this.playerHpBar = this.add.rectangle(
      GAME_WIDTH / 2 - barW / 2 + pFillW / 2,
      playerHpY, pFillW, 14,
      pPct > 0.5 ? 0x6ae060 : pPct > 0.25 ? 0xe8c040 : 0xe04040
    );
    this.hudContainer.add(this.playerHpBar);
    this.playerHpText = this.add.text(GAME_WIDTH / 2, playerHpY, `❤ Toi  ${this.playerHp}/${this.playerMaxHp}`, {
      fontFamily: "monospace", fontSize: "14px", color: "#fff5dc", fontStyle: "bold",
    }).setOrigin(0.5);
    this.hudContainer.add(this.playerHpText);

    const top = (Object.entries(this.axisPool) as [Axis, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    // Panel ÂME agrandi : 130×64 → 170×92, lignes 11→16px
    const panelW = 170;
    const panelH = 92;
    const px = GAME_WIDTH - panelW - 8;
    const py = 200;
    const bg2 = this.add.rectangle(px, py, panelW, panelH, 0x000000, 0.7);
    bg2.setOrigin(0, 0);
    bg2.setStrokeStyle(1, 0x8a5018, 0.7);
    this.hudContainer.add(bg2);

    this.hudContainer.add(this.add.text(px + 8, py + 6, "ÂME", {
      fontFamily: "monospace", fontSize: "13px", color: "#d4a040", fontStyle: "bold",
    }));

    top.forEach((entry, i) => {
      const [axis, val] = entry;
      const palette = AXIS_COLOR[axis];
      const yo = py + 24 + i * 16;
      this.hudContainer?.add(this.add.circle(px + 12, yo + 6, 4, palette.secondary));
      this.hudContainer?.add(this.add.text(px + 20, yo, `${axis} ${val}`, {
        fontFamily: "monospace", fontSize: "13px",
        color: "#" + palette.accent.toString(16).padStart(6, "0"),
      }));
    });

    // D.5 — appease stacks
    if (this.bossSpecials.includes("appeasable") && this.bossPhase === 1 && this.appeaseStacks > 0) {
      this.hudContainer.add(this.add.text(8, 200, `🕊 Apaisement: ${this.appeaseStacks}/3`, {
        fontFamily: "monospace", fontSize: "13px", color: "#88e0a0",
      }));
    }

    // B.2 — affichage des synergies actives
    const axisCount: Record<string, number> = {};
    this.playerBoard.forEach((s) => {
      if (s.card && !s.card.isBoss) {
        axisCount[s.card.axis] = (axisCount[s.card.axis] || 0) + 1;
      }
    });
    const synergies = Object.entries(axisCount).filter(([, c]) => c >= 3);
    if (synergies.length > 0) {
      const synY = 410;
      const synBg = this.add.rectangle(GAME_WIDTH / 2, synY, 200, 18, 0x1a4028, 0.85);
      synBg.setStrokeStyle(1, 0x88e0a0);
      this.hudContainer.add(synBg);
      this.hudContainer.add(this.add.text(GAME_WIDTH / 2, synY,
        `✦ Synergie: ${synergies.map(([a]) => a).join(" + ")}`,
        {
          fontFamily: "Georgia, serif", fontSize: "12px",
          color: "#88e0a0", fontStyle: "italic bold",
        }
      ).setOrigin(0.5));
    }

    // Bouton Légende (?) en haut-gauche : 12→24px rayon (hit area 48px)
    const legendBtn = this.add.container(36, 180);
    const lBg = this.add.circle(0, 0, 24, 0x2a1810, 0.95);
    lBg.setStrokeStyle(2, 0xa87a3a);
    legendBtn.add(lBg);
    legendBtn.add(this.add.text(0, 0, "?", {
      fontFamily: "Georgia, serif", fontSize: "26px",
      color: "#d4a040", fontStyle: "bold",
    }).setOrigin(0.5));
    lBg.setInteractive({ useHandCursor: true });
    lBg.on("pointerdown", () => this.showLegend());
    this.hudContainer.add(legendBtn);
  }

  // Légende combat (statuts + sigils)
  private legendOverlay?: Phaser.GameObjects.Container;
  private showLegend(): void {
    if (this.legendOverlay) {
      this.legendOverlay.destroy();
      this.legendOverlay = undefined;
      return;
    }
    this.legendOverlay = this.add.container(0, 0);
    this.legendOverlay.setDepth(6000);

    const dim = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.92);
    dim.setInteractive();
    dim.on("pointerdown", () => {
      this.legendOverlay?.destroy();
      this.legendOverlay = undefined;
    });
    this.legendOverlay.add(dim);

    this.legendOverlay.add(this.add.text(GAME_WIDTH / 2, 60, "LÉGENDE", {
      fontFamily: "Georgia, serif", fontSize: "22px",
      color: "#d4a040", fontStyle: "bold italic",
    }).setOrigin(0.5));

    const sections: Array<{ title: string; entries: string[] }> = [
      {
        title: "STATUTS",
        entries: [
          "🩸 Saignement : -1 HP/tour pendant N tours",
          "🛡 Bloc : absorbe les dégâts avant HP",
          "🧪 Toxique : -X HP/tour",
          "❄ Glacé : saute son prochain tour",
          "⬇ Faible : -25% ATK",
          "⬆ Fort : +25% ATK",
          "✦ Vulnérable : +50% dégâts reçus",
        ],
      },
      {
        title: "SIGILS DE CARTE",
        entries: [
          "⚡ Rapide : peut attaquer le tour de pose",
          "🛡 Bouclier : +2 bloc tour de pose",
          "🩸 Saignée : applique Saignement",
          "🦇 Vampire : récupère HP par dégât infligé",
          "🪤 Embuscade : carte face cachée, contre-attaque",
          "🎶 Cantique : rejouable gratis si survit",
          "🪬 Mue : devient Spectre à la mort",
          "💎 Gardienne : indestructible",
          "🧪 Toxique : applique Poison",
          "❄ Glace : applique Glacé",
          "🔥 Brûlure : brûle l'attaquant",
        ],
      },
      {
        title: "SYNERGIES",
        entries: [
          "3 cartes du même axe sur le board → +1 ATK chacune",
          "Cartes du Cercle de Combat → bonus contextuels",
        ],
      },
    ];

    let y = 110;
    sections.forEach((sec) => {
      this.legendOverlay?.add(this.add.text(GAME_WIDTH / 2, y, sec.title, {
        fontFamily: "Georgia, serif", fontSize: "15px",
        color: "#ffd870", fontStyle: "bold",
      }).setOrigin(0.5));
      y += 22;
      sec.entries.forEach((e) => {
        this.legendOverlay?.add(this.add.text(GAME_WIDTH / 2, y, e, {
          fontFamily: "Georgia, serif", fontSize: "14px",
          color: "#f0d8b0",
          align: "center", wordWrap: { width: GAME_WIDTH - 40 },
        }).setOrigin(0.5));
        y += 16;
      });
      y += 10;
    });

    this.legendOverlay.add(this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, "Touche pour fermer", {
      fontFamily: "Georgia, serif", fontSize: "14px",
      color: "#a87a3a", fontStyle: "italic",
    }).setOrigin(0.5));
  }

  // ============================================================================
  // Logic
  // ============================================================================
  private setJudgeMessage(msg: string): void {
    if (this.judgeBubble) {
      this.judgeBubble.setText(msg);
      this.tweens.add({ targets: this.judgeBubble, alpha: { from: 0.3, to: 1 }, duration: 400 });
    }
  }

  private getCardEmoji(axis: Axis, card?: Card): string {
    if (card?.emoji) return card.emoji;
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
    let drawn = 0;
    for (let i = 0; i < n; i++) {
      if (this.hand.length >= HAND_LIMIT) break;
      if (this.deck.length === 0) {
        if (this.discard.length === 0) break;
        this.deck = this.shuffle(this.discard);
        this.discard = [];
      }
      const c = this.deck.pop();
      if (c) {
        this.hand.push(c);
        drawn++;
      }
    }
    if (drawn > 0) audio.sfx("draw");
  }

  // B.1 — applique dégâts avec gestion bloc/vulnérable/faiblesse/force
  private applyDamage(target: any, attacker: any, baseDmg: number): { dealt: number; blocked: number } {
    let dmg = baseDmg;
    if ((attacker?.weak || 0) > 0) dmg = Math.round(dmg * 0.75);
    if ((attacker?.strong || 0) > 0) dmg = Math.round(dmg * 1.25);
    if ((target.vulnerable || 0) > 0) dmg = Math.round(dmg * 1.5);

    const blockAbsorbed = Math.min(dmg, target.block || 0);
    if (target.block) target.block -= blockAbsorbed;
    const finalDmg = dmg - blockAbsorbed;
    target.currentHp -= finalDmg;
    return { dealt: finalDmg, blocked: blockAbsorbed };
  }

  // ============================================================================
  // Summon
  // ============================================================================
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
      this.directSummon(handIdx, zoneIdx);
      return;
    }

    const playerMonsters = this.playerBoard.filter((s) => s.card && !s.card.isBoss).length;
    if (playerMonsters > 0) {
      this.pendingSummon = { handIdx, targetZone: zoneIdx };
      this.setJudgeMessage(`Pas assez de ${axis}. Sacrifie un de tes monstres pour combler.`);
      this.renderScene();
    } else {
      this.setJudgeMessage(`Tu n'as pas assez de ${axis} (${available}/${cost}).`);
      this.renderHand();
    }
  }

  private directSummon(handIdx: number, zoneIdx: number): void {
    const card = this.hand[handIdx];
    const axis = card.axis;
    this.axisPool[axis] = (this.axisPool[axis] || 0) - card.cost;

    const sigils = card.sigils || [];
    const swift = sigils.includes("swift");
    const shieldBlock = sigils.includes("shield") ? 2 : 0;
    const facedown = sigils.includes("counter");

    this.playerBoard[zoneIdx] = {
      card: {
        ...card,
        currentHp: card.hp,
        maxHpAtPlay: card.hp,
        sickness: !swift,
        block: shieldBlock,
        chantReady: sigils.includes("chant"),
        facedown,
      },
    };
    this.hand.splice(handIdx, 1);
    this.discard.push(card);

    audio.sfx("card_play");
    this.setJudgeMessage(pickLine("cardSummoned"));

    // I.1 — registre cumul + boost permanent
    registerCardPlay(card);
    // A.4 — profil évolutif : axe de la carte +1 transitoire
    applyAxisShift(card.axis, 1);
    this.cardsPlayedThisCombat.push(card.id);

    // D.5 — appeasable boss : Charité l'apaise
    if (this.bossSpecials.includes("appeasable") && card.axis === "Charite" && this.bossPhase === 1) {
      this.appeaseStacks = Math.min(3, this.appeaseStacks + 1);
      if (this.appeaseStacks >= 3) {
        const boss = this.enemyBoard.find((s) => s.card?.isBoss)?.card;
        if (boss) boss.atk = Math.max(1, boss.atk - 2);
        this.setJudgeMessage(`${this.circleDef.bossName} s'apaise. Ses dégâts diminuent.`);
      }
    }

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
    // G.5 gardienne ne peut être sacrifiée
    if ((sacrificed.sigils || []).includes("guardian")) {
      this.setJudgeMessage("La carte gardienne refuse d'être sacrifiée.");
      this.flashFlying("PROTÉGÉE", GAME_WIDTH / 2, 460, "#80c0ff");
      return;
    }
    this.cardsSacrificed++;

    const refund = sacrificed.cost;
    this.axisPool[sacrificed.axis] = (this.axisPool[sacrificed.axis] || 0) + refund;

    const playerY = 460;
    const slotW = 90;
    const totalW = 4 * slotW + 3 * 8;
    const startX = (GAME_WIDTH - totalW) / 2 + slotW / 2;
    const sx = startX + sacrificeZoneIdx * (slotW + 8);
    // Anim de sacrifice : large explosion sang + flash
    this.spawnBlood(sx, playerY, 30);
    this.spawnBlood(sx + 20, playerY - 10, 15);
    this.spawnBlood(sx - 20, playerY - 10, 15);
    audio.sfx("card_destroy");
    this.cameraShake(0.008, 350);
    vibrate([30, 20, 30]);
    this.flashFlying(`+${refund} ${sacrificed.axis}`, sx, playerY - 30, "#ffd870");

    // A.9 — pacted return ? La carte sacrifiée reviendra plus tard avec +ATK
    if (Math.random() < 0.2) {
      const pacted = { ...sacrificed, pactedReturn: true, pactedAtkBonus: 2 };
      // Stockée pour invocation auto plus tard
      (this as any).pactedCards = (this as any).pactedCards || [];
      (this as any).pactedCards.push(pacted);
      this.setJudgeMessage("Cette carte garde rancune. Elle reviendra.");
    }

    // B.3 — sigil morph : transformation à la mort
    if ((sacrificed.sigils || []).includes("morph")) {
      const newCard: Card = {
        ...sacrificed,
        id: sacrificed.id + "-morph",
        name: `Spectre de ${sacrificed.name}`,
        atk: Math.max(1, sacrificed.atk - 1),
        hp: Math.max(1, sacrificed.hp - 1),
        sigils: ["swift"] as Sigil[],
        emoji: "👻",
      };
      this.discard.push(newCard);
    } else {
      this.discard.push(sacrificed);
    }
    this.playerBoard[sacrificeZoneIdx] = { card: null };

    this.setJudgeMessage(pickLine("sacrifice"));

    const { handIdx, targetZone } = this.pendingSummon;
    this.pendingSummon = null;

    const card = this.hand[handIdx];
    if (card && this.axisPool[card.axis] >= card.cost) {
      this.directSummon(handIdx, targetZone);
    } else {
      this.setJudgeMessage("Encore. Sacrifie davantage.");
      this.renderScene();
    }
  }

  // ============================================================================
  // Turn flow
  // ============================================================================
  private endTurn(): void {
    if (this.isAnimating) return;
    if (this.pendingSummon) {
      this.pendingSummon = null;
      this.renderScene();
    }
    this.isAnimating = true;
    this.setJudgeMessage("Voyons ce que tes morts feront pour toi.");

    // B.10 — événement aléatoire 5%
    if (Math.random() < 0.08) this.triggerRandomEvent();

    this.time.delayedCall(700, () => this.battlePhase());
  }

  // B.10 — événement aléatoire en combat
  private triggerRandomEvent(): void {
    const evt = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
    this.setJudgeMessage(`✦ ${evt.msg}`);
    switch (evt.effect) {
      case "buff_atk": {
        const live = this.playerBoard.filter((s) => s.card && !s.card.isBoss);
        if (live.length > 0) {
          const target = live[Math.floor(Math.random() * live.length)];
          if (target.card) target.card.atk++;
        }
        break;
      }
      case "buff_hp": {
        const live = this.playerBoard.filter((s) => s.card && !s.card.isBoss);
        if (live.length > 0) {
          const target = live[Math.floor(Math.random() * live.length)];
          if (target.card) target.card.currentHp++;
        }
        break;
      }
      case "draw_extra":
        this.drawHand(1);
        break;
      case "boss_skip":
        (this as any).bossSkipNextTurn = true;
        break;
    }
  }

  private battlePhase(): void {
    let bossDestroyed = false;
    const playerY = 460;
    const slotW = 90;
    const totalW = 4 * slotW + 3 * 8;
    const startX = (GAME_WIDTH - totalW) / 2 + slotW / 2;

    let i = 0;
    const next = () => {
      if (i >= 4) {
        this.playerBoard.forEach((s) => {
          if (s.card) s.card.sickness = false;
        });
        if (bossDestroyed) {
          this.endCombat("victory");
          return;
        }
        this.time.delayedCall(500, () => this.enemyTurn());
        return;
      }

      const myMon = this.playerBoard[i].card;
      if (!myMon || myMon.sickness || (myMon.frozen || 0) > 0) {
        if (myMon && (myMon.frozen || 0) > 0) myMon.frozen!--;
        i++;
        next();
        return;
      }

      // B.4 — initiative & zone-vs-zone : attaque la zone i ennemie
      const enemy = this.enemyBoard[i].card;
      if (enemy) {
        // B.6 — initiative : si attaquant ATK > défenseur ATK, frappe d'abord
        const attackerFirst = myMon.atk >= (enemy.atk || 0);
        const myDmg = myMon.atk;
        const enDmg = enemy.atk || 0;

        const myMonAfter = { ...myMon };
        const enemyAfter = { ...enemy };

        if (attackerFirst) {
          this.applyDamage(enemy, myMon, myDmg);
          if ((myMon.sigils || []).includes("bleed")) enemy.bleeding = (enemy.bleeding || 0) + 2;
          if ((myMon.sigils || []).includes("venom")) enemy.poisoned = (enemy.poisoned || 0) + 1;
          if ((myMon.sigils || []).includes("freeze")) enemy.frozen = (enemy.frozen || 0) + 1;
          if ((myMon.sigils || []).includes("vampire")) {
            myMon.currentHp = Math.min(myMon.hp, myMon.currentHp + 1);
          }
          if (enemy.currentHp > 0) {
            // Riposte
            this.applyDamage(myMon, enemy, enDmg);
            if ((enemy.sigils || []).includes("burn") && (myMon.flammable || 0) > 0) {
              myMon.currentHp -= 2;
            }
          }
        } else {
          this.applyDamage(myMon, enemy, enDmg);
          if (myMon.currentHp > 0) {
            this.applyDamage(enemy, myMon, myDmg);
          }
        }

        const ex = startX + i * (slotW + 8);
        const ey = 230;
        this.spawnBlood(ex, ey, 12);
        this.cameraShake(0.004, 150);
        audio.sfx("damage");
        this.flashFlying(`-${myDmg}`, ex, ey, "#f08070");
        if (Math.random() < 0.4) this.setJudgeMessage(pickLine("damage"));

        if (enemy.currentHp <= 0) {
          this.enemyBoard[i].card = null;
          if (enemy.isBoss) bossDestroyed = true;
        }
        if (myMon.currentHp <= 0) {
          // B.3 morph à la mort
          if ((myMon.sigils || []).includes("morph")) {
            this.playerBoard[i].card = {
              ...myMon, name: `Spectre de ${myMon.name}`,
              atk: Math.max(1, myMon.atk - 1), hp: 2, currentHp: 2,
              sigils: ["swift"], emoji: "👻", maxHpAtPlay: 2,
            } as any;
          } else {
            this.playerBoard[i].card = null;
          }
        }
      } else {
        // Direct sur boss
        const bossZone = this.enemyBoard.findIndex((s) => s.card?.isBoss);
        if (bossZone !== -1 && this.enemyBoard[bossZone].card) {
          const boss = this.enemyBoard[bossZone].card!;
          const r = this.applyDamage(boss, myMon, myMon.atk);
          this.spawnBlood(GAME_WIDTH / 2, 175, 15);
          this.cameraShake(0.006, 200);
          audio.sfx("damage");
          this.flashFlying(`-${r.dealt}`, GAME_WIDTH / 2, 195, "#f08070");

          if ((myMon.sigils || []).includes("vampire") && r.dealt > 0) {
            myMon.currentHp = Math.min(myMon.hp, myMon.currentHp + Math.ceil(r.dealt / 2));
          }
          if ((myMon.sigils || []).includes("bleed")) boss.bleeding = (boss.bleeding || 0) + 2;
          if ((myMon.sigils || []).includes("venom")) boss.poisoned = (boss.poisoned || 0) + 2;

          // B.9 — vérifier déclenchement phase 2
          if (this.bossPhase === 1 && boss.currentHp > 0 && boss.currentHp <= this.bossMaxHp / 2) {
            this.enterBossPhase2();
          }
          if (boss.currentHp <= 0) {
            bossDestroyed = true;
            this.enemyBoard[bossZone].card = null;
          }
        }
      }

      // B.2 — synergie de zone : si 3 cartes du même axe sur le board → +1 ATK toutes
      this.applyZoneSynergies();

      this.renderScene();
      i++;
      this.time.delayedCall(450, next);
    };
    next();
  }

  // B.2 — synergies de zone
  private applyZoneSynergies(): void {
    const axisCount: Record<string, number> = {};
    this.playerBoard.forEach((s) => {
      if (s.card && !s.card.isBoss) {
        axisCount[s.card.axis] = (axisCount[s.card.axis] || 0) + 1;
      }
    });
    Object.entries(axisCount).forEach(([axis, count]) => {
      if (count >= 3) {
        this.playerBoard.forEach((s) => {
          if (s.card && s.card.axis === axis && !s.card.isBoss && !(s.card as any).synergyBuffed) {
            s.card.atk++;
            (s.card as any).synergyBuffed = true;
          }
        });
      }
    });
  }

  // B.9 — phase 2 boss à 50% HP
  private enterBossPhase2(): void {
    if (this.bossPhase === 2) return;
    this.bossPhase = 2;
    const boss = this.enemyBoard.find((s) => s.card?.isBoss)?.card;
    if (!boss) return;
    boss.bossPhase = 2;
    this.cameraShake(0.015, 600);
    audio.sfx("bell");
    vibrate([60, 30, 60]);

    if (this.bossSpecials.includes("phase_2_rage")) {
      boss.atk = Math.round(boss.atk * 1.5);
      this.setJudgeMessage(`${this.circleDef.bossName} entre en rage. ${this.circleDef.phase2Rule}`);
    }
    if (this.bossSpecials.includes("phase_2_heal")) {
      boss.currentHp = Math.min(boss.maxHpAtPlay || boss.hp, boss.currentHp + 8);
      this.setJudgeMessage(`${this.circleDef.bossName} se régénère. ${this.circleDef.phase2Rule}`);
    }
    if (this.bossSpecials.includes("phase_2_swap")) {
      this.setJudgeMessage(`${this.circleDef.bossName} change de règles. ${this.circleDef.phase2Rule}`);
    }
  }

  private enemyTurn(): void {
    this.setJudgeMessage(pickLine("endTurn"));
    audio.sfx("click");

    // Tick statuts ennemis
    this.enemyBoard.forEach((slot, i) => {
      const e = slot.card;
      if (!e) return;
      if ((e.bleeding || 0) > 0) {
        e.currentHp -= 1;
        e.bleeding = (e.bleeding || 0) - 1;
        const slotW = 90;
        const totalW = 4 * slotW + 3 * 8;
        const startX = (GAME_WIDTH - totalW) / 2 + slotW / 2;
        this.flashFlying(`🩸 -1`, startX + i * (slotW + 8), 230, "#ff6060");
        if (e.currentHp <= 0) {
          if (e.isBoss) { this.endCombat("victory"); return; }
          this.enemyBoard[i].card = null;
        }
      }
      if ((e.poisoned || 0) > 0) {
        e.currentHp -= e.poisoned!;
        const slotW = 90;
        const totalW = 4 * slotW + 3 * 8;
        const startX = (GAME_WIDTH - totalW) / 2 + slotW / 2;
        this.flashFlying(`🧪 -${e.poisoned}`, startX + i * (slotW + 8), 230, "#80f080");
        if (e.currentHp <= 0) {
          if (e.isBoss) { this.endCombat("victory"); return; }
          this.enemyBoard[i].card = null;
        }
      }
    });

    // D.2 — Cerbère détruit 1 case par tour
    if (this.bossSpecials.includes("destroy_board_slot")) {
      const candidates = this.playerBoard
        .map((s, i) => ({ s, i }))
        .filter((x) => x.s.card && !x.s.card.isBoss && !(x.s.card.sigils || []).includes("guardian"));
      const destroyCount = this.bossPhase === 2 ? 2 : 1;
      for (let n = 0; n < destroyCount && candidates.length > 0; n++) {
        const target = candidates.splice(Math.floor(Math.random() * candidates.length), 1)[0];
        this.discard.push(target.s.card!);
        this.playerBoard[target.i] = { card: null };
        this.spawnBlood(0, 460, 20);
        this.flashFlying("DÉVORÉ", GAME_WIDTH / 2, 460, "#ff6060");
      }
    }

    // D.4 — Acédie efface l'axe le plus fort
    if (this.bossSpecials.includes("drain_top_axis")) {
      const sorted = (Object.entries(this.axisPool) as [Axis, number][]).sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0) {
        const [topAxis] = sorted[0];
        const drain = this.bossPhase === 2 ? 8 : 5;
        if (this.bossPhase === 2) {
          // Drain sur tous
          Object.keys(this.axisPool).forEach((a) => {
            this.axisPool[a as Axis] = Math.max(0, this.axisPool[a as Axis] - 3);
          });
        } else {
          this.axisPool[topAxis] = Math.max(0, this.axisPool[topAxis] - drain);
        }
        this.flashFlying(`-${drain} ${topAxis}`, 50, 200, "#a08080");
      }
    }

    // Sœurs d'Envie : copient ta carte la plus puissante
    if (this.bossSpecials.includes("copy_strongest")) {
      const sorted = this.playerBoard
        .filter((s) => s.card && !s.card.isBoss)
        .sort((a, b) => (b.card!.atk - a.card!.atk));
      if (sorted.length > 0 && sorted[0].card) {
        const proto = sorted[0].card!;
        const free = this.enemyBoard.findIndex((s) => !s.card);
        if (free >= 0) {
          this.enemyBoard[free] = {
            card: {
              ...proto, id: proto.id + "-copy", isBoss: false,
              currentHp: proto.hp, name: "Copie",
            } as any,
          };
          this.flashFlying("COPIE", 230, 230, "#a0c0e0");
        }
      }
    }

    // B.8 — invoque minions
    if (this.bossSpecials.includes("summon_minions") && this.turn % 3 === 0) {
      const free = this.enemyBoard.findIndex((s) => !s.card);
      if (free >= 0) {
        const minion: Card = {
          id: "minion", name: "Larve", axis: this.bossAxis,
          cost: 0, atk: 2, hp: 3, emoji: "🦗",
        };
        this.enemyBoard[free] = { card: { ...minion, currentHp: 3 } as any };
      }
    }

    // Boss skip de l'event aléatoire ?
    if ((this as any).bossSkipNextTurn) {
      (this as any).bossSkipNextTurn = false;
      this.setJudgeMessage("Le boss saute son attaque.");
      this.time.delayedCall(800, () => {
        this.turn++;
        this.drawHand(2);
        this.isAnimating = false;
        this.renderScene();
      });
      return;
    }

    let i = 0;
    const next = () => {
      if (i >= 4) {
        this.turn++;
        // Pioche ajustée par cercle Paresse
        let drawN = 2;
        if (this.bossAxis === "Paresse") drawN--;
        this.drawHand(Math.max(1, drawN));

        // B.7 — chant : libère cartes prêtes
        this.playerBoard.forEach((s) => {
          if (s.card && (s.card.sigils || []).includes("chant") && s.card.chantReady && s.card.currentHp > 0) {
            // Pas de cost ce tour
            (s.card as any).cost = 0;
          }
        });

        const total = (Object.values(this.axisPool) as number[]).reduce((s, v) => s + v, 0);
        if (this.playerHp <= 0 || total < 5) {
          this.endCombat("defeat");
          return;
        }
        this.isAnimating = false;
        this.renderScene();
        return;
      }

      const enemy = this.enemyBoard[i].card;
      if (!enemy || (enemy.frozen || 0) > 0) {
        if (enemy && (enemy.frozen || 0) > 0) enemy.frozen!--;
        i++;
        next();
        return;
      }
      const myMon = this.playerBoard[i].card;
      const slotW = 90;
      const totalW = 4 * slotW + 3 * 8;
      const playerStartX = (GAME_WIDTH - totalW) / 2 + slotW / 2;
      const px = playerStartX + i * (slotW + 8);

      let attackCount = 1;
      if (enemy.isBoss && this.bossPhase === 2 && this.bossSpecials.includes("phase_2_rage")) {
        attackCount = 2;  // Cléopâtre frappe deux fois
      }

      for (let atk = 0; atk < attackCount; atk++) {
        if (myMon && myMon.currentHp > 0) {
          // B.5 — counter révélation
          if (myMon.facedown) {
            myMon.facedown = false;
            // counter revele : double sa propre ATK ce tour
            myMon.atk *= 2;
            this.flashFlying("EMBUSCADE!", px, 460, "#ffd870");
          }
          const r = this.applyDamage(myMon, enemy, enemy.atk);
          this.spawnBlood(px, 460, 12);
          this.cameraShake(0.004, 150);
          audio.sfx("damage");
          this.flashFlying(`-${r.dealt}`, px, 460, "#e08080");
          if ((enemy.sigils || []).includes("burn") && (myMon.flammable || 0) > 0) {
            myMon.currentHp -= 2;
          }
          if (myMon.currentHp <= 0) {
            this.playerBoard[i].card = null;
          }
        } else {
          // Attaque directe
          this.playerHp = Math.max(0, this.playerHp - enemy.atk);
          this.cameraShake(0.01, 300);
          audio.sfx("damage");
          vibrate([40, 20, 40]);
          this.flashFlying(`-${enemy.atk} HP`, GAME_WIDTH / 2, 700, "#ff5050");
          if (Math.random() < 0.5) this.setJudgeMessage(pickLine("enemyAttack"));
          this.refreshPlayerHpBar();
          if (this.playerHp <= 0) { this.endCombat("defeat"); return; }
        }
      }

      this.renderScene();
      i++;
      this.time.delayedCall(500, next);
    };
    next();
  }

  private refreshPlayerHpBar(): void {
    this.renderHud();
  }

  private showCardZoom(card: Card): void {
    if (this.cardZoomOverlay) this.cardZoomOverlay.destroy();
    this.cardZoomOverlay = this.add.container(0, 0);
    this.cardZoomOverlay.setDepth(5000);

    const dim = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.85);
    dim.setInteractive();
    dim.on("pointerdown", () => {
      this.cardZoomOverlay?.destroy();
      this.cardZoomOverlay = undefined;
    });
    this.cardZoomOverlay.add(dim);

    const palette = AXIS_COLOR[card.axis] || AXIS_COLOR.Foi;
    const cardW = 280;
    const cardH = 400;
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const cardBg = this.add.rectangle(cx, cy, cardW, cardH, palette.primary);
    cardBg.setStrokeStyle(5, palette.secondary);
    this.cardZoomOverlay.add(cardBg);

    const costCircle = this.add.circle(cx - cardW / 2 + 35, cy - cardH / 2 + 35, 28, palette.secondary);
    costCircle.setStrokeStyle(4, palette.accent);
    this.cardZoomOverlay.add(costCircle);
    this.cardZoomOverlay.add(this.add.text(cx - cardW / 2 + 35, cy - cardH / 2 + 35, String(card.cost), {
      fontFamily: "monospace", fontSize: "26px", color: "#fff5dc", fontStyle: "bold",
    }).setOrigin(0.5));

    const halo = this.add.graphics();
    halo.fillStyle(palette.secondary, 0.4);
    halo.fillCircle(cx, cy - 60, 80);
    halo.fillStyle(palette.accent, 0.25);
    halo.fillCircle(cx, cy - 60, 50);
    this.cardZoomOverlay.add(halo);
    this.tweens.add({
      targets: halo, alpha: { from: 0.7, to: 1.0 },
      duration: 1400, yoyo: true, repeat: -1,
    });

    const zoomEmoji = this.add.text(cx, cy - 60, this.getCardEmoji(card.axis, card), { fontSize: "100px" }).setOrigin(0.5);
    this.cardZoomOverlay.add(zoomEmoji);
    this.tweens.add({ targets: zoomEmoji, scale: { from: 1, to: 1.08 }, duration: 1700, yoyo: true, repeat: -1 });

    if (card.flavor) {
      this.cardZoomOverlay.add(this.add.text(cx, cy + 20, `« ${card.flavor} »`, {
        fontFamily: "Georgia, serif", fontSize: "14px",
        color: "#a87a3a", fontStyle: "italic",
        align: "center", wordWrap: { width: cardW - 40 },
      }).setOrigin(0.5));
    }

    this.cardZoomOverlay.add(this.add.text(cx, cy + 40, card.name, {
      fontFamily: "Georgia, serif", fontSize: "26px",
      color: "#" + palette.accent.toString(16).padStart(6, "0"),
      fontStyle: "bold", align: "center",
    }).setOrigin(0.5));

    if (card.effect) {
      this.cardZoomOverlay.add(this.add.text(cx, cy + 80, card.effect, {
        fontFamily: "Georgia, serif", fontSize: "15px",
        color: "#f0d8b0", align: "center", wordWrap: { width: cardW - 40 },
      }).setOrigin(0.5));
    }

    if (card.anomalyMessage) {
      this.cardZoomOverlay.add(this.add.text(cx, cy + 100, `⚠ ${card.anomalyMessage}`, {
        fontFamily: "Georgia, serif", fontSize: "13px",
        color: "#ff8080", fontStyle: "italic",
        align: "center", wordWrap: { width: cardW - 40 },
      }).setOrigin(0.5));
    }

    if (card.sigils && card.sigils.length > 0) {
      let sy = cy + 130;
      const labels: Record<string, { icon: string; desc: string }> = {
        bleed:    { icon: "🩸", desc: "Saignement (1 dmg/tour)" },
        shield:   { icon: "🛡", desc: "+2 bloc tour de pose" },
        swift:    { icon: "⚡", desc: "Attaque tour de pose" },
        vampire:  { icon: "🦇", desc: "Vol de vie" },
        counter:  { icon: "🪤", desc: "Embuscade" },
        chant:    { icon: "🎶", desc: "Cantique : rejouable" },
        morph:    { icon: "🪬", desc: "Mue à la mort" },
        guardian: { icon: "💎", desc: "Indestructible" },
        venom:    { icon: "🧪", desc: "Toxique" },
        freeze:   { icon: "❄", desc: "Glace l'ennemi" },
        burn:     { icon: "🔥", desc: "Brûlure" },
      };
      card.sigils.forEach((sig) => {
        const meta = labels[sig];
        if (!meta) return;
        this.cardZoomOverlay?.add(this.add.text(cx - cardW / 2 + 20, sy, `${meta.icon} ${meta.desc}`, {
          fontFamily: "Georgia, serif", fontSize: "14px",
          color: "#a87a3a", wordWrap: { width: cardW - 40 },
        }));
        sy += 18;
      });
    }

    this.cardZoomOverlay.add(this.add.text(cx - cardW / 2 + 20, cy + cardH / 2 - 30, `⚔ ${card.atk}`, {
      fontFamily: "monospace", fontSize: "22px", color: "#f08070", fontStyle: "bold",
    }));
    this.cardZoomOverlay.add(this.add.text(cx + cardW / 2 - 20, cy + cardH / 2 - 30, `❤ ${card.hp}`, {
      fontFamily: "monospace", fontSize: "22px", color: "#80c08f", fontStyle: "bold",
    }).setOrigin(1, 0));

    this.cardZoomOverlay.add(this.add.text(cx, cy + cardH / 2 + 30, "Touche pour fermer", {
      fontFamily: "Georgia, serif", fontSize: "14px", color: "#a87a3a", fontStyle: "italic",
    }).setOrigin(0.5));

    this.cardZoomOverlay.setScale(0);
    this.tweens.add({ targets: this.cardZoomOverlay, scale: 1, duration: 200, ease: "Back.easeOut" });
  }

  private flashFlying(text: string, x: number, y: number, color: string): void {
    const t = this.add.text(x, y, text, {
      fontFamily: "monospace", fontSize: "20px",
      color, stroke: "#000000", strokeThickness: 3, fontStyle: "bold",
    }).setOrigin(0.5);
    t.setDepth(1000);
    this.tweens.add({
      targets: t, y: y - 60,
      alpha: { from: 1, to: 0 },
      duration: 1100, ease: "Cubic.easeOut",
      onComplete: () => t.destroy(),
    });
  }

  private endCombat(result: "victory" | "defeat"): void {
    this.finished = true;
    GameState.outcome = result;
    GameState.combatStats = {
      turns: this.turn,
      cardsSacrificed: this.cardsSacrificed,
      axesRemaining: (Object.values(this.axisPool) as number[]).reduce((s, v) => s + v, 0),
    };
    // Stocke cartes jouées pour télémétrie (Outcome utilisera)
    (GameState as any).lastCombatCards = this.cardsPlayedThisCombat;
    audio.sfx(result);
    this.cameraShake(result === "victory" ? 0.01 : 0.02, 600);
    vibrate([60, 30, 60]);

    recordCombatResult(this.circleDef.id, result);

    this.time.delayedCall(800, () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("Outcome");
      });
    });
  }
}
