# Antikor

Jeu d'arcade néon en HTML/CSS/JavaScript sans dépendance, publié avec GitHub Pages. Un compte est nécessaire pour jouer : la progression est gardée sur le serveur du jeu et suit le joueur sur tous ses appareils. Le corps est envahi par des germes : tu es sa dernière défense.

(Anciennement « Néon Horde », renommé en v0.7 ; les sauvegardes sont reprises automatiquement.)

- Jouer : https://antiprod3.github.io/antikor/
- Code : `index.html` (écrans), `css/` (styles), `js/` (jeu : `data/` réglages, `sim/` simulation, `render/` dessin, `ui/` interface, `online/` connexion au serveur) ; `js/rules.js` contient les règles de progression partagées avec le serveur
- En local : lancer un petit serveur dans le dossier (`python3 -m http.server`) puis ouvrir http://localhost:8000/ (ouvrir le fichier directement ne marche pas avec les modules)

Version actuelle : **1.2.2** (affichée en bas à droite du jeu).

## Armes, raretés et box

- On commence avec un **Blaster commun** (et une Box Souche offerte).
- Les **box** s'achètent avec les noyaux (Box Souche 80, sans Mythique ; Box Mutante 140) ou se gagnent sur les boss et parfois les élites.
- 5 raretés : Commun, Rare, Épique, Légendaire, Mythique. Plus c'est rare, plus l'arme est forte (dégâts, recharge, zone ; Légendaire et Mythique commencent niveau 2, Mythique +1 projectile).
- **Inventaire** (menu uniquement) : équiper son arme de départ, fusionner 3 exemplaires identiques en une rareté supérieure.
- En partie, seules les armes possédées apparaissent, avec la meilleure rareté possédée.
- **1 seule arme à la fois** au départ ; le talent **Arsenal** du labo ajoute des emplacements : 2 armes à partir du monde 2 (120 noyaux), 3 armes à partir du monde 3 (260 noyaux), c'est le maximum.
- Une partie abandonnée ne rapporte aucun noyau (les box trouvées sont conservées).
- 15 armes, dont Lance-flammes, Rayon cryo, Katana néon, Singularité (0.4) et Tourelle (0.8, évolution « Sentinelles » : tourelles volantes qui suivent le joueur).

## Skins et cadeau du jour (v1.2)

- **Skins** : l'apparence du vaisseau, sans effet sur la partie. Ils ne s'achètent pas : on les obtient avec la **Box Halloween** (199 noyaux, une seule par joueur, un des 4 skins d'Halloween) et la box du cadeau du 7e jour.
- **Cadeau du jour** : en se connectant chaque jour, des noyaux, des box Souche et Mutante, et une box de skin le 7e jour d'affilée. Un jour manqué fait repartir au jour 1.
- Sur la **carte**, à côté de chaque niveau : les 3 meilleurs joueurs arrêtés à ce niveau.
- **Codes promo** : il existe un passage secret pour les saisir…
- **Mutation** (v1.2.2) : tous les talents au maximum et le monde 3 atteint ? On peut muter : talents et noyaux repartent de zéro, mais on gagne pour toujours +10 % de dégâts, +10 % de PV et +15 % de noyaux, et un badge M1, M2 puis M3 (3 mutations au plus).

## Boss

Quatre boss au style néon, chacun avec ses attaques : **La Ruche** (renforts), **L'Œil** (spirales de projectiles), **Le Titan** (charges rapides, très résistant) et **La Couronne** (boss final).

## Carrière (v0.8)

- 25 niveaux répartis en 5 mondes (Épiderme, Plasma, Lymphe, Moelle, Cortex), chacun avec son fond néon.
- Chaque niveau : 10 manches, boss aux manches 5 et 10. La difficulté monte doucement dans un niveau et de façon linéaire d'un niveau à l'autre.
- Carte façon « chemin » : niveau suivant débloqué en cas de victoire, 1 à 3 étoiles selon les PV restants (40 % et 75 %).
- Bonus de noyaux au premier passage et pour chaque nouvelle étoile ; Box Mutante sur le boss de fin de monde.
- Le dernier niveau de chaque monde (5, 10, 15, 20, 25) est une **épreuve** : ennemis et boss bien plus coriaces.
- Chaque monde amène deux nouveaux germes : Piqueur et Plaquette (Plasma), Leucocyte et Anticorps (Lymphe), Pondeuse et Ostéoclaste (Moelle), Neurone et Synapse (Cortex).
- Plus d'événements en pleine vague : encerclement, nuée, mur, pluie de spores, fièvre, ruée d'or, essaim.
- Les niveaux du héros demandent de plus en plus d'XP (par paliers, comme dans Minecraft) : atteindre le niveau 12 est un vrai objectif.
- Le mode **Infini** reste disponible (le fond et les nouveaux germes arrivent toutes les 10 vagues). Les vagues sous son record rapportent très peu de noyaux : il faut battre son record pour en gagner beaucoup.

## Compte et modes

- **Compte obligatoire** : pseudo et mot de passe. Noyaux, armes, talents, box et carrière sont gardés sur le serveur du jeu (un Raspberry Pi) et suivent le joueur sur tous ses appareils. Les box sont tirées au sort par le serveur, et les récompenses de fin de partie sont calculées par le serveur après vérification du résultat.
- **Solo** : la partie tourne sur l'appareil ; le serveur enregistre le début et la fin.
- **Duo en ligne** (v0.10) : l'un crée une salle et donne son code (5 caractères), l'autre le saisit. L'hôte choisit le mode (Carrière ou Infini) et lance. La partie tourne sur le serveur ; chacun joue sur son appareil avec la progression de son compte et reçoit ses propres récompenses. Pas de pause en duo (le menu pause reste accessible). Si un joueur perd la connexion, la partie l'attend 30 secondes ; au-delà, l'autre continue seul.
- **Classement** (v0.10) : top 15 de tous les joueurs pour 9 statistiques (meilleure manche en Infini, étoiles, niveaux de carrière, éliminations, dégâts, niveau du héros, combo, victoires, parties), avec sa propre place.
