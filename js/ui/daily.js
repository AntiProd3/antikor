// Cadeau de connexion (v1.2) : un par jour, 7 jours de suite, box de skin le 7e jour.
// Le serveur décide (date de Paris) ; le jeu affiche la fenêtre à l'arrivée au menu si le cadeau est disponible.

import { Sfx } from '../audio.js';
import { BOXES, DAILY } from '../data/loot.js';
import { SKIN_BOX, SKINS } from '../data/skins.js';
import { svg } from '../icons.js';
import { request } from '../online/client.js';
import { refreshMeta } from './boxes.js';
import { $, notice } from './dom.js';
import { revealSkin, spinSkin } from './skins.js';

const label = R =>
  R.cores
    ? `${svg('core', 2)}<b>${R.cores}</b><small>noyaux</small>`
    : R.box
      ? `${svg('box', 2)}<b>1</b><small>${BOXES[R.box].name}</small>`
      : `${svg('box', 2)}<b>1</b><small>${SKIN_BOX.name}</small>`;

function render(day, done) {
  $('#daily-days').innerHTML = DAILY.map((R, i) => {
    const d = i + 1;
    const cls = d < day || (done && d === day) ? 'got' : d === day ? 'today' : '';
    return `<div class="dday ${cls} ${R.skinBox ? 'big' : ''}" style="--c:${R.skinBox ? SKIN_BOX.col : R.box ? BOXES[R.box].col : 'var(--core)'}"><span class="dn">Jour ${d}</span>${label(R)}${cls === 'got' ? '<i>✓</i>' : ''}</div>`;
  }).join('');
}

let checking = false;

// À l'arrivée au menu : la fenêtre s'ouvre si le cadeau du jour n'a pas encore été pris
export async function checkDaily() {
  if (checking) return;
  checking = true;
  const r = await request('daily', { claim: false });
  checking = false;
  if (!r.ok || !r.can) return;
  render(r.day, false);
  $('#daily-note').textContent =
    r.day === 1
      ? 'Reviens demain pour le cadeau suivant. Un jour manqué fait repartir au jour 1.'
      : `Jour ${r.day} d’affilée : continue !`;
  $('#daily-btns').innerHTML = '<button class="btn btn-gold cut" id="btn-daily">Récupérer</button>';
  $('#daily').hidden = false;
}

async function claim() {
  const b = $('#btn-daily');
  if (b) b.disabled = true;
  Sfx.init();
  const r = await request('daily', { claim: true });
  if (!r.ok) {
    $('#daily').hidden = true;
    return notice(r.msg);
  }
  Sfx.buy();
  render(r.day, true);
  const got = r.skin ? 'un nouveau skin' : r.cores ? `+${r.cores} noyaux` : `1 ${BOXES[r.box].name} (à ouvrir au labo)`;
  $('#daily-note').textContent = `Récupéré : ${got}. À demain !`;
  $('#daily-btns').innerHTML = '<button class="btn cut" id="btn-daily-close">Fermer</button>';
  refreshMeta();
  if (r.skin) {
    $('#daily').hidden = true;
    // la roue montre les skins que pouvait donner la box (ceux du labo et de fidélité)
    const pool = Object.keys(SKINS).filter(k => SKINS[k].src === 'shop' || SKINS[k].src === 'daily');
    await spinSkin(r.skin, pool, SKIN_BOX.name);
    revealSkin(r.skin, 'CADEAU DU 7E JOUR', 'ajouté à tes skins (labo)');
  }
}

export function initDaily() {
  $('#daily').addEventListener('click', e => {
    if (e.target.closest('#btn-daily')) claim();
    else if (e.target.closest('#btn-daily-close')) $('#daily').hidden = true;
  });
}
