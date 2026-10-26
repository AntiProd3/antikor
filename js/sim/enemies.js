// Déplacement des ennemis, séparation, brûlure et contact.

import { bossAI } from './boss.js';
import { addEB, dmgEnemy, hurtPlayer } from './combat.js';
import { EVENT, MAX_E, MOB } from '../data/enemies.js';
import { burst, enemyFx, ring, sfx } from './fx.js';
import { CELL, forNear, gk, grid } from './grid.js';
import { nearestPl, owner } from './player.js';
import { spawnEnemy, spawnPos } from './spawn.js';
import { G, setP, view } from './state.js';
import { TAU, compact, rand } from '../util.js';

export function updateEnemies(dt) {
  const E = G.enemies;
  const farR = Math.max(view.hw, view.hh) * 2.3 + 200;
  for (let i = 0; i < E.length; i++) {
    const e = E[i];
    if (e.dead) continue;
    e.t += dt;
    if (e.flash > 0) e.flash -= dt;
    const tp = nearestPl(e.x, e.y) || G.players[0];
    let dx = tp.x - e.x,
      dy = tp.y - e.y;
    const d = Math.hypot(dx, dy) || 1;
    dx /= d;
    dy /= d;
    if (G.state === 'dying') {
      dx *= 0.2;
      dy *= 0.2;
    }
    e.kx -= e.kx * Math.min(1, dt * 7);
    e.ky -= e.ky * Math.min(1, dt * 7);
    if (e.type === 'boss') {
      if (e.stun > 0) e.stun -= dt;
      bossAI(e, dt, dx, dy);
    } else {
      let sp = e.spd;
      if (e.slowT > 0) {
        e.slowT -= dt;
        sp *= 1 - e.slowV;
      } else e.slowV = 0;
      if (e.stun > 0) {
        e.stun -= dt;
        sp = 0;
      }
      if (G.feverT > 0) sp *= EVENT.fever.speed;
      let mx = dx,
        my = dy;
      // germe doré (Ruée d'or) : il fuit, puis disparaît
      if (e.gold) {
        mx = -dx;
        my = -dy;
        e.gold -= dt;
        if (e.gold <= 0) {
          e.dead = true;
          burst(e.x, e.y, '#ffd23e', 6, 120, 2);
          continue;
        }
      }
      if (e.type === 'spitter') {
        if (d < 230) {
          mx = -dx * 0.5 - dy * 0.85;
          my = -dy * 0.5 + dx * 0.85;
        } else if (d < 300) {
          mx = -dy;
          my = dx;
        }
        e.shootT -= dt;
        if (e.shootT <= 0 && d < 440 && G.state === 'play' && e.stun <= 0) {
          e.shootT = 2.6;
          addEB({
            x: e.x + dx * e.r,
            y: e.y + dy * e.r,
            vx: dx * 230,
            vy: dy * 230,
            r: 6,
            dmg: e.dmg,
            life: 4,
            col: '#f2ff4a',
          });
          sfx('spit');
        }
      } else if (e.type === 'dasher') {
        // Piqueur : s'arrête et vise (tele), puis fonce tout droit
        const M = MOB.dasher;
        e.cool = (e.cool ?? 1) - dt;
        if (e.dashT > 0) {
          e.dashT -= dt;
          mx = Math.cos(e.dashA);
          my = Math.sin(e.dashA);
          sp = M.speed * G.scale.spd * (e.stun > 0 ? 0 : 1);
        } else if (e.tele > 0) {
          e.tele -= dt;
          sp = 0;
          if (e.tele <= 0) {
            e.dashT = M.dash;
            e.dashA = e.ang;
            sfx('dash');
          }
        } else if (e.cool <= 0 && d < M.range && G.state === 'play') {
          e.tele = M.aim;
          e.cool = M.rest + M.aim + M.dash;
        }
      } else if (e.type === 'healer') {
        // Leucocyte : garde ses distances et soigne régulièrement les germes autour de lui
        const M = MOB.healer;
        if (d < M.keep) {
          mx = -dx * 0.6 - dy * 0.8;
          my = -dy * 0.6 + dx * 0.8;
        } else if (d < M.keep + 60) {
          mx = -dy;
          my = dx;
        }
        e.healT = (e.healT ?? M.every) - dt;
        if (e.healT <= 0 && G.state === 'play' && e.stun <= 0) {
          e.healT = M.every;
          let n = 0;
          forNear(e.x, e.y, M.R, o => {
            if (o === e || o.type === 'boss' || o.hp >= o.maxHp) return;
            o.hp = Math.min(o.maxHp, o.hp + o.maxHp * M.heal);
            n++;
          });
          if (n) {
            ring(e.x, e.y, 10, M.R, 0.45, '#62ff9a');
            sfx('heal');
          }
        }
      } else if (e.type === 'brood') {
        // Pondeuse : pond des petits germes à intervalles réguliers
        const M = MOB.brood;
        e.layT = (e.layT ?? M.every) - dt;
        if (e.layT <= 0 && G.state === 'play' && (e.laid || 0) < M.max && G.enemies.length < MAX_E) {
          e.layT = M.every;
          for (let k = 0; k < M.n; k++) {
            const m = spawnEnemy('mini', e.x + rand(-10, 10), e.y + rand(-10, 10));
            const a = rand(TAU);
            m.kx = Math.cos(a) * 160;
            m.ky = Math.sin(a) * 160;
          }
          e.laid = (e.laid || 0) + M.n;
          burst(e.x, e.y, e.col, 6, 140, 2);
          sfx('drop');
        }
      } else if (e.type === 'blinker') {
        // Neurone : clignote (tele), puis réapparaît tout près du joueur
        const M = MOB.blinker;
        e.blinkT = (e.blinkT ?? rand(...M.every)) - dt;
        if (e.tele > 0) {
          e.tele -= dt;
          sp *= 0.3;
          if (e.tele <= 0) {
            const a = rand(TAU),
              r = rand(...M.near);
            burst(e.x, e.y, e.col, 8, 180, 2);
            e.x = tp.x + Math.cos(a) * r;
            e.y = tp.y + Math.sin(a) * r;
            e.kx = e.ky = 0;
            burst(e.x, e.y, e.col, 10, 200, 2);
            sfx('zap');
          }
        } else if (e.blinkT <= 0 && d > 160 && G.state === 'play' && e.stun <= 0) {
          e.blinkT = rand(...M.every);
          e.tele = M.warn;
        }
      } else if (e.type === 'zigzag') {
        // Plaquette : avance en zigzag
        const s = Math.sin(e.t * MOB.zigzag.weave) * 0.9;
        mx = dx - dy * s;
        my = dy + dx * s;
      } else if (e.type === 'pulser') {
        // Synapse : s'approche, se charge (tele), puis décharge autour d'elle
        const M = MOB.pulser;
        e.cool = (e.cool ?? 1) - dt;
        if (e.tele > 0) {
          e.tele -= dt;
          sp = 0;
          if (e.tele <= 0) {
            ring(e.x, e.y, 10, M.R, 0.35, e.col);
            sfx('zap');
            if (G.state === 'play')
              for (const pl of G.players)
                if (!pl.down && Math.hypot(pl.x - e.x, pl.y - e.y) < M.R + pl.r) hurtPlayer(pl, e.dmg * M.dmg);
          }
        } else if (e.cool <= 0 && d < M.range && G.state === 'play' && e.stun <= 0) {
          e.tele = M.charge;
          e.cool = M.rest + M.charge;
        }
      } else if (e.type === 'bomber') {
        if (e.fuse > 0) {
          e.fuse -= dt;
          sp = 0;
          if (e.fuse <= 0) {
            e.dead = true;
            G.booms.push({ x: e.x, y: e.y, t: 0, R: 78, dmg: 30 + 10 * G.wave, hurt: e.dmg });
            burst(e.x, e.y, e.col, 10, 200, 3);
          }
        } else if (d < 62 && G.state === 'play') e.fuse = 0.6;
      }
      e.x += (mx * sp + e.kx) * dt;
      e.y += (my * sp + e.ky) * dt;
      // le Piqueur garde sa direction pendant qu'il fonce
      if (!(e.dashT > 0)) e.ang += (((Math.atan2(dy, dx) - e.ang + Math.PI * 3) % TAU) - Math.PI) * Math.min(1, dt * 8);
    }
    // separation
    const cx = Math.floor(e.x / CELL),
      cy = Math.floor(e.y / CELL);
    for (let ox = -1; ox <= 1; ox++)
      for (let oy = -1; oy <= 1; oy++) {
        const a = grid.get(gk(cx + ox, cy + oy));
        if (!a) continue;
        for (let j = 0; j < a.length; j++) {
          const o = a[j];
          if (o === e || o.dead) continue;
          const sx = e.x - o.x,
            sy = e.y - o.y,
            rr = (e.r + o.r) * 0.9,
            dd = sx * sx + sy * sy;
          if (dd < rr * rr && dd > 0.01) {
            const l = Math.sqrt(dd);
            const push = ((rr - l) / l) * (e.type === 'boss' ? 0.05 : o.type === 'boss' ? 0.9 : 0.35);
            e.x += sx * push;
            e.y += sy * push;
          }
        }
      }
    // brûlure / gel
    if (e.frozen > 0) e.frozen -= dt;
    if (e.burnT > 0) {
      e.burnT -= dt;
      e.burnK -= dt;
      enemyFx(e, dt);
      if (e.burnK <= 0) {
        e.burnK = 0.3;
        setP(owner(e.burnO));
        dmgEnemy(e, e.burnD, { raw: true, quiet: true });
        setP(G.players[0]);
        if (e.dead) continue;
      }
    }
    // contact
    if (G.state === 'play')
      for (const pl of G.players) {
        if (pl.down) continue;
        if (Math.hypot(pl.x - e.x, pl.y - e.y) < e.r + pl.r - 2) {
          hurtPlayer(pl, e.dmg);
          // Anticorps : s'accroche et ralentit le joueur
          if (e.type === 'latcher') pl.slowT = MOB.latcher.time;
        }
      }
    if (d > farR && e.type !== 'boss') {
      const [x, y] = spawnPos();
      e.x = x;
      e.y = y;
    }
  }
  compact(E);
}
