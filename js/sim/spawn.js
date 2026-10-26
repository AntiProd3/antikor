// Difficulté et apparition des ennemis (vagues normales, élites, événements).

import { FINALE, worldOf } from '../data/career.js';
import { ETYPES, EVENT, MAX_E, MOB } from '../data/enemies.js';
import { toast } from './fx.js';
import { focusPl, nearestPl } from './player.js';
import { G, view } from './state.js';
import { TAU, clamp, pick, rand } from '../util.js';

// Carrière : la difficulté monte doucement dans un niveau (t) et linéairement d'un niveau à l'autre (k)
export function careerT() {
  return clamp((G.wave - 1 + clamp(G.waveT / G.waveDur, 0, 1)) / 10, 0, 1);
}

export function progress() {
  const f = clamp(G.waveT / G.waveDur, 0, 1);
  if (G.M.endless) return (G.wave - 1 + f) / 9;
  if (G.M.career) {
    const k = G.M.level - 1;
    return Math.min(1.6, 0.05 + 0.045 * k + 0.6 * careerT() + (G.M.finale ? FINALE.density : 0));
  }
  return Math.min(1.25, (G.wave - 1 + f) / (G.M.waves - 1));
}

export function computeScale(p) {
  if (G && G.M.career) {
    const k = G.M.level - 1,
      t = careerT();
    const F = G.M.finale ? FINALE : { hp: 1, dmg: 1, spd: 1 };
    return {
      hp: (1 + 0.13 * k) * (1 + 1.7 * t + 2.4 * t * t) * F.hp,
      spd: Math.min(1.5, (1 + 0.015 * k + 0.2 * t) * F.spd),
      dmg: (1 + 0.09 * k) * (1 + 1.2 * t) * F.dmg,
    };
  }
  const q = Math.min(p, 1.6);
  return { hp: 1 + 1.6 * p + 8 * p * p * p, spd: 1 + 0.22 * q, dmg: 1 + 1.3 * p };
}

export function spawnEnemy(type, x, y, o = {}) {
  const T = ETYPES[type];
  const sc = G.scale;
  const el = !!o.elite;
  const e = {
    id: ++G.eid,
    type,
    x,
    y,
    r: T.r * (el ? 1.5 : 1),
    hp: T.hp * sc.hp * (el ? 9 : 1) * (o.hpMul || 1),
    spd: T.spd * sc.spd * (el ? 0.85 : 1) * rand(0.92, 1.08),
    dmg: T.dmg * sc.dmg * (el ? 1.5 : 1),
    xp: T.xp * (el ? 12 : 1),
    col: T.col,
    kx: 0,
    ky: 0,
    flash: 0,
    stun: 0,
    slowT: 0,
    slowV: 0,
    t: rand(10),
    hc: {},
    elite: el,
    kbRes: el ? 0.25 : T.kb,
    ang: 0,
    shootT: rand(1, 2.5),
    fuse: 0,
    dead: false,
  };
  const tp = nearestPl(x, y) || G.players[0];
  e.ang = Math.atan2(tp.y - y, tp.x - x);
  e.maxHp = e.hp;
  G.enemies.push(e);
  return e;
}

export function spawnPos(extra = 0, F = focusPl()) {
  let a = rand(TAU);
  const mv = Math.hypot(F.vx, F.vy);
  if (mv > 40 && Math.random() < 0.6) a = Math.atan2(F.vy, F.vx) + rand(-1.4, 1.4);
  const R = Math.hypot(view.hw, view.hh) + 40 + extra;
  return [F.x + Math.cos(a) * R, F.y + Math.sin(a) * R, a];
}

// Monde en cours : celui du niveau en carrière ; en Infini, il change toutes les 10 vagues (avec le fond)
export function worldIndex() {
  if (G.M.career) return worldOf(G.M.level);
  return Math.min(4, Math.floor((G.wave - 1) / 10));
}

