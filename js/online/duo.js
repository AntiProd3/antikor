// Duo par le serveur : la partie tourne sur le serveur (AntiBack), le jeu affiche les instantanés reçus.
// Le jeu envoie seulement ses commandes : direction (duo_in) et actions (duo_act : carte, achat, prêt, abandon).
// Pour que le vaisseau réponde tout de suite, le jeu anticipe son propre déplacement et le corrige en douceur
// avec la position calculée par le serveur.

import { Sfx } from '../audio.js';
import { MODES, careerMode } from '../data/career.js';
import { ETYPES } from '../data/enemies.js';
import { clearInput, inputVec } from '../input.js';
import {
  EV,
  addShake,
  addText,
  banner,
  burst,
  decal,
  enemyFx,
  flashFx,
  fxPush,
  hurtFx,
  muzzleAt,
  ring,
  rocketTrail,
  spark,
  textFx,
  toast,
  weaponFx,
  white,
  zoneFx,
} from '../sim/fx.js';
import { PCOLS, xpFor } from '../sim/player.js';
import { ETI, PKI } from '../sim/snapshot.js';
import { G, ME, P, setG, setME, setP } from '../sim/state.js';
import { movePlayer, updateCosmetics } from '../sim/update.js';
import { TAU, clamp, lerp, rand } from '../util.js';
import { on, post, request } from './client.js';

// Salle en cours : { code, members: [{ name, host, away }], host (c'est moi), playing, mode, level } ou null
// on = l'onglet « Duo en ligne » est choisi dans le menu
export const duo = { on: false, room: null };

