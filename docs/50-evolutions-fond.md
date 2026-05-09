# 50 évolutions de FOND pour Mort dans l'âme

> Inspiré de l'analyse `~/dev-fif/sandbox/inscryption-deckbuilder-gdd/`
> (corpus 16 jeux + 5 leçons design extraites Wikipedia/GDC/LocalThunk).
>
> Pas du polish UI. Que de la **mécanique, narration, design système**.
> Effort : **S** (≤30 min) · **M** (1-3h) · **L** (4h+)
> Date : 2026-05-09

---

## A. Identité et signature design (10)

L'analyse identifie 5 angles morts du marché. On en occupe 1 (axes-ressource).
Pour vraiment se démarquer, en occuper 2-3.

| # | Évolution | Effort | Pourquoi |
|---|---|---|---|
| A.1 | **Coût narratif** : certaines cartes coûtent un PNJ allié, un souvenir, un trait du profil — pas juste des points | M | Angle mort #3 : aucun deckbuilder ne le fait |
| A.2 | **Sigils transférables** : à la fin d'un combat, déplacer un sigil d'une carte à une autre | M | Angle mort #5 : Inscryption les a, personne ne pousse plus loin |
| A.3 | **Économie de dette inter-combat** : entre cercles, dettes accumulées qui se déclenchent (boss bonus) | M | Angle mort #2 : StS a un shop, pas de dette persistante |
| A.4 | **Profil narratif évolutif** : profil change PENDANT le combat selon les cartes jouées (péchés gagnent +1 en jouant Colère) | L | Notre USP unique : amplifier la boucle vie ↔ deck |
| A.5 | **Système d'usure** : cartes utilisées 3+ fois deviennent "fatiguées" (-1 ATK) jusqu'à un repos | M | Force la rotation vs spam d'1 carte forte |
| A.6 | **Mémoire des combats** : Le Juge se souvient des combats précédents et adapte ses voice lines | M | Notre force narrative |
| A.7 | **Consécration de carte** : 1 fois par run, transformer une carte basique en version supérieure (trade-off : perdre un axe de 10 pts) | M | Choix structurel mémorable |
| A.8 | **Anomalies de cartes** : 1% des cartes ont un comportement inhabituel (parle, pleure, refuse d'être jouée) | L | Style Inscryption pur — cartes "vivantes" |
| A.9 | **Pacte avec une carte** : sacrifier 1 carte pour qu'elle "garde rancune" et revienne plus tard avec +ATK | M | Mécanique narrative de cohérence |
| A.10 | **Fin alternative selon profil** : 4 fins narratives selon où ton profil te mène (Saint, Damné, Rebelle, Tiède) | L | Vraie rejouabilité narrative |

## B. Profondeur tactique combat (10)

| # | Évolution | Effort |
|---|---|---|
| B.1 | **Statuts complets** : Vulnérable, Faiblesse, Force, Inflammable, Vol-de-vie persistant, Toxique, Glacé | M |
| B.2 | **Synergies de zone** : si 3 cartes du même axe sur le board → bonus collectif (ex. +1 ATK à toutes) | M |
| B.3 | **Cartes "transformations"** : à mort, une carte devient autre chose (Souffle → Spectre) | M |
| B.4 | **Position du board matters** : zone 1 attaque zone 1 ennemi, zone 4 attaque zone 4 (Inscryption pur) | S |
| B.5 | **Counter spell** : poser une carte face cachée qui se déclenche quand l'ennemi attaque | M |
| B.6 | **Système d'initiative** : ATK haute = frappe en premier, sinon prend le coup d'abord | S |
| B.7 | **Cartes "chant"** : quand jouée, peut être réutilisée 1× au prochain tour si elle a survécu | M |
| B.8 | **Combat avec subordonnés** : le boss invoque ses propres minions au fil des tours | M |
| B.9 | **Phase 2 du boss** : à 50% HP, change de règles (Cléopâtre → mode rage, Séraphin → manifestation divine) | M |
| B.10 | **Évènements aléatoires en combat** : 5% chance d'événement à chaque tour (cri d'oiseau, vent, étincelle qui change qqch) | M |

## C. Méta-progression structurelle (5)

