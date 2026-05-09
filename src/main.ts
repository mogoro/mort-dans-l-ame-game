import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { CharacterScene } from "./scenes/CharacterScene";
import { LifeScene } from "./scenes/LifeScene";
import { DeckRevealScene } from "./scenes/DeckRevealScene";
import { CombatScene } from "./scenes/CombatScene";
import { OutcomeScene } from "./scenes/OutcomeScene";
import { MenuScene } from "./scenes/MenuScene";
import { MarketScene } from "./scenes/MarketScene";
import { RestScene } from "./scenes/RestScene";
import { CodexScene } from "./scenes/CodexScene";
import { TalentScene } from "./scenes/TalentScene";
import { LetterScene } from "./scenes/LetterScene";
import { EndingScene } from "./scenes/EndingScene";
import { ImprintScene } from "./scenes/ImprintScene";
import { PacteConteurScene } from "./scenes/PacteConteurScene";
import { NPCInterstitialScene } from "./scenes/NPCInterstitialScene";

const GAME_WIDTH = 540;
const GAME_HEIGHT = 960;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-container",
  backgroundColor: "#1a0a06",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  pixelArt: true,
  roundPixels: true,
  scene: [
    BootScene, CharacterScene, LifeScene, DeckRevealScene,
    CombatScene, OutcomeScene, MenuScene,
    MarketScene, RestScene, CodexScene, TalentScene,
    LetterScene, EndingScene, ImprintScene, PacteConteurScene,
    NPCInterstitialScene,
  ],
};

window.addEventListener("load", () => {
  new Phaser.Game(config);
  setTimeout(() => {
    const el = document.getElementById("loading");
    if (el) el.style.display = "none";
  }, 600);

  if ("wakeLock" in navigator) {
    let wakeLock: any = null;
    const acquire = async () => {
      try { wakeLock = await (navigator as any).wakeLock.request("screen"); } catch (e) {}
    };
    acquire();
    document.addEventListener("visibilitychange", () => {
      if (wakeLock !== null && document.visibilityState === "visible") acquire();
    });
  }

  window.addEventListener("popstate", (e) => {
    e.preventDefault();
  });

  history.pushState(null, "", window.location.href);
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    // Phaser pause auto via Page Visibility API normalement
  }
});

export { GAME_WIDTH, GAME_HEIGHT };
