// Instantané de la partie (duo) : le serveur le fabrique avec snap(), le jeu l'affiche (js/online/duo.js).
// Le format est défini ici, au même endroit pour les deux côtés.

import { ETYPES, MOB } from '../data/enemies.js';
import { EV } from './fx.js';
import { G } from './state.js';

export const ETI = Object.keys(ETYPES),
  PKI = ['gem', 'coin', 'heart', 'magnet', 'bomb', 'chest', 'box'];

export const r1 = v => Math.round(v * 10) / 10,
  r2 = v => Math.round(v * 100) / 100,
  R0 = Math.round;

export function plSnap(pl) {
  const o = {
    x: r1(pl.x),
    y: r1(pl.y),
    a: r2(pl.aim),
    hp: R0(pl.hp),
    mh: pl.maxHp,
    iv: pl.inv > 0 ? 1 : 0,
    mv: pl.moving ? 1 : 0,
    dn: pl.down ? 1 : 0,
    gn: pl.gone ? 1 : 0, // a quitté la partie
    aw: pl.away ? 1 : 0, // connexion perdue (la partie l'attend)
    nm: pl.name || '',
    sk: pl.skin,
    q: pl.sq || 0, // dernière commande de déplacement appliquée…
    qt: r2(pl.qt || 0), // …depuis combien de secondes (le jeu corrige sa propre anticipation)
    rv: r2(pl.rev),
    sp: R0(pl.speed * (pl.slowT > 0 ? MOB.latcher.slow : 1)), // vitesse du moment (ralenti par un Anticorps)
    sl: pl.slowT > 0 ? 1 : 0,
    c: Math.floor(pl.coins),
    w: pl.weapons.map(w => {
      const a = [w.id, w.lvl, w.evo ? 1 : 0, w.r || 0];
      if (w.id === 'flamer') a.push(r2(w.ang || 0), w.on ? 1 : 0, R0(w.len || 0), r2(w.wd || 0));
      else if (w.id === 'cryo') a.push(w.pts || []);
      else if (w.id === 'aura') a.push(R0(w.R || 0));
      else if (w.id === 'drones') a.push(r2(w.ang || 0), r2(w.rot || 0), w.n || 0, R0(w.R || 0), r1(w.br || 0));
      else if (w.id === 'laser') a.push(r2(w.ang || 0), r2(w.rot || 0), w.n || 0, R0(w.len || 0));
      else if (w.id === 'turret')
        a.push((w.tur || []).map(t => [R0(t.x), R0(t.y), r2(t.ang), r2(t.life), r2(t.max), t.mob ? 1 : 0]));
      return a;
    }),
    ps: pl.passives,
  };
  return o;
}

// Instantané envoyé aux joueurs environ 20 fois par seconde : nombres arrondis, tableaux courts.
// ev = effets et sons enregistrés depuis le précédent (rec), rejoués chez chaque joueur.
export function snap() {
  const g = [
    G.state,
    G.wave,
    r1(G.waveT),
    G.waveDur,
    G.isBoss ? 1 : 0,
    G.boss && !G.boss.dead ? r2(Math.max(0, G.boss.hp) / G.boss.maxHp) : 0,
    G.kills,
    G.combo,
    G.level,
    r1(G.xp),
    G.xpNext,
    G.isBoss && G.boss ? G.boss.bv || 'crown' : '',
  ];
  const e = [];
  for (const x of G.enemies)
    if (!x.dead)
      e.push([
        x.id,
        ETI.indexOf(x.type),
        R0(x.x),
        R0(x.y),
        r2(x.ang),
        (x.elite ? 1 : 0) |
          (x.flash > 0 ? 2 : 0) |
          (x.fuse > 0 ? 4 : 0) |
          (x.type === 'boss' && x.ai.ph === 'tele' ? 8 : 0) |
          (x.frozen > 0 ? 16 : 0) |
          (x.burnT > 0 ? 32 : 0) |
          (x.tele > 0 ? 64 : 0) | // Piqueur qui vise, Neurone qui clignote, Synapse qui se charge
          (x.gold ? 128 : 0), // germe doré (Ruée d'or)
        x.type === 'boss' || x.elite || x.type === 'tank' ? r2(Math.max(0, x.hp) / x.maxHp) : 1,
        x.type === 'boss' ? r2(x.ai.ang || 0) : 0,
      ]);
  const b = [];
  for (const x of G.bullets) {
    if (x.dead) continue;
    if (x.k === 'shot') b.push([x.id, 0, R0(x.x), R0(x.y), r2(x.dx), r2(x.dy), x.r, x.col]);
    else if (x.k === 'disc') b.push([x.id, 1, R0(x.x), R0(x.y), R0(x.r), x.col]);
    else if (x.k === 'lob') b.push([x.id, 2, R0(x.x), R0(x.y), R0(x.h)]);
    else if (x.k === 'rocket') b.push([x.id, 3, R0(x.x), R0(x.y), r2(x.a), x.small ? 1 : 0, x.col]);
  }
  const q = [];
  for (const x of G.ebullets) if (!x.dead) q.push([x.id, R0(x.x), R0(x.y), x.r, x.col]);
  const k = [];
  for (const x of G.pickups) if (!x.dead) k.push([x.id, PKI.indexOf(x.type), R0(x.x), R0(x.y), x.v]);
  const z = G.zones
    .filter(x => !x.dead)
    .map(x => [R0(x.x), R0(x.y), R0(x.R), r2(x.life), r2(x.max), x.evo ? 1 : 0, x.k === 'hole' ? 1 : 0]);
  const mi = G.mines.filter(x => !x.dead).map(x => [R0(x.x), R0(x.y), x.arm > 0 ? 1 : 0, x.evo ? 1 : 0]);
  const h = G.warn.map(x => [R0(x.x), R0(x.y), x.R, r2(x.t / x.max)]); // spores qui vont exploser
  const ev = EV.splice(0);
  return { t: 's', g, p: G.players.map(plSnap), e, b, q, k, z, m: mi, h, ev };
}
