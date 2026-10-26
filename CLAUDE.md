# Antikor : contexte du projet

Document de passation pour reprendre le travail dans une nouvelle conversation. À lire avant toute modification.

## En bref

- **Antikor** est un jeu d'arcade de survie (« survivor » / auto-shooter) à thème biologique et néon : le joueur est la dernière défense d'un corps envahi par des germes. Les armes tirent toutes seules, on se déplace, on monte de niveau, on achète entre les vagues.
- Le jeu s'appelait **« Néon Horde »** jusqu'à la v0.7. Il a été renommé parce qu'un jeu Steam porte ce nom.
- **Le jeu est découpé en modules ES** depuis la v0.8.2 : `index.html` (le squelette HTML des écrans), `css/` et `js/`. Aucune dépendance, aucune étape de construction : GitHub Pages sert les fichiers tels quels. Avant, tout tenait dans un seul `index.html` de 2 200 lignes.
- **Langue :** l'interface, les commentaires du code et les échanges avec l'utilisateur sont en **français**. Les messages de commit sont en anglais.
- **Version actuelle : 1.2.0.** (Les utilisateurs appellent « 1.0 » la version 0.10.0 ; la suite est numérotée 1.1, 1.2… La liste des tâches de la 1.1 et de la 1.2 est dans `TODO.md`.) Elle est affichée en bas à droite du jeu (`VERSION` dans `js/config.js`).
- **Un compte est obligatoire pour jouer** depuis la v0.9 : la progression (noyaux, armes, talents, box, carrière, records) est gardée sur le serveur **AntiBack** (dépôt privé `Antoinecorcos/AntiBack`, Raspberry Pi de Tibo, https://rpi5.tail085c70.ts.net). Elle suit le joueur sur tous ses appareils ; plusieurs appareils peuvent être connectés en même temps. Les sauvegardes locales d'avant la v0.9 ne sont pas reprises (décision des utilisateurs : les comptes partent de zéro).

## Dépôt et publication

- Dépôt GitHub : `AntiProd3/antikor` (compte créé pour le projet ; anciennement `antoinecorcos/neonhorde`, transféré et renommé en octobre 2026), branche **`main`**, publiée telle quelle par **GitHub Pages** (Settings → Pages → branche `main`, dossier `/`).
- URL : https://antiprod3.github.io/antikor/ (l'ancienne adresse ne redirige pas ; les sauvegardes locales de l'ancienne adresse ne sont pas reprises).
- Le serveur est dans le **dépôt privé `Antoinecorcos/AntiBack`**. Ne jamais passer ce dépôt public en privé (GitHub Pages s'arrêterait) et ne rien y mettre de secret.
- **Le serveur lit ce dépôt** : sur le Pi, il est cloné dans `/opt/antikor` et AntiBack importe `js/rules.js` et `js/data/` (règles de progression). Après une modification de ces fichiers, Tibo doit faire `git pull` dans `/opt/antikor` et redémarrer le service (`sudo systemctl restart antiback`), sinon le serveur applique les anciennes règles. Un changement de protocole (messages) demande de mettre à jour les deux dépôts ensemble.
- Usage établi : **chaque mise à jour validée est commitée et poussée directement sur `main`**, ce qui la met en ligne. On incrémente `VERSION` dans `js/config.js` et la ligne « Version actuelle » du `README.md`.
- Fichiers :
  - `index.html`, `css/`, `js/` : le jeu (voir « Repères dans le code ») ;
  - `tests/sim-bench.mjs` et `package.json` : test de la simulation sous Node (le `package.json` ne sert qu'à Node, pas au site) ;
  - `.prettierrc.json` / `.prettierignore` : réglages de mise en forme du code ;
  - `test-serveur.html` : page de test du serveur de jeu (comptes, salles, protocole 2), copie de `public/test.html` du dépôt privé AntiBack ; non liée depuis le jeu. Ne pas la modifier ici : recopier depuis AntiBack ;
  - `README.md` : présentation et règles ;
  - `manifest.webmanifest` : nom « Antikor », icônes ;
  - les icônes : `apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png`, `favicon-32.png`, `favicon-64.png`. Elles représentent le petit monstre vert (« walker ») du jeu sur fond sombre.
- L'icône iOS utilise un chemin relatif (`href="apple-touch-icon.png"`), corrigé en v0.8.2 : un chemin absolu `/…` pointerait vers la racine du domaine et non vers `/antikor/`. Même règle pour tout nouveau fichier : **toujours des chemins relatifs**.
- Cache : GitHub Pages autorise les navigateurs à garder les fichiers 10 minutes. Juste après une mise en ligne, un joueur peut brièvement avoir un mélange d'anciens et de nouveaux modules ; un rechargement quelques minutes plus tard règle le problème.

## L'utilisateur et sa façon de travailler

- Deux personnes travaillent sur le projet : **Antoine** (propriétaire du dépôt) et **Tibo**, qui gère le Raspberry Pi et la future partie serveur (feuille de route : serveur Node autoritaire sur le Pi, Tailscale Funnel, SQLite ; voir « Pistes en attente »).

- Il n'est pas développeur. Il teste sur PC et sur iPhone (ajout à l'écran d'accueil iOS) et donne des retours de design et de jeu par petites séries numérotées.
- Il apprécie qu'on propose des idées et qu'on soit créatif, mais il tranche franchement : par exemple « le nouveau fond, ça va pas du tout ».
- Il aime le style **néon sobre**, le côté **addictif** (box, raretés, étoiles, carte de niveaux) et la **vibe biologique**.
- Réponses attendues en français, claires, sans jargon. On résume ce qui a changé et ce qui a été testé.

## Fonctionnalités actuelles (v1.2.0)

### Compte
- Au lancement, **écran de connexion** (`#scr-login`, `js/ui/login.js`) : pseudo (3 à 16 caractères) et mot de passe (8 minimum), « Se connecter » ou « Créer un compte ». Le jeton de session est gardé dans le navigateur (`antikor-token`, 7 jours) : au prochain lancement la session reprend toute seule. Si le serveur est injoignable : message et bouton « Réessayer ».
- Dans le menu : le pseudo à côté de « Records », un bouton « Classement » et un bouton « Se déconnecter » à côté du son.
- **Classement** (`#scr-rank`, `js/ui/rank.js`, v0.10) : top 15 de tous les joueurs pour 9 statistiques (onglets) : meilleure manche en Infini, étoiles, niveaux de carrière terminés, éliminations, dégâts, meilleur niveau du héros, meilleur combo, victoires, parties. Sa propre place s'affiche en dessous si on n'est pas dans le top. Calculé par le serveur (requête `leaderboard`) à partir de la progression de chaque compte ; dégâts, niveau du héros et combo sont dans `prog.stats` depuis la v0.10 (les parties d'avant ne comptent pas).
- **Cadeau du jour** (v1.2, `#daily`, `js/ui/daily.js`, règles `dailyNext`/`claimDaily` dans `rules.js`, récompenses `DAILY` dans `data/loot.js`) : fenêtre à l'arrivée au menu si le cadeau n'est pas pris. J1 20 noyaux, J2 30, J3 Box Souche, J4 50 noyaux, J5 Box Souche, J6 Box Mutante, J7 box de skin (un skin du labo ou de fidélité pas encore possédé, sinon 150 noyaux). Jours consécutifs, date de Paris décidée par le serveur ; un jour manqué ou après le 7e : retour au jour 1. Progression : `prog.daily {last, day}`.
- **Codes promo** (v1.2, `#promo`, `js/ui/promo.js`) : volontairement cachés, **5 appuis rapides sur le numéro de version** en bas à droite (hors partie). Les codes et leurs cadeaux sont **uniquement sur le serveur** (fichier `promo-codes.json` du dépôt privé AntiBack, jamais dans ce dépôt public), une fois par compte (`prog.codes`). Premier code : SINGE (1 Box Mutante).
- Connexion perdue : message discret en haut (« Connexion au serveur perdue · reconnexion… »), reconnexion automatique ; une fin de partie est renvoyée dès que le serveur revient.

### Menu
- Logo **ANTIKOR** sur une ligne : « ANTI » en cyan, « KOR » en rose néon qui clignote. Sa taille suit la colonne (unités `cqi`).
- Description : « Tiens jusqu'à la dernière vague. Ouvre des box, collectionne les armes rares et fais évoluer ton arsenal. » L'utilisateur a refusé la version « Le corps est envahi… ».
- **Joueurs :** Solo / Duo en ligne. En duo, un panneau apparaît sous le choix : « Créer une salle » ou un code à saisir puis « Rejoindre » ; dans une salle, le code (rose), les deux pseudos (l'hôte est marqué) et « Quitter ». Seul l'hôte lance (le JOUER du partenaire est grisé).
- **Mode :** Carrière / Infini.
- **Arme équipée** (carte avec la rareté) et bouton **Inventaire**.
- Gros bouton **JOUER**. En Carrière, il ouvre la carte.
- À droite :
  - le grand bouton **LABO** animé (bordure dégradée, box qui flotte, noyaux, badge « X box à ouvrir » qui pulse) ;
  - les records ;
  - les commandes ;
  - le bouton son.
- Le menu doit tenir sans défilement sur PC, testé de 1280×720 à 1920×1080.

### Modes
- **Carrière** (v0.8) :
  - 25 niveaux (`CAREER_LEVELS`), répartis en **5 mondes de 5 niveaux** (`WORLDS`) : Épiderme (grille bleue d'origine), Plasma (hexagones roses), Lymphe (points vert d'eau), Moelle (triangles ambre), Cortex (circuit violet).
  - Chaque niveau compte **10 manches de 30 s**, avec un **boss aux manches 5 et 10**.
  - Les boss de chaque niveau sont fixes (`careerBosses(L)`). La Couronne garde la fin de chaque monde (niveaux 5, 10…).
- **Difficulté de la carrière :** `progress()` et `computeScale()`. Avec `t` la progression dans le niveau (0→1) et `k = niveau−1` :
  - `hp = (1+.13k)(1+1.7t+2.4t²)` ;
  - `dmg = (1+.09k)(1+1.2t)` ;
  - `spd` augmente légèrement ;
  - la densité suit `p = .05+.045k+.6t`.
  - But : une montée **régulière dans un niveau et linéaire entre niveaux**. L'ancien Marathon était trop facile au milieu et injouable à la fin.
- **Épreuves de fin de monde** (v1.1, niveaux 5, 10, 15, 20, 25 : `isFinale()`, réglages `FINALE` dans `data/career.js`) : ennemis +45 % PV, +30 % dégâts, +6 % vitesse, plus nombreux, événements plus fréquents, boss +30 % PV. Bannière « ÉPREUVE DU MONDE N » et ligne « Épreuve » sur la fiche du niveau.
- **Étoiles :** 1★ si on termine, 2★ avec ≥ 40 % des PV à la fin, 3★ avec ≥ 75 %.
- **Récompenses :** bonus de noyaux au premier passage (`10+3L`), +5 par nouvelle étoile. Le niveau suivant est débloqué (`save.career.max`).
- **Carte** façon Candy Crush (`#scr-map`, `renderMap()`) :
  - chemin sinueux en SVG, niveau 1 en bas, bandes de couleur par monde sur toute la largeur ;
  - nœuds avec étoiles ; le niveau courant pulse ; les niveaux 5, 10… portent « Boss du monde » ;
  - toucher un nœud ouvre une fiche (boss, difficulté, étoiles, bonus) avec JOUER ;
  - **joueurs arrêtés à chaque niveau** (v1.2) : à côté du nœud, les 3 meilleurs comptes dont le niveau atteint (`career.max`) est celui-ci (classés par étoiles puis éliminations), « +N » pour les autres ; aussi dans la fiche. Requête `career_board` (calcul serveur, gardé 15 s).
- **Écran de fin carrière :** « NIVEAU X TERMINÉ », étoiles animées, boutons « Niveau suivant → », « Rejouer »/« Réessayer », « Labo » et « Carte ».
- **Infini :** l'ancien mode sans fin. Le fond change toutes les 10 vagues et un boss arrive toutes les 5 vagues. **Noyaux (v1.1) :** les vagues déjà franchies lors de son record rapportent 15 % (`ENDLESS_OLD` dans `rules.js`), seules celles au-delà rapportent tout ; message sur l'écran de fin, record affiché sous « Infini » dans le menu. Sprint et Marathon ont été supprimés en v0.8 ; les sauvegardes sont migrées vers la Carrière.

### Partie
- Déplacement : ZQSD, WASD ou flèches. Sur tactile, un joystick apparaît là où le doigt se pose ; **son centre reste fixe** (v0.8.1).
- Les armes tirent seules. Les gemmes donnent de l'XP (`xpFor()`, par paliers depuis la v1.2 : `12+6l` jusqu'au niveau 5, `42+35(l−5)` jusqu'au 11, puis `252+60(l−11)` ; il faut 1 137 XP pour atteindre le niveau 12, contre 648 avant) ; à chaque niveau on choisit une carte parmi 3 (4 avec le talent). Plus de cartes « Bourse » ou « Kit de soin » de remplissage : s'il reste moins de cartes possibles, on en propose moins ; quand tout est au maximum, **pas d'écran de choix**, le joueur regagne `2 × niveau` PV (`maxedHeal()`). Un coffre sans amélioration possible soigne.
- Boutique : une **relance** ne repropose pas ce qu'on vient d'acheter dans la même boutique (`shop.bought`).
- Une boutique s'ouvre entre les vagues et se paie en **pièces**.
- Il y a des élites (avec coffre), des **événements** et des bonus au sol (cœur, aimant, bombe). Événements (`spawnEvent()` dans `sim/spawn.js`, tirage pondéré selon la difficulté et le monde, réglages `EVENT` dans `data/enemies.js`) : encerclement, nuée, mur, diviseurs, et depuis la v1.2 **pluie de spores** (cercles rouges qui explosent 1,2 s après, `G.warn`, envoyés dans l'instantané du duo `h`), **fièvre** (germes +45 % de vitesse 8 s, `G.feverT`), **ruée d'or** (8 germes dorés qui fuient 10 s et lâchent 6 pièces chacun, `e.gold`), **essaim** (meute d'un germe du monde en cours).
- **Germes des mondes** (v1.1, `ETYPES` avec `w` = monde d'arrivée, réglages `MOB` dans `data/enemies.js`, comportements dans `sim/enemies.js`) : **Piqueur** (`dasher`, bleu, monde 2 : vise 0,55 s avec une ligne pointillée puis fonce), **Leucocyte** (`healer`, blanc, monde 3 : garde ses distances, soigne 25 % des PV des germes proches toutes les 3 s), **Pondeuse** (`brood`, vert citron, monde 4 : pond 2 petits germes toutes les 3,5 s, 6 au plus), **Neurone** (`blinker`, turquoise, monde 5 : clignote puis réapparaît près du joueur). v1.2, un second germe par monde : **Plaquette** (`zigzag`, saumon, monde 2 : petite et rapide, en grappes, avance en zigzag), **Anticorps** (`latcher`, mauve, monde 3 : au contact le joueur avance à 60 % pendant 1,5 s, `pl.slowT`, anneau pointillé), **Ostéoclaste** (`spiker`, os, monde 4 : 8 éclats à sa mort), **Synapse** (`pulser`, lavande, monde 5 : se charge 0,8 s avec un cercle puis décharge autour d'elle). Chacun reste dans les mondes suivants, plus fréquent dans le sien (`pickType`, `worldIndex()`). En Infini, ils arrivent avec les fonds (toutes les 10 vagues). Les nouveaux types sont toujours ajoutés **à la fin** d'`ETYPES` (leur rang sert d'identifiant dans les instantanés du duo).
- **Emplacements d'armes :** une partie commence avec **1 seule arme** (celle équipée). Le talent **Arsenal** monte jusqu'à 3 armes (v1.1).
- **Abandon :** aucun noyau gagné, mais les box trouvées sont gardées.
- **Manches de boss :** le même sol en **version éclaircie** (palettes `FLOOR_LIT` / `bgLit`), avec un fondu, et les bords de l'écran qui battent comme un cœur à la couleur du boss. Un fond « tissu infecté » avait été essayé puis **rejeté** par l'utilisateur.
- **4 boss** (`BOSSV`), dessinés dans le même style néon :
  - **La Couronne** (rose) : charges, anneaux de projectiles, renforts ;
  - **La Ruche** (jaune) : nombreux renforts ;
  - **L'Œil** (bleu) : spirales de projectiles ;
  - **Le Titan** (orange) : charges rapides, très résistant.
  - Leur nom s'affiche sous la barre de vie.

### Armes, raretés, box (méta-progression)
- **15 armes :** Blaster, Fusil à pompe, Drones, Arc électrique, Disque, Molotov, Mines, Roquettes, Champ de force, Laser rotatif, Lance-flammes, Rayon cryo, Katana néon, Singularité, **Tourelle** (v0.8).
  - Chacune a 5 niveaux et une **évolution** au niveau 5, qui demande un équipement précis.
  - Évolution de la Tourelle : « Sentinelles », trois tourelles volantes qui suivent le joueur. Elle demande le **Servomoteur**.
- **Équipements (passifs) :** 15 au total, dont Réservoir (portée), Puce tactique (dégâts contre élites et boss) et Servomoteur (vitesse et cadence). Au maximum 6 en partie.
- **Raretés** (`RARITY`) : Commun, Rare, Épique, Légendaire, Mythique.
  - Elles augmentent les dégâts et la zone, et réduisent la recharge. Depuis la v1.1, bonus plus modestes : dégâts +8 / +16 / +25 / +35 %, recharge −3 / −6 / −9 / −12 %, zone +2 à +8 %.
  - Une arme Légendaire ou Mythique commence au niveau 2, et la Mythique tire un projectile de plus.
- **Équilibrage des armes (v1.1)** : mesuré sous Node (dégâts par seconde de chaque arme seule, ennemis 8× plus résistants, moyenne sur plusieurs graines). Écart entre la plus forte et la plus faible au niveau 5 ramené de ×2,9 à environ ×1,9 : Mines, Singularité (surtout son explosion), Molotov, Disque, Lance-flammes baissés ; Fusil à pompe, Drones, Tourelle, Rayon cryo, Arc électrique relevés ; Laser plus faible au niveau 1.
- **Box** (`BOXES`) :
  - **Box Souche** : 80 noyaux, de Commun à Légendaire (plus de Mythique depuis la v1.1).
  - **Box Mutante** : 140 noyaux, au moins Rare.
  - Les box tombent aussi des boss (parfois des élites). Seul le boss de fin de monde donne une Box Mutante.
  - Chaque box donne 1 arme au hasard.
  - L'ouverture est animée : capsule bio hexagonale qui tremble et change de couleur jusqu'à la rareté obtenue.
  - Un nouveau joueur reçoit 1 Box Souche.
- **Inventaire** (menu uniquement) : on y équipe l'arme de départ, et **3 exemplaires identiques fusionnent** en une rareté supérieure. En partie, **seules les armes possédées** apparaissent, avec la meilleure rareté possédée.
- **Labo :**
  - les deux box directement en haut, sans sous-menu ;
  - les **talents permanents** avec icônes et couleurs : Arsenal, Vitalité, Puissance, Agilité, Magnétisme, Fortune, Capital, Blindage, Relance, Quatrième carte, Seconde chance.
  - **Arsenal (v1.1) :** 2 niveaux, 3 armes au maximum. Niveau 1 (120 noyaux) au monde 2, niveau 2 (260) au monde 3 (`talentGate`). Les comptes qui avaient l'ancien niveau 3 sont ramenés au niveau 2 et remboursés de 450 noyaux par le serveur (`upgradeProgress()` dans `rules.js`, appliquée au chargement de la progression). Les niveaux déjà achetés avant d'avoir atteint le monde requis sont gardés.
- **Skins** (v1.2, `data/skins.js`, dessin `render/hero.js`, labo `ui/skins.js`) : apparence du vaisseau, aucun effet en jeu. **Pas d'achat au labo** (décision des utilisateurs, `SKIN_SHOP = false` dans `rules.js` ; le labo n'affiche que les skins possédés). Les 6 skins « labo » (Toxique, Magma, Glace, Néon noir, Or, Prisme ; prix gardés dans les données au cas où) ne s'obtiennent plus que par la box du 7e jour, 4 d'Halloween par la **Box Halloween** (199 noyaux, **une seule par joueur**, `prog.halloween` ; Citrouille 35 %, Fantôme 30 %, Chauve-souris 25 %, Squelette 10 %), 2 de fidélité (Fidèle, Aurore) par la box de skin du 7e jour. Progression : `prog.skins`, `prog.skin` ; le skin part avec le joueur (`playerSpec`, `pl.skin`, `sk` dans l'instantané). En duo avec un skin, un anneau à la couleur du joueur sous le vaisseau. Les skins d'Halloween et de fidélité ne s'affichent au labo qu'une fois obtenus.
- **Deux monnaies, à ne pas confondre :**
  - les **noyaux** sont **violets** (`--core:#c77dff`) : monnaie permanente gagnée en fin de partie, dépensée au labo ;
  - les **pièces** sont **dorées** : monnaie de la partie, dépensée dans la boutique entre les vagues, perdue à la fin.
- **Infobulles** (`data-tip`, `tipData()`, `#tip`) :
  - au survol sur PC, via un bouton « ? » sur tactile ;
  - armes : statistiques du niveau 1 au niveau 5 avec la rareté, progression et évolution ;
  - talents : effet actuel et suivant, coût, explication ;
  - monnaies (les box n'ont plus d'infobulle depuis la v0.8.3).

### Duo en ligne (v0.10, phase 3 d'AntiBack)
- **La partie tourne sur le serveur** (un worker par partie, qui importe `js/sim/` de ce dépôt sans modification). Le jeu envoie seulement ses commandes : direction du joystick (`duo_in`, numérotée, 30 par seconde au plus) et actions (`duo_act` : carte, achat, relance, verrou, prêt, abandon). Le serveur envoie 20 instantanés par seconde (`js/sim/snapshot.js`, format partagé), les écrans de niveau/boutique de chaque joueur (`duo_view`, données de `js/sim/views.js`), ses sons et notifications (`duo_say`, `duo_toast`), et la fin (`duo_over` avec les récompenses de chacun).
- `js/online/duo.js` : salle (`duo.room`), début (`duo_begin`), affichage des instantanés (interpolation des autres objets), **anticipation de son propre vaisseau** (il avance tout de suite ; quand un instantané arrive, l'écart avec la position calculée par le serveur au même moment est corrigé en douceur, grâce au numéro de commande `q` et au temps `qt` renvoyés par le serveur). `js/ui/duo.js` : panneau du menu et écrans de la partie.
- Chacun joue avec la progression de son compte (talents, armes) ; récompenses de chacun avec ses propres éliminations, dégâts et PV ; les box trouvées sont données aux deux. En Carrière, le niveau doit être débloqué par l'hôte ; le partenaire ne débloque le niveau suivant que s'il était à ce niveau.
- **Pas de pause en duo** : le menu pause s'affiche mais la partie continue ; changer de fenêtre ne met pas en pause.
- **Connexion perdue** : la partie s'arrête et attend le joueur **30 s** (message chez l'autre). Il revient tout seul (reconnexion automatique, ou page rechargée : la partie est retenue dans `sessionStorage`, clé `antikor-duo`). Au-delà, il est considéré comme parti et l'autre continue seul. Abandonner (menu pause) = partir : aucun noyau, box gardées.
- Un joueur parti (`pl.gone`) est retiré de la partie (`leaveGame()` dans `js/sim/flow.js`) ; s'il ne reste personne debout, la partie se termine.

### Progression sur le serveur (v0.9)
- Le serveur fait foi : le jeu affiche la progression reçue (`prog` dans `js/online/client.js`) et **demande chaque changement** au serveur : achat de talent (`talent_buy`), ouverture ou achat de box (`box_open`, l'arme est **tirée par le serveur**), équiper (`equip`), fusion (`fuse`).
- **Partie solo :** elle tourne toujours dans le navigateur. Au lancement, `run_start` donne un ticket et le joueur à créer (talents, armes, arme équipée, d'après le compte). À la fin, `run_end` envoie le résultat ; le serveur vérifie qu'il est possible (durée réelle, vagues complètes de 30 s, boss, box, éliminations) puis calcule les récompenses avec les mêmes règles (`runRewards`). Un résultat impossible est refusé (« Résultat refusé par le serveur »).
- Les **règles** (prix et conditions des talents, tirage des box, fusion, récompenses de fin de partie, progression de départ) sont dans `js/rules.js`, partagé avec le serveur.

## Repères dans le code

### Organisation des fichiers

Chaque fichier commence par une ligne qui dit ce qu'il contient. Les imports en tête de fichier indiquent d'où vient chaque fonction.

- `index.html` : le HTML de tous les écrans, les feuilles de style, puis `<script type="module" src="js/main.js">`.
- `css/` : les styles, chargés **dans cet ordre** (l'ordre compte pour la cascade) : `base`, `menu` (+ connexion et message `notice`), `collection` (raretés, inventaire, box, bouton labo), `map`, `tooltips`, `duo` (panneau duo, partenaire dans le HUD, classement), `screens` (cartes, boutique, labo, fin), `hud` (+ bannière).
- `js/main.js` : démarrage (`init…()` de chaque module) et boucle `frame()`.
- `js/data/` : **les réglages du jeu, sans code** ; c'est là qu'on équilibre.
  - `weapons.js` : les 15 armes (textes, `stats(niveau)`, évolution) ;
  - `passives.js` (équipements), `talents.js` (labo + textes d'infobulle `TFX`/`TNOTE`), `loot.js` (`RARITY`, `BOXES`), `career.js` (`MODES`, `WORLDS`, `CAREER_LEVELS`, boss par niveau), `enemies.js` (`ETYPES`, `MAX_E`, `BOSSV`).
- `js/sim/` : **la simulation**. Elle n'accède jamais à la page (ni `document`, ni `window`, ni sauvegarde, ni son) et tourne aussi sous Node.
  - `state.js` : `G`, `P`, `ME`, `WM`, `view` (demi-taille visible `hw`/`hh`), `settings`. Les autres modules lisent ces variables directement mais les modifient **uniquement avec `setG`, `setP`, `setME`, `setWM`, `setView`** (règle des modules ES) ;
  - `hooks.js` : ce que la simulation demande à l'interface (son, bannière, notification, écran, fin de partie…). Le client les remplit dans `js/ui/game.js` (`initGame`) ; sous Node elles restent vides ;
  - `update.js` (une image), `weapons.js` (comportement des armes, `this` = l'arme de `data/weapons.js`), `combat.js`, `enemies.js`, `projectiles.js`, `pickups.js`, `spawn.js` (difficulté `progress()`/`computeScale()`, apparitions, événements), `boss.js`, `waves.js` (`newRun`, `startWave`, `endWave`), `options.js` (cartes de niveau/coffre/boutique et prix), `flow.js` (actions `doAct`, montée de niveau, boutique, pause, `gameOver`), `fx.js` (effets et `sfx()`, enregistrés par `rec()` pour le duo), `grid.js`, `player.js` ;
  - `views.js` (contenu des écrans de niveau et de boutique d'un joueur, sous forme de données : mis en forme par `ui/cards.js` en solo, envoyé par le serveur en duo), `snapshot.js` (instantané de la partie pour le duo) ;
  - la commande de chaque joueur arrive dans `pl.in = [x, y]`, remplie par `main.js` (`stepGame`) à partir de `inputVec()` en solo, par le serveur en duo. `movePlayer()` (`update.js`) déplace un joueur selon sa commande ;
  - chaque joueur compte ses éliminations et dégâts (`pl.kills`, `pl.dmgDone`) ; `pl.name` (pseudo), `pl.gone` (parti), `pl.away` (connexion perdue).
- `js/render/` : le dessin sur le canvas. `render.js` (image complète, démo du menu), `world.js` (tout ce qui est dans le monde), `floor.js` (sols des mondes), `canvas.js` (taille, `ZOOM`, `HW`/`HH`), `sprites.js` (dessins des monstres, créés par `initSprites()`).
- `js/ui/` : les écrans HTML. `login.js` (connexion, reconnexion), `game.js` (lancer une partie avec `run_start`, `act()`, branchement des hooks), `menu.js`, `map.js`, `lab.js`, `boxes.js`, `inventory.js`, `cards.js` (écrans de niveau et de boutique, `showLevel`/`showShop` à partir des données de `sim/views.js`), `over.js` (fin de partie : statistiques tout de suite, récompenses envoyées par le serveur après `run_end`, ou directement avec `duo_over`), `duo.js` (panneau duo du menu, écrans d'une partie en duo), `rank.js` (classement), `hud.js`, `tooltips.js`, `keyboard.js`, `dom.js` (`$`, `show`, `notice()` pour les messages hors partie, notifications).
- `js/rules.js` : **règles de la progression, partagées avec le serveur** (`newProgress`, `talentCost`/`talentGate`/`buyTalent`, `talentStats`, `playerSpec`, `openBox`/`rollBox`, `equip`, `fuse`, `runRewards`). Aucune dépendance à la page.
- `js/online/client.js` : connexion au serveur (WebSocket, protocole 4 ; le serveur accepte encore le 3) : `login`/`register`/`resumeSession`/`logout`, `request(type, données)` (réponse `{ok, …}`), `post(type, données)` (sans réponse : commandes du duo), progression `prog` et pseudo `account`, événements `on('state' | 'status' | 'logout')`, reconnexion automatique. `?server=ws://127.0.0.1:PORT/ws` permet de viser un serveur local (seulement localhost).
- `js/save.js` (réglages de l'appareil : mode, son ; clé `antikor-settings`), `js/meta.js` (lecture de `prog` avec les règles : talents, armes possédées, arme équipée), `js/audio.js` (sons), `js/input.js` (clavier, joystick), `js/icons.js` (icônes SVG), `js/util.js`, `js/config.js` (`VERSION`, `SERVER_URL`).
- Les deux fichiers de dessins (`js/icons.js`, `js/render/sprites.js`) restent volontairement compacts ; inutile de les lire pour comprendre le jeu.

### Points clés

- **Écrans** (`.screen`, affichés avec `show(id)`) : `scr-login`, `scr-menu`, `scr-rank`, `scr-lab`, `scr-inv`, `scr-map`, `scr-level`, `scr-shop`, `scr-pause`, `scr-over`. Plus le calque `#box-open` et `#map-pop`.
- **CSS :** variables de couleur dans `:root` (`css/base.css` : `--cyan`, `--mag`, `--gold`, `--core`…). Coins coupés avec la classe `.cut`, polices Bungee (titres) et Chakra Petch (texte).
- **État :** `G` la partie, `G.players` les joueurs, `P` le joueur « courant » (utilisé par le code des armes, changé avec `withP()`), `ME` l'index du joueur local, `WM` le multiplicateur de dégâts de la rareté pendant la mise à jour d'une arme.
- **Progression** (`prog`, reçue du serveur, ne jamais la modifier côté jeu) : `cores`, `talents`, `inv` (`[{u,id,r}]`), `equip`, `uid`, `boxes {std,prem}`, `career {max,stars}`, `best`, `runs`, `wins`, `totalKills`, `stats {dmg, maxLevel, maxCombo}`, `skins`, `skin`, `halloween`, `daily {last, day}`. **Réglages locaux** (`save`, `persist()`) : `mode`, `muted`.
- **Boucle :** `frame()` → `stepGame()` → `update()` (simulation ; en duo `duoUpdate()` à la place) → `render()` → `updateHUD()`. En duo, `G.online` est vrai et `act()` envoie les actions au serveur.
- **Pour le futur serveur** (phase 0 du bilan serveur, faite en v0.8.2) : la simulation n'a plus de lien avec la page, les sprites sont créés dans `initSprites()`, la sauvegarde est sortie de `newRun`, et `tests/sim-bench.mjs` fait tourner une partie sous Node. Le serveur fixe `view` avec `setView(560, 340)` ; les références directes entre objets (`b.tg`, `w.tgs`, `G.boss`) restent dans le worker et ne sont jamais envoyées.
- **Débogage :** `window.__AK` expose `G`, `P`, `startGame`, `act`, `chooseLevel`, `keys` et `tick(dt)` (une étape de simulation, pour les tests).

## Méthode de travail

- Le jeu se teste avec un serveur local (les modules ne s'ouvrent pas en double-cliquant sur `index.html`) : `python3 -m http.server 8765 --bind 127.0.0.1` dans le dossier du dépôt, puis http://127.0.0.1:8765/.
- **Mise en forme :** une instruction par ligne, réglages Prettier dans `.prettierrc.json` (`npx prettier --write js css tests`). Les fichiers de dessins sont exclus (`.prettierignore`).
- **Contrôles avant de pousser :**
  - `node --check` sur les fichiers modifiés, et vérifier qu'aucun module de `js/sim/` n'importe depuis `ui/`, `render/`, `net/`, `save.js`, `audio.js` ou `input.js` ;
  - `node tests/sim-bench.mjs [ticks] [mode] [niveau] [--duo] [--mortel]` : une partie sous Node, avec le temps par tick ;
  - **tests dans un vrai navigateur avec Playwright** (Chromium déjà installé) : piloter la partie via `__AK` (forcer l'XP, `G.waveT=G.waveDur` pour finir une vague, PV infinis…), prendre des captures et les regarder, vérifier qu'il n'y a pas d'erreur console, l'absence de défilement du menu (1280×720 à 1920×1080) et le rendu mobile (390×844).
- **Pour un changement qui ne doit rien changer au jeu** (réorganisation) : remplacer `Math.random` par un générateur à graine et `performance.now` par une horloge simulée, appeler `__AK.tick(1/60)` en boucle avec des touches scriptées, et comparer la trace (vague, éliminations, positions, PV, XP…) avec celle de la version précédente. Elle doit être identique. C'est ainsi qu'a été vérifié le découpage de la v0.8.2.
- Pièges déjà rencontrés :
  - les identifiants HTML en double (par exemple `btn-next` existe déjà dans la boutique) ;
  - Playwright refuse de cliquer sur un élément `aria-disabled` : utiliser `{force:true}` ;
  - une variable importée (`G`, `P`, `joy`…) ne peut pas être réaffectée depuis un autre module : passer par sa fonction `set…()`.
- **Tester avec un serveur local** (le jeu ne marche plus sans serveur) : cloner AntiBack à côté de ce dépôt, `npm install`, puis `ALLOWED_ORIGINS=http://127.0.0.1:8765 PORT=3010 DB_PATH=/tmp/ak.db node src/server.js` dans AntiBack, et ouvrir http://127.0.0.1:8765/?server=ws://127.0.0.1:3010/ws. L'environnement de développement ne peut pas joindre le vrai serveur (rpi5.tail085c70.ts.net).

## Historique des versions

- **0.1–0.2 :** fichier d'origine « Néon Horde » mis sur GitHub Pages.
- **0.3 :** duo en ligne PeerJS (hôte avec code, lien d'invitation, réanimation, boutiques séparées), puis journal de connexion et configuration STUN/TURN.
- **0.4 :** raretés, box, inventaire, fusion ; 4 nouvelles armes ; numéro de version visible.
- **0.5 :** duo suspendu ; icônes des talents ; box déplacées dans le labo ; 4 designs de boss.
- **0.6 :** icône du site (monstre vert), box dans le labo sans sous-menu, emplacements d'armes (talent Arsenal), abandon sans noyaux.
- **0.7 :** renommage en **Antikor**, bouton Labo attractif, nouvelles box en capsule. **0.7.1 :** Labo en haut à droite, JOUER plus gros. **0.7.2 :** noyaux violets et pièces dorées, infobulles, fond de boss. **0.7.3 :** fond de boss = grille d'origine éclaircie. **0.7.4 :** logo sur une ligne.
- **0.8 :** mode Carrière (25 niveaux, carte, étoiles), 5 fonds de monde, Tourelle et Servomoteur.
- **0.8.1 :** carte en pleine largeur sur PC, « ? » sur les box, Arsenal lié aux mondes, joystick fixe.
- **0.9.0 :** **comptes obligatoires** et progression sur le serveur AntiBack (écran de connexion, plusieurs appareils, reconnexion automatique, box tirées et récompenses calculées par le serveur, résultats de partie vérifiés), règles partagées dans `js/rules.js`, ancien duo PeerJS supprimé.
- **1.2.0 :** seconde moitié de `TODO.md` : XP par paliers (niveau 12 bien plus long), 4 germes de plus (deux par monde ; en Infini, deux nouveaux toutes les 10 vagues jusqu'à la 41e), 4 événements (spores, fièvre, ruée d'or, essaim), skins et Box Halloween unique, cadeau du jour sur 7 jours, joueurs arrêtés à chaque niveau sur la carte, codes promo cachés (SINGE). Protocole 4.
- **1.1.0 :** première moitié de `TODO.md` : noyaux de l'Infini réduits sous son record, 4 nouveaux germes (un par monde), Arsenal limité à 3 armes et lié aux mondes 2 et 3, épreuves de fin de monde, raretés moins fortes et armes rééquilibrées, box à 80 et 140 noyaux (plus de Mythique dans la Box Souche).
- **0.10.0 (« 1.0 ») :** **duo en ligne par le serveur** (salle avec code, l'hôte lance, Carrière et Infini, partie calculée par le serveur, anticipation du déplacement, attente de 30 s en cas de coupure, reprise après rechargement) et **classement** (top 15, 9 statistiques). Protocole 3.
- **0.8.3 :** fin de partie sans cartes « Bourse »/« Soin » (soin automatique quand tout est au maximum), plus d'infobulle sur les box, la relance de la boutique ne repropose pas l'achat qui vient d'être fait, +15 % d'XP par niveau.
- **0.8.2 :** réorganisation du code sans changement de jeu : découpage en modules (`css/`, `js/data`, `js/sim`, `js/render`, `js/ui`, `js/net`), simulation séparée de la page (phase 0 du bilan serveur), test Node `tests/sim-bench.mjs`, chemin de l'icône iOS corrigé.

## Pistes en attente

- **Fluidité du duo** (phase 4) : à mesurer en vrai sur le Pi (débit de Funnel avec beaucoup d'ennemis) ; pistes : instantanés des ennemis moins fréquents, format binaire.
- **Difficulté du duo** : les ennemis ne sont pas plus nombreux ni plus résistants à deux (comme l'ancien duo) ; à ajuster selon les retours.
- **Équilibrage :** les chiffres de difficulté de la carrière, des prix et des chances des box sont un premier réglage, à ajuster selon les retours.
- Idées proposées mais pas encore validées :
  - box quotidienne ;
  - défis qui rapportent des box ;
  - garantie d'une Épique toutes les 10 box ;
  - boomerang ;
  - effets uniques pour les armes Mythiques ;
  - améliorations au-delà du niveau 5 quand tous les emplacements d'armes sont pris.
