// Règles de la progression du joueur (noyaux, talents, box, armes, récompenses de fin de partie).
// Partagées entre le jeu et le serveur : le serveur (dépôt AntiBack) importe ce fichier et l'applique
// pour de vrai ; le jeu s'en sert seulement pour afficher les prix, les conditions et les chances.
// Aucune dépendance à la page : ni document, ni window, ni sauvegarde.

import { CAREER_LEVELS, worldOf } from './data/career.js';
import { BOXES, DAILY } from './data/loot.js';
import { HALLOWEEN, SKIN_BOX, SKINS } from './data/skins.js';
import { TALENTS } from './data/talents.js';
import { WEAPONS } from './data/weapons.js';

// Progression d'un nouveau compte : un Blaster commun et une Box Souche offerte
// inv = armes possédées {u: identifiant unique, id: type d'arme, r: rareté 0-4} ; equip = u de l'arme de départ
export function newProgress() {
  return {
    cores: 0,
    talents: {},
    inv: [{ u: 1, id: 'blaster', r: 0 }],
    equip: 1,
    uid: 2,
    boxes: { std: 1, prem: 0 },
    career: { max: 1, stars: {} },
    best: {},
    runs: 0,
    wins: 0,
    totalKills: 0,
    // pour le classement : dégâts cumulés, meilleur niveau de héros et meilleur combo en une partie
    stats: { dmg: 0, maxLevel: 0, maxCombo: 0 },
    // v1.2 : skins possédés et équipé, skin tiré dans la box Halloween (une seule par joueur), cadeau quotidien
    skins: [],
    skin: 'base',
    halloween: null,
    daily: { last: null, day: 0 },
  };
}

// ---------- Talents ----------

export function talentLevel(prog, id) {
  return prog.talents[id] || 0;
}

export function talentCost(t, l) {
  return t.costs ? t.costs[l] : t.cost * (l + 1);
}

// Arsenal : le niveau n s'achète une fois le monde n + 1 atteint en carrière (monde 2 : 2 armes, monde 3 : 3 armes).
// Renvoie le monde requis, ou 0 s'il n'y a pas de restriction.
export function talentGate(t, l, careerMax) {
  if (t.id !== 'slot' || l >= t.max) return 0;
  const need = l + 2;
  return worldOf(careerMax) + 1 >= need ? 0 : need;
}

// Mise à niveau d'une progression enregistrée avec des règles plus anciennes (appliquée par le serveur au chargement).
// v1.1 : Arsenal limité à 2 niveaux (3 armes) ; le niveau en trop est remboursé. Renvoie true si quelque chose a changé.
export function upgradeProgress(prog) {
  let changed = false;
  const t = TALENTS.find(x => x.id === 'slot');
  const l = prog.talents.slot || 0;
  if (l > t.max) {
    prog.cores += [120, 260, 450].slice(t.max, l).reduce((a, b) => a + b, 0);
    prog.talents.slot = t.max;
    changed = true;
  }
  return changed;
}

// Effet des talents achetés, tel que la partie l'utilise
export function talentStats(talents) {
  const T = id => talents[id] || 0;
  return {
    slots: 1 + Math.min(T('slot'), 2),
    hp: 10 * T('hp'),
    dmg: 0.05 * T('dmg'),
    spd: 0.04 * T('spd'),
    mag: 0.15 * T('mag'),
    gold: 0.1 * T('gold'),
    startGold: 20 * T('start'),
    armor: 0.04 * T('armor'),
    freeRerolls: T('reroll'),
    choice: T('choice'),
    revive: T('revive'),
  };
}

// Renvoie null si l'achat est fait, sinon la raison du refus
export function buyTalent(prog, id) {
  const t = TALENTS.find(x => x.id === id);
  if (!t) return 'unknown';
  const l = talentLevel(prog, id);
  if (l >= t.max) return 'max';
  if (talentGate(t, l, prog.career.max)) return 'locked';
  const cost = talentCost(t, l);
  if (prog.cores < cost) return 'not_enough';
  prog.cores -= cost;
  prog.talents[id] = l + 1;
  return null;
}

// ---------- Armes ----------

// Meilleure rareté possédée pour chaque arme
export function ownedMap(inv) {
  const o = {};
  for (const it of inv) o[it.id] = Math.max(o[it.id] ?? -1, it.r);
  return o;
}

export function equippedItem(prog) {
  return prog.inv.find(x => x.u === prog.equip) || prog.inv[0];
}

