// Vignettes pixel-art animées pour les événements de Phase Vie.
// Chaque scène est composée en Phaser Graphics (pixels primitifs) + emojis
// pour évoquer le contexte. Animations subtiles via tweens (sway, pulse, particles).

import Phaser from "phaser";

export type IllustrationKind =
  | "playground" | "home" | "school" | "party"
  | "hospital" | "office" | "road" | "bedroom"
  | "wedding" | "funeral";

// Mapping event code -> illustration kind
const EVENT_ILLUSTRATIONS: Record<string, IllustrationKind> = {
  // ENF
  "ENF-01": "home",
  "ENF-02": "playground",
  "ENF-03": "hospital",
  "ENF-04": "home",
  "ENF-05": "funeral",
  "ENF-06": "road",
  "ENF-07": "home",
  "ENF-08": "school",
  "ENF-09": "school",
  "ENF-10": "road",
  // ADO
  "ADO-01": "bedroom",
  "ADO-02": "party",
  "ADO-03": "school",
  "ADO-04": "school",
  "ADO-05": "home",
  "ADO-06": "bedroom",
  "ADO-07": "school",
  "ADO-08": "party",
  "ADO-09": "home",
  "ADO-10": "school",
  // ADU
  "ADU-01": "bedroom",
  "ADU-02": "office",
  "ADU-03": "office",
  "ADU-04": "bedroom",
  "ADU-05": "school",
  "ADU-06": "hospital",
  "ADU-07": "home",
  "ADU-08": "office",
  "ADU-09": "office",
  "ADU-10": "road",
};

export function getIllustrationKind(code: string): IllustrationKind {
  return EVENT_ILLUSTRATIONS[code] || "home";
}

/**
 * Dessine la vignette dans le container, taille (w x h).
 * Lance les animations.
 */
export function drawIllustration(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  kind: IllustrationKind,
  w: number,
  h: number
): void {
  // Cadre arrière
  const frame = scene.add.rectangle(0, 0, w, h, 0x0a0608);
  frame.setStrokeStyle(2, 0x8a5018);
  container.add(frame);

  switch (kind) {
    case "playground": drawPlayground(scene, container, w, h); break;
    case "home":       drawHome(scene, container, w, h); break;
    case "school":     drawSchool(scene, container, w, h); break;
    case "party":      drawParty(scene, container, w, h); break;
    case "hospital":   drawHospital(scene, container, w, h); break;
    case "office":     drawOffice(scene, container, w, h); break;
    case "road":       drawRoad(scene, container, w, h); break;
    case "bedroom":    drawBedroom(scene, container, w, h); break;
    case "funeral":    drawFuneral(scene, container, w, h); break;
    default:           drawHome(scene, container, w, h);
  }

  // Coins dorés ornés
  const orn = scene.add.graphics();
  orn.lineStyle(1, 0xd4a040, 0.7);
  [-1, 1].forEach((sx) => [-1, 1].forEach((sy) => {
    const cx = sx * (w / 2 - 4);
    const cy = sy * (h / 2 - 4);
    orn.lineBetween(cx, cy + sy * 8, cx, cy);
    orn.lineBetween(cx, cy, cx + sx * 8, cy);
  }));
  container.add(orn);
}

// ============== Helpers ==============

function pixel(scene: Phaser.Scene, container: Phaser.GameObjects.Container, x: number, y: number, color: number, size = 3): Phaser.GameObjects.Rectangle {
  const r = scene.add.rectangle(x, y, size, size, color);
  container.add(r);
  return r;
}

function tinyHuman(scene: Phaser.Scene, container: Phaser.GameObjects.Container, x: number, y: number, hairColor = 0x5c3a1f, skinColor = 0xecad80, shirtColor = 0xc83838): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  // Tête
  c.add(scene.add.rectangle(0, -8, 8, 8, skinColor));
  // Cheveux top
  c.add(scene.add.rectangle(0, -12, 8, 3, hairColor));
  // Yeux (pixels)
  c.add(scene.add.rectangle(-2, -8, 1, 1, 0x000000));
  c.add(scene.add.rectangle(2, -8, 1, 1, 0x000000));
  // Corps
  c.add(scene.add.rectangle(0, 2, 10, 10, shirtColor));
  // Jambes
  c.add(scene.add.rectangle(-2, 11, 3, 6, 0x2a1f10));
  c.add(scene.add.rectangle(2, 11, 3, 6, 0x2a1f10));
  // Bras
  c.add(scene.add.rectangle(-6, 2, 2, 8, shirtColor));
  c.add(scene.add.rectangle(6, 2, 2, 8, shirtColor));
  container.add(c);
  return c;
}

