// Labo : talents permanents (les box sont dans boxes.js).

import { Sfx } from '../audio.js';
import { TALENTS } from '../data/talents.js';
import { svg } from '../icons.js';
import { T, talentCost, talentGate } from '../meta.js';
import { prog, request } from '../online/client.js';
import { renderBox } from './boxes.js';
import { pips } from './cards.js';
import { $, flashDeny, notice, show } from './dom.js';
import { renderMenu } from './menu.js';
import { renderSkins } from './skins.js';
import { retip } from './tooltips.js';

export function renderLab() {
  $('#lab-cores').innerHTML = svg('core', 2) + `<span class="num">${prog.cores}</span><small>noyaux</small>`;
  const nb = prog.boxes.std + prog.boxes.prem;
  $('#lab-box-sub').textContent = nb ? nb + ' à ouvrir' : 'une arme au hasard, aussi lâchées par les boss';
  renderBox();
  renderSkins();
  setTimeout(retip);
  $('#lab-talents').innerHTML = TALENTS.map((t, i) => {
    const l = T(t.id);
    const max = l >= t.max;
    const cost = talentCost(t, l);
    const gate = talentGate(t, l);
    return `<button class="card cut tal ${gate ? 'gated' : ''}" data-t="${i}" data-tip="t:${t.id}" ${max || gate || prog.cores < cost ? 'aria-disabled="true"' : ''} style="--c:${t.col}"><div class="card-top"><span class="ico">${svg(t.icon)}</span><span class="tag">${max ? 'MAX' : 'NIV ' + l + ' / ' + t.max}</span><span class="tipi" data-tipi>?</span></div><div class="card-name">${t.name}</div>${pips({ from: l, to: l, max: t.max })}<p class="card-desc">${t.desc}</p><div class="price-row">${gate ? `<span class="price gate">${svg('lock')}Monde ${gate} requis</span>` : `<span class="price ${max ? '' : 'nk'} ${!max && prog.cores < cost ? 'poor' : ''}">${max ? 'MAX' : svg('core', 2) + cost + ' noyaux'}</span>`}</div></button>`;
  }).join('');
}

export function initLab() {
  $('#btn-lab').addEventListener('click', () => {
    Sfx.init();
    renderLab();
    show('scr-lab');
  });
  $('#btn-lab-back').addEventListener('click', () => {
    renderMenu();
    show('scr-menu');
  });
  $('#lab-talents').addEventListener('click', e => {
    const b = e.target.closest('[data-t]');
    if (!b) return;
    const t = TALENTS[+b.dataset.t];
    const l = T(t.id);
    const cost = talentCost(t, l);
    if (l >= t.max || talentGate(t, l) || prog.cores < cost) {
      flashDeny(b);
      return;
    }
    // le serveur fait l'achat ; la nouvelle progression arrive juste avant sa réponse et réaffiche le labo
    request('talent_buy', { id: t.id }).then(r => {
      if (r.ok) Sfx.buy();
      else {
        flashDeny(b);
        notice(r.msg);
      }
    });
  });
}
