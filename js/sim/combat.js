// Combat : projectiles, dégâts, mort des ennemis, butin, dégâts subis par les joueurs.

import { ETYPES, EVENT, MOB } from '../data/enemies.js';
import { bossDown } from './boss.js';
import {
  addShake,
  addText,
  banner,
  burst,
  decal,
  flashFx,
  fxPush,
  hurtFx,
  muzzle,
  ring,
  sfx,
  textFx,
  toast,
  white,
} from './fx.js';
import { forNear } from './grid.js';
import { hooks } from './hooks.js';
import { alive, plName } from './player.js';
import { spawnEnemy } from './spawn.js';
import { G, P, WM, view } from './state.js';
import { TAU, rand, segDist } from '../util.js';

export function aimAt(a) {
  P.aimT = a;
  P.aimHold = 0.35;
}

export function addB(o) {
  o.id = ++G.bid;
  o.o = P.i;
  o.wm = WM;
  G.bullets.push(o);
}

export function burnE(e, d, t) {
  if (e.burnT <= 0 || !e.burnT || d >= e.burnD) {
    e.burnD = d;
    e.burnO = P.i;
  }
  e.burnT = Math.max(e.burnT || 0, t);
  if (!e.burnK) e.burnK = 0.3;
}

export function shot(x, y, a, spd, dmg, pierce, life, col, r, kb) {
  const c = Math.cos(a),
    s = Math.sin(a);
  addB({ k: 'shot', x, y, vx: c * spd, vy: s * spd, dx: c, dy: s, dmg, pierce, life, col, r, kb, hit: [] });
}

export function railgun(a, dmg) {
  const L = 1100,
    c = Math.cos(a),
    s = Math.sin(a),
    x2 = P.x + c * L,
    y2 = P.y + s * L;
  forNear((P.x + x2) / 2, (P.y + y2) / 2, L / 2, e => {
    if (segDist(e.x, e.y, P.x, P.y, x2, y2) < e.r + 9) dmgEnemy(e, dmg, { critBonus: 0.15, kb: 160, kx: c, ky: s });
  });
  fxPush({
    k: 'beam',
    x1: Math.round(P.x),
    y1: Math.round(P.y),
    x2: Math.round(x2),
    y2: Math.round(y2),
    life: 0.28,
    max: 0.28,
    col: '#bff9ff',
    w: 12,
  });
  muzzle(a, '#bff9ff', 8);
  addShake(3);
}

export function dmgEnemy(e, base, o = {}) {
  if (e.dead) return;
  let d = o.raw ? base : base * P.dmg * WM * (e.elite || e.type === 'boss' ? P.bossDmg : 1);
  let crit = false;
  if (!o.raw && Math.random() < P.crit + (o.critBonus || 0)) {
    d *= P.critMul;
    crit = true;
  }
  d = Math.max(1, Math.round(d));
  e.hp -= d;
  e.flash = 0.08;
  G.dmgDone += d;
  if (P) P.dmgDone += d; // dégâts de chaque joueur (classement)
  if (o.kb) {
    const k = o.kb * e.kbRes;
    let ax = o.kx,
      ay = o.ky;
    if (ax === undefined) {
      const dx = e.x - (o.sx ?? P.x),
        dy = e.y - (o.sy ?? P.y);
      const l = Math.hypot(dx, dy) || 1;
      ax = dx / l;
      ay = dy / l;
    }
    e.kx += ax * k;
    e.ky += ay * k;
  }
  if (o.stun) e.stun = Math.max(e.stun, o.stun);
  if (o.slow) {
    e.slowT = 0.5;
    e.slowV = Math.max(e.slowV * (e.slowT > 0 ? 1 : 0), o.slow);
  }
  if (!o.quiet || crit || Math.random() < 0.3) addText(e.x, e.y - e.r, d, crit);
  sfx('hit');
  if (e.hp <= 0) killEnemy(e);
}

