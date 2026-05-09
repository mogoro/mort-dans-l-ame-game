import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../main";
import { audio } from "../systems/AudioSystem";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload(): void {
    // Pour le proto, on génère les sprites via Graphics (pas de PNG externes)
    // ComfyUI assets viendront dans une étape ultérieure
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Background dégradé chaud
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0a06, 0x1a0a06, 0x3a1f0c, 0x3a1f0c, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Halos de bougies aux 4 coins
    [
      { x: 60, y: 100 },
      { x: GAME_WIDTH - 60, y: 100 },
      { x: 60, y: GAME_HEIGHT - 100 },
      { x: GAME_WIDTH - 60, y: GAME_HEIGHT - 100 },
    ].forEach((pos) => {
      this.createCandle(pos.x, pos.y);
    });

    // Titre
    const title = this.add.text(cx, cy - 80, "Mort dans l'âme", {
      fontFamily: "Georgia, serif",
      fontSize: "44px",
      color: "#d4a040",
      stroke: "#1a0a06",
      strokeThickness: 4,
    });
    title.setOrigin(0.5);

    // Pulse subtle
    this.tweens.add({
      targets: title,
      alpha: { from: 0.7, to: 1.0 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
    });

    // Sous-titre
    const subtitle = this.add.text(cx, cy - 30, "Cercle I — Luxure", {
      fontFamily: "Georgia, serif",
      fontSize: "18px",
      color: "#a87a3a",
      fontStyle: "italic",
    });
    subtitle.setOrigin(0.5);

    // Indication de tap
    const tapText = this.add.text(cx, cy + 80, "Touche l'écran pour commencer", {
      fontFamily: "Georgia, serif",
      fontSize: "16px",
      color: "#8a6a40",
      fontStyle: "italic",
    });
    tapText.setOrigin(0.5);
    this.tweens.add({
      targets: tapText,
      alpha: { from: 0.4, to: 1 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
    });

    // Petite description
    this.add.text(cx, cy + 160,
      "Tu vis. Tu meurs.\nTu es jugé(e) aux Enfers.",
      {
        fontFamily: "Georgia, serif",
        fontSize: "14px",
        color: "#6a5030",
        fontStyle: "italic",
        align: "center",
      }
    ).setOrigin(0.5);

    // Toggle audio en haut-droite (icône note)
    this.createAudioToggle();

    // Click handler global - mais évite la zone du toggle audio
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      // Si on tape près du toggle audio (top-right), ignorer
      if (p.x > GAME_WIDTH - 60 && p.y < 60) return;
      audio.playPhase("ambient");
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("Life");
      });
    });
  }

  private createAudioToggle(): void {
    const x = GAME_WIDTH - 30;
    const y = 30;
    const c = this.add.container(x, y);
    c.setDepth(1000);

    const bg = this.add.circle(0, 0, 22, 0x2a1810, 0.9);
    bg.setStrokeStyle(2, 0xd4a040);
    c.add(bg);

    const icon = this.add.text(0, 0, audio.enabled ? "🔊" : "🔇", {
      fontSize: "20px",
    }).setOrigin(0.5);
    c.add(icon);

    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerdown", () => {
      const enabled = audio.toggle();
      icon.setText(enabled ? "🔊" : "🔇");
      if (enabled) audio.playPhase("ambient");
    });
  }

  private createCandle(x: number, y: number): void {
    // Halo
    const halo = this.add.graphics();
    halo.fillStyle(0xffaa44, 0.3);
    halo.fillCircle(x, y, 70);
    halo.fillStyle(0xffcc77, 0.2);
    halo.fillCircle(x, y, 40);

    // Flamme (cercle qui pulse)
    const flame = this.add.circle(x, y, 5, 0xffd870);
    this.tweens.add({
      targets: flame,
      scale: { from: 0.9, to: 1.3 },
      alpha: { from: 0.85, to: 1 },
      duration: 600 + Math.random() * 400,
      yoyo: true,
      repeat: -1,
    });
  }
}
