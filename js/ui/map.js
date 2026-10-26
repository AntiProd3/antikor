// Carte de la carrière.

import { Sfx } from '../audio.js';
import { CAREER_LEVELS, WORLDS, careerBosses, isFinale, worldOf } from '../data/career.js';
import { BOSSV } from '../data/enemies.js';
import { ICON, svg } from '../icons.js';
import { account, prog, request } from '../online/client.js';
import { setG, setP } from '../sim/state.js';
import { $, currentScreen, esc, show } from './dom.js';
import { startGame } from './game.js';

/* ---------- Carte de la carrière : chemin sinueux, niveau 1 en bas ---------- */

export function starsSvg(n, cls = '') {
  return [1, 2, 3]
    .map(i => `<svg viewBox="0 0 24 24" class="${i <= n ? 'on' : ''} ${cls}">${ICON.star}</svg>`)
    .join('');
}

// Joueurs arrêtés à chaque niveau (v1.2) : { niveau: { top: [{ name, stars }], n } }, demandé au serveur
let board = {};

async function loadBoard() {
  const r = await request('career_board');
  if (!r.ok) return;
  board = r.levels || {};
  if (currentScreen() === 'scr-map') renderMap();
}

export function openMap(focus) {
  loadBoard();
  setG(null);
  setP(null);
  $('#hud').hidden = true;
  $('#map-pop').hidden = true;
  show('scr-map');
  renderMap();
  requestAnimationFrame(() => {
    const n = document.querySelector(`.lv[data-lv="${focus || prog.career.max}"]`);
    if (n) n.scrollIntoView({ block: 'center' });
  });
}