export function killEnemy(e, silent) {
  if (e.dead) return;
  e.dead = true;
  if (silent) {
    burst(e.x, e.y, e.col, 5, 150, 2.5);
    return;
  }
  G.kills++;
  if (P) P.kills++;
  G.combo++;
  G.comboT = 2.2;
  if (G.combo > G.maxCombo) G.maxCombo = G.combo;
  burst(e.x, e.y, e.col, e.r > 20 ? 16 : 8, e.r > 20 ? 260 : 190, 3);
  burst(e.x, e.y, '#ffffff', 2, 120, 2);
  decal(e.x, e.y, e.col, e.r);
  sfx('kill');
  dropLoot(e);
  if (e.type === 'splitter') {
    for (let i = 0; i < 2; i++) {
      const m = spawnEnemy('mini', e.x + rand(-8, 8), e.y + rand(-8, 8));
      const a = rand(TAU);
      m.kx = Math.cos(a) * 220;
      m.ky = Math.sin(a) * 220;
      if (e.elite) {
        m.hp *= 4;
        m.maxHp = m.hp;
      }
    }
  }
  if (e.frozen > 0 && e.shatter)
    for (let k = 0; k < 6; k++) shot(e.x, e.y, (k / 6) * TAU + rand(0.3), 480, 22, 1, 0.45, '#bff9ff', 4, 80);
  if (e.type === 'bomber') G.booms.push({ x: e.x, y: e.y, t: 0.09, R: 75, dmg: 30 + 10 * G.wave, hurt: 0 });
  // Ostéoclaste : éclats d'os tout autour à sa mort
  if (e.type === 'spiker') {
    const M = MOB.spiker;
    for (let k = 0; k < M.shards; k++) {
      const a = (k / M.shards) * TAU + rand(0.2);
      addEB({
        x: e.x,
        y: e.y,
        vx: Math.cos(a) * M.speed,
        vy: Math.sin(a) * M.speed,
        r: 5,
        dmg: e.dmg * M.dmg,
        life: 1.6,
        col: e.col,
      });
    }
  }
  if (e.elite) {
    G.hitstop = Math.max(G.hitstop, 0.08);
    addShake(8);
    ring(e.x, e.y, 10, 90, 0.4, '#ffd23e');
  }
  if (e.type === 'boss') bossDown(e);
}

export function dropLoot(e) {
  const T = ETYPES[e.type];
  if (e.type === 'boss') {
    for (let i = 0; i < 16; i++) addPickup('gem', e.x, e.y, 10, true);
    for (let i = 0; i < 24; i++) addPickup('coin', e.x, e.y, 2, true);
    addPickup('chest', e.x, e.y);
    addPickup('box', e.x + 30, e.y, e.final && (!G.M.career || G.M.level % 5 === 0) ? 2 : 1);
    return;
  }
  addPickup('gem', e.x, e.y, e.xp);
  if (e.gold) for (let i = 0; i < EVENT.gold.coins; i++) addPickup('coin', e.x, e.y, 2, true);
  if (Math.random() < T.coin) addPickup('coin', e.x + rand(-6, 6), e.y + rand(-6, 6), e.type === 'tank' ? 2 : 1);
  if (e.elite) {
    addPickup('chest', e.x, e.y);
    for (let i = 0; i < 6; i++) addPickup('coin', e.x, e.y, 2, true);
    if (Math.random() < 0.2 * P.luck) addPickup('box', e.x + 24, e.y, 1);
  }
  const r = Math.random(),
    L = P.luck;
  if (r < 0.005 * L) addPickup('heart', e.x, e.y);
  else if (r < 0.008 * L) addPickup('magnet', e.x, e.y);
  else if (r < 0.0105 * L) addPickup('bomb', e.x, e.y);
}

export function addPickup(type, x, y, v = 1, scatter) {
  const k = { id: ++G.pid, type, x, y, v, t: rand(3), vx: 0, vy: 0, sp: 0, mag: false };
  if (scatter) {
    const a = rand(TAU),
      s = rand(80, 300);
    k.vx = Math.cos(a) * s;
    k.vy = Math.sin(a) * s;
  }
  G.pickups.push(k);
}

export function explode(x, y, R, dmg, o = {}) {
  forNear(x, y, R, e => {
    dmgEnemy(e, dmg, { kb: o.kb ?? 200, sx: x, sy: y, raw: o.raw });
  });
  const col = o.col || '#ffb03e';
  ring(x, y, R * 0.3, R, 0.32, col);
  burst(x, y, col, Math.min(24, 8 + R / 6), R * 3.2, 4);
  burst(x, y, '#fff4c0', 5, R * 2, 3);
  flashFx(x, y, R * 1.3, col);
  addShake(Math.min(9, R / 14));
  sfx('boom');
  if (o.hurt)
    for (const pl of G.players) if (!pl.down && Math.hypot(pl.x - x, pl.y - y) < R + pl.r) hurtPlayer(pl, o.hurt);
}