function bounce(scene: Phaser.Scene, target: any, amp = 4, dur = 800): void {
  scene.tweens.add({
    targets: target, y: target.y - amp,
    duration: dur, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
  });
}

function sway(scene: Phaser.Scene, target: any, ang = 5, dur = 1200): void {
  scene.tweens.add({
    targets: target, angle: { from: -ang, to: ang },
    duration: dur, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
  });
}

// ============== Scènes ==============

function drawPlayground(scene: Phaser.Scene, container: Phaser.GameObjects.Container, w: number, h: number): void {
  // Sol gris
  container.add(scene.add.rectangle(0, h / 4, w, h / 2, 0x444444));
  // Lignes de bitume
  for (let x = -w / 2; x < w / 2; x += 18) {
    container.add(scene.add.rectangle(x, h / 4, 8, 1, 0x2a2a2a));
  }
  // Ciel
  container.add(scene.add.rectangle(0, -h / 4, w, h / 2, 0x4060a0));

  // Soleil
  const sun = scene.add.circle(w / 2 - 16, -h / 2 + 14, 6, 0xffd870);
  container.add(sun);
  bounce(scene, sun, 1.5, 1500);

  // 3 enfants en cercle
  const k1 = tinyHuman(scene, container, -25, -5, 0x5c3a1f, 0xecad80, 0x4080a0);
  const k2 = tinyHuman(scene, container, 0, 5, 0x1a1a1a, 0x8a5a3c, 0xc88040);
  const k3 = tinyHuman(scene, container, 25, -5, 0xb03030, 0xf5d3b3, 0x3a8050);

  bounce(scene, k1, 3, 700);
  bounce(scene, k2, 3, 900);
  bounce(scene, k3, 3, 800);

  // Ballon
  const ball = scene.add.circle(0, -10, 4, 0xc83838);
  container.add(ball);
  scene.tweens.add({
    targets: ball, y: { from: -10, to: -25 }, x: { from: -10, to: 10 },
    duration: 1100, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
  });
}

function drawHome(scene: Phaser.Scene, container: Phaser.GameObjects.Container, w: number, h: number): void {
  // Mur fond
  container.add(scene.add.rectangle(0, 0, w, h, 0x3a2a18));
  // Sol bois
  container.add(scene.add.rectangle(0, h / 3, w, h / 3, 0x2a1f10));
  for (let x = -w / 2; x < w / 2; x += 14) {
    container.add(scene.add.rectangle(x, h / 3, 1, h / 3, 0x1a0f06));
  }

  // Fenêtre carrée
  const win = scene.add.rectangle(-w / 3, -h / 4, 28, 28, 0x4080a0);
  win.setStrokeStyle(2, 0x6a4818);
  container.add(win);
  // Croix de fenêtre
  container.add(scene.add.rectangle(-w / 3, -h / 4, 28, 1, 0x6a4818));
  container.add(scene.add.rectangle(-w / 3, -h / 4, 1, 28, 0x6a4818));

  // Lampe suspendue
  const lamp = scene.add.circle(w / 4, -h / 3, 5, 0xffd870);
  container.add(scene.add.rectangle(w / 4, -h / 2 + 6, 1, 14, 0x6a4818));
  container.add(lamp);
  scene.tweens.add({
    targets: lamp, alpha: { from: 0.7, to: 1 },
    duration: 1300, yoyo: true, repeat: -1,
  });

  // Personnage debout au milieu
  tinyHuman(scene, container, 0, 5, 0x5c3a1f, 0xecad80, 0xa07020);

  // Petit objet (vase) à côté
  container.add(scene.add.rectangle(20, 14, 5, 8, 0x88582a));
}

