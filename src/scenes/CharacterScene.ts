import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../main";
import { GameState, persistCharacter, buildAvatarUrl, setNeutralProfile, buildInitialDeck } from "../systems/GameState";
import { audio } from "../systems/AudioSystem";

const STYLES = [
  { id: "personas",       label: "Détaillé" },
  { id: "lorelei-neutral", label: "Moderne" },
  { id: "pixel-art",      label: "Pixel" },
  { id: "miniavs",        label: "Mini" },
];

const HAIR_COLORS = [
  { hex: "1a1a1a", name: "Noir" },
  { hex: "5c3a1f", name: "Brun foncé" },
  { hex: "8b4513", name: "Châtain" },
  { hex: "c08040", name: "Châtain clair" },
  { hex: "e8c878", name: "Blond" },
  { hex: "b03030", name: "Roux" },
  { hex: "888888", name: "Gris" },
];

const SKIN_COLORS = [
  { hex: "f5d3b3", name: "Très clair" },
  { hex: "ecad80", name: "Clair" },
  { hex: "c89070", name: "Mat" },
  { hex: "8a5a3c", name: "Foncé" },
  { hex: "5a3018", name: "Très foncé" },
];

const EYE_COLORS = [
  { hex: "5c3a26", name: "Marron" },
  { hex: "228b22", name: "Vert" },
  { hex: "1e3a8a", name: "Bleu" },
  { hex: "000000", name: "Noir" },
];

export class CharacterScene extends Phaser.Scene {
  private avatarImage?: Phaser.GameObjects.Image;
  private avatarLoadingText?: Phaser.GameObjects.Text;
  private container?: Phaser.GameObjects.Container;

  constructor() {
    super("Character");
  }

  create(): void {
    this.cameras.main.fadeIn(400, 0, 0, 0);
    audio.playPhase("ambient");

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0a06, 0x1a0a06, 0x3a1f0c, 0x3a1f0c, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Bougies aux coins
    [
      { x: 50, y: 80 }, { x: GAME_WIDTH - 50, y: 80 },
      { x: 50, y: GAME_HEIGHT - 80 }, { x: GAME_WIDTH - 50, y: GAME_HEIGHT - 80 },
    ].forEach((p) => {
      const halo = this.add.graphics();
      halo.fillStyle(0xffaa44, 0.2);
      halo.fillCircle(p.x, p.y, 60);
      const flame = this.add.circle(p.x, p.y, 4, 0xffd870);
      this.tweens.add({ targets: flame, scale: { from: 0.85, to: 1.4 }, duration: 600, yoyo: true, repeat: -1 });
    });

    // Titre
    this.add.text(GAME_WIDTH / 2, 50, "Crée ton âme", {
      fontFamily: "Georgia, serif",
      fontSize: "26px",
      color: "#d4a040",
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 80, "Avant de naître", {
      fontFamily: "Georgia, serif",
      fontSize: "12px",
      color: "#a87a3a",
      fontStyle: "italic",
    }).setOrigin(0.5);

    // Cadre avatar (centre haut)
    const frameY = 200;
    const frameBg = this.add.rectangle(GAME_WIDTH / 2, frameY, 180, 180, 0x000000, 0.4);
    frameBg.setStrokeStyle(3, 0xd4a040);

    // Coins ornés
    const orn = this.add.graphics();
    orn.lineStyle(2, 0xd4a040);
    [-1, 1].forEach((sx) => [-1, 1].forEach((sy) => {
      const cx = GAME_WIDTH / 2 + sx * 90;
      const cy = frameY + sy * 90;
      orn.lineBetween(cx, cy + sy * -16, cx, cy);
      orn.lineBetween(cx, cy, cx + sx * -16, cy);
    }));

    // Halo derrière
    const halo = this.add.graphics();
    halo.fillStyle(0xd4a040, 0.2);
    halo.fillCircle(GAME_WIDTH / 2, frameY, 100);
    halo.fillStyle(0xffcc66, 0.12);
    halo.fillCircle(GAME_WIDTH / 2, frameY, 70);
    this.tweens.add({ targets: halo, alpha: { from: 0.6, to: 1 }, duration: 1500, yoyo: true, repeat: -1 });

    this.avatarLoadingText = this.add.text(GAME_WIDTH / 2, frameY, "...", {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#d4a040",
    }).setOrigin(0.5);

    this.loadAvatar();

    // Sélecteurs
    let y = 320;
    y = this.addOptionRow(y, "Style", STYLES.map((s) => s.id), STYLES.map((s) => s.label),
      GameState.character.style, (v) => { GameState.character.style = v; persistCharacter(); this.loadAvatar(); });

    y = this.addColorRow(y, "Cheveux", HAIR_COLORS,
      GameState.character.hairColor, (hex) => { GameState.character.hairColor = hex; persistCharacter(); this.loadAvatar(); });

    y = this.addColorRow(y, "Carnation", SKIN_COLORS,
      GameState.character.skinColor, (hex) => { GameState.character.skinColor = hex; persistCharacter(); this.loadAvatar(); });

    y = this.addColorRow(y, "Yeux", EYE_COLORS,
      GameState.character.eyesColor, (hex) => { GameState.character.eyesColor = hex; persistCharacter(); this.loadAvatar(); });

    // Bouton Aléatoire
    const randBtn = this.createBtn(GAME_WIDTH / 2, y + 20, "🎲 Aléatoire", () => {
      GameState.character.seed = "perso-" + Math.random().toString(36).substring(2, 10);
      GameState.character.hairColor = HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)].hex;
      GameState.character.skinColor = SKIN_COLORS[Math.floor(Math.random() * SKIN_COLORS.length)].hex;
      GameState.character.eyesColor = EYE_COLORS[Math.floor(Math.random() * EYE_COLORS.length)].hex;
      persistCharacter();
      this.loadAvatar();
    }, 0x4a3018, 180, 38);

