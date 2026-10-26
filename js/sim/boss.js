// Boss : apparition, attaques et mort.

import { FINALE, careerBosses } from '../data/career.js';
import { BOSSV } from '../data/enemies.js';
import { addEB } from './combat.js';
import { addShake, burst, part, ring, sfx, white } from './fx.js';
import { nearestPl } from './player.js';
import { spawnEnemy, spawnPos } from './spawn.js';
import { G } from './state.js';
import { isFinal } from './waves.js';
import { TAU, pick, rand } from '../util.js';

export function spawnBoss() {
  const [x, y] = spawnPos(60);
  const fin = isFinal(G.wave);
  const pool = (G.M.endless ? ['crown', 'hive', 'eye', 'titan'] : ['hive', 'eye', 'titan']).filter(
    k => k !== G.lastBoss,
  );
  const cb = G.M.career ? careerBosses(G.M.level) : null;
  const bv = cb ? (fin ? cb.fin : cb.mid) : fin ? 'crown' : pick(pool);
  G.lastBoss = bv;
  const V = BOSSV[bv];
  const e = spawnEnemy('boss', x, y, {
    hpMul: V.hp * (fin ? 2.2 : G.M.endless ? 1 + G.wave / 10 : 1) * (G.M.finale ? FINALE.boss : 1),
  });
  e.final = fin;
  e.bv = bv;
  e.col = V.col;
  e.spd *= V.spd;
  e.ai = { ph: 'chase', t: 2.5, i: 0 };
  G.boss = e;
  G.bossDead = false;
}

export function bossDown(e) {
  G.bossKills++;
  G.bossDead = true;
  G.bossClearT = 1.3;
  G.slowT = 1.3;
  white(0.6);
  addShake(22);
  G.hitstop = 0.12;
  burst(e.x, e.y, e.col, 60, 600, 5);
  burst(e.x, e.y, '#ffd23e', 40, 500, 4);
  burst(e.x, e.y, '#ffffff', 20, 400, 3);
  ring(e.x, e.y, 20, 300, 0.8, '#ffd23e');
  ring(e.x, e.y, 10, 200, 0.6, e.col);
  sfx('boom');
  sfx('evo');
}

export function bossAI(e, dt, dx, dy) {
  const A = e.ai;
  const V = BOSSV[e.bv || 'crown'];
  const col = V.col;
  A.t -= dt;
  let mx = 0,
    my = 0,
    sp = e.spd;
  switch (A.ph) {
    case 'chase':
      mx = dx;
      my = dy;
      if (A.t <= 0) {
        A.ph = V.seq[A.i++ % V.seq.length];
        if (A.ph === 'tele') {
          A.t = 0.8;
          const tp = nearestPl(e.x, e.y) || G.players[0];
          A.ang = Math.atan2(tp.y - e.y, tp.x - e.x);
        } else if (A.ph === 'ring') {
          A.t = 0.5;
          A.count = e.final ? 3 : 2;
        } else if (A.ph === 'spiral') {
          A.t = e.final ? 2.6 : 2;
          A.sk = 0;
          A.sa = rand(TAU);
        } else A.t = 0.6;
      }
      break;
    case 'tele':
      sp = 0;
      e.ang = A.ang;
      if (A.t <= 0) {
        A.ph = 'dash';
        A.t = 0.55;
        sfx('dash');
      }
      break;
    case 'dash':
      mx = Math.cos(A.ang);
      my = Math.sin(A.ang);
      sp = V.dash || 720;
      e.ang = A.ang;
      part(e.x, e.y, rand(-40, 40), rand(-40, 40), 0.4, 8, col, 0, 2);
      if (A.t <= 0) {
        A.ph = 'chase';
        A.t = e.bv === 'titan' ? 1.1 : 2.2;
      }
      break;
    case 'ring':
      sp = 0;
      if (A.t <= 0) {
        const n = (e.final ? 22 : 16) + (e.bv === 'titan' ? 6 : 0);
        const off = A.count * 0.2;
        const v = e.bv === 'titan' ? 150 : 200;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * TAU + off;
          addEB({
            x: e.x,
            y: e.y,
            vx: Math.cos(a) * v,
            vy: Math.sin(a) * v,
            r: e.bv === 'titan' ? 9 : 7,
            dmg: 12 * G.scale.dmg,
            life: 5,
            col,
          });
        }
        sfx('spit');
        ring(e.x, e.y, e.r, e.r * 2, 0.3, col);
        A.count--;
        if (A.count > 0) A.t = 0.45;
        else {
          A.ph = 'chase';
          A.t = 2.4;
        }
      }
      break;
    // L'Œil : rafale en spirale
    case 'spiral':
      sp = e.spd * 0.25;
      mx = dx;
      my = dy;
      A.sk -= dt;
      while (A.sk <= 0) {
        A.sk += 0.075;
        A.sa += 0.33;
        for (let k = 0; k < 3; k++) {
          const a = A.sa + (k * TAU) / 3;
          addEB({
            x: e.x + Math.cos(a) * e.r * 0.6,
            y: e.y + Math.sin(a) * e.r * 0.6,
            vx: Math.cos(a) * 190,
            vy: Math.sin(a) * 190,
            r: 6,
            dmg: 10 * G.scale.dmg,
            life: 4.5,
            col,
          });
        }
        if (Math.random() < 0.3) sfx('spit');
      }
      if (A.t <= 0) {
        A.ph = 'chase';
        A.t = 2;
      }
      break;
    case 'summon':
      sp = 0;
      if (A.t <= 0) {
        const n = (e.final ? 10 : 6) + (e.bv === 'hive' ? 4 : 0);
        for (let i = 0; i < n; i++) {
          const a = (i / n) * TAU;
          spawnEnemy(V.summon[i % V.summon.length], e.x + Math.cos(a) * 80, e.y + Math.sin(a) * 80);
        }
        ring(e.x, e.y, e.r, e.r * 2.5, 0.4, col);
        A.ph = 'chase';
        A.t = 2.2;
      }
      break;
  }
  if (A.ph !== 'tele' && A.ph !== 'dash') e.ang = Math.atan2(dy, dx);
  e.x += (mx * sp + e.kx) * dt;
  e.y += (my * sp + e.ky) * dt;
}