function drawSchool(scene: Phaser.Scene, container: Phaser.GameObjects.Container, w: number, h: number): void {
  // Mur clair
  container.add(scene.add.rectangle(0, 0, w, h, 0x3a4a5a));
  // Tableau noir
  const board = scene.add.rectangle(0, -h / 3, w * 0.7, 30, 0x1a2a18);
  board.setStrokeStyle(2, 0x6a4818);
  container.add(board);
  // Craie
  container.add(scene.add.rectangle(-15, -h / 3, 14, 1, 0xfff5dc));
  container.add(scene.add.rectangle(-10, -h / 3 + 3, 8, 1, 0xfff5dc));
  container.add(scene.add.rectangle(8, -h / 3, 12, 1, 0xfff5dc));

  // 3 bureaux
  for (let i = -1; i <= 1; i++) {
    const x = i * 30;
    container.add(scene.add.rectangle(x, h / 4, 18, 6, 0x88582a));
    container.add(scene.add.rectangle(x - 7, h / 4 + 6, 2, 6, 0x88582a));
    container.add(scene.add.rectangle(x + 7, h / 4 + 6, 2, 6, 0x88582a));
    // Élève (tête vue de dos)
    const k = scene.add.circle(x, h / 4 - 8, 5, [0x5c3a1f, 0x1a1a1a, 0xb03030][i + 1]);
    container.add(k);
    bounce(scene, k, 1, 1000 + i * 200);
  }
}

function drawParty(scene: Phaser.Scene, container: Phaser.GameObjects.Container, w: number, h: number): void {
  // Fond sombre
  container.add(scene.add.rectangle(0, 0, w, h, 0x1a0a14));

  // Spots colorés en haut
  const spots = [
    { x: -w / 3, color: 0xc04080 },
    { x: 0,      color: 0x8a4ed0 },
    { x: w / 3,  color: 0x40c08a },
  ];
  spots.forEach((s) => {
    const beam = scene.add.triangle(s.x, -h / 2 + 18, 0, 0, -10, 30, 10, 30, s.color);
    beam.setAlpha(0.5);
    container.add(beam);
    scene.tweens.add({ targets: beam, angle: { from: -15, to: 15 }, duration: 1500 + Math.random() * 500, yoyo: true, repeat: -1 });
  });

  // 3 silhouettes qui dansent
  const dancers = [
    tinyHuman(scene, container, -25, 8, 0x1a1a1a, 0xc89070, 0xc04080),
    tinyHuman(scene, container, 0, 8, 0xb03030, 0xecad80, 0x8a4ed0),
    tinyHuman(scene, container, 25, 8, 0xe8c878, 0xf5d3b3, 0x40c08a),
  ];
  dancers.forEach((d, i) => {
    bounce(scene, d, 5, 500 + i * 100);
  });

  // Particules disco (petits points qui flottent)
  for (let i = 0; i < 6; i++) {
    const p = scene.add.circle(
      Phaser.Math.Between(-w / 2, w / 2),
      Phaser.Math.Between(-h / 2, h / 2),
      1.5,
      [0xffd870, 0xc04080, 0x8a4ed0][i % 3]
    );
    container.add(p);
    scene.tweens.add({
      targets: p, alpha: { from: 0.2, to: 1 },
      duration: 400 + i * 100, yoyo: true, repeat: -1,
    });
  }
}

