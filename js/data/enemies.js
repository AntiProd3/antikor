// Types d’ennemis et variantes de boss.

export const ETYPES = {
  walker: { r: 14, hp: 12, spd: 62, dmg: 10, xp: 1, col: '#8dff5a', kb: 1, coin: 0.35 },
  runner: { r: 11, hp: 8, spd: 128, dmg: 8, xp: 1, col: '#ff9b3d', kb: 1.2, coin: 0.3 },
  tank: { r: 24, hp: 85, spd: 44, dmg: 20, xp: 5, col: '#a66bff', kb: 0.3, coin: 0.8 },
  spitter: { r: 15, hp: 20, spd: 58, dmg: 9, xp: 2, col: '#f2ff4a', kb: 1, coin: 0.45 },
  bomber: { r: 13, hp: 14, spd: 100, dmg: 24, xp: 2, col: '#ff4a3d', kb: 1, coin: 0.4 },
  splitter: { r: 18, hp: 28, spd: 58, dmg: 12, xp: 2, col: '#ff5ad8', kb: 0.8, coin: 0.4 },
  mini: { r: 10, hp: 7, spd: 96, dmg: 7, xp: 1, col: '#ff5ad8', kb: 1.3, coin: 0.1 },
  boss: { r: 50, hp: 800, spd: 60, dmg: 26, xp: 0, col: '#ff3d8b', kb: 0.04, coin: 0 },
  // v1.1 : un nouveau germe par monde (w = monde où il apparaît, 0 = Épiderme). Toujours ajoutés à la fin :
  // l'ordre de cette liste sert d'identifiant dans les instantanés du duo.
  dasher: { r: 12, hp: 16, spd: 70, dmg: 14, xp: 2, col: '#5ab0ff', kb: 1, coin: 0.4, w: 1, name: 'Piqueur' },
  healer: { r: 15, hp: 30, spd: 55, dmg: 8, xp: 3, col: '#eafff7', kb: 0.9, coin: 0.5, w: 2, name: 'Leucocyte' },
  brood: { r: 20, hp: 60, spd: 40, dmg: 14, xp: 4, col: '#c8ff3e', kb: 0.5, coin: 0.6, w: 3, name: 'Pondeuse' },
  blinker: { r: 13, hp: 22, spd: 75, dmg: 13, xp: 3, col: '#4affe0', kb: 1, coin: 0.5, w: 4, name: 'Neurone' },
};

// Réglages des comportements des nouveaux germes
export const MOB = {
  dasher: { range: 260, aim: 0.55, dash: 0.4, speed: 520, rest: 2.2 }, // vise, fonce, se repose
  healer: { keep: 250, every: 3, R: 150, heal: 0.25 }, // garde ses distances, soigne 25 % des PV autour de lui
  brood: { every: 3.5, n: 2, max: 6 }, // pond 2 petits germes toutes les 3,5 s (6 au plus)
  blinker: { every: [3.5, 5], warn: 0.5, near: [90, 130] }, // clignote puis réapparaît près du joueur
};

export const MAX_E = 380;

// seq = enchaînement des attaques ; hp/spd = multiplicateurs ; summon = renforts appelés
export const BOSSV = {
  crown: {
    name: 'La Couronne',
    col: '#ff3d8b',
    draw: 'boss',
    seq: ['tele', 'ring', 'summon'],
    hp: 1,
    spd: 1,
    summon: ['runner'],
  },
  hive: {
    name: 'La Ruche',
    col: '#f2ff4a',
    draw: 'bhive',
    seq: ['summon', 'ring', 'summon', 'tele'],
    hp: 0.9,
    spd: 0.85,
    summon: ['walker', 'bomber', 'runner'],
  },
  eye: {
    name: 'L’Œil',
    col: '#3ea8ff',
    draw: 'beye',
    seq: ['spiral', 'tele', 'ring'],
    hp: 0.95,
    spd: 0.9,
    summon: ['spitter'],
  },
  titan: {
    name: 'Le Titan',
    col: '#ff6a2a',
    draw: 'btitan',
    seq: ['tele', 'ring', 'tele', 'tele'],
    hp: 1.35,
    spd: 0.75,
    dash: 900,
    summon: ['tank'],
  },
};
