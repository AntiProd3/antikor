// Roue d'ouverture des box (v1.2.1), façon CS:GO : une bande horizontale de possibilités, chacune à la couleur
// de sa rareté, défile, ralentit et s'arrête sur l'objet obtenu (tiré par le serveur), qui s'agrandit (v1.2.2).

import { Sfx } from '../audio.js';
import { $ } from './dom.js';

const N = 46; // cases sur la bande
const WIN = 38; // place de l'objet obtenu (assez loin pour un long défilement)

// Tire une case au hasard selon des poids : pool = [[valeur, poids], …]
export function weighted(pool) {
  let x = Math.random() * pool.reduce((a, p) => a + p[1], 0);
  for (const [v, w] of pool) {
    x -= w;
    if (x < 0) return v;
  }
  return pool[pool.length - 1][0];
}

// opts : win (objet obtenu), filler() (une case au hasard), tile(objet) → HTML, col(objet) → couleur,
// after(objet, élément) facultatif (ex. dessiner un aperçu dans la case), title (texte au-dessus)
// Renvoie une promesse résolue quand la roue est arrêtée (un clic ou une touche accélère jusqu'à la fin).
export function spin(opts) {
  const ov = $('#box-open');
  ov.hidden = false;
  const items = Array.from({ length: N }, (_, i) => (i === WIN ? opts.win : opts.filler()));
  const stage = $('#bo-stage');
  stage.classList.add('wide');
  stage.innerHTML = `<div class="bo-hint">${opts.title || 'Ouverture…'}</div>
  <div class="rl"><div class="rl-track">${items
    .map((it, i) => `<div class="rl-tile" data-i="${i}" style="--rc:${opts.col(it)}">${opts.tile(it)}</div>`)
    .join('')}</div><div class="rl-mark"></div></div>`;
  const tiles = stage.querySelectorAll('.rl-tile');
  if (opts.after) tiles.forEach((el, i) => opts.after(items[i], el));
  const track = stage.querySelector('.rl-track');
  const rl = stage.querySelector('.rl');
  // largeur réelle d'une case et pas entre deux cases (mesurés : le CSS peut changer)
  const TILE = tiles[0].offsetWidth;
  const STEP = tiles[1].offsetLeft - tiles[0].offsetLeft;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dur = reduced ? 1200 : 5200;
  // l'arrêt tombe quelque part dans la case gagnante, pas toujours au centre (suspense)
  const center = rl.clientWidth / 2;
  const target = -(WIN * STEP + TILE / 2 + (Math.random() - 0.5) * TILE * 0.7) + center;
  const start = center - TILE / 2 - STEP * 2;
  const ease = t => 1 - Math.pow(1 - t, 4);
  let t0 = 0,
    last = -1,
    skip = false;
  return new Promise(resolve => {
    const done = () => {
      track.style.transform = `translateX(${target}px)`;
      tiles[WIN].classList.add('win');
      stage.querySelector('.bo-hint').textContent = opts.doneTitle || '';
      Sfx.reveal(opts.reveal ?? 3);
      ov.onclick = null;
      removeEventListener('keydown', onKey);
      setTimeout(resolve, 900);
    };
    const onKey = () => (skip = true);
    ov.onclick = () => (skip = true);
    addEventListener('keydown', onKey);
    const frame = now => {
      if (!t0) t0 = now;
      const k = Math.min(1, (now - t0) / dur);
      if (skip || k >= 1) return done();
      const x = start + (target - start) * ease(k);
      track.style.transform = `translateX(${x}px)`;
      // un petit « clic » à chaque case qui passe sous le repère
      const i = Math.floor((center - x) / STEP);
      if (i !== last) {
        last = i;
        Sfx.click();
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
}

// Remet la scène de l'ouverture à sa largeur normale (carte révélée, boutons)
export function narrowStage() {
  $('#bo-stage').classList.remove('wide');
}
