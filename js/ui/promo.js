// Codes promo (v1.2), cachés : 5 appuis rapides sur le numéro de version en bas à droite.
// Les codes et leurs cadeaux sont sur le serveur (dépôt privé) : le jeu ne les connaît pas.

import { Sfx } from '../audio.js';
import { BOXES } from '../data/loot.js';
import { SKINS } from '../data/skins.js';
import { account, request } from '../online/client.js';
import { G } from '../sim/state.js';
import { refreshMeta } from './boxes.js';
import { $ } from './dom.js';
import { revealSkin } from './skins.js';

function open() {
  if (G || !account.name) return; // pas pendant une partie, ni avant la connexion
  $('#promo-in').value = '';
  $('#promo-note').textContent = '';
  $('#promo').hidden = false;
  $('#promo-in').focus();
}

async function submit() {
  const code = $('#promo-in').value.trim();
  if (!code) return;
  Sfx.init();
  const r = await request('promo', { code });
  if (!r.ok) {
    Sfx.deny();
    $('#promo-note').textContent = r.msg || 'Code refusé.';
    return;
  }
  Sfx.buy();
  const got = [];
  if (r.cores) got.push(`+${r.cores} noyaux`);
  if (r.std) got.push(`+${r.std} ${BOXES.std.name}`);
  if (r.prem) got.push(`+${r.prem} ${BOXES.prem.name}`);
  if (r.skin) got.push('skin ' + SKINS[r.skin].name);
  $('#promo-note').textContent = 'Code accepté : ' + got.join(' · ') + (r.std || r.prem ? ' (à ouvrir au labo)' : '');
  refreshMeta();
  if (r.skin) {
    $('#promo').hidden = true;
    revealSkin(r.skin, 'CODE ' + code.toUpperCase(), 'ajouté à tes skins (labo)');
  }
}

export function initPromo() {
  let taps = [];
  $('#ver').addEventListener('pointerdown', () => {
    const t = performance.now();
    taps = taps.filter(x => t - x < 3000);
    taps.push(t);
    if (taps.length >= 5) {
      taps = [];
      open();
    }
  });
  $('#promo-form').addEventListener('submit', e => {
    e.preventDefault();
    submit();
  });
  $('#promo-close').addEventListener('click', () => ($('#promo').hidden = true));
  $('#promo-in').addEventListener('input', e => {
    e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
  });
}