// Ce que la partie reçoit pour créer le joueur : talents, armes possédées et arme de départ
export function playerSpec(prog) {
  const it = equippedItem(prog);
  return {
    ts: talentStats(prog.talents),
    owned: ownedMap(prog.inv),
    start: { id: it.id, r: it.r },
    skin: ownsSkin(prog, prog.skin) ? prog.skin : 'base',
  };
}

export function equip(prog, u) {
  if (!prog.inv.some(x => x.u === u)) return 'unknown';
  prog.equip = u;
  return null;
}

// 3 exemplaires identiques (même arme, même rareté) → 1 exemplaire de la rareté au-dessus
export function fuse(prog, id, r) {
  const its = prog.inv.filter(x => x.id === id && x.r === r);
  if (r >= 4 || its.length < 3) return { error: 'not_enough' };
  const used = its.slice(0, 3);
  const wasEquipped = used.some(x => x.u === prog.equip);
  prog.inv = prog.inv.filter(x => !used.includes(x));
  const item = { u: prog.uid++, id, r: r + 1 };
  prog.inv.push(item);
  if (wasEquipped) prog.equip = item.u;
  return { item };
}

// ---------- Skins (v1.2) ----------

export function ownsSkin(prog, id) {
  return id === 'base' || (Object.hasOwn(SKINS, id) && (prog.skins || []).includes(id));
}

function addSkin(prog, id) {
  prog.skins = prog.skins || [];
  if (!prog.skins.includes(id)) prog.skins.push(id);
}

// Achat d'un skin du labo (il est équipé tout de suite). Renvoie null si c'est fait, sinon la raison du refus.
export function buySkin(prog, id) {
  if (!Object.hasOwn(SKINS, id)) return 'unknown';
  const s = SKINS[id];
  if (s.src !== 'shop') return 'locked';
  if (ownsSkin(prog, id)) return 'owned';
  if (prog.cores < s.price) return 'not_enough';
  prog.cores -= s.price;
  addSkin(prog, id);
  prog.skin = id;
  return null;
}

export function equipSkin(prog, id) {
  if (!ownsSkin(prog, id)) return 'unknown';
  prog.skin = id;
  return null;
}

// Box Halloween : une seule par joueur, un skin d'Halloween tiré au sort (le Squelette est le plus rare)
export function openHalloween(prog, rnd) {
  if (prog.halloween) return { error: 'opened' };
  if (prog.cores < HALLOWEEN.cost) return { error: 'not_enough' };
  const pool = Object.keys(SKINS).filter(k => SKINS[k].src === 'halloween');
  let x = rnd() * pool.reduce((a, k) => a + SKINS[k].odds, 0),
    id = pool[pool.length - 1];
  for (const k of pool) {
    x -= SKINS[k].odds;
    if (x < 0) {
      id = k;
      break;
    }
  }
  prog.cores -= HALLOWEEN.cost;
  addSkin(prog, id);
  prog.halloween = id;
  prog.skin = id;
  return { skin: id };
}

// Box de skin (cadeau du 7e jour) : un skin du labo ou de fidélité pas encore possédé, sinon des noyaux
export function rollSkinBox(prog, rnd) {
  const pool = Object.keys(SKINS).filter(
    k => (SKINS[k].src === 'shop' || SKINS[k].src === 'daily') && !ownsSkin(prog, k),
  );
  if (!pool.length) {
    prog.cores += SKIN_BOX.fallbackCores;
    return { cores: SKIN_BOX.fallbackCores };
  }
  const id = pool[Math.floor(rnd() * pool.length)];
  addSkin(prog, id);
  return { skin: id };
}

// ---------- Cadeau de connexion (v1.2) ----------
// today et yesterday : dates du jour et de la veille ('AAAA-MM-JJ', heure de Paris), données par le serveur

export function dailyNext(prog, today, yesterday) {
  const d = prog.daily || { last: null, day: 0 };
  if (d.last === today) return { can: false, day: d.day };
  return { can: true, day: d.last === yesterday ? (d.day % DAILY.length) + 1 : 1 };
}

export function claimDaily(prog, today, yesterday, rnd) {
  const st = dailyNext(prog, today, yesterday);
  if (!st.can) return { error: 'already' };
  const R = DAILY[st.day - 1];
  const reward = { day: st.day };
  if (R.cores) {
    prog.cores += R.cores;
    reward.cores = R.cores;
  }
  if (R.box) {
    prog.boxes[R.box]++;
    reward.box = R.box;
  }
  if (R.skinBox) Object.assign(reward, rollSkinBox(prog, rnd));
  prog.daily = { last: today, day: st.day };
  return reward;
}

// ---------- Box ----------

