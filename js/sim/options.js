// Cartes proposées : montée de niveau, coffres et boutique (tirage, validité, effet, prix).

import { RARITY } from '../data/loot.js';
import { PASSIVES, PCOL } from '../data/passives.js';
import { WEAPONS } from '../data/weapons.js';
import { banner, sfx } from './fx.js';
import { addWeapon, getW, recalc } from './player.js';
import { G, P } from './state.js';

export function candidates(ctx) {
  const list = [];
  // un coffre n'apporte que des améliorations de ce qu'on a déjà (niveau d'arme, d'équipement, évolution) :
  // jamais d'arme ni d'équipement nouveaux
  const wSlots = P.weapons.length < P.ts.slots && ctx !== 'chest',
    pSlots = Object.keys(P.passives).length < 6 && ctx !== 'chest';
  for (const w of P.weapons) {
    const d = WEAPONS[w.id];
    if (w.lvl < 5) list.push({ kind: 'wup', id: w.id, w: 10 });
    else if (!w.evo && P.passives[d.evoWith] && ctx !== 'shop') list.push({ kind: 'evo', id: w.id, w: 40 });
  }
  if (wSlots) for (const id in P.owned) if (!getW(id)) list.push({ kind: 'wnew', id, w: ctx === 'shop' ? 7 : 5 });
  for (const id in P.passives) if (P.passives[id] < PASSIVES[id].max) list.push({ kind: 'pup', id, w: 8 });
  if (pSlots) for (const id in PASSIVES) if (!P.passives[id]) list.push({ kind: 'pnew', id, w: 4 });
  if (ctx === 'shop' && P.hp < P.maxHp * 0.75) list.push({ kind: 'heal', id: 'heal', w: 5 });
  return list;
}

export function weightedPicks(pool, n) {
  pool = pool.slice();
  const out = [];
  while (out.length < n && pool.length) {
    let tot = 0;
    for (const o of pool) tot += o.w;
    let r = Math.random() * tot,
      k = 0;
    for (; k < pool.length - 1; k++) {
      r -= pool[k].w;
      if (r <= 0) break;
    }
    out.push(pool.splice(k, 1)[0]);
  }
  return out;
}

export function rollOptions(n, ctx) {
  const c = candidates(ctx);
  const out = [];
  if (ctx === 'chest') {
    const evo = c.find(o => o.kind === 'evo');
    if (evo) out.push(evo);
  }
  out.push(
    ...weightedPicks(
      c.filter(o => !out.includes(o)),
      n - out.length,
    ),
  );
  // Plus rien à améliorer : un coffre soigne (la montée de niveau, elle, est gérée dans flow.js)
  if (!out.length && ctx === 'chest') out.push({ kind: 'heal', id: 'heal' });
  return out;
}

export function validOpt(o) {
  switch (o.kind) {
    case 'wnew':
      return !getW(o.id) && P.weapons.length < P.ts.slots;
    case 'wup': {
      const w = getW(o.id);
      return !!w && w.lvl < 5;
    }
    case 'evo': {
      const w = getW(o.id);
      return !!w && !w.evo && w.lvl >= 5 && !!P.passives[WEAPONS[o.id].evoWith];
    }
    case 'pnew':
      return !P.passives[o.id] && Object.keys(P.passives).length < 6;
    case 'pup':
      return !!P.passives[o.id] && P.passives[o.id] < PASSIVES[o.id].max;
    default:
      return true;
  }
}

export function applyOpt(o) {
  switch (o.kind) {
    case 'wnew':
      addWeapon(o.id);
      break;
    case 'wup':
      getW(o.id).lvl++;
      break;
    case 'evo': {
      getW(o.id).evo = true;
      banner(WEAPONS[o.id].evoName.toUpperCase(), 'ÉVOLUTION', '#ffd23e');
      sfx('evo');
      break;
    }
    case 'pnew':
      P.passives[o.id] = 1;
      break;
    case 'pup':
      P.passives[o.id]++;
      break;
    case 'heal':
      P.hp = Math.min(P.maxHp, P.hp + P.maxHp * 0.5);
      sfx('heal');
      break;
  }
  recalc();
  if ((o.kind === 'pnew' || o.kind === 'pup') && o.id === 'heart') P.hp = Math.min(P.maxHp, P.hp + 20);
}

