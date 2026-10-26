// Écran de fin de partie : récompenses, étoiles, records.

import { CAREER_LEVELS, MODES, WORLDS, careerMode, worldOf } from '../data/career.js';
import { BOXES } from '../data/loot.js';
import { ICON, svg } from '../icons.js';
import { request } from '../online/client.js';
import { $, esc, show } from './dom.js';
import { setOverMode } from './game.js';
import { fmtTime } from '../util.js';

// Fin de partie : les statistiques s'affichent tout de suite ; les récompenses (noyaux, étoiles, box, déblocage)
// sont calculées par le serveur, qui vérifie d'abord que le résultat est plausible.
let overSeq = 0;

export function showOver(d) {
  const seq = ++overSeq;
  const career = d.mode === 'career';
  const M = career ? careerMode(d.cl) : MODES[d.mode] || MODES.endless;
  const won = career && d.win && !d.quit;
  const stars = won ? (d.hp >= 0.75 ? 3 : d.hp >= 0.4 ? 2 : 1) : 0;
  $('#over-box').className = 'box over ' + (d.win ? 'win' : 'lose');
  $('#over-title').textContent = d.win
    ? career
      ? 'NIVEAU ' + d.cl + ' TERMINÉ'
      : 'VICTOIRE'
    : d.quit
      ? 'ABANDON'
      : 'TU AS CHUTÉ';
  const wd = career ? WORLDS[worldOf(d.cl)] : null;
  const sub = extra =>
    career
      ? `Monde ${worldOf(d.cl) + 1} · ${wd.name} · niveau ${d.cl}${extra.unlocked ? ' · niveau ' + (d.cl + 1) + ' débloqué !' : ''}`
      : `${M.name} · ${d.win ? 'toutes les vagues tenues' : 'vague ' + d.wave}${extra.newRec ? ' · nouveau record' : ''}`;
  $('#over-sub').textContent = sub({});
  const os = $('#over-stars');
  os.hidden = !won;
  os.innerHTML = [1, 2, 3]
    .map(i => `<svg viewBox="0 0 24 24" class="${i <= stars ? 'on' : ''}">${ICON.star}</svg>`)
    .join('');
  const st = [
    ['Vague atteinte', M.endless ? d.wave : `${d.wave} / ${M.waves}`],
    ['Temps', fmtTime(d.time)],
    ['Éliminations', d.kills + (d.duo ? ` · équipe ${d.teamKills}` : '')],
    ['Meilleur combo', d.maxCombo],
    ['Dégâts infligés', d.dmg.toLocaleString('fr-FR')],
    ['Niveau du héros', d.level],
    ['Pièces ramassées (partie)', d.coins],
  ];
  if (won)
    st.unshift([
      'PV restants',
      Math.round(d.hp * 100) +
        '% · ' +
        (stars === 3 ? 'parfait' : stars === 2 ? '3★ à partir de 75%' : '2★ à partir de 40%'),
    ]);
  $('#over-stats').innerHTML = st.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
  const reward = $('#over-reward');
  reward.innerHTML = `<span class="over-wait">Enregistrement de la partie…</span>`;
  const again = $('#btn-again');
  again.disabled = false;
  again.textContent = d.duo ? 'Retour à la salle' : career && !d.win ? 'Réessayer' : 'Rejouer';
  const nx = $('#btn-nextlv');
  nx.hidden = !(won && d.cl < CAREER_LEVELS) || !!d.duo;
  nx.className = 'btn btn-gold cut';
  again.className = nx.hidden ? 'btn btn-gold cut' : 'btn cut';
  $('#btn-menu').textContent = career ? 'Carte' : 'Menu';
  setOverMode(career ? 'career' : 'endless');
  $('#hud').hidden = true;
  show('scr-over');

  const showRewards = r => {
    if (!r.ok) {
      reward.innerHTML = `<span class="over-wait err">Récompenses non enregistrées : ${esc(r.msg || r.code)}</span>`;
      return;
    }
    $('#over-sub').textContent = sub(r);
    reward.innerHTML =
      (d.quit
        ? `<span class="over-wait">Partie abandonnée : aucun noyau.</span>`
        : svg('core', 2) + `+${r.cores} noyaux <span class="cur-lbl">gardés sur ton compte</span>`) +
      (!d.quit && r.underRecord
        ? `<span class="over-wait note">Infini : les vagues sous ton record (vague ${r.prevBest}) rapportent peu de noyaux. Dépasse-le pour gagner plus !</span>`
        : '') +
      (r.boxes.std
        ? ` <span class="rw-box" style="--c:${BOXES.std.col}">${svg('box', 2)}+${r.boxes.std} ${BOXES.std.name}</span>`
        : '') +
      (r.boxes.prem
        ? ` <span class="rw-box" style="--c:${BOXES.prem.col}">${svg('box', 2)}+${r.boxes.prem} ${BOXES.prem.name}</span>`
        : '');
  };
  // duo : la partie a tourné sur le serveur, qui envoie directement les récompenses
  if (d.rewards) return showRewards(d.rewards);

  const res = {
    win: !!d.win,
    quit: !!d.quit,
    wave: d.wave,
    kills: d.kills,
    bossKills: d.bossKills,
    time: Math.round(d.time * 10) / 10,
    hp: Math.round(d.hp * 1000) / 1000,
    level: d.level,
    dmg: d.dmg,
    maxCombo: d.maxCombo,
    boxes: { std: d.boxes.std | 0, prem: d.boxes.prem | 0 },
  };
  // renvoyée après une coupure : le serveur ne compte une partie qu'une fois
  request('run_end', { run: d.run, res }, { retry: true, timeout: 120000 }).then(r => {
    if (seq === overSeq) showRewards(r);
  });
}