// Germes propres aux mondes (v1.1) : chacun arrive dans son monde, plus nombreux dans celui-ci, et reste ensuite
const WORLD_MOBS = [
  ['dasher', 2.5],
  ['healer', 1.2],
  ['brood', 1.4],
  ['blinker', 2],
  ['zigzag', 1.6],
  ['latcher', 2],
  ['spiker', 1.8],
  ['pulser', 1.8],
];

export function pickType(p) {
  const w = worldIndex();
  const W = [
    ['walker', 10],
    ['runner', p > 0.08 ? 4 + 4 * p : 0],
    ['splitter', p > 0.25 ? 3 : 0],
    ['spitter', p > 0.3 ? 2.5 : 0],
    ['bomber', p > 0.38 ? 3 : 0],
    ['tank', p > 0.45 ? 2 + 3 * p : 0],
  ];
  for (const [t, wt] of WORLD_MOBS) {
    const tw = ETYPES[t].w;
    if (w >= tw) W.push([t, wt * (w === tw ? 1.8 : 1)]);
  }
  let tot = 0;
  for (const w of W) tot += w[1];
  let r = Math.random() * tot;
  for (const w of W) {
    r -= w[1];
    if (r <= 0) return w[0];
  }
  return 'walker';
}

export function spawnTick(dt, p) {
  const f = clamp(G.waveT / G.waveDur, 0, 1);
  let iv = Math.max(0.07, 0.72 - 0.62 * Math.min(p, 1)) / (0.75 + 0.6 * f);
  if (G.isBoss) iv *= 1.8;
  if (p > 1) iv /= 1 + (p - 1) * 1.5;
  G.spawnT -= dt;
  let guard = 0;
  while (G.spawnT <= 0 && guard++ < 20) {
    G.spawnT += iv;
    if (G.enemies.length >= MAX_E) {
      G.spawnT = 0.2;
      break;
    }
    let n = 1;
    if (Math.random() < p * 0.8) n++;
    if (Math.random() < p - 0.6) n++;
    const type = pickType(p);
    if (type === 'zigzag') n += MOB.zigzag.pack;
    const [x, y] = spawnPos();
    for (let i = 0; i < n; i++) spawnEnemy(type, x + rand(-30, 30), y + rand(-30, 30));
  }
  G.eventT -= dt;
  if (G.eventT <= 0) {
    G.eventT = rand(9, 13) * (G.isBoss ? 1.5 : 1) * (G.M.finale ? FINALE.events : 1);
    if (p > 0.15) spawnEvent(p);
  }
  if (!G.eliteDone && G.waveT > G.waveDur * 0.45) {
    G.eliteDone = true;
    const tp = p > 0.4 ? pick(['tank', 'splitter', 'walker']) : 'walker';
    const [x, y] = spawnPos();
    spawnEnemy(tp, x, y, { elite: true });
    toast('ÉLITE', 'Un monstre doré approche. Il lâche un coffre.', '#ffd23e');
  }
}

// Événements en pleine vague (« happenings »). Chacun a un poids et une condition (difficulté p, monde).
export function spawnEvent(p) {
  const w = worldIndex();
  const EV = [
    ['encircle', 4.5],
    ['swarm', 3.5],
    ['wall', p > 0.45 ? 2 : 0],
    ['splitters', p <= 0.45 ? 2 : 0.6],
    ['spores', p > 0.25 ? 2.2 : 0], // v1.2
    ['fever', p > 0.35 ? 1.6 : 0],
    ['gold', 1.2],
    ['pack', w >= 1 ? 2 : 0],
  ];
  let tot = 0;
  for (const e of EV) tot += e[1];
  let r = Math.random() * tot,
    k = 'encircle';
  for (const e of EV) {
    r -= e[1];
    if (r <= 0) {
      k = e[0];
      break;
    }
  }
  EVENTS[k](p, w);
}

