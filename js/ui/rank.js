// Classement de tous les joueurs (top 15 par statistique), calculé par le serveur.

import { Sfx } from '../audio.js';
import { account, prog, request } from '../online/client.js';
import { $, esc, mutBadge, show } from './dom.js';
import { renderMenu } from './menu.js';

// Statistiques classées : identifiant du serveur, onglet, titre, mise en forme de la valeur
export const RANKS = [
  ['endless', 'Infini', 'Meilleure manche en Infini', v => 'manche ' + v],
  ['stars', 'Étoiles', 'Étoiles gagnées en carrière', v => v + ' ★'],
  ['career', 'Carrière', 'Niveaux de carrière terminés', v => v + ' / 25'],
  ['kills', 'Éliminations', 'Germes éliminés', v => v.toLocaleString('fr-FR')],
  ['dmg', 'Dégâts', 'Dégâts infligés', v => v.toLocaleString('fr-FR')],
  ['hero', 'Niveau', 'Meilleur niveau du héros en une partie', v => 'niveau ' + v],
  ['combo', 'Combo', 'Meilleur combo', v => '×' + v],
  ['wins', 'Victoires', 'Parties gagnées', v => String(v)],
  ['runs', 'Parties', 'Parties jouées', v => String(v)],
];

let cur = 'endless',
  data = null,
  loading = false;

export async function openRank() {
  show('scr-rank');
  renderRank();
  if (loading) return;
  loading = true;
  const r = await request('leaderboard');
  loading = false;
  data = r.ok ? r : { err: r.msg || 'Classement indisponible.' };
  renderRank();
}

function renderRank() {
  $('#rank-tabs').innerHTML = RANKS.map(
    ([id, tab]) =>
      `<button class="cut ${id === cur ? 'on' : ''}" data-rank="${id}" role="tab" aria-selected="${id === cur}">${tab}</button>`,
  ).join('');
  const el = $('#rank-list');
  const [, , title, fmt] = RANKS.find(r => r[0] === cur);
  if (!data) {
    el.innerHTML = `<h3 class="rank-title">${title}</h3><p class="rank-empty">Chargement…</p>`;
    return;
  }
  if (data.err) {
    el.innerHTML = `<h3 class="rank-title">${title}</h3><p class="rank-empty err">${esc(data.err)}</p>`;
    return;
  }
  const c = data.cats[cur] || { top: [], me: null };
  const row = (rank, name, v, me, m) =>
    `<li class="${me ? 'me' : ''} ${rank <= 3 ? 'p' + rank : ''}"><span class="rk">${rank}</span><span class="nm">${esc(name)} ${mutBadge(m)}</span><span class="vl">${fmt(v)}</span></li>`;
  let h = c.top.map((e, i) => row(i + 1, e.name, e.v, e.name === account.name, e.m)).join('');
  const inTop = c.top.some(e => e.name === account.name);
  if (!inTop && c.me) h += `<li class="gap">…</li>` + row(c.me.rank, account.name, c.me.v, true, prog.mutation | 0);
  el.innerHTML =
    `<h3 class="rank-title">${title}</h3>` +
    (c.top.length
      ? `<ol class="rank-ol">${h}</ol>`
      : `<p class="rank-empty">Personne pour l’instant : à toi de jouer !</p>`) +
    (!inTop && !c.me ? `<p class="rank-note">Tu n’es pas encore classé ici.</p>` : '');
}

export function initRank() {
  $('#rank-tabs').addEventListener('click', e => {
    const b = e.target.closest('[data-rank]');
    if (!b) return;
    Sfx.click();
    cur = b.dataset.rank;
    renderRank();
  });
  $('#btn-rank-back').addEventListener('click', () => {
    renderMenu();
    show('scr-menu');
  });
}
