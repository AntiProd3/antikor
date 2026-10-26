// Une image de simulation : update() fait avancer toute la partie de dt secondes.

import { MOB } from '../data/enemies.js';
import { RARITY } from '../data/loot.js';
import { explode, hurtPlayer, updateRevive } from './combat.js';
import { updateEnemies } from './enemies.js';
import { gameOver, openLevel, openShop } from './flow.js';
import { burst, weaponFx } from './fx.js';
import { buildGrid } from './grid.js';
import { updatePickups } from './pickups.js';
import { updateBullets, updateEBullets, updateZones } from './projectiles.js';
import { computeScale, progress, sporeTick, spawnTick } from './spawn.js';
import { G, ME, P, setP, setWM } from './state.js';
import { endWave, isFinal } from './waves.js';
import { updateWeapon } from './weapons.js';
import { TAU, compact } from '../util.js';

export function update(dt, rdt) {
  G.t += dt;
  if (G.state === 'play') G.time += dt;
  const p = progress();
  G.scale = computeScale(p);
  if (G.state === 'play') {
    G.waveT += dt;
    if (!G.isBoss && G.waveT >= G.waveDur) {
      endWave();
    }
  }
  for (const pl of G.players) updatePlayer(pl, dt);
  const me = G.players[ME];
  G.cam.x += (me.x - G.cam.x) * Math.min(1, dt * 9);
  G.cam.y += (me.y - G.cam.y) * Math.min(1, dt * 9);
  if (G.state === 'play') spawnTick(dt, p);
  buildGrid();
  if (G.state === 'play')
    for (const pl of G.players) {
      if (pl.down) continue;
      setP(pl);
      for (const w of pl.weapons) {
        const R = RARITY[w.r || 0];
        const cd = P.cd,
          ar = P.area,
          pj = P.proj;
        P.cd *= R.cd;
        P.area *= R.area;
        P.proj += R.proj;
        setWM(R.dmg);
        updateWeapon(w, dt);
        P.cd = cd;
        P.area = ar;
        P.proj = pj;
      }
    }
  setWM(1);
  setP(G.players[0]);
  for (const pl of G.players) weaponFx(pl, dt);
  if (G.state === 'play' && G.players.length > 1) updateRevive(dt);
  updateEnemies(dt);
  updateBullets(dt);
  updateEBullets(dt);
  updateZones(dt);
  updatePickups(dt);
  for (let i = 0; i < G.booms.length; i++) {
    const b = G.booms[i];
    b.t -= dt;
    if (b.t <= 0) {
      b.dead = true;
      explode(b.x, b.y, b.R, b.dmg, { raw: true, col: '#ff4a3d', kb: 260, hurt: b.hurt });
    }
  }
  compact(G.booms);
  // événements : spores qui explosent, fièvre
  if (G.state === 'play') sporeTick(dt);
  for (const w of G.warn) {
    w.t -= dt;
    if (w.t > 0) continue;
    w.dead = true;
    burst(w.x, w.y, '#ff4a3d', 10, 220, 3);
    if (G.state === 'play')
      for (const pl of G.players)
        if (!pl.down && Math.hypot(pl.x - w.x, pl.y - w.y) < w.R + pl.r) hurtPlayer(pl, w.dmg);
  }
  compact(G.warn);
  if (G.feverT > 0) G.feverT -= dt;
  updateCosmetics(dt, rdt);
  if (G.comboT > 0) {
    G.comboT -= dt;
    if (G.comboT <= 0) G.combo = 0;
  }
  if (G.gemComboT > 0) {
    G.gemComboT -= dt;
    if (G.gemComboT <= 0) G.gemCombo = 0;
  }
  setP(G.players[ME]);
  // boss wave end
  if (G.state === 'play' && G.isBoss && G.bossDead) {
    G.bossClearT -= rdt;
    if (G.bossClearT <= 0) endWave();
  }
  // clear phase
  if (G.state === 'clear') {
    G.clearT -= rdt;
    if (
      (G.clearT <= 0 &&
        !G.pickups.some(k => k.type === 'gem' || k.type === 'coin' || k.type === 'chest' || k.type === 'box')) ||
      G.clearT < -2
    ) {
      if (isFinal(G.wave)) {
        gameOver(true);
        return;
      }
      if (G.pendingLevels > 0) {
        G.afterLevel = 'shop';
        openLevel();
      } else openShop();
    }
  }
  if (G.state === 'dying') {
    G.dyingT -= rdt;
    if (G.dyingT <= 0) gameOver(false);
  }
  if (G.state === 'play' && G.pendingLevels > 0) {
    G.afterLevel = 'play';
    openLevel();
  }
}

// Particules, textes et flashs : purement visuels, avancent aussi chez l'invité
export function updateCosmetics(dt, rdt) {
  for (const q of G.parts) {
    q.life -= rdt;
    if (q.life <= 0) {
      q.dead = true;
      continue;
    }
    const f = Math.exp(-q.drag * rdt);
    q.vx *= f;
    q.vy *= f;
    q.x += q.vx * rdt;
    q.y += q.vy * rdt;
  }
  compact(G.parts);
  for (const t of G.texts) {
    t.life -= rdt;
    t.y += t.vy * rdt;
    t.vy *= Math.exp(-3 * rdt);
    if (t.life <= 0) t.dead = true;
  }
  compact(G.texts);
  for (const f of G.fx) {
    f.life -= rdt;
    if (f.life <= 0) f.dead = true;
  }
  compact(G.fx);
  for (const f of G.flashes) {
    f.life -= rdt;
    if (f.life <= 0) f.dead = true;
  }
  compact(G.flashes);
  for (const d of G.decals) {
    d.life -= dt;
    if (d.life <= 0) d.dead = true;
  }
  compact(G.decals);
}

// Déplacement d'un joueur selon sa commande [x, y] (aussi utilisé par le jeu en duo pour anticiper son propre vaisseau)
export function movePlayer(pl, [ix, iy], dt) {
  const sp = pl.speed * slowFactor(pl);
  const tx = ix * sp,
    ty = iy * sp;
  const k = Math.min(1, dt * 14);
  pl.vx += (tx - pl.vx) * k;
  pl.vy += (ty - pl.vy) * k;
  pl.x += pl.vx * dt;
  pl.y += pl.vy * dt;
  pl.moving = Math.hypot(ix, iy) > 0.1;
}

// Ralentissement (Anticorps accroché)
export function slowFactor(pl) {
  return pl.slowT > 0 ? MOB.latcher.slow : 1;
}

export function updatePlayer(pl, dt) {
  if (G.state === 'dying' || pl.down) {
    pl.vx = pl.vy = 0;
    pl.moving = false;
    return;
  }
  if (pl.slowT > 0) pl.slowT -= dt;
  movePlayer(pl, pl.in || [0, 0], dt);
  if (pl.moving) pl.step += dt * 14;
  if (pl.inv > 0) pl.inv -= dt;
  if (pl.regen && G.state === 'play') pl.hp = Math.min(pl.maxHp, pl.hp + pl.regen * dt);
  pl.aimHold -= dt;
  const target = pl.aimHold > 0 ? pl.aimT : pl.moving ? Math.atan2(pl.vy, pl.vx) : pl.aim;
  let da = ((target - pl.aim + Math.PI * 3) % TAU) - Math.PI;
  pl.aim += da * Math.min(1, dt * 16);
}