const SESSION_KEY = 'antikor-duo'; // partie en cours sur cet onglet (pour la reprendre après un rechargement)
const rememberGame = code => {
  try {
    if (code) sessionStorage.setItem(SESSION_KEY, code);
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {}
};
export const savedGame = () => {
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
};

// Ce dont le module a besoin côté interface (branché par js/ui/duo.js, pour éviter les imports circulaires)
export const duoUi = {
  changed() {}, // la salle a changé : redessiner le panneau du menu
  start() {}, // début (ou reprise) d'une partie : cacher le menu, afficher le HUD
  view(k, v) {}, // écran de niveau ou de boutique du joueur
  say(n, a) {}, // son ou refus destiné à ce joueur
  toast(a, b, c) {},
  wait(name, left) {}, // la partie attend un joueur dont la connexion est coupée (left = 0 : fini)
  over(d) {}, // fin de partie : résultats et récompenses du serveur
  lost(msg) {}, // la partie n'existe plus (coupure trop longue)
};

export function initDuo() {
  on('room', m => {
    duo.room = m;
    duoUi.changed();
  });
  on('room_left', () => {
    duo.room = null;
    duoUi.changed();
  });
  on('duo_begin', begin);
  on('s', applySnap);
  on('duo_view', m => G && G.online && duoUi.view(m.k, m.v));
  on('duo_say', m => G && G.online && duoUi.say(m.n, m.a));
  on('duo_toast', m => G && G.online && duoUi.toast(m.a, m.b, m.c));
  on('duo_wait', m => G && G.online && duoUi.wait(m.name, m.left));
  on('duo_lost', m => {
    rememberGame(null);
    if (G && G.online) duoUi.lost(m.msg);
  });
  on('duo_over', m => {
    rememberGame(null);
    if (G && G.online) {
      G.state = 'over';
      duoUi.over({ ...m.d, rewards: m.rewards });
    }
  });
  // Connexion rétablie pendant une partie : on demande à la reprendre (la partie attend 30 s)
  on('status', async s => {
    if (s !== 'online' || !G || !G.online) return;
    const r = await request('duo_rejoin');
    if (!r.ok && G && G.online && G.state !== 'over') {
      rememberGame(null);
      duoUi.lost(r.msg || 'La partie en duo est terminée.');
    }
  });
}

// ---------- Salle ----------

export const createRoom = () => request('room_create');
export const joinRoom = code => request('room_join', { code });
export const leaveRoom = () => request('room_leave');
export const startDuo = (mode, level) => request('duo_start', { mode, level });

// Après un rechargement de la page pendant une partie : on la reprend
export async function resumeSaved() {
  if (!savedGame()) return false;
  const r = await request('duo_rejoin');
  if (!r.ok) rememberGame(null);
  return r.ok;
}

// ---------- Commandes ----------

export function duoAct(a, i) {
  post('duo_act', i === undefined ? { a } : { a, i });
}

// ---------- Début de partie ----------

function begin(m) {
  Sfx.init();
  Sfx.resume();
  rememberGame(m.code);
  duo.on = true;
  setME(m.me);
  const M = m.mode === 'career' ? careerMode(m.level) : MODES.endless;
  setG({
    online: true,
    mode: m.mode,
    M,
    state: 'play',
    t: 0,
    wave: 1,
    waveT: 0,
    waveDur: M.dur,
    isBoss: false,
    boss: null,
    kills: 0,
    combo: 0,
    level: 1,
    xp: 0,
    xpNext: xpFor(1),
    enemies: [],
    bullets: [],
    ebullets: [],
    pickups: [],
    zones: [],
    mines: [],
    parts: [],
    texts: [],
    fx: [],
    flashes: [],
    decals: [],
    booms: [],
    warn: [],
    players: [],
    cam: { x: 0, y: 0 },
    shake: 0,
    hurtFlash: 0,
    whiteFlash: 0,
    hitstop: 0,
    slowT: 0,
    snapAt: 0,
    snapDt: 50,
    started: false,
    waiting: false,
    // anticipation du déplacement : commandes envoyées et positions récentes du vaisseau
    seq: 0,
    lastIn: null,
    inT: 1,
    sent: new Map(), // numéro de commande → instant d'envoi (s)
    hist: [], // [instant, x, y]
  });
  setP(null);
  EV.length = 0;
  duoUi.start(m);
}

// ---------- Réception des instantanés ----------

function syncList(old, arr, make, set) {
  const map = new Map();
  for (const o of old) map.set(o.id, o);
  const out = [];
  for (const a of arr) {
    let o = map.get(a[0]);
    const fresh = !o;
    if (fresh) o = make(a);
    const x = a[2],
      y = a[3];
    if (fresh) {
      o.x = o.px = o.tx = x;
      o.y = o.py = o.ty = y;
    } else {
      o.px = o.x;
      o.py = o.y;
      o.tx = x;
      o.ty = y;
    }
    set(o, a);
    out.push(o);
  }
  return out;
}

const nowS = () => performance.now() / 1000;

// Position anticipée du vaisseau à l'instant t (d'après l'historique des images récentes)
function histAt(t) {
  const h = G.hist;
  if (!h.length || t <= h[0][0]) return h[0];
  for (let i = 1; i < h.length; i++) {
    if (h[i][0] >= t) {
      const a = h[i - 1],
        b = h[i];
      const k = (t - a[0]) / Math.max(1e-6, b[0] - a[0]);
      return [t, lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
    }
  }
  return h[h.length - 1];
}

// Écart entre la position calculée par le serveur et celle que le jeu avait anticipée au même moment
function reconcile(me, s) {
  const sentAt = G.sent.get(s.q);
  const far = Math.hypot(s.x - me.x, s.y - me.y) > 160;
  if (!G.started || me.down || far || sentAt === undefined || !G.hist.length) {
    me.x = s.x;
    me.y = s.y;
    G.hist.length = 0;
    return;
  }
  const h = histAt(sentAt + s.qt);
  if (!h) return;
  const k = 0.3;
  const ex = (s.x - h[1]) * k,
    ey = (s.y - h[2]) * k;
  me.x += ex;
  me.y += ey;
  // les positions plus récentes sont décalées d'autant : la même erreur n'est pas corrigée deux fois
  for (const q of G.hist)
    if (q[0] >= h[0]) {
      q[1] += ex;
      q[2] += ey;
    }
}

function applySnap(m) {
  if (!G || !G.online) return;
  const now = performance.now();
  if (G.snapAt) G.snapDt = clamp(G.snapDt * 0.8 + (now - G.snapAt) * 0.2, 30, 200);
  G.snapAt = now;
  const g = m.g,
    prev = G.state;
  [G.state, G.wave, G.waveT, G.waveDur] = g;
  G.isBoss = !!g[4];
  G.boss = G.isBoss ? { hp: g[5], maxHp: 1, bv: g[11] || 'crown' } : null;
  G.kills = g[6];
  G.combo = g[7];
  G.level = g[8];
  G.xp = g[9];
  G.xpNext = g[10];
  G.waiting = !!m.w;
  m.p.forEach((s, i) => {
    let o = G.players[i];
    if (!o)
      o = G.players[i] = {
        i,
        col: PCOLS[i],
        r: 14,
        vx: 0,
        vy: 0,
        step: 0,
        x: s.x,
        y: s.y,
        px: s.x,
        py: s.y,
        tx: s.x,
        ty: s.y,
        weapons: [],
        passives: {},
      };
    o.aim = s.a;
    o.hp = s.hp;
    o.maxHp = s.mh;
    o.inv = s.iv ? 0.3 : 0;
    o.down = !!s.dn;
    o.gone = !!s.gn;
    o.away = !!s.aw;
    o.name = s.nm;
    o.skin = s.sk;
    o.rev = s.rv;
    o.speed = s.sp;
    o.slowed = !!s.sl;
    o.coins = s.c;
    o.passives = s.ps || {};
    if (i === ME) reconcile(o, s);
    else {
      o.px = o.x;
      o.py = o.y;
      o.tx = s.x;
      o.ty = s.y;
      o.moving = !!s.mv;
    }
    o.weapons = s.w.map(a0 => {
      const w = { id: a0[0], lvl: a0[1], evo: !!a0[2], r: a0[3] };
      const a = a0.slice(1);
      const old = (G.players[i].weapons || []).find(x => x.id === w.id);
      if (w.id === 'flamer') {
        w.ang = a[3];
        w.on = !!a[4];
        w.len = a[5];
        w.wd = a[6];
      } else if (w.id === 'cryo') w.pts = a[3];
      else if (w.id === 'aura') w.R = a[3];
      else if (w.id === 'drones') {
        w.ang = a[3];
        w.rot = a[4];
        w.n = a[5];
        w.R = a[6];
        w.br = a[7];
      } else if (w.id === 'laser') {
        w.ang = a[3];
        w.rot = a[4];
        w.n = a[5];
        w.len = a[6];
      } else if (w.id === 'turret')
        w.tur = (a[3] || []).map(t => ({ x: t[0], y: t[1], ang: t[2], life: t[3], max: t[4], mob: !!t[5] }));
      if (old && old.ang !== undefined && w.ang !== undefined) {
        let d = ((w.ang - old.ang + Math.PI * 3) % TAU) - Math.PI;
        if (Math.abs(d) < 0.6) w.ang = old.ang + d * 0.5;
      }
      return w;
    });
  });
  G.players.length = m.p.length;
  setP(G.players[ME] || G.players[0]);
  if (!G.started && P) {
    G.started = true;
    G.cam.x = P.x;
    G.cam.y = P.y;
  }
  G.enemies = syncList(
    G.enemies,
    m.e,
    a => ({ id: a[0], type: ETI[a[1]], t: rand(10), ai: {} }),
    (o, a) => {
      const T = ETYPES[o.type];
      o.ang = a[4];
      const f = a[5];
      o.elite = !!(f & 1);
      o.flash = f & 2 ? 0.05 : 0;
      o.fuse = f & 4 ? 1 : 0;
      o.frozen = f & 16 ? 1 : 0;
      o.burnT = f & 32 ? 1 : 0;
      o.tele = f & 64 ? 1 : 0;
      o.gold = f & 128 ? 1 : 0;
      o.r = T.r * (o.elite ? 1.5 : 1);
      o.col = T.col;
      o.hp = a[6];
      o.maxHp = 1;
      o.ai.ph = f & 8 ? 'tele' : 'x';
      o.ai.ang = a[7];
      if (o.type === 'boss' && G.boss) o.bv = G.boss.bv;
    },
  );
  G.bullets = syncList(
    G.bullets,
    m.b,
    a => ({ id: a[0], k: ['shot', 'disc', 'lob', 'rocket'][a[1]], spin: 0, rot: 0 }),
    (o, a) => {
      if (o.k === 'shot') {
        o.dx = a[4];
        o.dy = a[5];
        o.r = a[6];
        o.col = a[7];
      } else if (o.k === 'disc') {
        o.r = a[4];
        o.col = a[5];
      } else if (o.k === 'lob') {
        o.h = a[4];
      } else {
        o.a = a[4];
        o.small = !!a[5];
        o.col = a[6];
      }
    },
  );
  G.ebullets = syncList(
    G.ebullets,
    m.q.map(a => [a[0], 0, a[1], a[2], a[3], a[4]]),
    a => ({ id: a[0] }),
    (o, a) => {
      o.r = a[4];
      o.col = a[5];
    },
  );
  G.pickups = syncList(
    G.pickups,
    m.k.map(a => [a[0], a[1], a[2], a[3], a[4]]),
    a => ({ id: a[0], type: PKI[a[1]], t: rand(3) }),
    (o, a) => {
      o.v = a[4];
    },
  );
  G.zones = m.z.map(a => ({
    x: a[0],
    y: a[1],
    R: a[2],
    life: a[3],
    max: a[4],
    evo: !!a[5],
    k: a[6] ? 'hole' : 'fire',
  }));
  G.warn = (m.h || []).map(a => ({ x: a[0], y: a[1], R: a[2], t: a[3], max: 1 }));
  G.mines = m.m.map((a, i) => ({ x: a[0], y: a[1], arm: a[2], evo: !!a[3], t: G.t + i * 0.7 }));
  for (const a of m.ev) {
    const f = FXR[a[0]];
    if (f)
      try {
        f(...a.slice(1));
      } catch (e) {}
  }
  if (G.state !== prev && G.state !== 'play') clearInput();
}

// Rejoue ici les effets enregistrés par le serveur
const FXR = {
  shake: addShake,
  burst,
  spark,
  ring,
  muzzle: muzzleAt,
  decal,
  fx: o => fxPush(o),
  flash: flashFx,
  white,
  hurt: hurtFx,
  banner,
  toast,
  text: (x, y, v, c, col) => addText(x, y, v, !!c, col),
  textfx: textFx,
  $: (k, ...a) => {
    if (k !== 'hurt' && Sfx[k]) Sfx[k](...a);
  },
};

// ---------- Une image ----------

// La commande est envoyée dès qu'elle change (30 fois par seconde au plus), et renvoyée 4 fois par seconde sinon
const IN_MIN = 1 / 30,
  IN_EVERY = 0.25;

export function duoUpdate(dt, paused) {
  G.t += dt;
  const me = P;
  const now = nowS();
  if (me) {
    const can = (G.state === 'play' || G.state === 'clear') && !me.down && !G.waiting;
    let inp = can && !paused ? inputVec() : [0, 0];
    // quantifiée : de petites variations du joystick n'envoient pas de nouvelle commande
    inp = [Math.round(inp[0] * 20) / 20, Math.round(inp[1] * 20) / 20];
    G.inT += dt;
    const changed = !G.lastIn || inp[0] !== G.lastIn[0] || inp[1] !== G.lastIn[1];
    if ((changed && G.inT >= IN_MIN) || G.inT >= IN_EVERY) {
      G.inT = 0;
      G.lastIn = inp;
      G.seq++;
      G.sent.set(G.seq, now);
      if (G.sent.size > 64) G.sent.delete(G.sent.keys().next().value);
      post('duo_in', { x: inp[0], y: inp[1], q: G.seq });
    }
    // on avance avec la commande envoyée (pas celle de l'instant) : exactement ce que fera le serveur
    if (can) movePlayer(me, G.lastIn, dt);
    else {
      me.vx = me.vy = 0;
      me.moving = false;
    }
    G.hist.push([now, me.x, me.y]);
    while (G.hist.length && G.hist[0][0] < now - 2) G.hist.shift();
    if (me.moving) me.step += dt * 14;
    G.cam.x += (me.x - G.cam.x) * Math.min(1, dt * 9);
    G.cam.y += (me.y - G.cam.y) * Math.min(1, dt * 9);
    // direction du regard : celle du déplacement (le serveur l'envoie aussi, mais avec du retard)
    if (me.moving) {
      const ta = Math.atan2(me.vy, me.vx);
      me.aim += (((ta - me.aim + Math.PI * 3) % TAU) - Math.PI) * Math.min(1, dt * 16);
    }
  }
  const a = clamp((performance.now() - G.snapAt) / G.snapDt, 0, 1);
  for (const L of [G.enemies, G.bullets, G.ebullets, G.pickups])
    for (const o of L) {
      o.x = lerp(o.px, o.tx, a);
      o.y = lerp(o.py, o.ty, a);
    }
  for (const pl of G.players) {
    if (pl.i !== ME) {
      pl.x = lerp(pl.px, pl.tx, a);
      pl.y = lerp(pl.py, pl.ty, a);
      if (pl.moving) pl.step += dt * 14;
    }
    for (const w of pl.weapons) if (w.rot) w.ang += w.rot * dt;
  }
  if (G.state === 'play' || G.state === 'clear' || G.state === 'dying') {
    for (const e of G.enemies) {
      e.t += dt;
      enemyFx(e, dt);
    }
    for (const k of G.pickups) k.t += dt;
    for (const pl of G.players) if (!pl.gone) weaponFx(pl, dt);
    for (const b of G.bullets) {
      if (b.k === 'disc') b.spin += dt * 18;
      else if (b.k === 'lob') b.rot += dt * 12;
      else if (b.k === 'rocket') rocketTrail(b);
    }
    for (const z of G.zones) {
      z.life = Math.max(0, z.life - dt);
      zoneFx(z, dt);
    }
  }
  updateCosmetics(dt, dt);
}