    // Bouton Naître (vit la phase Vie)
    this.createBtn(GAME_WIDTH / 2 - 100, GAME_HEIGHT - 80, "Naître", () => {
      audio.sfx("bell");
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("Life"));
    }, 0x6a3018, 180, 48);

    // Bouton Médium (skip Vie)
    this.createBtn(GAME_WIDTH / 2 + 100, GAME_HEIGHT - 80, "Médium (skip)", () => {
      // Profil neutre + deck par défaut
      setNeutralProfile();
      GameState.deck = buildInitialDeck();
      audio.sfx("click");
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("Combat"));
    }, 0x4a4a18, 180, 48);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 28,
      "Médium = test rapide (profil neutre, deck équilibré)",
      {
        fontFamily: "Georgia, serif",
        fontSize: "10px",
        color: "#806040",
        fontStyle: "italic",
      }
    ).setOrigin(0.5);

    // Bouton retour
    const back = this.add.text(20, 25, "← Retour", {
      fontFamily: "Georgia, serif",
      fontSize: "13px",
      color: "#a87a3a",
    });
    back.setInteractive({ useHandCursor: true });
    back.on("pointerdown", () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("Boot"));
    });
  }

  private loadAvatar(): void {
    if (this.avatarLoadingText) this.avatarLoadingText.setText("...");
    if (this.avatarImage) {
      this.avatarImage.destroy();
      this.avatarImage = undefined;
    }
    const url = buildAvatarUrl(160);
    const key = "avatar-" + Date.now();

    this.load.image(key, url);
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      if (this.avatarLoadingText) this.avatarLoadingText.setText("");
      this.avatarImage = this.add.image(GAME_WIDTH / 2, 200, key);
      this.avatarImage.setDisplaySize(160, 160);
      // Anim entrée
      this.avatarImage.setScale(0);
      this.tweens.add({ targets: this.avatarImage, scaleX: 1, scaleY: 1, duration: 250, ease: "Back.easeOut" });
    });
    this.load.once("loaderror", () => {
      if (this.avatarLoadingText) this.avatarLoadingText.setText("(erreur)");
    });
    this.load.start();
  }

  private addOptionRow(y: number, label: string, ids: string[], labels: string[], current: string, onPick: (id: string) => void): number {
    this.add.text(GAME_WIDTH / 2, y, label, {
      fontFamily: "Georgia, serif",
      fontSize: "11px",
      color: "#a87a3a",
    }).setOrigin(0.5);
    const segW = 90;
    const totalW = ids.length * segW;
    const startX = GAME_WIDTH / 2 - totalW / 2 + segW / 2;
    ids.forEach((id, i) => {
      const x = startX + i * segW;
      const isActive = id === current;
      const r = this.add.rectangle(x, y + 22, segW - 4, 24, isActive ? 0xa07020 : 0x2a1810);
      r.setStrokeStyle(1, 0x8a5018);
      r.setInteractive({ useHandCursor: true });
      this.add.text(x, y + 22, labels[i], {
        fontFamily: "Georgia, serif",
        fontSize: "10px",
        color: isActive ? "#fff5dc" : "#a87a3a",
      }).setOrigin(0.5);
      r.on("pointerdown", () => {
        audio.sfx("click");
        onPick(id);
        this.scene.restart();
      });
    });
    return y + 44;
  }

  private addColorRow(y: number, label: string, colors: { hex: string; name: string }[], current: string, onPick: (hex: string) => void): number {
    this.add.text(GAME_WIDTH / 2, y, label, {
      fontFamily: "Georgia, serif",
      fontSize: "11px",
      color: "#a87a3a",
    }).setOrigin(0.5);
    const sw = 24;
    const totalW = colors.length * (sw + 4);
    const startX = GAME_WIDTH / 2 - totalW / 2 + sw / 2;
    colors.forEach((c, i) => {
      const x = startX + i * (sw + 4);
      const r = this.add.rectangle(x, y + 22, sw, sw, parseInt(c.hex, 16));
      const isActive = c.hex === current;
      r.setStrokeStyle(isActive ? 3 : 1, isActive ? 0xffd870 : 0x000000);
      r.setInteractive({ useHandCursor: true });
      r.on("pointerdown", () => {
        audio.sfx("click");
        onPick(c.hex);
        this.scene.restart();
      });
    });
    return y + 44;
  }

  private createBtn(x: number, y: number, label: string, onClick: () => void, color = 0x6a3018, width = 200, height = 48): Phaser.GameObjects.Container {
    const c = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, width, height, color);
    bg.setStrokeStyle(2, 0xd4a040);
    c.add(bg);
    c.add(this.add.text(0, 0, label, {
      fontFamily: "Georgia, serif",
      fontSize: "14px",
      color: "#f0d8b0",
      fontStyle: "bold",
    }).setOrigin(0.5));
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerover", () => bg.setFillStyle(color + 0x202020));
    bg.on("pointerout", () => bg.setFillStyle(color));
    bg.on("pointerdown", () => {
      this.tweens.add({ targets: c, scale: 0.95, duration: 80, yoyo: true, onComplete: onClick });
    });
    return c;
  }
}
