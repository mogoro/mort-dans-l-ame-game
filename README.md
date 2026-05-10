# Mort dans l'âme

Jeu de cartes narratif inspiré d'Inscryption. Tu vis (3 événements de vie qui forgent ton profil 14 axes), tu meurs, puis tu es jugé(e) à travers les 7 cercles dantesques. Ton deck est l'empreinte de tes choix de vie.

**Live :** [mogoro.github.io/mort-dans-l-ame-game](https://mogoro.github.io/mort-dans-l-ame-game/) · **Stack :** Phaser 3 + Vite + TypeScript · **Cible :** mobile portrait (testable PC).

## Mécaniques principales

- **Phase Vie** — 60 événements (3 phases × 20), branches conditionnelles, lettres interstitielles, PNJ persistants
- **14 axes psychologiques** — 7 péchés capitaux + 7 vertus, ressource de combat
- **Sigils & statuts** — 11 sigils (Saignée, Bouclier, Vampire, Embuscade, Cantique, Mue, Gardienne, Toxique, Glace, Brûlure, Rapide), 7 statuts (Saignement, Bloc, Vulnérable, Faible, Fort, Toxique, Glacé)
- **7 boss systémiques** — Cléopâtre, Cerbère, Plutos, Phlégias, Acédie, Sœurs d'Envie, Lucifer (chacun avec règles uniques + phase 2 à 50% HP)
- **Économie** — or, marché à 20 offres dynamiques, repos coûteux, malédiction de deck, dette inter-combat
- **Méta-progression** — codex 100 pages, 5 disciplines de talents, reliques permanentes, NG+, 4 fins (Saint/Damné/Rebelle/Tiède)
- **Empreinte** — chaque carte jouée 10× modifie ton profil de +5 permanent (cross-runs)

## Lancement local

```bash
npm install
npm run dev   # serveur :5173 avec --host (test mobile : http://<IP-LAN>:5173)
```

## Build & déploiement

```bash
npm run build     # tsc + vite build → dist/
npm test          # vitest (10 tests : score + deck)
```

Déploiement automatique sur GitHub Pages via `.github/workflows/deploy.yml` à chaque push sur `main`.

## Structure

```
src/
├── main.ts              # Phaser config + scenes registry
├── data/
│   ├── cards.ts         # 28 monstres + 11 sigils + helpers (consécration, anomalies)
│   ├── circles.ts       # 7 cercles dantesques + règles boss
│   └── events.ts        # 60 events Phase Vie + branches + PNJ + lettres
├── systems/             # logique pure (sans Phaser)
│   ├── GameState.ts     # singleton run state + persistance
│   ├── SaveSystem.ts    # save/load complet de run
│   ├── Economy.ts       # or, marché, dette, repos, malédiction
│   ├── Talents.ts       # arbre 5 disciplines
│   ├── Relics.ts        # 7 reliques permanentes
│   ├── Codex.ts         # 100 pages narratives
│   ├── Telemetry.ts     # logs opt-in + win-rate
│   ├── Judge.ts         # voice lines + mémoire entre runs
│   ├── NarrativeCost.ts # coût narratif (souvenir/PNJ/axe)
│   ├── AudioSystem.ts   # ambient lo-fi procédural + 10 SFX
│   └── Settings.ts      # difficulty, accessibilité, animSpeed
└── scenes/
    ├── BootScene             # splash + accès méta-prog
    ├── CharacterScene        # création avatar DiceBear
    ├── LifeScene             # 3 events random + branches
    ├── DeckRevealScene       # mort + pioche + gardienne + consécration
    ├── CombatScene           # 4 zones, sacrifice, sigils, statuts, légende
    ├── OutcomeScene          # cercle gagné/perdu → suite
    ├── RestScene             # E.2 axe → +50% HP
    ├── MarketScene           # 3 offres + élite + malédiction
    ├── NPCInterstitialScene  # PNJ visite entre cercles
    ├── EndingScene           # 4 fins + lettre auto-générée
    ├── CodexScene            # voir 100 pages
    ├── TalentScene           # arbre talents
    ├── ImprintScene          # voir empreinte permanente
    ├── PacteConteurScene     # I.2 réécrire passé contre cartes
    ├── LetterScene           # lettre interstitielle plein écran
    └── MenuScene             # settings + stats + achievements
```

## Documentation design

- [`docs/100-evolutions.md`](./docs/100-evolutions.md) — roadmap initiale 10×10
- [`docs/50-evolutions-fond.md`](./docs/50-evolutions-fond.md) — 50 évolutions de fond livrées (audit deckbuilder + LocalThunk/StS lessons)

## État

**v0.4 — production stable**, mobile-first, 19 scènes, ~5000 lignes code.

Voir [STATUS.md](./STATUS.md) pour l'état précis de la dernière session.
