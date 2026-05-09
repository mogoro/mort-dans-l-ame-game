import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { CharacterScene } from "./scenes/CharacterScene";
import { LifeScene } from "./scenes/LifeScene";
import { DeckRevealScene } from "./scenes/DeckRevealScene";
import { CombatScene } from "./scenes/CombatScene";
import { OutcomeScene } from "./scenes/OutcomeScene";
import { MenuScene } from "./scenes/MenuScene";

const GAME_WIDTH = 540;   // mobile portrait base width
const GAME_HEIGHT = 960;  // ratio 9:16

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
  scene: [BootScene, CharacterScene, LifeScene, DeckRevealScene, CombatScene, OutcomeScene, MenuScene],
};

window.addEventListener("load", () => {
  new Phaser.Game(config);
  setTimeout(() => {
    const el = document.getElementById("loading");
    if (el) el.style.display = "none";
  }, 600);

  // 6.1 Wake lock - empêcher l'écran de s'éteindre
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

  // 6.5 Bouton retour Android - empêche fermeture si dans le jeu
  window.addEventListener("popstate", (e) => {
    e.preventDefault();
  });

  // Push initial state pour qu'il y ait quelque chose à pop
  history.pushState(null, "", window.location.href);
});

// 9.6 Auto-pause quand app en background
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    // Phaser pause auto via Page Visibility API normalement
  }
});

export { GAME_WIDTH, GAME_HEIGHT };