export function renderMap() {
  const inner = $('#map-inner');
  const W = inner.clientWidth || 520;
  const N = CAREER_LEVELS,
    GAP = 118,
    PAD = 120;
  const H = PAD * 2 + (N - 1) * GAP;
  inner.style.height = H + 'px';
  const amp = Math.min(W * 0.3, 190);
  const pos = i => ({ x: W / 2 + Math.sin(i * 0.85) * amp, y: H - PAD - i * GAP });
  const pts = [];
  for (let i = 0; i < N; i++) pts.push(pos(i));
  // courbe lissée (Catmull-Rom → Bézier) passant par tous les niveaux
  const path = k => {
    let d = `M${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < k; i++) {
      const p0 = pts[Math.max(0, i - 1)],
        p1 = pts[i],
        p2 = pts[i + 1],
        p3 = pts[Math.min(N - 1, i + 2)];
      d += ` C${p1.x + (p2.x - p0.x) / 6},${p1.y + (p2.y - p0.y) / 6} ${p2.x - (p3.x - p1.x) / 6},${p2.y - (p3.y - p1.y) / 6} ${p2.x},${p2.y}`;
    }
    return d;
  };
  const mx = prog.career.max;
  let h = '';
  WORLDS.forEach((w, wi) => {
    const top = wi === WORLDS.length - 1 ? 0 : pos(wi * 5 + 4).y - GAP / 2,
      bot = wi === 0 ? H : pos(wi * 5).y + GAP / 2;
    const right = pos(wi * 5).x < W / 2; // nom du monde du côté opposé au premier niveau, pour ne rien chevaucher
    h += `<div class="map-band ${right ? 'r' : ''}" style="--c:${w.col};top:${top}px;height:${bot - top}px"><b>MONDE ${wi + 1} · ${w.name.toUpperCase()}</b><small>Niveaux ${wi * 5 + 1} à ${wi * 5 + 5}</small></div>`;
  });
  h += `<svg class="map-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><path d="${path(N - 1)}" fill="none" stroke="#1d2a48" stroke-width="10" stroke-linecap="round" stroke-dasharray="2 16"/>
  ${mx > 1 ? `<path d="${path(mx - 1)}" fill="none" stroke="#3ef2ff" stroke-width="5" stroke-linecap="round" style="filter:drop-shadow(0 0 6px #3ef2ff)"/>` : ''}</svg>`;
  for (let i = 0; i < N; i++) {
    const L = i + 1,
      p = pts[i],
      w = WORLDS[worldOf(L)];
    const st = prog.career.stars[L] || 0;
    const locked = L > mx,
      cur = L === mx;
    const big = L % 5 === 0;
    h += `<button class="lv ${locked ? 'locked' : ''} ${cur ? 'cur' : ''} ${big ? 'big' : ''}" data-lv="${L}" style="left:${p.x}px;top:${p.y}px;--c:${w.col}">${big && !locked ? '<span class="crown">BOSS DU MONDE</span>' : ''}${locked ? svg('lock') : L}${locked ? '' : `<span class="st">${starsSvg(st)}</span>`}</button>`;
    // les 3 meilleurs joueurs arrêtés à ce niveau, du côté opposé au virage du chemin
    const b = board[L];
    if (b && b.top.length) {
      const side = p.x < W / 2 ? 'r' : 'l';
      h += `<div class="lv-who ${side}" style="${side === 'r' ? 'left' : 'right'}:${side === 'r' ? p.x + 46 : W - p.x + 46}px;top:${p.y}px">${b.top.map(x => `<span class="${x.name === account.name ? 'me' : ''}">${esc(x.name)}</span>`).join('')}${b.n > b.top.length ? `<small>+${b.n - b.top.length}</small>` : ''}</div>`;
    }
  }
  inner.innerHTML = h;
  const tot = Object.values(prog.career.stars).reduce((a, b) => a + b, 0);
  $('#map-stars').innerHTML = `<svg viewBox="0 0 24 24">${ICON.star}</svg>${tot} / ${N * 3}`;
}

export function levelPop(L) {
  const w = WORLDS[worldOf(L)],
    cb = careerBosses(L),
    st = prog.career.stars[L] || 0;
  const pop = $('#map-pop');
  pop.dataset.lv = L;
  const diff = Math.min(10, Math.ceil((L / CAREER_LEVELS) * 10) + (isFinale(L) ? 2 : 0));
  pop.innerHTML = `<div class="map-card cut" style="--c:${w.col}"><div class="eyebrow">Monde ${worldOf(L) + 1} · ${w.name}</div><h3>Niveau ${L}</h3>
  <div class="stars-row">${starsSvg(st)}</div>
  <dl class="kv"><dt>Manches</dt><dd>10 · boss aux manches 5 et 10</dd><dt>Boss</dt><dd><span style="color:${BOSSV[cb.mid].col}">${BOSSV[cb.mid].name}</span> puis <span style="color:${BOSSV[cb.fin].col}">${BOSSV[cb.fin].name}</span></dd>
  <dt>Difficulté</dt><dd><span class="diff">${Array.from({ length: 10 }, (_, i) => `<i class="${i < diff ? 'on' : ''}"></i>`).join('')}</span></dd>
${isFinale(L) ? `<dt>Épreuve</dt><dd class="finale">Fin du monde ${worldOf(L) + 1} : ennemis et boss bien plus coriaces</dd>` : ''}
${board[L] && board[L].top.length ? `<dt>Arrêtés ici</dt><dd>${board[L].top.map(x => esc(x.name) + ' ' + x.stars + '★').join(' · ')}${board[L].n > board[L].top.length ? ` · +${board[L].n - board[L].top.length}` : ''}</dd>` : ''}
  <dt>Étoiles</dt><dd>1★ terminer · 2★ ≥ 40% PV · 3★ ≥ 75% PV</dd>${st ? '' : `<dt>Premier passage</dt><dd class="nk">+${10 + 3 * L} noyaux bonus</dd>`}</dl>
  <div class="btnrow"><button class="btn btn-primary cut" data-go="${L}" style="font-size:30px;padding:14px 40px">JOUER</button><button class="btn cut" data-close>Fermer</button></div></div>`;
  pop.hidden = false;
}

export function initMap() {
  $('#map-inner').addEventListener('click', e => {
    const b = e.target.closest('.lv');
    if (!b) return;
    Sfx.init();
    const L = +b.dataset.lv;
    if (L > prog.career.max) {
      Sfx.deny();
      b.classList.remove('shake');
      void b.offsetWidth;
      b.classList.add('shake');
      return;
    }
    Sfx.click();
    levelPop(L);
  });
  $('#map-pop').addEventListener('click', e => {
    const g = e.target.closest('[data-go]');
    if (g) {
      $('#map-pop').hidden = true;
      startGame(+g.dataset.go);
      return;
    }
    if (e.target.closest('[data-close]') || e.target === $('#map-pop')) $('#map-pop').hidden = true;
  });
  addEventListener('resize', () => {
    if (currentScreen() === 'scr-map') renderMap();
  });
}