export function hurtPlayer(pl, d) {
  if (pl.inv > 0 || pl.down || G.state !== 'play') return;
  d *= pl.armor;
  pl.hp -= d;
  pl.inv = 0.6;
  G.hitstop = Math.max(G.hitstop, 0.07);
  hurtFx(pl.i);
  textFx(pl.x, pl.y - 22, '-' + Math.round(d), '#ff4a6b');
  if (pl.hp > 0) return;
  const duo = G.players.length > 1;
  if (pl.revive > 0) {
    pl.revive--;
    pl.hp = pl.maxHp * 0.5;
    pl.inv = 2.5;
    nova(pl, true);
    banner('SECONDE CHANCE', duo ? plName(pl) + ' RESTE DEBOUT' : 'TU RESTES DEBOUT', '#62ff9a');
    return;
  }
  pl.hp = 0;
  if (duo) {
    pl.down = true;
    pl.rev = 0;
    pl.vx = pl.vy = 0;
    burst(pl.x, pl.y, pl.col, 30, 380, 4);
    addShake(8);
    if (!alive().length) teamDown();
    else {
      sfx('over');
      banner(plName(pl) + ' À TERRE', 'RESTE PRÈS DE LUI POUR LE RÉANIMER', '#ff3d8b');
    }
  } else teamDown();
}

export function teamDown() {
  G.state = 'dying';
  G.dyingT = 1.5;
  G.slowT = 1.5;
  for (const p of G.players) {
    burst(p.x, p.y, p.col, 40, 420, 4);
    burst(p.x, p.y, '#ffffff', 16, 300, 3);
  }
  addShake(16);
  sfx('over');
  hooks.clearInput();
}

// Réanimation : un partenaire debout reste à côté du joueur à terre pendant 3 s
export function updateRevive(dt) {
  for (const pl of G.players) {
    if (!pl.down || pl.gone) continue;
    const near = G.players.some(o => o !== pl && !o.down && Math.hypot(o.x - pl.x, o.y - pl.y) < 70);
    if (near) {
      pl.rev += dt / 3;
      if (pl.rev >= 1) {
        pl.down = false;
        pl.rev = 0;
        pl.hp = pl.maxHp * 0.4;
        pl.inv = 2;
        ring(pl.x, pl.y, 10, 140, 0.5, '#62ff9a');
        burst(pl.x, pl.y, '#62ff9a', 24, 300, 3);
        sfx('heal');
        toast('RÉANIMÉ', plName(pl) + ' est de retour.', '#62ff9a');
      }
    } else pl.rev = Math.max(0, pl.rev - dt * 0.25);
  }
}

export function nova(pl, fromRevive) {
  white(0.5);
  addShake(14);
  sfx('boom');
  for (const e of G.enemies) {
    if (e.dead) continue;
    if (Math.abs(e.x - pl.x) < view.hw + 40 && Math.abs(e.y - pl.y) < view.hh + 40) {
      if (e.type === 'boss') dmgEnemy(e, e.maxHp * 0.08, { raw: true });
      else dmgEnemy(e, Math.max(60, e.maxHp * 0.75), { raw: true, kb: 500, sx: pl.x, sy: pl.y });
    }
  }
  G.ebullets.length = 0;
  ring(pl.x, pl.y, 10, Math.max(view.hw, view.hh), 0.6, fromRevive ? '#62ff9a' : '#ffffff');
}

export function shockwave(pl) {
  forNear(pl.x, pl.y, 170, e => {
    const dx = e.x - pl.x,
      dy = e.y - pl.y,
      l = Math.hypot(dx, dy) || 1;
    e.kx += (dx / l) * 520 * e.kbRes;
    e.ky += (dy / l) * 520 * e.kbRes;
  });
  ring(pl.x, pl.y, 16, 170, 0.4, '#62ff9a');
  G.ebullets.length = 0;
}

export function addEB(o) {
  o.id = ++G.bid;
  G.ebullets.push(o);
}

export function rocketBoom(b) {
  b.dead = true;
  explode(b.x, b.y, b.R, b.dmg, { kb: 220, col: b.col });
}
