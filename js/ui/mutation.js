// Mutation (v1.2.2) : quand tous les talents sont au maximum (monde 3 atteint), le joueur repart sans talents
// ni noyaux, et gagne pour toujours +10 % de dégâts, +10 % de PV et +15 % de noyaux par mutation (M1 à M3).

import { Sfx } from '../audio.js';
import { prog, request } from '../online/client.js';
import { MUTATION, mutateBlock, mutationLevel } from '../rules.js';
import { $, mutBadge, notice } from './dom.js';

const pct = v => Math.round(v * 100) + ' %';

export function renderMutation() {
  const m = mutationLevel(prog);
  const why = mutateBlock(prog);
  const next = m + 1;
  const now = m
    ? `Actuellement ${mutBadge(m)} : +${pct(MUTATION.dmg * m)} de dégâts, +${pct(MUTATION.hp * m)} de PV, +${pct(MUTATION.cores * m)} de noyaux.`
    : 'Pas encore de mutation.';
  const cond =
    why === 'max'
      ? 'Mutation maximale atteinte.'
      : why === 'locked'
        ? `Disponible à partir du monde ${MUTATION.world} de la carrière, avec tous les talents au maximum.`
        : why === 'not_maxed'
          ? 'Monte tous les talents au maximum pour pouvoir muter.'
          : `Prêt : tu repars sans talents ni noyaux, et tu gagnes ${mutBadge(next)}.`;
  $('#lab-mutation').innerHTML = `<div class="mut-card cut ${why ? '' : 'ready'}">
  <div><b>Mutation ${m ? mutBadge(m) : ''}</b><small>${now}</small><small>${cond}</small></div>
  ${why === 'max' ? '' : `<button class="btn ${why ? '' : 'btn-gold'} cut" id="btn-mutate" ${why ? 'aria-disabled="true"' : ''}>Muter</button>`}</div>`;
}

function ask() {
  const next = mutationLevel(prog) + 1;
  $('#mutate-title').innerHTML = 'Muter en ' + mutBadge(next);
  $('#mutate-text').innerHTML =
    `Tu perds <b>tous tes talents</b> et <b>tous tes noyaux</b> (${prog.cores}). Tu gardes tes armes, tes box, tes skins et ta carrière.<br>` +
    `En échange, pour toujours : <b>+${pct(MUTATION.dmg)} de dégâts</b>, <b>+${pct(MUTATION.hp)} de PV</b> et <b>+${pct(MUTATION.cores)} de noyaux</b> gagnés, et le badge ${mutBadge(next)} à côté de ton pseudo.`;
  $('#mutate').hidden = false;
}

async function confirm() {
  $('#btn-mutate-ok').disabled = true;
  const r = await request('mutate');
  $('#btn-mutate-ok').disabled = false;
  $('#mutate').hidden = true;
  if (!r.ok) return notice(r.msg);
  Sfx.evo();
  notice(`Mutation réussie : te voilà M${r.mutation} !`, 'ok', 3500);
}

export function initMutation() {
  $('#lab-mutation').addEventListener('click', e => {
    const b = e.target.closest('#btn-mutate');
    if (!b) return;
    Sfx.init();
    if (b.getAttribute('aria-disabled')) return Sfx.deny();
    ask();
  });
  $('#btn-mutate-ok').addEventListener('click', confirm);
  $('#btn-mutate-no').addEventListener('click', () => ($('#mutate').hidden = true));
}
