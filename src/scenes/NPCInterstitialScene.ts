// F.10 — PNJ apparaît entre cercles selon relation
// (Marc, Sarah, Père) qui te visitent dans les Enfers
import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../main";
import { GameState, type NPC } from "../systems/GameState";
import { audio } from "../systems/AudioSystem";
import type { Axis } from "../data/events";

interface NPCDialog {
  conditionRelation: "high" | "low" | "neutral" | "dead";
  message: string;
  giftType?: "axis_boost" | "heal" | "gold" | "nothing";
  giftValue?: number;
  giftAxis?: Axis;
}

const DIALOGS: Record<string, NPCDialog[]> = {
  marc: [
    { conditionRelation: "high",
      message: "« Marc apparaît. Il te tend la main. \"Je sais que tu es passé par là pour moi à 7 ans. Je n'ai pas oublié.\" »",
      giftType: "axis_boost", giftAxis: "Charite", giftValue: 10 },
    { conditionRelation: "low",
      message: "« Marc apparaît. Il te regarde sans rien dire. Il s'éloigne. »",
      giftType: "nothing" },
    { conditionRelation: "dead",
      message: "« L'ombre de Marc te traverse sans te voir. Il y a longtemps qu'il n'est plus. »",
      giftType: "axis_boost", giftAxis: "Foi", giftValue: -5 },
    { conditionRelation: "neutral",
      message: "« Marc apparaît, distant. \"On ne s'est pas vraiment connus, hein.\" »",
      giftType: "gold", giftValue: 5 },
  ],
  sarah: [
    { conditionRelation: "high",
      message: "« Sarah apparaît, lumineuse. \"Le secret est resté entre nous. Tout ce temps.\" Elle te bénit. »",
      giftType: "heal", giftValue: 15 },
    { conditionRelation: "low",
      message: "« Sarah apparaît. Elle pleure encore. Elle disparaît. »",
      giftType: "axis_boost", giftAxis: "Foi", giftValue: -5 },
    { conditionRelation: "dead",
      message: "« Sarah ne vient pas. Elle est ailleurs. Tu n'as jamais su où. »",
      giftType: "nothing" },
    { conditionRelation: "neutral",
      message: "« Sarah passe. Elle te salue à peine. »",
      giftType: "gold", giftValue: 3 },
  ],
  pere: [
    { conditionRelation: "high",
      message: "« Ton père apparaît, plus jeune. \"Je suis fier de toi.\" Tu n'avais jamais entendu ces mots. »",
      giftType: "axis_boost", giftAxis: "Force", giftValue: 12 },
    { conditionRelation: "low",
      message: "« Ton père apparaît, dur. \"Tu n'as jamais voulu écouter.\" Il s'en va. »",
      giftType: "axis_boost", giftAxis: "Colere", giftValue: 8 },
    { conditionRelation: "dead",
      message: "« Ton père est absent. Comme toujours. »",
      giftType: "nothing" },
    { conditionRelation: "neutral",
      message: "« Ton père apparaît, indifférent. \"Tu es quoi, déjà ?\" »",
      giftType: "axis_boost", giftAxis: "Charite", giftValue: -5 },
  ],
};

const NPC_EMOJI: Record<string, string> = {
  marc: "🧒",
  sarah: "👧",
  pere: "👨",
};

export class NPCInterstitialScene extends Phaser.Scene {
  private npc!: NPC;
  private dialog!: NPCDialog;

  constructor() { super("NPCInterstitial"); }

  create(data?: { npcId?: string }): void {
    const npcId = data?.npcId;
    if (!npcId) {
      this.scene.start("Market");
      return;
    }
    const npc = GameState.npcs.find((n) => n.id === npcId);
    if (!npc) {
      this.scene.start("Market");
      return;
    }
    this.npc = npc;
    this.dialog = this.pickDialog(npc);
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.renderScene();
  }

  private pickDialog(npc: NPC): NPCDialog {
    const dialogs = DIALOGS[npc.id];
    if (!dialogs) return { conditionRelation: "neutral", message: "..." };
    let condition: NPCDialog["conditionRelation"];
    if (!npc.alive) condition = "dead";
    else if (npc.relation > 30) condition = "high";
    else if (npc.relation < -20) condition = "low";
    else condition = "neutral";
    return dialogs.find((d) => d.conditionRelation === condition) || dialogs[0];
  }

  private renderScene(): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a14, 0x0a0a14, 0x1a1428, 0x1a1428, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Vignette
    this.add.text(GAME_WIDTH / 2, 80, `— ${this.npc.name.toUpperCase()} —`, {
      fontFamily: "Georgia, serif", fontSize: "20px",
      color: "#d4a040", fontStyle: "italic",
    }).setOrigin(0.5);