const EVENTS = {
  encircle(p) {
    const R = Math.max(view.hw, view.hh) * 0.95 + 40;
    const F = focusPl();
    const n = Math.round(14 + 16 * Math.min(p, 1.2));
    const tp = p > 0.6 && Math.random() < 0.4 ? 'runner' : 'walker';
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      spawnEnemy(tp, F.x + Math.cos(a) * R, F.y + Math.sin(a) * R);
    }
    toast('ENCERCLEMENT', 'Ils arrivent de partout.', '#ff4a6b');
  },
  swarm(p) {
    const R = Math.max(view.hw, view.hh) * 0.95 + 40;
    const F = focusPl();
    const [, , a] = spawnPos(0, F);
    const n = 10 + Math.round(14 * p);
    const c = Math.cos(a),
      s = Math.sin(a);
    for (let i = 0; i < n; i++) {
      const d = R + rand(0, 140),
        o = rand(-140, 140);
      spawnEnemy('runner', F.x + c * d - s * o, F.y + s * d + c * o);
    }
    toast('NUÉE', 'Coureurs en approche.', '#ff9b3d');
  },
  wall(p) {
    const R = Math.max(view.hw, view.hh) * 0.95 + 40;
    const F = focusPl();
    const [, , a] = spawnPos(0, F);
    const n = 4 + Math.round(4 * p);
    const c = Math.cos(a),
      s = Math.sin(a);
    for (let i = 0; i < n; i++) {
      const o = (i - (n - 1) / 2) * 55;
      spawnEnemy('tank', F.x + c * R - s * o, F.y + s * R + c * o);
    }
    toast('MUR', 'Une ligne de colosses.', '#a66bff');
  },
  splitters() {
    const [x, y] = spawnPos(0, focusPl());
    for (let i = 0; i < 6; i++) spawnEnemy('splitter', x + rand(-50, 50), y + rand(-50, 50));
  },
  // Pluie de spores : des cercles rouges apparaissent autour des joueurs et explosent un peu plus tard
  spores(p) {
    G.sporeT = 5;
    G.sporeK = 0;
    G.sporeDmg = 14 * G.scale.dmg;
    toast('PLUIE DE SPORES', 'Sors des cercles rouges !', '#ff4a3d');
  },
  // Fièvre : tous les germes vont plus vite pendant quelques secondes
  fever() {
    G.feverT = EVENT.fever.time;
    toast('FIÈVRE', 'Les germes s’emballent !', '#ff3d5a');
  },
  // Ruée d'or : des germes dorés fuient le joueur ; les attraper rapporte des pièces
  gold() {
    const F = focusPl();
    const [x, y] = spawnPos(-120, F);
    for (let i = 0; i < EVENT.gold.n; i++) {
      const e = spawnEnemy('walker', x + rand(-60, 60), y + rand(-60, 60));
      e.gold = EVENT.gold.life;
      e.col = '#ffd23e';
    }
    toast('RUÉE D’OR', 'Des germes dorés fuient : rattrape-les !', '#ffd23e');
  },
  // Essaim : une meute du germe propre au monde en cours
  pack(p, w) {
    const pool = Object.keys(ETYPES).filter(t => ETYPES[t].w === w);
    const t = pick(pool);
    const [x, y] = spawnPos(0, focusPl());
    const n = t === 'zigzag' ? 14 : 7;
    for (let i = 0; i < n; i++) spawnEnemy(t, x + rand(-70, 70), y + rand(-70, 70));
    toast('ESSAIM', ETYPES[t].name + ' en meute.', ETYPES[t].col);
  },
};

// Pluie de spores : une spore toutes les 0,35 s pendant l'événement
export function sporeTick(dt) {
  if (!(G.sporeT > 0)) return;
  G.sporeT -= dt;
  G.sporeK -= dt;
  if (G.sporeK > 0) return;
  G.sporeK = 0.35;
  const pl = pick(G.players.filter(q => !q.down)) || G.players[0];
  const a = rand(TAU),
    r = rand(0, 190);
  // une spore sur trois vise exactement l'endroit où va le joueur
  const lead = Math.random() < 0.33 ? 0.9 : 0;
  G.warn.push({
    x: pl.x + pl.vx * lead + (lead ? 0 : Math.cos(a) * r),
    y: pl.y + pl.vy * lead + (lead ? 0 : Math.sin(a) * r),
    R: EVENT.spores.R,
    t: EVENT.spores.delay,
    max: EVENT.spores.delay,
    dmg: G.sporeDmg,
  });
}
