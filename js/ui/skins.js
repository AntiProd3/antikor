// Skins au labo (v1.2) : box Halloween (une par joueur), skins à acheter, équiper.

import { Sfx } from '../audio.js';
import { HALLOWEEN, SKINS, SRC_LABEL } from '../data/skins.js';
import { svg } from '../icons.js';
import { prog, request } from '../online/client.js';
import { drawSkinPreview } from '../render/hero.js';
import { ownsSkin } from '../rules.js';
import { $, flashDeny, notice } from './dom.js';

export function renderSkins() {
  const el = $('#lab-skins');
  const hw = prog.halloween;
  const canHw = !hw && prog.cores >= HALLOWEEN.cost;
  let h = `<div class="skin-card hw cut" style="--c:${HALLOWEEN.col}"><canvas width="128" height="128" data-skin="${hw || 'pumpkin'}" class="${hw ? '' : 'mystery'}"></canvas>
  <div><b>${HALLOWEEN.name}</b><small>${hw ? 'Ouverte : ' + SKINS[hw].name : 'Une seule par joueur · un skin d’Halloween au hasard'}</small></div>
  ${hw ? '<span class="skin-tag">OUVERTE</span>' : `<button class="btn btn-gold cut" data-hw ${canHw ? '' : 'aria-disabled="true"'}>Ouvrir · <span class="nk">${svg('core', 2)}${HALLOWEEN.cost}</span></button>`}</div>`;
  for (const [id, S] of Object.entries(SKINS)) {
    const own = ownsSkin(prog, id);
    const on = (prog.skin || 'base') === id;
    // les skins d'Halloween et de fidélité ne se montrent qu'une fois obtenus (surprise)
    if (!own && S.src !== 'shop') continue;
    let act;
    if (on) act = '<span class="skin-tag on">ÉQUIPÉ</span>';
    else if (own) act = `<button class="btn cut" data-equip-skin="${id}">Équiper</button>`;
    else
      act = `<button class="btn cut" data-buy-skin="${id}" ${prog.cores < S.price ? 'aria-disabled="true"' : ''}>${svg('core', 2)}${S.price}</button>`;
    h += `<div class="skin-card cut ${on ? 'on' : ''}"><canvas width="128" height="128" data-skin="${id}"></canvas><div><b>${S.name}</b><small>${SRC_LABEL[S.src]}</small></div>${act}</div>`;
  }
  el.innerHTML = h;
  for (const cv of el.querySelectorAll('canvas[data-skin]')) drawSkinPreview(cv, cv.dataset.skin, 0.5);
}

// Révélation d'un skin obtenu (box Halloween, cadeau du 7e jour)
export function revealSkin(id, title, sub = 'équipé') {
  const ov = $('#box-open');
  ov.hidden = false;
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
      const r = await request('skin_box', { kind: 'halloween' });
      if (!r.ok) return notice(r.msg);
      return revealSkin(r.skin, 'BOX HALLOWEEN');
    }
    const id = b.dataset.buySkin || b.dataset.equipSkin;
    const r = await request(b.dataset.buySkin ? 'skin_buy' : 'skin_equip', { id });
    if (r.ok) Sfx.buy();
    else notice(r.msg);
  });
}
