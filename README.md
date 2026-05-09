# Mort dans l'âme — Jeu (Phaser 3)

> Pivot 2026-05-09 : abandon du design-viewer HTML pour un vrai moteur de jeu.
> Le viewer reste comme outil de doc concept dans
> `~/dev-fif/projects/moisson-desroches` (à côté).

## Stack

- **Phaser 3** — moteur 2D pour web et mobile (touch, animations sprites, particles)
- **Vite** — dev server avec hot reload + build prod optimisé
- **TypeScript** — sécurité types
- Pas de dépendance lourde supplémentaire pour V1.

## Lancement

```bash
npm install
npm run dev    # serveur sur :5173 avec --host (accessible LAN)
```

Tu peux tester :
- **Sur PC** : `http://localhost:5173/`
- **Sur téléphone** (même WiFi que le PC) : ouvre l'URL `http://<IP-LAN>:5173/`
  (visible dans le terminal au démarrage de Vite)

## Scope V1 — Cercle de la Luxure complet

5 scènes Phaser :

1. **BootScene** — titre + bougies pulsantes + tap pour commencer
2. **LifeScene** — 3 événements de vie (Enfance, Adolescence, Adulte) avec 4 options
   chacun, deltas axes appliqués, animations flying numbers
3. **DeckRevealScene** — mort + reveal des 5 cartes du deck initial dérivé du profil
4. **CombatScene** — combat contre **Cléopâtre** (boss du Cercle Luxure) :
   - Plateau Inscryption-style, 4 zones par côté
   - Drag & drop des cartes vers les zones libres
   - Coût en points d'axe (ressource = profil acquis en Phase Vie)
   - Voice lines du Juge dans bulle au-dessus du portrait
   - Bataille auto en fin de tour, ennemi attaque, condition victoire/défaite
5. **OutcomeScene** — Verdict suspendu / Tu chutes plus profond + bouton Renaître

## À ajouter (V2+)

- Vrais sprites pixel art HQ via ComfyUI/SDXL (`pixel-art-xl` LoRA déjà installé)
- Sound design (Web Audio ou Howler.js)
- Animations sprites (idle / attack / hurt) via Aseprite
- 6 autres cercles
- Marché de l'Âme entre cercles
- Méta-progression (déblocage cartes/événements)
- Build APK Android via Capacitor (`npm run build` → `npx cap sync android`)

## Build production

```bash
npm run build
# Output dans dist/. Servable sur n'importe quel host statique (Vercel, Netlify, GitHub Pages).
```

## Capacitor APK Android (à faire)

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init mort-dans-l-ame io.fif.mortdanslame
npm run build
npx cap add android
npx cap sync
npx cap open android
# → Android Studio s'ouvre, build APK signé
```