export function optInfo(o) {
  if (o.kind === 'wnew' || o.kind === 'wup') {
    const d = WEAPONS[o.id];
    const w = getW(o.id);
    const l = w ? w.lvl : 0;
    const pn = PASSIVES[d.evoWith].name;
    const r = w ? w.r || 0 : P.owned[o.id] || 0;
    const to = w ? l + 1 : RARITY[r].lvl;
    return {
      name: d.name,
      tag: l ? 'NIV ' + (l + 1) : 'NOUVELLE ARME',
      col: d.col,
      icon: o.id,
      desc: d.up[l],
      from: l,
      to,
      max: 5,
      rar: r,
      hint: `Évolue avec ${pn} au niveau 5${P.passives[d.evoWith] ? ' ✓' : ''}`,
    };
  }
  if (o.kind === 'evo') {
    const d = WEAPONS[o.id];
    return { name: d.evoName, tag: 'ÉVOLUTION', evo: true, col: '#ffd23e', icon: o.id, desc: d.evoDesc };
  }
  if (o.kind === 'pnew' || o.kind === 'pup') {
    const d = PASSIVES[o.id];
    const l = P.passives[o.id] || 0;
    const ev = Object.keys(WEAPONS).find(k => WEAPONS[k].evoWith === o.id);
    let hint = '';
    if (ev) {
      const w = getW(ev);
      hint = w
        ? w.evo
          ? ''
          : `Fait évoluer ${WEAPONS[ev].name}${w.lvl >= 5 ? ' (prêt !)' : ' au niveau 5'}`
        : P.owned[ev] !== undefined
          ? `Évolution : ${WEAPONS[ev].name}`
          : '';
    }
    return {
      name: d.name,
      tag: l ? 'NIV ' + (l + 1) : 'ÉQUIPEMENT',
      col: PCOL,
      icon: o.id,
      desc: d.desc,
      from: l,
      to: l + 1,
      max: d.max,
      hint,
    };
  }
  return { name: 'Kit de soin', tag: 'SOIN', col: '#62ff9a', icon: 'heal', desc: 'Rend 50% des PV max.' };
}

export function optLabel(o) {
  const i = optInfo(o);
  if (o.kind === 'evo') return 'Évolution : ' + i.name;
  if (i.to) return i.name + ' niv ' + i.to;
  return i.name;
}

export function priceOf(o) {
  const m = 1 + 0.14 * (G.wave - 1);
  const w = getW(o.id),
    l = P.passives[o.id] || 0;
  switch (o.kind) {
    case 'wnew':
      return Math.round(32 * m);
    case 'wup':
      return Math.round((16 + 7 * (w ? w.lvl : 1)) * m);
    case 'pnew':
      return Math.round(24 * m);
    case 'pup':
      return Math.round((14 + 7 * l) * m);
    case 'heal':
      return Math.round(18 * m);
  }
  return 0;
}

export function rollShop() {
  const sh = P.shop;
  const keep = sh.offers.filter(s => s.locked && !s.sold && validOpt(s.o));
  const ids = new Set(keep.map(s => s.o.id));
  const picks = weightedPicks(
    candidates('shop').filter(o => !ids.has(o.id) && !sh.bought.includes(o.id)),
    4 - keep.length,
  );
  sh.offers = [...keep, ...picks.map(o => ({ o, locked: false, sold: false }))];
}

export function rerollCost(pl) {
  return 4 + 2 * G.wave + 3 * pl.shop.rerolls;
}
