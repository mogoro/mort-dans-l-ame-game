# 100 évolutions pour Mort dans l'âme

> Roadmap structurée en 10 axes × 10 propositions concrètes.
> Effort : **S** (≤30 min) · **M** (1-3h) · **L** (4h+)
> Date : 2026-05-09

---

## 1. Game feel & juice (anims, feedback)

| # | Évolution | Effort |
|---|---|---|
| 1.1 | **Hit-stop** : 60 ms de pause sur dégâts importants (>5) avant que le visuel reprenne. Émotionnel énorme. | S |
| 1.2 | **Slow-motion** sur la frappe finale du boss (200 ms à 0.3× speed) | M |
| 1.3 | **Cards qui pulsent** subtilement quand jouables (échelle 1.0→1.04, 1.5s loop) | S |
| 1.4 | **Drag offset** : la carte suit le pointeur avec un léger décalage et tilt selon vitesse | M |
| 1.5 | **Card snap** sur zone valide : la carte saute à la zone la plus proche pendant le drag | M |
| 1.6 | **Squash & stretch** sur les monstres au moment de l'attaque | M |
| 1.7 | **Cliquer une carte sur le board zoom dessus** (preview large + flavor text) | M |
| 1.8 | **Floating text bigger** sur damage critique (>10 dégâts), avec effet de tremblement | S |
| 1.9 | **Bouton haptique vibe** sur mobile via Vibration API à chaque action importante | S |
| 1.10 | **Damage popup** stylisé (chiffres pixel-art au lieu de monospace) | M |

## 2. Mécaniques de combat (profondeur)

