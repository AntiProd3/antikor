// Écran de connexion : un compte est nécessaire pour jouer (la progression est gardée sur le serveur
// et suit le joueur sur tous ses appareils). Gère aussi la reconnexion et la session expirée.

import { Sfx } from '../audio.js';
import { account, hasToken, login, on, register, resumeSession } from '../online/client.js';
import { G } from '../sim/state.js';
import { refreshMeta } from './boxes.js';
import { $, hideNotice, notice, show } from './dom.js';
import { checkDaily } from './daily.js';
import { resumeDuoGame } from './duo.js';
import { renderMenu } from './menu.js';

function status(text, kind = '') {
  const s = $('#login-status');
  s.textContent = text || '';
  s.className = 'login-status ' + kind;
}

function busy(b) {
  for (const el of document.querySelectorAll('#login-form input, #login-form button')) el.disabled = b;
}

export function showLogin(msg) {
  show('scr-login');
  $('#login-form').hidden = false;
  $('#btn-retry').hidden = true;
  busy(false);
  status(msg, msg ? 'err' : '');
}

function enterMenu() {
  hideNotice();
  renderMenu();
  show('scr-menu');
  // page rechargée pendant une partie en duo : on la reprend (elle attend le joueur 30 s) ; sinon, cadeau du jour
  resumeDuoGame().then(inGame => {
    if (!inGame) checkDaily();
  });
}

async function submit(kind) {
  const name = $('#login-name').value.trim();
  const pass = $('#login-pass').value;
  if (!name || !pass) return status('Indique ton pseudo et ton mot de passe.', 'err');
  busy(true);
  status(kind === 'register' ? 'Création du compte…' : 'Connexion…');
  const r = kind === 'register' ? await register(name, pass) : await login(name, pass);
  busy(false);
  if (!r.ok) {
    const wait = r.retryIn ? ` (encore ${Math.ceil(r.retryIn / 60)} min)` : '';
    return status((r.msg || 'Connexion impossible.') + wait, 'err');
  }
  $('#login-pass').value = '';
  Sfx.init();
  Sfx.wave();
  enterMenu();
}

export async function initLogin() {
  $('#login-form').addEventListener('submit', e => {
    e.preventDefault();
    submit('login');
  });
  $('#btn-register').addEventListener('click', () => submit('register'));
  $('#btn-retry').addEventListener('click', resume);

  // Nouvelle progression reçue (achat, box, fin de partie, ou action faite sur un autre appareil)
  on('state', refreshMeta);
  // Connexion perdue pendant la session : message discret, la reconnexion est automatique
  let lost = false;
  on('status', s => {
    if (!account.name) return;
    if (s === 'offline' && !lost) {
      lost = true;
      notice('Connexion au serveur perdue · reconnexion…', 'warn', 0);
    } else if (s === 'online' && lost) {
      lost = false;
      notice('Reconnecté', 'ok', 1500);
    }
  });
  on('logout', reason => {
    lost = false;
    hideNotice();
    if (!G) showLogin((reason && reason.msg) || 'Session expirée : reconnecte-toi.');
  });

  // Démarrage : reprise de la session gardée sur cet appareil
  if (hasToken()) resume();
  else showLogin();
}

async function resume() {
  show('scr-login');
  $('#login-form').hidden = true;
  $('#btn-retry').hidden = true;
  status('Connexion au serveur…');
  const r = await resumeSession();
  if (r.ok) return enterMenu();
  if (r.code === 'bad_token') return showLogin('Session expirée : reconnecte-toi.');
  // serveur injoignable : la session reste gardée, on peut réessayer sans mot de passe
  status(r.msg || 'Serveur injoignable.', 'err');
  $('#btn-retry').hidden = false;
}