function drawHospital(scene: Phaser.Scene, container: Phaser.GameObjects.Container, w: number, h: number): void {
  // Mur blanc
  container.add(scene.add.rectangle(0, 0, w, h, 0x4a5060));
  // Sol gris pale
  container.add(scene.add.rectangle(0, h / 3, w, h / 3, 0x6a7080));

  // Lit
  const bedY = h / 6;
  container.add(scene.add.rectangle(0, bedY, 80, 18, 0xfff5dc));
  container.add(scene.add.rectangle(-40, bedY, 4, 24, 0x444444));
  container.add(scene.add.rectangle(40, bedY, 4, 24, 0x444444));

  // Patient (tête sur oreiller)
  const patient = scene.add.circle(-30, bedY - 4, 6, 0xecad80);
  container.add(patient);
  // Oreiller
  container.add(scene.add.rectangle(-30, bedY - 10, 18, 4, 0xeeeeee));
  // Couverture
  const blanket = scene.add.rectangle(8, bedY - 2, 60, 12, 0x4080a0);
  container.add(blanket);
  scene.tweens.add({
    targets: blanket, scaleY: { from: 1, to: 0.9 },
    duration: 2200, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
  });

  // Croix
  container.add(scene.add.rectangle(w / 3, -h / 3, 4, 14, 0xc83838));
  container.add(scene.add.rectangle(w / 3, -h / 3, 14, 4, 0xc83838));

  // Goutte à goutte
  container.add(scene.add.rectangle(-w / 3, -h / 3 + 4, 2, 16, 0x444444));
  const drop = scene.add.circle(-w / 3, -h / 3 + 22, 1.5, 0x88c0e0);
  container.add(drop);
  scene.tweens.add({
    targets: drop, y: { from: -h / 3 + 22, to: -h / 3 + 28 }, alpha: { from: 1, to: 0 },
    duration: 700, repeat: -1,
  });
}

function drawOffice(scene: Phaser.Scene, container: Phaser.GameObjects.Container, w: number, h: number): void {
  // Mur
  container.add(scene.add.rectangle(0, 0, w, h, 0x2a2a30));
  // Sol moquette
  container.add(scene.add.rectangle(0, h / 3, w, h / 3, 0x4a4030));

  // Bureau
  container.add(scene.add.rectangle(0, h / 6, 70, 4, 0x1a0f06));
  container.add(scene.add.rectangle(-30, h / 4, 3, 14, 0x1a0f06));
  container.add(scene.add.rectangle(30, h / 4, 3, 14, 0x1a0f06));
  // Écran ordinateur
  const screen = scene.add.rectangle(0, h / 6 - 16, 28, 22, 0x4080a0);
  screen.setStrokeStyle(1, 0x6a4818);
  container.add(screen);
  // Sigle sur écran
  container.add(scene.add.rectangle(0, h / 6 - 16, 1, 12, 0xfff5dc));
  // Pieds écran
  container.add(scene.add.rectangle(0, h / 6 - 4, 6, 2, 0x444444));

  // Personnage assis (juste tête + épaules)
  container.add(scene.add.circle(0, h / 6 - 28, 6, 0xecad80));
  container.add(scene.add.rectangle(0, h / 6 - 22, 12, 4, 0x1a1a40));

  // Plante en pot
  const plant = scene.add.circle(w / 3, h / 4 - 6, 5, 0x408050);
  container.add(scene.add.rectangle(w / 3, h / 4, 6, 6, 0x88582a));
  container.add(plant);
  scene.tweens.add({
    targets: plant, scaleX: { from: 1, to: 1.1 },
    duration: 1800, yoyo: true, repeat: -1,
  });

  // Horloge
  container.add(scene.add.circle(-w / 3, -h / 3, 8, 0xfff5dc));
  const hand = scene.add.rectangle(-w / 3, -h / 3 - 3, 1, 6, 0x000000).setOrigin(0.5, 1);
  container.add(hand);
  scene.tweens.add({
    targets: hand, angle: 360, duration: 4000, repeat: -1,
  });
}

function drawRoad(scene: Phaser.Scene, container: Phaser.GameObjects.Container, w: number, h: number): void {
  // Ciel
  container.add(scene.add.rectangle(0, -h / 4, w, h / 2, 0x4060a0));
  // Sol/route
  container.add(scene.add.rectangle(0, h / 4, w, h / 2, 0x444444));
  // Lignes de route
  for (let x = -w / 2 + 10; x < w / 2; x += 20) {
    container.add(scene.add.rectangle(x, h / 4 + 4, 8, 2, 0xfff5dc));
  }

  // Arbres
  for (const ax of [-w / 2 + 22, w / 2 - 22]) {
    const trunk = scene.add.rectangle(ax, 0, 4, 16, 0x4a2810);
    const leaves = scene.add.circle(ax, -10, 8, 0x408050);
    container.add(trunk);
    container.add(leaves);
    sway(scene, leaves, 2, 1500);
  }

  // Personnage qui marche
  const walker = tinyHuman(scene, container, 0, 0, 0x5c3a1f, 0xecad80, 0xa07020);
  scene.tweens.add({
    targets: walker, y: { from: 0, to: -2 },
    duration: 350, yoyo: true, repeat: -1,
  });

  // Soleil
  const sun = scene.add.circle(w / 2 - 16, -h / 2 + 14, 6, 0xffd870);
  container.add(sun);
}

