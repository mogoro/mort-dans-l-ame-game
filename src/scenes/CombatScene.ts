import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../main";
import { GameState, getProfileNature } from "../systems/GameState";
import { AXIS_COLOR, type Card } from "../data/cards";
import type { Axis } from "../data/events";
import { audio } from "../systems/AudioSystem";
import { Settings, animSpeed, shakeFactor, difficultyMul, vibrate, DEBUG } from "../systems/Settings";

interface BoardSlot {
  card: (Card & {
    currentHp: number;
    isBoss?: boolean;
    sickness?: boolean;
    bleeding?: number;   // Saignement : perd 1 HP/tour pendant N tours
    block?: number;      // Bloc absorbé avant HP
    vulnerable?: number; // Reçoit +50% dégâts pendant N tours
  }) | null;
}

const HAND_LIMIT = 6; // 2.9

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
  private rerollUsed = false;     // 8.9 - 1 reroll par combat
  private cardsSacrificed = 0;    // pour score
  private playerHp = 30;
  private playerMaxHp = 30;
  private playerHpBar?: Phaser.GameObjects.Rectangle;
  private playerHpText?: Phaser.GameObjects.Text;
  private playerAvatar?: Phaser.GameObjects.Image;

  // UI refs
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

    // Boss adapté au profil (nature ombre/lumière/neutre)
    const nature = getProfileNature();
    const bossDef = this.pickBossForNature(nature);

    // Boss — adapté difficulté + pacifist
    const dm = difficultyMul();
    let bossHp = bossDef.hp * dm.bossHp;
    let bossAtk = bossDef.atk * dm.bossAtk;
    if (Settings.pacifist) bossHp /= 2;
    bossHp = Math.round(bossHp);
    bossAtk = Math.round(bossAtk);

    this.enemyBoard[1] = {
      card: {
        id: bossDef.id,
        name: bossDef.name,
        axis: bossDef.axis,
        cost: 0,
        atk: bossAtk,
        hp: bossHp,
        currentHp: bossHp,
        isBoss: true,
        emoji: bossDef.emoji,
      } as any,
    };
    (this as any).bossEmoji = bossDef.emoji;
    (this as any).bossName = bossDef.name;
    this.bossMaxHp = bossHp;
    this.cardsSacrificed = 0;
    this.rerollUsed = false;

    // HP joueur
    this.playerMaxHp = Math.round(30 * dm.playerStartHp);
    this.playerHp = this.playerMaxHp;

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

  // 3 boss différents selon nature du profil
  private pickBossForNature(nature: "ombre" | "lumiere" | "neutre"): {
    id: string; name: string; emoji: string; atk: number; hp: number; axis: any;
  } {
    if (nature === "ombre") {
      return { id: "cleopatre", name: "Cléopâtre", emoji: "👸", atk: 8, hp: 32, axis: "Luxure" };
    } else if (nature === "lumiere") {
      return { id: "seraphin",  name: "Séraphin Pâle", emoji: "👼", atk: 7, hp: 36, axis: "Foi" };
    } else {
      return { id: "minos",     name: "Minos le Juge", emoji: "🧙‍♂️", atk: 7, hp: 30, axis: "Justice" };
    }
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
    if (Settings.reduceFlashes && intensity > 0.005) intensity *= shakeFactor();
    this.cameras.main.shake(duration * animSpeed(), intensity * shakeFactor());
  }

  // 1.1 Hit-stop : pause brève sur dégâts importants
  private hitStop(durationMs = 60): Promise<void> {
    if (Settings.reduceFlashes) return Promise.resolve();
    return new Promise((resolve) => {
      this.time.timeScale = 0.001;
      setTimeout(() => {
        this.time.timeScale = 1;
        resolve();
      }, durationMs);
    });
  }

  // ============================================================================
  // Background statique (n'est pas redessiné à chaque renderScene)
  // ============================================================================

  private renderBackground(): void {
    // 5.7 Palette par cercle - Luxure = pourpre/rose
    const c1 = 0x1a0a14;
    const c2 = 0x3a1428;
    const bg = this.add.graphics();
    bg.fillGradientStyle(c1, c1, c2, c2, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.setDepth(-100);

    // 5.6 Vignette (bords sombres)
    const vignette = this.add.graphics();
    vignette.setDepth(2000);
    const center = { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 };
    for (let r = 200; r < GAME_WIDTH; r += 30) {
      const alpha = Math.min(0.5, (r - 200) / 600);
      vignette.fillStyle(0x000000, alpha * 0.04);
      vignette.fillCircle(center.x, center.y, r);
    }
    // Bordures noires fines aux 4 coins (vignette plus marquée)
    const edge = this.add.graphics();
    edge.setDepth(1500);
    edge.fillStyle(0x000000, 0.3);
    edge.fillRect(0, 0, GAME_WIDTH, 30);
    edge.fillRect(0, GAME_HEIGHT - 30, GAME_WIDTH, 30);
    edge.fillRect(0, 0, 20, GAME_HEIGHT);
    edge.fillRect(GAME_WIDTH - 20, 0, 20, GAME_HEIGHT);

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
    const bossEmojiText = (this as any).bossEmoji || "👸";
    judgePortrait.add(this.add.text(0, 0, bossEmojiText, { fontSize: "32px" }).setOrigin(0.5));
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

    // Cadre arrière (ombre)
    const shadow = this.add.rectangle(2, 3, w, h, 0x000000, 0.5);
    c.add(shadow);

    // Background carte
    const bg = this.add.rectangle(0, 0, w, h, palette.primary);
    bg.setStrokeStyle(3, palette.secondary);
    c.add(bg);

    // Halo radial coloré derrière l'emoji (effet pulse)
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

    // Ornements coins dorés
    const orn = this.add.graphics();
    orn.lineStyle(1, palette.accent, 0.7);
    // Coin haut-gauche
    orn.lineBetween(-w/2 + 4, -h/2 + 12, -w/2 + 4, -h/2 + 4);
    orn.lineBetween(-w/2 + 4, -h/2 + 4, -w/2 + 12, -h/2 + 4);
    // Coin haut-droit
    orn.lineBetween(w/2 - 4, -h/2 + 12, w/2 - 4, -h/2 + 4);
    orn.lineBetween(w/2 - 4, -h/2 + 4, w/2 - 12, -h/2 + 4);
    // Coin bas-gauche
    orn.lineBetween(-w/2 + 4, h/2 - 12, -w/2 + 4, h/2 - 4);
    orn.lineBetween(-w/2 + 4, h/2 - 4, -w/2 + 12, h/2 - 4);
    // Coin bas-droit
    orn.lineBetween(w/2 - 4, h/2 - 12, w/2 - 4, h/2 - 4);
    orn.lineBetween(w/2 - 4, h/2 - 4, w/2 - 12, h/2 - 4);
    c.add(orn);

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

    // Emoji art (utilise card.emoji si défini, sinon emoji axe)
    const emoji = card.isBoss ? ((this as any).bossEmoji || "👸") : this.getCardEmoji(card.axis, card);
    const emojiText = this.add.text(0, -h / 2 + 50, emoji, {
      fontSize: card.isBoss ? "44px" : "30px",
    }).setOrigin(0.5);
    c.add(emojiText);
    // Pulse subtle de l'emoji
    this.tweens.add({
      targets: emojiText,
      scale: { from: 1, to: 1.06 },
      duration: 1800 + Math.random() * 600,
      yoyo: true,
      repeat: -1,
    });

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

    // 2.1 Sigils icons sur la carte (max 2 visibles en haut-droite)
    const sigilIcons: Record<string, string> = {
      bleed: "🩸", shield: "🛡", swift: "⚡", vampire: "🦇",
    };
    if (card.sigils && card.sigils.length > 0) {
      card.sigils.slice(0, 2).forEach((sig, idx) => {
        c.add(this.add.text(w / 2 - 4 - idx * 14, -h / 2 + 4, sigilIcons[sig] || "✦", {
          fontSize: "11px",
        }).setOrigin(1, 0));
      });
    }

    // Statut Saignement visible
    if ((card.bleeding || 0) > 0) {
      c.add(this.add.text(-w / 2 + 4, -h / 2 + 4, `🩸${card.bleeding}`, {
        fontSize: "9px",
        color: "#ff6060",
      }).setOrigin(0, 0));
    }
    // Statut Bloc visible
    if ((card.block || 0) > 0) {
      c.add(this.add.text(-w / 2 + 4, -h / 2 + 16, `🛡${card.block}`, {
        fontSize: "9px",
        color: "#60a0e0",
      }).setOrigin(0, 0));
    }

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
      this.tweens.add({
        targets: bellGfx,
        angle: { from: -15, to: 15 },
        duration: 100,
        yoyo: true,
        repeat: 2,
      });
      audio.sfx("bell");
      vibrate(20);
      this.endTurn();
    });

    // 8.9 Bouton Reroll (1× par combat) à gauche-bas
    if (!this.rerollUsed) {
      const rerollC = this.add.container(60, GAME_HEIGHT - 40);
      const rBg = this.add.circle(0, 0, 22, 0x2a1810, 0.95);
      rBg.setStrokeStyle(2, 0x88a040);
      rerollC.add(rBg);
      rerollC.add(this.add.text(0, 0, "🔄", { fontSize: "18px" }).setOrigin(0.5));
      rerollC.add(this.add.text(0, 32, "REROLL", {
        fontFamily: "Georgia, serif",
        fontSize: "8px",
        color: "#88a040",
        fontStyle: "italic",
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

      // Ombre arrière
      const shadow = this.add.rectangle(2, 3, cardW, cardH, 0x000000, 0.5);
      c.add(shadow);

      const bg = this.add.rectangle(0, 0, cardW, cardH, palette.primary);
      bg.setStrokeStyle(3, palette.secondary);
      if (!playable) bg.setAlpha(0.4);
      c.add(bg);

      // Halo radial pulsé derrière l'emoji
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

      // Ornements coins dorés
      const orn = this.add.graphics();
      orn.lineStyle(1, palette.accent, 0.7);
      [-1, 1].forEach((sx) => [-1, 1].forEach((sy) => {
        const cx = sx * (cardW / 2 - 4);
        const cy = sy * (cardH / 2 - 4);
        orn.lineBetween(cx, cy + sy * 8, cx, cy);
        orn.lineBetween(cx, cy, cx + sx * 8, cy);
      }));
      c.add(orn);

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

      // Emoji spécifique du monstre
      const emojiText = this.add.text(0, -cardH / 2 + 38, this.getCardEmoji(card.axis, card), {
        fontSize: "28px",
      }).setOrigin(0.5);
      c.add(emojiText);
      if (playable) {
        this.tweens.add({
          targets: emojiText,
          scale: { from: 1, to: 1.06 },
          duration: 1800 + Math.random() * 600,
          yoyo: true,
          repeat: -1,
        });
      }

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

      // 2.1 Sigils icons sur la carte en main
      const sigilIconsHand: Record<string, string> = {
        bleed: "🩸", shield: "🛡", swift: "⚡", vampire: "🦇",
      };
      if (card.sigils && card.sigils.length > 0) {
        card.sigils.slice(0, 2).forEach((sig, idx) => {
          c.add(this.add.text(cardW / 2 - 4 - idx * 12, -cardH / 2 + 4, sigilIconsHand[sig] || "✦", {
            fontSize: "10px",
          }).setOrigin(1, 0));
        });
      }

      // Drag setup
      bg.setInteractive({ useHandCursor: true, draggable: playable });
      this.input.setDraggable(bg, playable);

      // 1.3 Pulse subtle si jouable
      if (playable && !this.pendingSummon) {
        this.tweens.add({
          targets: c,
          scaleX: { from: 1, to: 1.04 },
          scaleY: { from: 1, to: 1.04 },
          duration: 1500,
          yoyo: true,
          repeat: -1,
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

      // 6.2 Long-press preview = zoom carte en grand au centre
      bg.on("pointerdown", (p: Phaser.Input.Pointer) => {
        if (this.longPressTimer) clearTimeout(this.longPressTimer);
        this.longPressTimer = setTimeout(() => {
          if (!c.getData("dragging")) {
            this.showCardZoom(card);
          }
        }, 500);
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
    const bossName = (this as any).bossName || "Boss";
    this.bossHpText = this.add.text(GAME_WIDTH / 2, bossBarY, `${bossName}  ${bossHp}/${this.bossMaxHp}`, {
      fontFamily: "monospace",
      fontSize: "10px",
      color: "#fff5dc",
      fontStyle: "bold",
    }).setOrigin(0.5);
    this.hudContainer.add(this.bossHpText);

    // Joueur HP bar (juste au-dessus de la main)
    const playerHpY = GAME_HEIGHT - 250;
    const pBarBg = this.add.rectangle(GAME_WIDTH / 2, playerHpY, barW, 16, 0x000000, 0.75);
    pBarBg.setStrokeStyle(2, 0x88c060);
    this.hudContainer.add(pBarBg);
    const pPct = Math.max(0, this.playerHp / this.playerMaxHp);
    const pFillW = barW * pPct;
    this.playerHpBar = this.add.rectangle(
      GAME_WIDTH / 2 - barW / 2 + pFillW / 2,
      playerHpY,
      pFillW,
      14,
      pPct > 0.5 ? 0x6ae060 : pPct > 0.25 ? 0xe8c040 : 0xe04040
    );
    this.hudContainer.add(this.playerHpBar);
    this.playerHpText = this.add.text(GAME_WIDTH / 2, playerHpY, `❤ Toi  ${this.playerHp}/${this.playerMaxHp}`, {
      fontFamily: "monospace",
      fontSize: "11px",
      color: "#fff5dc",
      fontStyle: "bold",
    }).setOrigin(0.5);
    this.hudContainer.add(this.playerHpText);

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
    for (let i = 0; i < n; i++) {
      if (this.hand.length >= HAND_LIMIT) break; // 2.9 limite main
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

    // 2.1 Sigil "swift" : pas de summoning sickness
    const swift = (card.sigils || []).includes("swift");
    // 2.1 Sigil "shield" : +2 bloc au tour de pose
    const shieldBlock = (card.sigils || []).includes("shield") ? 2 : 0;

    this.playerBoard[zoneIdx] = {
      card: {
        ...card,
        currentHp: card.hp,
        sickness: !swift,
        block: shieldBlock,
      },
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
    this.cardsSacrificed++;

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
        // Calcul dégâts avec bloc + vulnérable (statuts 2.2)
        let dmg = myMon.atk;
        if ((enemy.vulnerable || 0) > 0) dmg = Math.round(dmg * 1.5);
        const blockAbsorbed = Math.min(dmg, enemy.block || 0);
        if (enemy.block) enemy.block -= blockAbsorbed;
        const finalDmg = dmg - blockAbsorbed;
        enemy.currentHp -= finalDmg;
        // Sigil bleed -> applique Saignement
        if ((myMon.sigils || []).includes("bleed")) {
          enemy.bleeding = (enemy.bleeding || 0) + 2;
        }
        // Sigil vampire -> heal myMon
        if ((myMon.sigils || []).includes("vampire") && finalDmg > 0) {
          myMon.currentHp = Math.min(myMon.hp, myMon.currentHp + Math.ceil(finalDmg / 2));
        }
        const ex = startX + i * (slotW + 8);
        const ey = 230;
        this.spawnBlood(ex, ey, 12);
        this.cameraShake(0.004, 150);
        audio.sfx("damage");
        this.flashFlying(`-${finalDmg}${blockAbsorbed > 0 ? ` (${blockAbsorbed} bloqué)` : ""}`, ex, ey, "#f08070");
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

    // Tick saignement sur ennemis (status actif 2.2)
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
          if (e.isBoss) {
            // Boss tombe par saignement -> victoire
            this.endCombat("victory");
            return;
          }
          this.enemyBoard[i].card = null;
        }
      }
    });

    let i = 0;
    const next = () => {
      if (i >= 4) {
        // Pioche fin de tour
        this.turn++;
        this.drawHand(2);

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
        // Attaque directe sur HP du joueur
        this.playerHp = Math.max(0, this.playerHp - enemy.atk);
        this.cameraShake(0.01, 300);
        audio.sfx("damage");
        vibrate([40, 20, 40]);
        this.flashFlying(`-${enemy.atk} HP`, GAME_WIDTH / 2, 700, "#ff5050");
        if (Math.random() < 0.5) this.setJudgeMessage(pickLine("enemyAttack"));
        this.refreshPlayerHpBar();
        if (this.playerHp <= 0) {
          this.endCombat("defeat");
          return;
        }
      }

      this.renderScene();
      i++;
      this.time.delayedCall(500, next);
    };
    next();
  }

  private refreshPlayerHpBar(): void {
    // re-render hud pour repartir frais
    this.renderHud();
  }

  // 1.7 Zoom carte au long-press
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

    // Coût
    const costCircle = this.add.circle(cx - cardW / 2 + 35, cy - cardH / 2 + 35, 28, palette.secondary);
    costCircle.setStrokeStyle(4, palette.accent);
    this.cardZoomOverlay.add(costCircle);
    this.cardZoomOverlay.add(this.add.text(cx - cardW / 2 + 35, cy - cardH / 2 + 35, String(card.cost), {
      fontFamily: "monospace", fontSize: "26px", color: "#fff5dc", fontStyle: "bold",
    }).setOrigin(0.5));

    // Halo derrière l'emoji
    const halo = this.add.graphics();
    halo.fillStyle(palette.secondary, 0.4);
    halo.fillCircle(cx, cy - 60, 80);
    halo.fillStyle(palette.accent, 0.25);
    halo.fillCircle(cx, cy - 60, 50);
    this.cardZoomOverlay.add(halo);
    this.tweens.add({
      targets: halo,
      alpha: { from: 0.7, to: 1.0 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
    });

    // Emoji spécifique
    const zoomEmoji = this.add.text(cx, cy - 60, this.getCardEmoji(card.axis, card), {
      fontSize: "100px",
    }).setOrigin(0.5);
    this.cardZoomOverlay.add(zoomEmoji);
    this.tweens.add({
      targets: zoomEmoji,
      scale: { from: 1, to: 1.08 },
      duration: 1700,
      yoyo: true,
      repeat: -1,
    });

    // Flavor text si présent
    if (card.flavor) {
      this.cardZoomOverlay.add(this.add.text(cx, cy + 20, `« ${card.flavor} »`, {
        fontFamily: "Georgia, serif", fontSize: "11px",
        color: "#a87a3a", fontStyle: "italic",
        align: "center", wordWrap: { width: cardW - 40 },
      }).setOrigin(0.5));
    }

    // Nom
    this.cardZoomOverlay.add(this.add.text(cx, cy + 40, card.name, {
      fontFamily: "Georgia, serif", fontSize: "26px",
      color: "#" + palette.accent.toString(16).padStart(6, "0"),
      fontStyle: "bold", align: "center",
    }).setOrigin(0.5));

    // Effect text
    if (card.effect) {
      this.cardZoomOverlay.add(this.add.text(cx, cy + 80, card.effect, {
        fontFamily: "Georgia, serif", fontSize: "13px",
        color: "#f0d8b0", align: "center", wordWrap: { width: cardW - 40 },
      }).setOrigin(0.5));
    }

    // Sigils détaillés
    if (card.sigils && card.sigils.length > 0) {
      let sy = cy + 120;
      card.sigils.forEach((sig) => {
        const meta = (window as any).SIGIL_LABELS_INLINE?.[sig] ||
          { bleed: { icon: "🩸", desc: "Inflige Saignement (1 dmg/tour) à l'attaqué." },
            shield: { icon: "🛡", desc: "+2 bloc au tour de pose." },
            swift: { icon: "⚡", desc: "Peut attaquer le tour de pose." },
            vampire: { icon: "🦇", desc: "Vol de vie : récupère HP par dégât infligé." } }[sig];
        if (!meta) return;
        this.cardZoomOverlay?.add(this.add.text(cx - cardW / 2 + 20, sy, `${meta.icon} ${meta.desc}`, {
          fontFamily: "Georgia, serif", fontSize: "11px",
          color: "#a87a3a", wordWrap: { width: cardW - 40 },
        }));
        sy += 18;
      });
    }

    // ATK / HP en bas
    this.cardZoomOverlay.add(this.add.text(cx - cardW / 2 + 20, cy + cardH / 2 - 30, `⚔ ${card.atk}`, {
      fontFamily: "monospace", fontSize: "22px", color: "#f08070", fontStyle: "bold",
    }));
    this.cardZoomOverlay.add(this.add.text(cx + cardW / 2 - 20, cy + cardH / 2 - 30, `❤ ${card.hp}`, {
      fontFamily: "monospace", fontSize: "22px", color: "#80c08f", fontStyle: "bold",
    }).setOrigin(1, 0));

    // Hint fermer
    this.cardZoomOverlay.add(this.add.text(cx, cy + cardH / 2 + 30, "Touche pour fermer", {
      fontFamily: "Georgia, serif", fontSize: "11px", color: "#a87a3a", fontStyle: "italic",
    }).setOrigin(0.5));

    // Anim entrée
    this.cardZoomOverlay.setScale(0);
    this.tweens.add({ targets: this.cardZoomOverlay, scale: 1, duration: 200, ease: "Back.easeOut" });
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
    GameState.combatStats = {
      turns: this.turn,
      cardsSacrificed: this.cardsSacrificed,
      axesRemaining: (Object.values(this.axisPool) as number[]).reduce((s, v) => s + v, 0),
    };
    audio.sfx(result);
    this.cameraShake(result === "victory" ? 0.01 : 0.02, 600);
    vibrate([60, 30, 60]);

    this.time.delayedCall(800, () => {
      this.cameras.main.fadeOut(1000, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("Outcome");
      });
    });
  }
}
