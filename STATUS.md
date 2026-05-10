# Status — mort-dans-l-ame-game

**Dernière session :** 2026-05-10 · **Version :** 0.4 · **Live :** https://mogoro.github.io/mort-dans-l-ame-game/

## Couverture fonctionnelle

### ✅ Implémenté
- Boot → Character → Life (60 events) → DeckReveal → 7× (Combat → Outcome → Rest/Market/PNJ) → Ending
- 4 fins narratives auto-générées avec mémoire des PNJ
- Save/Load complet — reprendre une run depuis n'importe quelle étape
- Méta-progression cross-runs : codex 100 pages, 5 disciplines, 7 reliques, NG+, empreinte
- Combat tactique : 11 sigils, 7 statuts, synergies de zone, phase 2 boss à 50% HP, événements aléatoires
- Économie : or, marché 20 offres, repos coûteux, dette, élite, malédiction
- 7 boss systémiques avec règles uniques (destruction case, vol carte, drain axe, apaisable)
- Mobile-first : plancher 12px, hit areas ≥44px, safe area iOS, légende statuts (?), drop zones explicites

### 🚧 Reportés
- Sprites HD via SDXL/ComfyUI (actuellement tout en emoji + Phaser Graphics)
- APK Android via Capacitor (web ready, jamais wrappé)
- Telemetry serveur (actuellement local-only via opt-in)
- IA adaptative équilibrage (H.3 a un dump local mais pas de boucle auto)
- Code splitting (bundle 1.65 MB, 387 KB gzip — acceptable)

## Métriques

- **19 scènes** Phaser
- **28 cartes** monstres (2 par axe)
- **60 events** Phase Vie + branches/conditionnels/PNJ
- **100 fragments** codex narratifs
- **10 tests** unitaires (score + deck) — 100% pass
- **Build** : 5s, 38 modules, 1.65 MB JS minified

## Commits récents (top 5)

- `7645820` — fix(ergo): refonte ergonomie mobile complète (P0-P4)
- `ac8836c` — refactor(game): audit flux + sauvegarde complète + UX cartes/PNJ/statuts
- `abf990e` — feat(game): 50 évolutions de fond
- `c1613fd` — feat: scaffold rail-france-eu (CORIFER FR + ER-JU)
- `d78e98f` — feat(moisson-desroches): POC site annuaire alumni WeFer

## Tester

```bash
npm install
npm run dev   # http://localhost:5173 (PC) ou http://<IP-LAN>:5173 (smartphone)
```

URL prod : https://mogoro.github.io/mort-dans-l-ame-game/
