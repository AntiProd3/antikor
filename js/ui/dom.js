// Outils d’interface : écrans, titres, notifications, son.

import { Sfx } from '../audio.js';
import { persist, save } from '../save.js';
import { hideTip } from './tooltips.js';

export const $ = s => document.querySelector(s);

// Badge de mutation (M1, M2, M3) à côté d'un pseudo (v1.2.2)
export const mutBadge = m => (m > 0 ? `<span class="mut-b m${m}" title="Mutation ${m}">M${m}</span>` : '');

export function show(id) {
  hideTip();
  if (id) $('#banner').classList.remove('show');
  for (const s of document.querySelectorAll('.screen')) s.hidden = s.id !== id;
}

export function currentScreen() {
  const s = [...document.querySelectorAll('.screen')].find(x => !x.hidden);
  return s ? s.id : null;
}

export const esc = t =>
  String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function bannerRaw(main, sub, col) {
  const b = $('#banner');
  $('#b-main').textContent = main;
  $('#b-sub').textContent = sub || '';
  b.style.setProperty('--bc', col || '#3ef2ff');
  b.classList.remove('show');
  void b.offsetWidth;
  b.classList.add('show');
}

// Message court en haut de l'écran, visible aussi hors partie (erreurs du serveur, connexion…)
let noticeTO = 0;
export function notice(text, kind = 'err', ms = 3500) {
  if (!text) return;
  const n = $('#notice');
  n.textContent = text;
  n.className = 'notice cut ' + kind;
  n.hidden = false;
  clearTimeout(noticeTO);
  if (ms) noticeTO = setTimeout(() => (n.hidden = true), ms);
}

export function hideNotice() {
  $('#notice').hidden = true;
}

export function toastRaw(title, text, col) {
  const t = document.createElement('div');
  t.className = 'toast cut';
  t.style.setProperty('--c', col || '#ffd23e');
  t.innerHTML = `<b></b><span></span>`;
  t.querySelector('b').textContent = title;
  t.querySelector('span').textContent = text;
  const box = $('#toasts');
  box.appendChild(t);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => t.remove(), 2700);
}

export function toggleMute() {
  save.muted = !save.muted;
  persist();
  updateMuteLabels();
}

export function updateMuteLabels() {
  const t = 'Son : ' + (save.muted ? 'coupé' : 'activé');
  $('#btn-mute-menu').textContent = t;
  $('#btn-mute-pause').textContent = t;
}

export function flashDeny(el) {
  Sfx.deny();
  if (el) {
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
  }
}
