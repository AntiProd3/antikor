// Nouvelle partie, début et fin de vague.

import { MODES, WORLDS, careerMode, worldOf } from '../data/career.js';
import { BOSSV } from '../data/enemies.js';
import { spawnBoss } from './boss.js';
import { killEnemy } from './combat.js';
import { addShake, banner, sfx } from './fx.js';
import { mkPlayer, xpFor } from './player.js';
import { computeScale, progress } from './spawn.js';
import { G, ME, setG, setP } from './state.js';
import { rand } from '../util.js';

export function newRun(mode, specs, level) {
  const M = mode === 'career' ? careerMode(level || 1) : MODES[mode];
  setG({
    mode,
    M,
    wave: 0,
    waveT: 0,
    waveDur: M.dur,
    t: 0,
    state: 'play',
    kills: 0,
    dmgDone: 0,
    coinsEarned: 0,
    bossKills: 0,
    enemies: [],
    bullets: [],
    ebullets: [],
    pickups: [],
    parts: [],
    texts: [],
    zones: [],
    mines: [],
    fx: [],
    decals: [],
    flashes: [],
    booms: [],
    warn: [], // spores qui vont exploser (événement « Pluie de spores »)
    sporeT: 0,
    feverT: 0,
    spawnT: 0,
    eventT: 9,
    eliteDone: true,
    isBoss: false,
    boss: null,
    bossDead: false,
    bossClearT: 0,
    hitstop: 0,
    slowT: 0,
    shake: 0,
    hurtFlash: 0,
    whiteFlash: 0,
    cam: { x: 0, y: 0 },
    eid: 0,
    bid: 0,
    pid: 0,
    combo: 0,
    comboT: 0,
    maxCombo: 0,
    gemCombo: 0,
    gemComboT: 0,
    pendingLevels: 0,
    afterLevel: 'play',
    clearT: 0,
    dyingT: 0,
    xp: 0,
    level: 1,
    xpNext: xpFor(1),
    players: [],
    boxes: { std: 0, prem: 0 },
    scale: { hp: 1, spd: 1, dmg: 1 },
    time: 0,
    netT: 0,
  });
  const duo = specs.length > 1;
  G.players = specs.map((sp, i) => mkPlayer(i, { ...sp, x: duo ? (i ? 34 : -34) : 0 }));
  setP(G.players[ME]);
  startWave(1);
}

export function isBossWave(n) {
  return G.M.endless ? n % 5 === 0 : G.M.bosses.includes(n);
}

export function isFinal(n) {
  return !G.M.endless && n === G.M.waves;
}

export function startWave(n) {
  G.wave = n;
  G.theme = WORLDS[G.M.career ? worldOf(G.M.level) : Math.floor((n - 1) / 10) % WORLDS.length];
  G.isBoss = isBossWave(n);
  G.waveDur = G.M.dur;
  G.waveT = 0;
  G.spawnT = 0.6;
  G.eventT = rand(7, 10);
  G.eliteDone = n < 2 || G.isBoss;
  G.state = 'play';
  G.bossDead = false;
  G.boss = null;
  G.scale = computeScale(progress());
  const total = G.M.endless ? '' : ' / ' + G.M.waves;
  if (G.isBoss) {
    spawnBoss();
    const V = BOSSV[G.boss.bv];
    banner(V.name.toUpperCase(), (isFinal(n) ? 'BOSS FINAL' : 'BOSS') + ' · VAGUE ' + n + total, V.col);
    sfx('boss');
    addShake(6);
  } else if (n === 1 && G.M.career) {
    const w = worldOf(G.M.level);
    if (G.M.finale)
      banner('ÉPREUVE DU MONDE ' + (w + 1), 'NIVEAU ' + G.M.level + ' · ENNEMIS PLUS CORIACES', '#ff3d5a');
    else banner('NIVEAU ' + G.M.level, 'MONDE ' + (w + 1) + ' · ' + WORLDS[w].name.toUpperCase(), WORLDS[w].col);
    sfx('wave');
  } else {
    banner(
      'VAGUE ' + n,
      isFinal(n) ? 'DERNIÈRE VAGUE' : n === 1 ? 'SURVIS ' + G.waveDur + ' SECONDES' : 'TIENS BON',
      '#3ef2ff',
    );
    sfx('wave');
  }
}

export function endWave() {
  G.state = 'clear';
  G.warn.length = 0;
  G.sporeT = 0;
  G.feverT = 0;
  G.clearT = 1.5;
  for (const e of G.enemies) if (!e.dead) killEnemy(e, true);
  G.ebullets.length = 0;
  for (const k of G.pickups) k.mag = true;
  banner(isFinal(G.wave) ? 'VICTOIRE' : 'VAGUE ' + G.wave + ' TERMINÉE', '', isFinal(G.wave) ? '#ffd23e' : '#62ff9a');
  sfx('clear');
}