function drawBedroom(scene: Phaser.Scene, container: Phaser.GameObjects.Container, w: number, h: number): void {
  // Mur sombre violet
  container.add(scene.add.rectangle(0, 0, w, h, 0x2a1830));
  // Sol
  container.add(scene.add.rectangle(0, h / 3, w, h / 3, 0x1a0f1f));

  // Lit double
  container.add(scene.add.rectangle(0, h / 6, 80, 18, 0x4a3a3a));
  // Couverture
  const cover = scene.add.rectangle(0, h / 6 - 2, 70, 12, 0xa04088);
  container.add(cover);
  scene.tweens.add({
    targets: cover, alpha: { from: 0.85, to: 1 },
    duration: 1800, yoyo: true, repeat: -1,
  });
  // Oreillers
  container.add(scene.add.rectangle(-22, h / 6 - 8, 16, 4, 0xfff5dc));
  container.add(scene.add.rectangle(22, h / 6 - 8, 16, 4, 0xfff5dc));

  // Lampe de chevet
  container.add(scene.add.rectangle(-w / 3, 0, 4, 8, 0x88582a));
  const lamp = scene.add.circle(-w / 3, -6, 5, 0xffd870);
  container.add(lamp);
  scene.tweens.add({
    targets: lamp, alpha: { from: 0.7, to: 1 },
    duration: 1500, yoyo: true, repeat: -1,
  });

  // Tableau au mur (cœur)
  container.add(scene.add.text(w / 3, -h / 3, "💕", { fontSize: "18px" }).setOrigin(0.5));

  // Particules d'amour
  for (let i = 0; i < 4; i++) {
    const p = scene.add.text(
      Phaser.Math.Between(-w / 2 + 10, w / 2 - 10),
      Phaser.Math.Between(-h / 2, 0),
      "✨", { fontSize: "13px" }
    );
    container.add(p);
    scene.tweens.add({
      targets: p, alpha: { from: 0.3, to: 1 },
      duration: 600 + i * 150, yoyo: true, repeat: -1,
    });
  }
}

function drawFuneral(scene: Phaser.Scene, container: Phaser.GameObjects.Container, w: number, h: number): void {
  // Ciel gris
  container.add(scene.add.rectangle(0, -h / 4, w, h / 2, 0x202028));
  // Sol terre
  container.add(scene.add.rectangle(0, h / 4, w, h / 2, 0x2a1810));

  // Tombe (croix sombre)
  container.add(scene.add.rectangle(0, 4, 6, 28, 0x4a3018));
  container.add(scene.add.rectangle(0, -2, 22, 5, 0x4a3018));

  // Mound de terre
  container.add(scene.add.ellipse(0, h / 4 + 2, 60, 14, 0x4a2810));

  // 2 silhouettes en deuil
  const m1 = tinyHuman(scene, container, -20, h / 6, 0x1a1a1a, 0xecad80, 0x1a1a1a);
  const m2 = tinyHuman(scene, container, 22, h / 6, 0x888888, 0x8a5a3c, 0x1a1a1a);
  m1.setAlpha(0.85);
  m2.setAlpha(0.85);

  // Pluie subtle
  for (let i = 0; i < 8; i++) {
    const drop = scene.add.rectangle(
      Phaser.Math.Between(-w / 2, w / 2),
      Phaser.Math.Between(-h / 2, h / 2),
      1, 4, 0x6a8090
    );
    drop.setAlpha(0.5);
    container.add(drop);
    scene.tweens.add({
      targets: drop,
      y: drop.y + 30,
      duration: 800 + Math.random() * 400,
      repeat: -1,
      onRepeat: () => { drop.y -= 30; },
    });
  }
}
