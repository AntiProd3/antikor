// Les 15 armes : nom, couleur, textes, statistiques par niveau (1 à 5) et évolution.
// Le comportement de chaque arme (comment elle tire) est dans js/sim/weapons.js.

export const WEAPONS = {
  blaster: {
    name: 'Blaster',
    col: '#3ef2ff',
    evoWith: 'lens',
    evoName: 'Railgun',
    evoDesc: 'Rayon instantané qui transperce toute la ligne. +15% de chance de critique.',
    up: [
      'Tire sur l’ennemi le plus proche.',
      '+Dégâts, perce 1 ennemi.',
      '+1 projectile.',
      '+Dégâts, perce 2 ennemis.',
      '+1 projectile, +Dégâts.',
    ],
    stats(l) {
      return {
        dmg: [14, 17, 21, 26, 32][l - 1],
        cd: [0.55, 0.5, 0.48, 0.44, 0.4][l - 1],
        n: [1, 1, 2, 2, 3][l - 1],
        pierce: [0, 1, 1, 2, 2][l - 1],
      };
    },
  },
  shotgun: {
    name: 'Fusil à pompe',
    col: '#ffb03e',
    evoWith: 'powder',
    evoName: 'Souffle du dragon',
    evoDesc: '14 plombs incendiaires qui percent 2 ennemis. Recul énorme.',
    up: [
      'Gerbe de plombs à courte portée, fort recul.',
      '+1 plomb, +Dégâts.',
      '+1 plomb, tire plus vite.',
      '+1 plomb, +Dégâts.',
      '+1 plomb, tire plus vite.',
    ],
    stats(l) {
      return { dmg: [10, 14, 19, 26, 36][l - 1], n: [5, 6, 7, 8, 9][l - 1], cd: [1.25, 1.15, 1.05, 0.95, 0.85][l - 1] };
    },
  },
  drones: {
    name: 'Drones orbitaux',
    col: '#5ad1ff',
    evoWith: 'boots',
    evoName: 'Couronne de lames',
    evoDesc: '7 lames géantes tournent vite et loin. Dégâts massifs.',
    up: [
      'Deux lames tournent autour de toi.',
      '+Dégâts, rotation plus rapide.',
      '+1 lame.',
      '+Dégâts, rotation plus rapide.',
      '+1 lame, +Dégâts.',
    ],
    stats(l) {
      return { n: [2, 2, 3, 3, 4][l - 1], dmg: [9, 12, 16, 22, 30][l - 1], rot: [2.6, 2.9, 3, 3.3, 3.5][l - 1] };
    },
  },
  arc: {
    name: 'Arc électrique',
    col: '#c3b5ff',
    evoWith: 'trigger',
    evoName: 'Tempête',
    evoDesc: 'Trois éclairs à la fois, 8 rebonds, paralyse les ennemis touchés.',
    up: [
      'Un éclair frappe un ennemi puis rebondit.',
      '+1 rebond, +Dégâts.',
      '+1 rebond, tire plus vite.',
      '+1 rebond, +Dégâts.',
      '+1 rebond, tire plus vite.',
    ],
    stats(l) {
      return { dmg: [16, 21, 28, 35, 44][l - 1], ch: [2, 3, 4, 5, 6][l - 1], cd: [1.2, 1.1, 1, 0.95, 0.85][l - 1] };
    },
  },
  disc: {
    name: 'Disque',
    col: '#ff6ad5',
    evoWith: 'amp',
    evoName: 'Scie géante',
    evoDesc: 'Quatre scies énormes qui traversent tout à l’aller comme au retour.',
    up: [
      'Lance un disque qui traverse les ennemis et revient.',
      '+Dégâts.',
      '+1 disque.',
      '+Dégâts, lancers plus rapides.',
      '+1 disque, +Dégâts.',
    ],
    stats(l) {
      return { n: [1, 1, 2, 2, 3][l - 1], dmg: [12, 15, 18, 22, 27][l - 1], cd: [1.7, 1.6, 1.5, 1.4, 1.3][l - 1] };
    },
  },
  molotov: {
    name: 'Molotov',
    col: '#ff7a2a',
    evoWith: 'hourglass',
    evoName: 'Napalm',
    evoDesc: 'Quatre bombes de napalm : zones immenses qui brûlent 5 secondes et ralentissent.',
    up: [
      'Lance une bouteille qui embrase le sol.',
      '+Dégâts, zone plus large.',
      '+1 bouteille.',
      '+Dégâts, zone plus large.',
      '+1 bouteille, +Dégâts.',
    ],
    stats(l) {
      return {
        n: [1, 1, 2, 2, 3][l - 1],
        dmg: [5, 6, 8, 10, 12][l - 1],
        R: [50, 55, 60, 66, 74][l - 1],
        cd: [2.4, 2.3, 2.2, 2, 1.8][l - 1],
      };
    },
  },
  mines: {
    name: 'Mines',
    col: '#ffe14a',
    evoWith: 'clover',
    evoName: 'Fragmentation',
    evoDesc: 'Explosions géantes qui projettent 8 éclats tranchants.',
    up: [
      'Pose des mines derrière toi. Elles explosent au contact.',
      '+Dégâts, explosion plus large.',
      'Pose plus souvent, +Dégâts.',
      '+Dégâts, explosion plus large.',
      'Pose plus souvent, +Dégâts.',
    ],
    stats(l) {
      return {
        dmg: [25, 32, 39, 47, 56][l - 1],
        R: [65, 70, 76, 84, 92][l - 1],
        cd: [1.5, 1.4, 1.3, 1.2, 1.05][l - 1],
      };
    },
  },
  rockets: {
    name: 'Roquettes',
    col: '#ff4f6a',
    evoWith: 'dup',
    evoName: 'Essaim',
    evoDesc: 'Une salve de 8 mini-roquettes à tête chercheuse.',
    up: [
      'Roquette à tête chercheuse qui explose à l’impact.',
      '+Dégâts, explosion plus large.',
      '+1 roquette.',
      '+Dégâts, explosion plus large.',
      '+1 roquette, +Dégâts.',
    ],
    stats(l) {
      return {
        n: [1, 1, 2, 2, 3][l - 1],
        dmg: [28, 34, 42, 52, 62][l - 1],
        R: [50, 54, 58, 64, 70][l - 1],
        cd: [1.9, 1.8, 1.7, 1.6, 1.45][l - 1],
      };
    },
  },
  aura: {
    name: 'Champ de force',
    col: '#4affc4',
    evoWith: 'armor',
    evoName: 'Bastion',
    evoDesc: 'Champ immense qui ralentit tout, plus une onde de choc régulière.',
    up: [
      'Blesse et repousse les ennemis autour de toi.',
      'Champ plus large, +Dégâts.',
      'Champ plus large, +Dégâts.',
      'Champ plus large, +Dégâts.',
      'Champ plus large, +Dégâts.',
    ],
    stats(l) {
      return { R: [70, 80, 90, 100, 112][l - 1], dmg: [5, 7, 9, 11, 14][l - 1] };
    },
  },
  laser: {
    name: 'Laser rotatif',
    col: '#ff3df0',
    evoWith: 'regen',
    evoName: 'Prisme',
    evoDesc: 'Quatre faisceaux arc-en-ciel très longs qui balaient l’écran.',
    up: [
      'Un faisceau tourne autour de toi.',
      'Plus long, +Dégâts.',
      'Plus long, rotation plus rapide.',
      '+1 faisceau.',
      'Plus long, +Dégâts.',
    ],
    stats(l) {
      return {
        n: [1, 1, 1, 2, 2][l - 1],
        len: [150, 175, 200, 220, 250][l - 1],
        dmg: [3, 4, 7, 9, 12][l - 1],
        rot: [1.6, 1.8, 2, 2.1, 2.3][l - 1],
      };
    },
  },
  turret: {
    name: 'Tourelle',
    col: '#3effd2',
    evoWith: 'servo',
    evoName: 'Sentinelles',
    evoDesc: 'Trois tourelles volantes qui te suivent partout et tirent en rafale perçante.',
    up: [
      'Pose une tourelle fixe qui tire sur les ennemis proches.',
      '+Dégâts, tir plus rapide.',
      '+1 tourelle.',
      '+Dégâts, tourelles plus durables.',
      '+1 tourelle, les tirs percent.',
    ],
    stats(l) {
      return {
        dmg: [12, 15, 20, 26, 33][l - 1],
        cd: [0.55, 0.48, 0.46, 0.42, 0.38][l - 1],
        n: [1, 1, 2, 2, 3][l - 1],
        dur: [9, 9, 10, 12, 12][l - 1],
        pierce: [0, 0, 0, 0, 1][l - 1],
      };
    },
  },
  flamer: {
    name: 'Lance-flammes',
    col: '#ff8a2a',
    evoWith: 'fuel',
    evoName: 'Enfer',
    evoDesc: 'Flammes bleues devant et derrière toi, brûlure deux fois plus forte.',
    up: [
      'Crache un cône de feu qui enflamme les ennemis.',
      '+Dégâts, cône plus long.',
      'Brûlure plus forte, cône plus large.',
      '+Dégâts, cône plus long.',
      '+Dégâts, brûlure plus forte.',
    ],
    stats(l) {
      return {
        dmg: [3.5, 4.5, 5, 7, 8.5][l - 1],
        len: [115, 130, 140, 155, 170][l - 1],
        w: [0.42, 0.42, 0.5, 0.5, 0.55][l - 1],
        burn: [3, 3, 5, 6, 8][l - 1],
      };
    },
  },
  cryo: {
    name: 'Rayon cryo',
    col: '#8fe8ff',
    evoWith: 'chip',
    evoName: 'Zéro absolu',
    evoDesc: 'Quatre rayons qui gèlent presque instantanément. Les ennemis gelés éclatent en éclats de glace.',
    up: [
      'Un rayon glacial ralentit puis gèle sa cible.',
      '+Dégâts, portée accrue.',
      '+1 rayon.',
      'Gel plus rapide, +Dégâts.',
      '+1 rayon, +Dégâts.',
    ],
    stats(l) {
      return {
        dmg: [4.5, 8, 11, 15, 21][l - 1],
        R: [230, 250, 260, 280, 300][l - 1],
        n: [1, 1, 2, 2, 3][l - 1],
        fz: [1.6, 1.5, 1.4, 1.1, 1][l - 1],
      };
    },
  },
  katana: {
    name: 'Katana néon',
    col: '#b6ff3e',
    evoWith: 'heart',
    evoName: 'Lame vampire',
    evoDesc: 'Une frappe circulaire géante qui te soigne pour chaque ennemi touché.',
    up: [
      'Tranche en arc devant toi.',
      '+Dégâts, lame plus longue.',
      'Frappe aussi derrière toi.',
      '+Dégâts, frappe plus vite.',
      '+Dégâts, lame plus longue.',
    ],
    stats(l) {
      return {
        dmg: [24, 30, 36, 44, 54][l - 1],
        R: [78, 86, 90, 96, 106][l - 1],
        n: [1, 1, 2, 2, 2][l - 1],
        cd: [1.05, 1, 0.95, 0.85, 0.8][l - 1],
      };
    },
  },
  singular: {
    name: 'Singularité',
    col: '#9d7bff',
    evoWith: 'magnet',
    evoName: 'Horizon',
    evoDesc: 'Deux trous noirs géants qui aspirent tout, puis une explosion dévastatrice.',
    up: [
      'Ouvre un trou noir qui aspire les ennemis puis explose.',
      '+Dégâts, attraction plus large.',
      'Dure plus longtemps, +Dégâts.',
      '+1 trou noir.',
      'Explosion plus forte, attraction plus large.',
    ],
    stats(l) {
      return {
        n: [1, 1, 1, 2, 2][l - 1],
        dmg: [2, 3, 4, 4, 5][l - 1],
        boom: [16, 20, 25, 26, 30][l - 1],
        R: [105, 115, 120, 125, 140][l - 1],
        dur: [2, 2, 2.5, 2.5, 2.8][l - 1],
        cd: [4.2, 4, 3.8, 3.6, 3.3][l - 1],
      };
    },
  },
};
