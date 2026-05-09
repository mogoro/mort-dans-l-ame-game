import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { LifeScene } from "./scenes/LifeScene";
import { DeckRevealScene } from "./scenes/DeckRevealScene";
import { CombatScene } from "./scenes/CombatScene";
import { OutcomeScene } from "./scenes/OutcomeScene";

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
  scene: [BootScene, LifeScene, DeckRevealScene, CombatScene, OutcomeScene],
};

window.addEventListener("load", () => {
  new Phaser.Game(config);
  // Cacher le splash HTML
  setTimeout(() => {
    const el = document.getElementById("loading");
    if (el) el.style.display = "none";
  }, 600);
});

export { GAME_WIDTH, GAME_HEIGHT };