    // Avatar PNJ
    const avatar = this.add.text(GAME_WIDTH / 2, 220, NPC_EMOJI[this.npc.id] || "👤", {
      fontSize: "120px",
    }).setOrigin(0.5);
    avatar.setAlpha(0);
    this.tweens.add({ targets: avatar, alpha: 1, duration: 1500 });

    // Halo
    const halo = this.add.graphics();
    halo.fillStyle(0xa080d0, 0.3);
    halo.fillCircle(GAME_WIDTH / 2, 220, 100);
    this.tweens.add({
      targets: halo, alpha: { from: 0.2, to: 0.5 },
      duration: 1500, yoyo: true, repeat: -1,
    });

    // Relation badge
    const relText = this.npc.alive
      ? `Relation : ${this.npc.relation > 0 ? "+" : ""}${this.npc.relation}`
      : "Disparu(e)";
    this.add.text(GAME_WIDTH / 2, 320, relText, {
      fontFamily: "monospace", fontSize: "14px",
      color: this.npc.alive ? (this.npc.relation > 0 ? "#88e0a0" : "#e08080") : "#666666",
    }).setOrigin(0.5);

    // Message
    const msg = this.add.text(GAME_WIDTH / 2, 420, this.dialog.message, {
      fontFamily: "Georgia, serif", fontSize: "16px",
      color: "#f0d8b0", fontStyle: "italic",
      align: "center", wordWrap: { width: GAME_WIDTH - 60 },
    }).setOrigin(0.5);
    msg.setAlpha(0);
    this.tweens.add({ targets: msg, alpha: 1, duration: 1500, delay: 1500 });

    // Apply gift
    let giftLabel = "";
    if (this.dialog.giftType === "axis_boost" && this.dialog.giftAxis) {
      const axis = this.dialog.giftAxis;
      const v = this.dialog.giftValue || 0;
      GameState.profile[axis] = Math.max(0, Math.min(100, GameState.profile[axis] + v));
      giftLabel = `${axis} ${v > 0 ? "+" : ""}${v}`;
    } else if (this.dialog.giftType === "gold") {
      const v = this.dialog.giftValue || 0;
      GameState.gold += v;
      giftLabel = `+${v} or`;
    } else if (this.dialog.giftType === "heal") {
      const v = this.dialog.giftValue || 0;
      (GameState as any).nextHpHeal = ((GameState as any).nextHpHeal || 0) + (v / 30);
      giftLabel = `+${v} HP au prochain combat`;
    }

    if (giftLabel) {
      const giftT = this.add.text(GAME_WIDTH / 2, 540, giftLabel, {
        fontFamily: "monospace", fontSize: "18px",
        color: "#ffd870", fontStyle: "bold",
      }).setOrigin(0.5);
      giftT.setAlpha(0);
      this.tweens.add({ targets: giftT, alpha: 1, duration: 1000, delay: 3000 });
    }

    // Bouton continuer
    const btn = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 80);
    const bgB = this.add.rectangle(0, 0, 200, 44, 0x2a1810);
    bgB.setStrokeStyle(2, 0x88a040);
    btn.add(bgB);
    btn.add(this.add.text(0, 0, "Continuer", {
      fontFamily: "Georgia, serif", fontSize: "16px",
      color: "#88a040", fontStyle: "italic",
    }).setOrigin(0.5));
    btn.setAlpha(0);
    this.tweens.add({ targets: btn, alpha: 1, duration: 800, delay: 4000 });
    bgB.setInteractive({ useHandCursor: true });
    bgB.on("pointerdown", () => {
      audio.sfx("click");
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("Market"));
    });
  }
}

// Helper : choisit un PNJ pertinent pour ce cercle (le plus en lien avec le combat à venir)
export function pickNPCForCircle(circleIdx: number): string | null {
  const npcs = GameState.npcs;
  if (npcs.length === 0) return null;
  // 30% chance d'apparition
  if (Math.random() > 0.3) return null;
  // Préférer ceux avec relation marquée (positive ou négative)
  const sorted = [...npcs].sort((a, b) => Math.abs(b.relation) - Math.abs(a.relation));
  // 1 par run max — vérifier circlePnjs
  const already = GameState.circlePnjs.map((p) => p.name);
  const candidate = sorted.find((n) => !already.includes(n.name));
  if (!candidate) return null;
  GameState.circlePnjs.push({
    circleId: circleIdx,
    name: candidate.name,
    relation: candidate.relation > 30 ? "proche" : candidate.relation < -20 ? "ennemi" : "lointain",
    message: "",
  });
  return candidate.id;
}