| # | Évolution | Effort |
|---|---|---|
| C.1 | **Codex narratif** : chaque run gagnée écrit une page de "vie passée" — 100 pages collectionnables | L |
| C.2 | **Reliques permanentes** : objets gagnés par achievements, modifient les règles de toutes futures runs | M |
| C.3 | **Arbre de talents** : points gagnés en victoire à dépenser dans 5 disciplines (Guerre, Sagesse, Compassion, Calme, Foi) | L |
| C.4 | **New Game +** : recommence avec ton profil de fin de partie précédente comme profil de naissance | M |
| C.5 | **Mort permanente d'événements** : si tu meurs au cercle X 3 fois, l'événement de Vie qui t'y a mené est verrouillé | M |

## D. Asymétrie ennemi systématisée (5)

L'analyse souligne : Inscryption sur 3 actes, peu d'autres. Vraie niche.

| # | Évolution | Effort |
|---|---|---|
| D.1 | **7 boss complets** avec règles vraiment uniques (pas juste +ATK différent) — actuellement 3 esquissés | L |
| D.2 | **Boss qui change le board** : Cerbère détruit 1 case par tour | M |
| D.3 | **Boss qui te trahit** : Plutos vole une de tes cartes en début de combat | M |
| D.4 | **Boss qui efface ton profil** : Acédie remet les axes les plus forts à 50 progressivement | M |
| D.5 | **Boss interactif** : Phlégias peut être amadoué (cartes Charité l'apaisent et réduisent ses dégâts) | M |

## E. Économie de run (5)

| # | Évolution | Effort |
|---|---|---|
| E.1 | **Or comme 2e ressource** : gagné en victoire, dépensé au Marché de l'Âme | S |
| E.2 | **Coût d'un repos** : entre cercles, "se reposer" coûte un axe pour récupérer 50% HP | S |
| E.3 | **Marchés à offres dynamiques** : 3 offres tirées dans un pool de 20, certaines uniques au cercle | M |
| E.4 | **Risk vs reward** : choisir un combat élite (boss plus dur + 2 récompenses) ou normal (1 récompense) | M |
| E.5 | **Maudire son deck** : ajouter une carte maudite pour gagner un avantage permanent dans la run | M |

## F. Narration et récit (10)

L'analyse insiste : "Le thème vient après la mécanique" mais notre force EST le narratif.

| # | Évolution | Effort |
|---|---|---|
| F.1 | **30 → 60 événements de Phase Vie** (doubler le pool, plus de variété entre runs) | L |
| F.2 | **Branches narratives** : certains événements ouvrent des chemins (ex. ENF-08 secret → ADO unique) | M |
| F.3 | **PNJ persistants** : Marc, Sarah, ton père — apparaissent dans plusieurs événements, mémorisés | M |
| F.4 | **Lettres reçues** : entre événements, mini-mots qui déforment le contexte ("Marc te déteste depuis...") | S |
| F.5 | **Voice lines combat 100% liées au profil** : Le Juge cite l'événement EXACT qui a forgé ta Colère | M |
| F.6 | **Lettre de fin générée** : narration de qui tu as été (200 mots auto-générés selon profil) | M |
| F.7 | **Choix avec délai** : certains choix ont une horloge (10 sec) → si pas de réponse, "tu n'as pas choisi" + delta Paresse | S |
| F.8 | **Choix conditionnels** : option apparaît seulement si axe > 70 (ex. "Frapper ouvertement" si Colère 70+) | M |
| F.9 | **Conséquence à long terme** : choix d'enfance impacte option d'adulte (ex. mensonge ENF-01 → ADU-04 différent) | L |
| F.10 | **Personnage non-joueur introducible** : 1 PNJ par cercle représentant un proche perdu | L |

## G. Design système (5)

| # | Évolution | Effort |
|---|---|---|
| G.1 | **Pioche stratégique 3 choix** : à chaque pioche, voir 3 cartes et garder 1 (Inscryption pur) | M |
| G.2 | **Limite deck** : max 15 cartes — au-delà, doit retirer une | S |
| G.3 | **Niveaux de cartes** : carte jouée 5× peut être "améliorée" gratuitement | M |
| G.4 | **Synthèse de cartes** : 2 cartes → 1 carte hybride (ex. Saignée + Main tendue = Lame Soignée) | L |
| G.5 | **Cartes "gardiennes"** : 1 carte unique par run, ne peut être détruite, devient le cœur du deck | M |

## H. Difficulté et équilibrage par métriques (3)

L'analyse extrait : Mega Crit StS = télémétrie win-rate carte par carte. Méthode signature.

| # | Évolution | Effort |
|---|---|---|
| H.1 | **Logs anonymes opt-in** : enregistre cartes jouées, choix de Vie, durées, victoires/défaites | M |
| H.2 | **Win-rate par carte** affiché dans le Codex (après 50+ runs collectées) | M |
| H.3 | **Auto-équilibrage suggéré** : tableau de bord interne qui suggère ajustements de coût | L |

## I. Mécaniques uniques inspirées de l'analyse (2)

L'analyse pointe 5 angles morts. On en couvre 1. Voici 2 idées qui en couvrent d'autres.

| # | Évolution | Effort |
|---|---|---|
| I.1 | **« L'Empreinte »** (USP propre) : à la fin du combat, un fragment de chaque carte jouée se grave sur ton profil. Une carte jouée 10× modifie ton axe de +5 permanent (méta-progression mécanique douce) | L |
| I.2 | **« Le Pacte du Conteur »** : entre les combats, une rencontre narrative te propose de modifier le récit de ton enfance (ex. "tu n'as jamais menti à 7 ans") en échange d'un pouvoir, mais tu perds toutes les cartes liées à cet axe | L |

---

## Top 10 priorités recommandées

Triées par **impact stratégique × cohérence avec l'identité unique** :

1. **A.4** Profil évolutif pendant le combat — boucle vie↔deck radicale
2. **B.9** Phase 2 du boss à 50% HP — vraie tension de combat
3. **F.1** Doubler les événements (30 → 60) — vraie rejouabilité narrative
4. **A.3** Économie de dette inter-combat — angle mort #2 du marché
5. **B.4** Position du board (zone-vs-zone) — Inscryption pur
6. **F.5** Voice lines exactes selon événement — notre USP narrative
7. **A.1** Coût narratif (cartes coûtent souvenirs) — angle mort #3
8. **B.1** Suite de statuts (Vulnérable, Toxique, etc.) — profondeur tactique
9. **D.1** 6 boss complets avec règles uniques — asymétrie maximale (USP #2)
10. **G.1** Pioche stratégique 3 choix — gain de tactique sans complexité

## Top 5 long terme (transformations majeures)

1. **C.3** Arbre de talents 5 disciplines — vraie méta-prog
2. **F.9** Conséquences long terme entre phases (ENF → ADU) — narratif unique
3. **A.10** 4 fins alternatives selon profil — vraie rejouabilité narrative
4. **I.1** L'Empreinte (cartes modifient profil permanent) — méta-progression mécanique
5. **F.10** PNJ introduits par cercle — cohérence narrative finale

---

## Anti-patterns explicites (à NE PAS faire selon l'analyse)

1. ❌ Pas de mana coloré (héritage MTG abandonné par tous les deckbuilders solo modernes)
2. ❌ Pas de méta-narratif/4e mur (clarification JJ : on ne refait pas Inscryption Acte 2/3)
3. ❌ Pas de monétisation cosmétique (vente unique mobile, pas F2P)
4. ❌ Pas de level-grinding (méta-progression légère uniquement)
5. ❌ Pas de scope creep "comme Inscryption mais avec tout"
6. ❌ Pas de PvP en POC (focus solo)
7. ❌ Pas d'achat aléatoire / lootboxes (clean éthique)

---

## Comment tu choisis

Tape les numéros (ex : `A.1, A.4, B.9, F.5, F.6, G.1`) et je code par lots.

Ou choisis un **lot thématique** :
- **Lot identité** : A.1, A.4, A.5, A.7, I.1 — singularité unique sur le marché
- **Lot tactique** : B.1, B.2, B.4, B.6, G.1 — combat plus profond
- **Lot narratif** : F.1, F.5, F.6, F.8, F.9 — récit qui pèse
- **Lot asymétrie** : D.1, D.2, D.3, D.5, B.9 — vrais boss systémiques
- **Lot équilibrage** : H.1, H.2, E.1, E.2, A.5 — vraie économie data-driven