| # | Évolution | Effort |
|---|---|---|
| 2.1 | **Sigils Inscryption** : effets passifs sur cartes (ailé = touche directement, mortel = +1 dégât, etc.) | L |
| 2.2 | **Statuts** : Saignement (perd X HP/tour), Vulnérable (×1.5 dégâts subis), Bloc (absorbe avant HP) | M |
| 2.3 | **Cartes coût 0** spéciales (Souffle = +1 pioche) sans nécessiter d'axe | S |
| 2.4 | **Cartes 2-coût en sang** : nécessitent obligatoirement un sacrifice | M |
| 2.5 | **Combo entre cartes adjacentes** sur le board (synergie de zones voisines) | L |
| 2.6 | **Méta-règle de cercle** vraiment activée (ex Cercle Luxure : tes cartes Luxure t'attaquent) | M |
| 2.7 | **Combat boss en 2 phases** : Cléopâtre passe en mode rage à 50% HP avec règles différentes | M |
| 2.8 | **Cartes événement à 1 usage** : « Souvenir d'enfance » qui boost une carte X tours | M |
| 2.9 | **Limite de main** : 6 cartes max, défausse forcée | S |
| 2.10 | **Pioche stratégique** : voir 3 cartes, choisir 1 (Inscryption-like) | M |

## 3. Contenu narratif (étoffer le sens)

| # | Évolution | Effort |
|---|---|---|
| 3.1 | **Le Juge fait référence aux choix précis de Phase Vie** ("Tu as menti à 7 ans. Cette carte revient.") | M |
| 3.2 | **Cinématique de naissance** : scène pixel art ouverture (parents, contexte) | L |
| 3.3 | **Cinematique de mort** : 5-10 sec illustrées selon la cause (accident, vieillesse, etc.) | L |
| 3.4 | **Voice over** sur les transitions phases (fichiers audio courts, ou TTS local) | M |
| 3.5 | **6 autres cercles** avec leur boss + règle + flavor text | L |
| 3.6 | **Marché de l'Âme** entre cercles avec 3 offres dynamiques par run | M |
| 3.7 | **Pactes** consomment des points axes ou retirent des cartes du deck | M |
| 3.8 | **Lettre finale** générée selon ta run (qui as-tu été ?) | M |
| 3.9 | **Phrases du Juge personnalisées** selon ton axe dominant | M |
| 3.10 | **30 événements de Phase Vie** au lieu de 3 (tirage aléatoire pour rejouabilité) | L |

## 4. Audio (immersion)

| # | Évolution | Effort |
|---|---|---|
| 4.1 | **Musique adaptive** : couches qui s'ajoutent quand le combat s'intensifie (boss à 50% → couche percussion) | M |
| 4.2 | **Voice samples** humains pour le Juge (1-2 mots par phrase, libres de droits via freesound) | M |
| 4.3 | **Spatialisation 2D** : sons à gauche/droite selon la position sur le board | M |
| 4.4 | **Ambient layers** : vent, gouttes, murmures distants en boucle | S |
| 4.5 | **SFX uniques par carte** (Saignée = whoosh + drip, Souffle = breath, Charité = chime) | M |
| 4.6 | **Drum kit pixel art** sur les transitions de tour (un coup de tambour grave) | S |
| 4.7 | **Pitch variation** sur SFX répétitifs pour éviter la fatigue auditive | S |
| 4.8 | **Ducking** : la musique baisse quand le Juge parle | S |
| 4.9 | **Audio settings** : sliders séparés Music/SFX/Master | S |
| 4.10 | **Sound cue victoire** : 3-4 notes ascendantes triomphantes | S |

## 5. Visuel & ambiance (DA pixel art)

| # | Évolution | Effort |
|---|---|---|
| 5.1 | **Vrais sprites pixel art** (cartes, boss, perso) via SDXL + ComfyUI déjà installé | L |
| 5.2 | **Background animé** : bougies qui vacillent vraiment, fumée subtle, ombres qui bougent | M |
| 5.3 | **Frame des cartes** : bordures gravées style grimoire (illustrations PNG fixes) | M |
| 5.4 | **Effets de lumière dynamique** : halo qui pulse au tempo de la musique | M |
| 5.5 | **Shader CRT** ou scanlines pour un look rétro arcade | M |
| 5.6 | **Vignette** : bords sombres qui se renforcent dans les moments tendus | S |
| 5.7 | **Color palette** unifiée par cercle (Luxure violet/rose, Colère rouge/orange, etc.) | S |
| 5.8 | **Boss anim idle** : Cléopâtre qui respire, regarde, cligne | M |
| 5.9 | **Carte transparente** quand draggée (alpha 0.7) pour voir le board en dessous | S |
| 5.10 | **Animation flip 3D** sur reveal des cartes du deck | M |

## 6. Mobile UX (touch first)

| # | Évolution | Effort |
|---|---|---|
| 6.1 | **Wake lock API** : empêcher l'écran de s'éteindre pendant le jeu | S |
| 6.2 | **Long-press carte** = preview détail (plutôt que click) | M |
| 6.3 | **Double-tap** sur carte vide → invocation auto en zone libre | S |
| 6.4 | **Swipe up sur carte** = invocation rapide en zone libre | M |
| 6.5 | **Bouton retour Android** (back button) géré : retour menu au lieu de quitter | S |
| 6.6 | **Layout adapté** pour téléphones très étroits (iPhone SE) et larges (iPad) | M |
| 6.7 | **Service Worker** pour offline play (PWA installable) | M |
| 6.8 | **Manifest PWA** : icône d'écran d'accueil, nom, splash | S |
| 6.9 | **Capacitor wrap** pour APK Android signé sur le Play Store | L |
| 6.10 | **Prompt orientation** : forcer portrait, alerte si paysage | S |

## 7. Méta-progression & rejouabilité

| # | Évolution | Effort |
|---|---|---|
| 7.1 | **Save persistante** : reprendre une run interrompue | M |
| 7.2 | **Stats globales** : nombre de runs, victoires, axes dominants moyens | S |
| 7.3 | **Déblocage de cartes** par run (chaque victoire = 1 carte ajoutée au pool) | M |
| 7.4 | **Achievements** (~20) : "Vaincre Cléopâtre sans sacrifier", "Run avec Charité 100", etc. | M |
| 7.5 | **Mode "vie cohérente"** : chaque run reprend le profil de la précédente avec drift | L |
| 7.6 | **Encyclopédie** : tous les boss, axes, cartes débloqués, lecture libre | M |
| 7.7 | **Codex de tes vies passées** : log narratif de toutes les runs jouées | M |
| 7.8 | **Daily run** avec seed partagée (tout le monde joue la même config) | M |
| 7.9 | **Score final** : points selon ton style (cohérence, rapidité, économie) | S |
| 7.10 | **Replay system** : enregistrer/relire une run mythique | L |

## 8. Difficulté & équilibrage

| # | Évolution | Effort |
|---|---|---|
| 8.1 | **3 niveaux de difficulté** (Doux / Normal / Pénible) avec stats boss ajustées | S |
| 8.2 | **Mode Ascension** (StS-like) : modificateurs cumulables après chaque victoire | M |
| 8.3 | **Tutorial** scripté qui guide les 5 premières actions (carte → drag → bell → bataille) | M |
| 8.4 | **Hints contextuels** : "Sacrifie ton monstre A pour invoquer B" si bloqué | S |
| 8.5 | **IA boss adaptative** : Cléopâtre joue différemment selon ton style (agressif si tu défends) | L |
| 8.6 | **Telemetry win-rate** par carte (méthode Mega Crit StS) | M |
| 8.7 | **A/B testing** des coûts cartes (50% des joueurs voient cost X, 50% Y) | L |
| 8.8 | **Mode pacifique** : réduire HP boss de 50% pour découvrir l'histoire sans frustration | S |
| 8.9 | **Reroll d'une carte de la main** 1× par combat | S |
| 8.10 | **Health bar de la run** (au-dessus de l'écran) : combien de cercles restent | S |

## 9. Accessibilité

| # | Évolution | Effort |
|---|---|---|
| 9.1 | **Mode daltonien** : palette alternative pour distinguer péchés/vertus sans rouge/vert | S |
| 9.2 | **Tailles de texte** ajustables (small / medium / large) | S |
| 9.3 | **Speed mode** : skip animations longues (option pour joueurs pressés) | S |
| 9.4 | **Subtitles** des voice lines toujours visibles | S |
| 9.5 | **Réduire les flashes** (camera shake, particules) pour épileptiques | S |
| 9.6 | **Auto-pause** quand l'app passe en background (mobile multi-tâche) | S |
| 9.7 | **Localisation** : EN / DE / ES en plus de FR (i18n via JSON) | M |
| 9.8 | **Keyboard navigation** complet pour les non-touch (PC) | M |
| 9.9 | **Screen reader hints** sur les cartes (alt text + ARIA) | M |
| 9.10 | **Tooltip "Pourquoi cette carte ?"** sur reveal du deck (quel axe / quel choix l'a générée) | M |

## 10. Tooling & qualité dev

| # | Évolution | Effort |
|---|---|---|
| 10.1 | **Debug mode** : `?debug=1` dans URL → afficher les axes complets, skip animations, raccourcis | S |
| 10.2 | **Save state** entre développements (export/import JSON du GameState) | S |
| 10.3 | **Logs structurés** : chaque action loguée avec timestamp + scene + état | S |
| 10.4 | **Tests Vitest** pour la logique de combat (calculs ATK/DEF, sacrifice, conditions de fin) | M |
| 10.5 | **CI/CD** GitHub Actions : build auto + déploiement Vercel ou Netlify à chaque push main | S |
| 10.6 | **Analytics opt-in** (Plausible self-hosted) : conversion, durée de session, drop-off | M |
| 10.7 | **Lighthouse score** > 90 (performance, accessibilité, PWA) | M |
| 10.8 | **Hot reload preserve state** : modifier le code sans perdre la run en cours | M |
| 10.9 | **Version visible** en bas-droite (commit hash) pour suivi des bugs | S |
| 10.10 | **Telemetry serveur léger** (Express + SQLite) pour collecter événements jeu | L |

---

## Top 10 quick wins recommandés pour la prochaine session

Tri par **impact ressenti / effort** :

1. **Hit-stop sur dégâts** (1.1) — émotionnel énorme, 30 min
2. **Cards qui pulsent quand jouables** (1.3) — feedback immédiat
3. **Audio settings sliders** (4.9) — UX critique mobile
4. **Wake lock mobile** (6.1) — bloquant mobile sans ça
5. **Manifest PWA** + favicon (6.8) — "vrai jeu" perception
6. **3 niveaux de difficulté** (8.1) — rejouabilité immédiate
7. **Speed mode skip anims** (9.3) — accessibilité + rejouabilité
8. **Carte zoom au click** (1.7) — lisibilité mobile
9. **Statuts simples** (Saignement / Bloc) (2.2) — profondeur tactique
10. **Vrais sprites pixel art** (5.1) — pas un quick win mais gros impact perçu

## Top 10 grand soft pour V2 (gros impact, gros effort)

1. **6 autres cercles** (3.5)
2. **Sigils Inscryption** (2.1)
3. **Save persistante** (7.1)
4. **Capacitor APK Android** (6.9)
5. **Cinématiques mort** (3.3)
6. **Marché de l'Âme** (3.6)
7. **Encyclopédie** (7.6)
8. **Boss IA adaptative** (8.5)
9. **Replay system** (7.10)
10. **Localisation** (9.7)

---

## Comment procéder

1. JJ choisit 5-10 items dans le top 10 quick wins
2. On code session par session
3. À chaque session, on coche
4. On rejoue, on itère

Si tu n'es pas sûr : tape juste les numéros (ex "1.1, 1.3, 4.9, 6.1, 8.1") et je m'occupe.
