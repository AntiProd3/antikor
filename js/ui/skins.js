// Skins au labo (v1.2) : box Halloween (une par joueur, puis rachetable pour les skins manquants), équiper.

import { Sfx } from '../audio.js';
import { HALLOWEEN, SKINS, SRC_LABEL } from '../data/skins.js';
import { svg } from '../icons.js';
import { prog, request } from '../online/client.js';
import { drawSkinPreview } from '../render/hero.js';
import { halloweenOpen, halloweenPool, ownsSkin } from '../rules.js';
import { $, flashDeny, notice } from './dom.js';
import { narrowStage, spin, weighted } from './roulette.js';

export function renderSkins() {
  const el = $('#lab-skins');
  const hw = prog.halloween;
  const again = halloweenOpen(Date.now());
  const left = halloweenPool(prog, Date.now()).length;
  // ouverte (avant la réouverture) ou tous les skins d'Halloween déjà possédés : plus rien à acheter
  const shut = again ? !left : !!hw;
  const canHw = !shut && prog.cores >= HALLOWEEN.cost;
  const sub = shut
    ? again
      ? 'Tu as les 4 skins d’Halloween !'
      : 'Ouverte : ' + SKINS[hw].name
    : again
      ? `Un skin d’Halloween que tu n’as pas encore · ${left} restant${left > 1 ? 's' : ''}`
      : 'Une seule par joueur · un skin d’Halloween au hasard';
  let h = `<div class="skin-card hw cut" style="--c:${HALLOWEEN.col}"><canvas width="128" height="128" data-skin="${shut && hw ? hw : 'pumpkin'}" class="${shut ? '' : 'mystery'}"></canvas>
  <div><b>${HALLOWEEN.name}</b><small>${sub}</small></div>
  ${shut ? `<span class="skin-tag">${again ? 'COMPLÈTE' : 'OUVERTE'}</span>` : `<button class="btn btn-gold cut" data-hw ${canHw ? '' : 'aria-disabled="true"'}>Ouvrir · <span class="nk">${svg('core', 2)}${HALLOWEEN.cost}</span></button>`}</div>`;
  for (const [id, S] of Object.entries(SKINS)) {
    const own = ownsSkin(prog, id);
    const on = (prog.skin || 'base') === id;
    // seuls les skins possédés s'affichent (pas d'achat au labo : on les obtient par la box Halloween)
    if (!own) continue;
    const act = on
      ? '<span class="skin-tag on">ÉQUIPÉ</span>'
      : `<button class="btn cut" data-equip-skin="${id}">Équiper</button>`;
    h += `<div class="skin-card cut ${on ? 'on' : ''}"><canvas width="128" height="128" data-skin="${id}"></canvas><div><b>${S.name}</b><small>${SRC_LABEL[S.src]}</small></div>${act}</div>`;
  }
  el.innerHTML = h;
  for (const cv of el.querySelectorAll('canvas[data-skin]')) drawSkinPreview(cv, cv.dataset.skin, 0.5);
  // labo ouvert au moment de la réouverture : la carte se met à jour toute seule
  clearTimeout(reopen);
  if (!again) reopen = setTimeout(renderSkins, Math.min(HALLOWEEN.again - Date.now() + 1000, 2 ** 31 - 1));
}

let reopen = 0;

// Roue d'un tirage de skin (v1.2.1) : pool = skins possibles, avec leurs chances (odds) ou à égalité
export function spinSkin(win, pool, title) {
  return spin({
    title,
    win,
    filler: () => weighted(pool.map(id => [id, SKINS[id].odds || 1])),
    tile: id => `<canvas width="96" height="96"></canvas><b>${SKINS[id].name}</b>`,
    col: id => (SKINS[id].col && SKINS[id].col !== 'prism' ? SKINS[id].col : '#ffffff'),
    after: (id, el) => drawSkinPreview(el.querySelector('canvas'), id, 0.5),
    reveal: 4,
  });
}

// Révélation d'un skin obtenu (box Halloween, cadeau du 7e jour)
export function revealSkin(id, title, sub = 'équipé') {
  const ov = $('#box-open');
  ov.hidden = false;
  narrowStage();
  ov.dataset.k = '';
  const S = SKINS[id];
  $('#bo-stage').innerHTML = `<div class="bo-new">${title}</div>
  <div class="bo-card skin-reveal"><canvas width="256" height="256" id="skin-rev"></canvas><div class="card-name">${S.name}</div><p class="card-desc">${SRC_LABEL[S.src]} · ${sub}</p></div>
  <div class="bo-btns"><button class="btn btn-gold cut" data-close-skin>Super !</button></div>`;
  const cv = $('#skin-rev');
  let t = 0;
  const anim = () => {
    if (!cv.isConnected) return;
    t += 1 / 60;
    drawSkinPreview(cv, id, t);
    requestAnimationFrame(anim);
  };
  anim();
  Sfx.reveal(3);
  ov.onclick = e => {
    if (e.target.closest('[data-close-skin]')) ov.hidden = true;
  };
}

export function initSkins() {
  $('#lab-skins').addEventListener('click', async e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.getAttribute('aria-disabled')) return flashDeny(b);
    Sfx.init();
    if (b.dataset.hw !== undefined) {
      // skins possibles, calculés avant que la progression reçue n'y ajoute le skin obtenu
      const pool = halloweenPool(prog, Date.now());
      const r = await request('skin_box', { kind: 'halloween' });
      if (!r.ok) return notice(r.msg);
      Sfx.unbox();
      await spinSkin(r.skin, pool, HALLOWEEN.name);
      return revealSkin(r.skin, 'BOX HALLOWEEN');
    }
    const id = b.dataset.equipSkin;
    const r = await request('skin_equip', { id });
    if (r.ok) Sfx.buy();
    else notice(r.msg);
  });
}
