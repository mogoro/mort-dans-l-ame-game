// A.10 — 4 fins narratives + F.6 lettre de fin générée
import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../main";
import { GameState, computeEnding, type Ending, incrementNGPlus, persistJudgeMemory } from "../systems/GameState";
import { unlockCodexPage } from "../systems/Codex";
import { recordChoiceTag } from "../systems/Judge";
import { awardTalentPoint } from "../systems/Talents";
import { audio } from "../systems/AudioSystem";

const ENDING_DESCRIPTIONS: Record<Ending, { title: string; body: string; color: string }> = {
  Saint: {
    title: "LE SAINT",
    body: "Tu as franchi les sept cercles. La lumière t'a précédé partout. On dit de toi que tu n'as pas vraiment vécu — tu as toujours déjà été ailleurs.\n\nTu reposes. Mais l'orgueil, lui, n'a jamais dormi.",
    color: "#f0d878",
  },
  Damne: {
    title: "LE DAMNÉ",
    body: "Tu as franchi les sept cercles, mais ils sont restés en toi. Chaque cercle t'a reconnu. Tu n'as pas combattu — tu es rentré chez toi.\n\nTu reposes. Et le repos, ici, est sans fin.",
    color: "#ff4040",
  },
  Rebelle: {
    title: "LE REBELLE",
    body: "Tu n'as ni cherché la lumière ni accepté l'ombre. Tu as résisté. Tu as fait ton chemin.\n\nTu reposes. Mais on n'est pas sûr que tu sois en paix.",
    color: "#a080d0",
  },
  Tiede: {
    title: "LE TIÈDE",
    body: "Tu n'as choisi aucun excès. Tu as tenu la route, sans grandeur. La balance était ton outil, et tu as su l'utiliser.\n\nTu reposes. Personne ne se souviendra. Ce sera bien.",
    color: "#a87a3a",
  },
};

export class EndingScene extends Phaser.Scene {
  constructor() { super("Ending"); }

  create(): void {
    this.cameras.main.fadeIn(2000, 0, 0, 0);

    const ending = computeEnding();
    GameState.ending = ending;
    GameState.judgeMemory.lastEnding = ending;
    GameState.judgeMemory.totalRuns++;
    persistJudgeMemory();
    recordChoiceTag(`ending:${ending}`);

    // C.1 — débloque page codex
    const page = unlockCodexPage(ending);

    // C.3 — gain 1 point talent par victoire
    if (GameState.outcome === "victory") {
      awardTalentPoint();
    }

    audio.playPhase("life");

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x000000, 0x000000, 0x1a0a06, 0x1a0a06, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const def = ENDING_DESCRIPTIONS[ending];
    const title = this.add.text(GAME_WIDTH / 2, 120, def.title, {
      fontFamily: "Georgia, serif", fontSize: "40px",
      color: def.color, fontStyle: "bold italic",
    }).setOrigin(0.5);
    title.setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, duration: 2000 });

    const body = this.add.text(GAME_WIDTH / 2, 280, def.body, {
      fontFamily: "Georgia, serif", fontSize: "14px",
      color: "#f0d8b0", fontStyle: "italic",
      align: "center", wordWrap: { width: GAME_WIDTH - 60 },
    }).setOrigin(0.5);
    body.setAlpha(0);
    this.tweens.add({ targets: body, alpha: 1, duration: 2500, delay: 1500 });

    // F.6 — lettre auto-générée
    const letter = this.generateLetter(ending);
    const letterT = this.add.text(GAME_WIDTH / 2, 540, letter, {
      fontFamily: "Georgia, serif", fontSize: "12px",
      color: "#a87a3a", fontStyle: "italic",
      align: "center", wordWrap: { width: GAME_WIDTH - 80 },
    }).setOrigin(0.5);
    letterT.setAlpha(0);
    this.tweens.add({ targets: letterT, alpha: 1, duration: 2500, delay: 3500 });

    if (page) {
      const codexHint = this.add.text(GAME_WIDTH / 2, 720, `+ Page ${page.id + 1} dans le Codex`, {
        fontFamily: "Georgia, serif", fontSize: "11px",
        color: "#88e0a0", fontStyle: "italic",
      }).setOrigin(0.5);
      codexHint.setAlpha(0);
      this.tweens.add({ targets: codexHint, alpha: 1, duration: 1500, delay: 5000 });
    }

    // C.4 — bouton NG+
    const ngBtn = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 100);
    const bgB = this.add.rectangle(0, 0, 240, 50, 0x2a1810);
    bgB.setStrokeStyle(2, 0x88a040);
    ngBtn.add(bgB);
    ngBtn.add(this.add.text(0, 0, `NG+ (cycle ${GameState.ngPlus + 1})`, {
      fontFamily: "Georgia, serif", fontSize: "14px",
      color: "#88a040", fontStyle: "italic",
    }).setOrigin(0.5));
    ngBtn.setAlpha(0);
    this.tweens.add({ targets: ngBtn, alpha: 1, duration: 1000, delay: 6000 });
    bgB.setInteractive({ useHandCursor: true });
    bgB.on("pointerdown", () => {
      incrementNGPlus();
      audio.sfx("click");
      this.cameras.main.fadeOut(800, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("Boot"));
    });

    const back = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 40);
    const bgC = this.add.rectangle(0, 0, 200, 36, 0x2a1810);
    bgC.setStrokeStyle(1, 0x666666);
    back.add(bgC);
    back.add(this.add.text(0, 0, "Retour menu", {
      fontFamily: "Georgia, serif", fontSize: "11px",
      color: "#a0a0a0", fontStyle: "italic",
    }).setOrigin(0.5));
    back.setAlpha(0);
    this.tweens.add({ targets: back, alpha: 1, duration: 1000, delay: 6500 });
    bgC.setInteractive({ useHandCursor: true });
    bgC.on("pointerdown", () => {
      audio.sfx("click");
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("Boot"));
    });
  }

  // F.6 — lettre générée selon profil
  private generateLetter(ending: Ending): string {
    const profile = GameState.profile;
    const top3 = (Object.entries(profile) as [string, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    const bottom = (Object.entries(profile) as [string, number][])
      .sort((a, b) => a[1] - b[1])
      .slice(0, 1)[0];

    const choices = GameState.persistentChoices;
    const memos: string[] = [];
    if (choices.find((c) => c.tag === "honnete-enf")) memos.push("À 7 ans, tu as choisi la vérité.");
    if (choices.find((c) => c.tag === "menteur-enf")) memos.push("Le premier mensonge n'a jamais été le dernier.");
    if (choices.find((c) => c.tag === "courage-enf")) memos.push("Tu as su, jeune, ce qu'il fallait défendre.");
    if (choices.find((c) => c.tag === "tricheur")) memos.push("Tu as triché. Tu y as repensé toute ta vie.");
    if (choices.find((c) => c.tag === "trahisseur")) memos.push("Tu as trahi quelqu'un que tu aimais.");
    if (choices.find((c) => c.tag === "saboteur")) memos.push("Tu as obtenu en marchant sur les autres.");
    if (choices.find((c) => c.tag === "fidele-enf")) memos.push("Tu as gardé un secret. Toute ta vie.");

    const memoBlock = memos.length > 0 ? memos.join(" ") + " " : "";
    return `${memoBlock}Tu portais surtout ${top3[0][0]}, ${top3[1][0]} et ${top3[2][0]}. Tu as toujours manqué de ${bottom[0]}. C'est cela qu'on a écrit sur ta pierre.`;
  }
}
