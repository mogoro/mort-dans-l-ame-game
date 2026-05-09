import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../main";
import { GameState, recordDeathFromEvent, snapshotRun } from "../systems/GameState";
import { Settings } from "../systems/Settings";
import { recordRunResult, computeScore, clearCurrentRun, loadAchievements, saveCurrentRun } from "../systems/SaveSystem";
import { unlockRelic } from "../systems/Relics";
import { audio } from "../systems/AudioSystem";
import { awardGold, addDebt } from "../systems/Economy";
import { unlockCodexPage } from "../systems/Codex";
import { logRun, isTelemetryOptin } from "../systems/Telemetry";
import { CIRCLES } from "../data/circles";
import { pickNPCForCircle } from "./NPCInterstitialScene";

export class OutcomeScene extends Phaser.Scene {
  constructor() { super("Outcome"); }

  create(): void {
    this.cameras.main.fadeIn(800, 0, 0, 0);
    const isVictory = GameState.outcome === "victory";
    const stats = GameState.combatStats || { turns: 1, cardsSacrificed: 0, axesRemaining: 0 };
    const circleIdx = GameState.currentCircle;
    const isLastCircle = circleIdx >= CIRCLES.length - 1;

    const score = computeScore({
      victory: isVictory,
      turnsUsed: stats.turns,
      cardsSacrificed: stats.cardsSacrificed,
      axesRemaining: stats.axesRemaining,
      difficulty: Settings.difficulty,
    });

    // E.1 — gain or sur victoire
    let goldGained = 0;
    if (isVictory) {
      goldGained = awardGold(circleIdx, true);
    }

    // A.3 — défaite : crée une dette
    if (!isVictory) {
      addDebt(`Défaite au cercle ${circleIdx + 1}`, "extra_enemy");
      // Mark une mort pour l'event qui t'y a mené (C.5 mort permanente)
      const lastChoice = GameState.persistentChoices[GameState.persistentChoices.length - 1];
      if (lastChoice) recordDeathFromEvent(lastChoice.eventCode);
    }

    // C.2 — débloque reliques selon achievements
    const achievements = loadAchievements();
    achievements.forEach((a) => {
      if (a.unlocked) unlockRelic(a.id);
    });

    // H.1 — telemetry
    if (isTelemetryOptin()) {
      logRun({
        ts: Date.now(),
        duration: stats.turns * 10,
        result: isVictory ? "victory" : "defeat",
        cardsPlayed: (GameState as any).lastCombatCards || [],
        cardsWonWith: isVictory ? (GameState as any).lastCombatCards || [] : [],
        choices: GameState.persistentChoices.map((c) => ({ event: c.eventCode, option: c.optionIndex })),
        finalProfile: { ...GameState.profile },
        ending: GameState.ending,
        difficulty: Settings.difficulty,
      });
    }

    // Si défaite ou dernier cercle gagné → run finale
    const isRunOver = !isVictory || isLastCircle;
    if (isRunOver) {
      recordRunResult(GameState.outcome!, GameState.profile, score);
      clearCurrentRun();
      // Page codex aussi en défaite (la défaite est un récit, pas un échec)
      if (!isVictory) unlockCodexPage(null);
    } else {
      // Page codex intermédiaire pour cercle gagné
      unlockCodexPage(null);
      // Save : on est sur Outcome, le user peut quitter ici
      saveCurrentRun(snapshotRun("Outcome"));
    }

    audio.playPhase(isVictory ? "victory" : "defeat");

    const bg = this.add.graphics();
    if (isVictory) {
      bg.fillGradientStyle(0x2a0a08, 0x2a0a08, 0x4a1a10, 0x4a1a10, 1);
    } else {
      bg.fillGradientStyle(0x1a0508, 0x1a0508, 0x3a0a14, 0x3a0a14, 1);
    }
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const cx = GAME_WIDTH / 2;
    const circleDef = CIRCLES[circleIdx];
    const titleStr = isVictory
      ? (isLastCircle ? "TU REMONTES" : `CERCLE ${circleIdx + 1} VAINCU`)
      : "TU CHUTES";

    const title = this.add.text(cx, 130, titleStr, {
      fontFamily: "Georgia, serif", fontSize: "32px",
      color: isVictory ? "#d4a040" : "#c83838",
      fontStyle: "bold", stroke: "#000000", strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, duration: 1500 });

    const msgText = isVictory
      ? (isLastCircle
          ? "Tu as franchi les sept cercles."
          : `Tu as vaincu ${circleDef?.bossName || "le boss"}.\nLe ${circleIdx + 2}e cercle t'attend.`)
      : `${circleDef?.bossName || "Le boss"} te garde.\nLe procès continue.`;

    const msg = this.add.text(cx, 200, msgText, {
      fontFamily: "Georgia, serif", fontSize: "15px",
      color: "#a87a3a", fontStyle: "italic", align: "center",
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: msg, alpha: 1, duration: 1500, delay: 500 });

    let y = 320;
    const statLines: Array<[string, string | number]> = [
      ["Tours utilisés", stats.turns],
      ["Cartes sacrifiées", stats.cardsSacrificed],
      ["Âme restante", stats.axesRemaining],
      ["Or gagné", goldGained],
      ["Difficulté", Settings.difficulty + (Settings.pacifist ? " · pacifique" : "")],
    ];
    statLines.forEach(([label, val], i) => {
      const t1 = this.add.text(cx - 100, y + i * 22, String(label), {
        fontFamily: "Georgia, serif", fontSize: "13px", color: "#a87a3a",
      }).setAlpha(0);
      const t2 = this.add.text(cx + 100, y + i * 22, String(val), {
        fontFamily: "monospace", fontSize: "14px",
        color: "#f0d8b0", fontStyle: "bold",
      }).setOrigin(1, 0).setAlpha(0);
      this.tweens.add({ targets: [t1, t2], alpha: 1, duration: 500, delay: 1500 + i * 200 });
    });

    y = 460;
    const scoreLabel = this.add.text(cx, y, "SCORE", {
      fontFamily: "Georgia, serif", fontSize: "12px",
      color: "#806040", fontStyle: "italic",
    }).setOrigin(0.5).setAlpha(0);
    const scoreText = this.add.text(cx, y + 24, "0", {
      fontFamily: "monospace", fontSize: "44px",
      color: isVictory ? "#d4a040" : "#a87a3a", fontStyle: "bold",
      stroke: "#000000", strokeThickness: 3,
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: [scoreLabel, scoreText], alpha: 1, duration: 800, delay: 2400 });

    let displayScore = 0;
    this.time.addEvent({
      delay: 30, repeat: 50,
      callback: () => {
        displayScore = Math.min(score, displayScore + Math.ceil(score / 50));
        scoreText.setText(String(displayScore));
      },
    });

    // Boutons
    const btnY = 580;
    if (isRunOver) {
      // Run terminée → Ending screen
      this.createButton(cx, btnY, isVictory ? "Verdict final →" : "Verdict →", () => {
        this.cameras.main.fadeOut(800, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("Ending"));
      }, isVictory ? 0xa07020 : 0x6a3018);
    } else {
      // Cercle suivant via Repos ou Marché — PNJ peut apparaître entre les deux
      this.createButton(cx - 100, btnY, "Repos", () => {
        GameState.currentCircle++;
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => this.maybeNPCThen("Rest"));
      }, 0x4a3018);
      this.createButton(cx + 100, btnY, "Marché", () => {
        GameState.currentCircle++;
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => this.maybeNPCThen("Market"));
      }, 0x6a3018);
    }

    // Profil final (top 3)
    const sortedAxes = (Object.entries(GameState.profile) as [string, number][])
      .sort((a, b) => Math.abs(b[1] - 50) - Math.abs(a[1] - 50))
      .slice(0, 3);
    y = 660;
    this.add.text(cx, y, "Ce que tu es devenu", {
      fontFamily: "Georgia, serif", fontSize: "11px",
      color: "#806040", fontStyle: "italic",
    }).setOrigin(0.5);
    sortedAxes.forEach(([axis, val], i) => {
      this.add.text(cx, y + 22 + i * 18, `${axis}  ${val}`, {
        fontFamily: "monospace", fontSize: "11px", color: "#a87a3a",
      }).setOrigin(0.5);
    });
  }

  // F.10 — PNJ peut apparaître entre 2 cercles
  private maybeNPCThen(fallback: string): void {
    const npcId = pickNPCForCircle(GameState.currentCircle);
    if (npcId) {
      this.scene.start("NPCInterstitial", { npcId });
    } else {
      this.scene.start(fallback);
    }
  }

  private createButton(x: number, y: number, label: string, onClick: () => void, color = 0x6a3018): void {
    const c = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 160, 44, color);
    bg.setStrokeStyle(2, 0xd4a040);
    c.add(bg);
    c.add(this.add.text(0, 0, label, {
      fontFamily: "Georgia, serif", fontSize: "14px",
      color: "#f0d8b0", fontStyle: "bold",
    }).setOrigin(0.5));
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerover", () => bg.setFillStyle(color + 0x202020));
    bg.on("pointerout", () => bg.setFillStyle(color));
    bg.on("pointerdown", () => {
      this.tweens.add({ targets: c, scale: 0.95, duration: 80, yoyo: true, onComplete: onClick });
    });
  }
}