// rnd() renvoie un nombre entre 0 et 1 (Math.random dans le jeu, générateur cryptographique sur le serveur)
export function rollBox(kind, rnd) {
  const B = BOXES[kind];
  let x = rnd() * B.odds.reduce((a, b) => a + b, 0),
    r = 0;
  for (; r < 4; r++) {
    x -= B.odds[r];
    if (x < 0) break;
  }
  const ids = Object.keys(WEAPONS);
  return { id: ids[Math.floor(rnd() * ids.length)], r };
}

// Ouvre une box du stock (buy = false) ou en achète une (buy = true)
export function openBox(prog, kind, buy, rnd) {
  if (!Object.hasOwn(BOXES, kind)) return { error: 'unknown' };
  const B = BOXES[kind];
  if (buy) {
    if (prog.cores < B.cost) return { error: 'not_enough' };
    prog.cores -= B.cost;
  } else {
    if (!(prog.boxes[kind] > 0)) return { error: 'no_box' };
    prog.boxes[kind]--;
  }
  const res = rollBox(kind, rnd);
  const isNew = ownedMap(prog.inv)[res.id] === undefined;
  const item = { u: prog.uid++, id: res.id, r: res.r };
  prog.inv.push(item);
  return { item, isNew };
}

// ---------- Fin de partie ----------

// d = résultat de la partie (déjà vérifié par le serveur) : win, quit, mode, cl (niveau de carrière), hp (0 à 1),
// wave, kills, bossKills, boxes {std, prem}, dmg, level (héros), maxCombo. Met à jour la progression et renvoie les récompenses.
// Part des noyaux gagnés en Infini pour les vagues en dessous de son record
export const ENDLESS_OLD = 0.15;

export function runRewards(prog, d) {
  const career = d.mode === 'career';
  const waves = d.win ? d.wave : d.wave - 1;
  // Carrière : étoiles selon les PV restants, bonus au premier passage et pour chaque nouvelle étoile, niveau suivant débloqué
  let stars = 0,
    bonus = 0,
    unlocked = false;
  if (career && d.win && !d.quit) {
    stars = d.hp >= 0.75 ? 3 : d.hp >= 0.4 ? 2 : 1;
    const prev = prog.career.stars[d.cl] || 0;
    if (!prev) bonus += 10 + 3 * d.cl;
    if (stars > prev) {
      bonus += (stars - prev) * 5;
      prog.career.stars[d.cl] = stars;
    }
    // en duo, le partenaire peut jouer un niveau qu'il n'a pas encore débloqué : il ne saute pas de niveau pour autant
    if (d.cl === prog.career.max && d.cl < CAREER_LEVELS) {
      prog.career.max = d.cl + 1;
      unlocked = true;
    }
  }
  let cores;
  // Infini (v1.1) : les vagues déjà franchies lors de son record ne rapportent presque rien (15 %) ;
  // seules les vagues au-delà du record rapportent tous leurs noyaux
  const prevBest = prog.best[d.mode] || 0;
  let underRecord = false;
  if (!career) {
    const prevDone = Math.max(0, prevBest - 1); // vagues terminées lors du record
    const fresh = Math.max(0, waves - prevDone),
      old = waves - fresh;
    const oldBoss = Math.min(d.bossKills, Math.floor(prevDone / 5)),
      freshBoss = d.bossKills - oldBoss;
    const share = waves ? Math.max(ENDLESS_OLD, fresh / waves) : ENDLESS_OLD;
    cores = Math.floor(
      3 * fresh + 3 * ENDLESS_OLD * old + 8 * freshBoss + 8 * ENDLESS_OLD * oldBoss + (d.kills / 40) * share,
    );
    underRecord = old > 0;
  } else cores = Math.floor(waves * 3 + d.kills / 40 + d.bossKills * 8 + bonus);
  cores = d.quit ? 0 : Math.max(1, cores);
  prog.cores += cores;
  prog.totalKills += d.kills;
  const st = (prog.stats = Object.assign({ dmg: 0, maxLevel: 0, maxCombo: 0 }, prog.stats));
  st.dmg += Math.max(0, Math.round(d.dmg) || 0);
  st.maxLevel = Math.max(st.maxLevel, d.level | 0);
  st.maxCombo = Math.max(st.maxCombo, d.maxCombo | 0);
  if (d.win) prog.wins++;
  const best = prog.best[d.mode] || 0;
  const newRec = !career && d.wave > best;
  if (newRec) prog.best[d.mode] = d.wave;
  // les box trouvées sont gardées, même en cas d'abandon
  const boxes = { std: d.boxes.std | 0, prem: d.boxes.prem | 0 };
  prog.boxes.std += boxes.std;
  prog.boxes.prem += boxes.prem;
  return { cores, stars, unlocked, newRec, boxes, underRecord, prevBest };
}
