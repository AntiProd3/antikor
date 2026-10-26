// Duo en ligne : panneau du menu (salle avec un code à partager) et écrans de la partie en duo.

import { Sfx } from '../audio.js';
import { account } from '../online/client.js';
import { createRoom, duo, duoUi, joinRoom, leaveRoom, resumeSaved } from '../online/duo.js';
import { G } from '../sim/state.js';
import { save } from '../save.js';
import { refreshMeta } from './boxes.js';
import { showLevel, showShop, shakeCard, resetLevelView } from './cards.js';
import { $, currentScreen, esc, hideNotice, notice, show, toastRaw } from './dom.js';
import { openMenu } from './game.js';
import { resetHud } from './hud.js';
import { renderMenu } from './menu.js';
import { showOver } from './over.js';

let typed = '',
  err = '',
  lastView = null; // dernier écran de niveau/boutique reçu (ré-affiché en sortant du menu pause)

export function renderDuo() {
  const el = $('#duo-panel');
  el.hidden = !duo.on;
  if (!duo.on) return;
  const r = duo.room;
  let h;
  if (!r) {
    h = `<div class="duo-row"><button class="btn btn-gold cut" data-duo="create">Créer une salle</button><input class="code-in cut" id="code-in" maxlength="5" placeholder="CODE" title="Crée une salle et donne son code, ou saisis celui d’un ami" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Code de la salle d’un ami" value="${esc(typed)}"><button class="btn cut" data-duo="join">Rejoindre</button></div>`;
    // une ligne d'erreur seulement si besoin : le menu doit tenir sans défilement en 1280×720
    if (err) h += `<p class="duo-status err">${esc(err)}</p>`;
  } else {
    const names = r.members
      .map(
        m =>
          `<b class="${m.name === account.name ? 'me' : ''}">${esc(m.name)}</b>${m.host ? ' <small>hôte</small>' : ''}`,
      )
      .join(' · ');
    const full = r.members.length >= 2;
    const st = !full
      ? 'En attente du second joueur…'
      : r.host
        ? 'Prêts : choisis le mode puis JOUER'
        : 'Prêts : l’hôte lance la partie';
    h = `<div class="duo-row"><span class="code-big" title="Code à donner à ton partenaire">${esc(r.code)}</span><span class="duo-names">${names}<span class="duo-status ${err ? 'err' : full ? 'ok' : ''}">${esc(err || st)}</span></span><button class="btn cut" data-duo="leave">Quitter</button></div>`;
  }
  el.innerHTML = h;
}

function setErr(r) {
  err = r.ok ? '' : r.msg || 'Erreur.';
}

export function initDuoUi() {
  $('#duo-panel').addEventListener('click', async e => {
    const b = e.target.closest('[data-duo]');
    if (!b) return;
    Sfx.init();
    Sfx.click();
    const k = b.dataset.duo;
    if (k === 'create') setErr(await createRoom());
    else if (k === 'join') {
      const c = ($('#code-in').value || '').trim().toUpperCase();
      if (c.length < 5) err = 'Saisis le code de la salle (5 caractères).';
      else setErr(await joinRoom(c));
    } else if (k === 'leave') {
      err = '';
      await leaveRoom();
    }
    renderMenu();
  });
  $('#duo-panel').addEventListener('keydown', e => {
    if (e.target.id === 'code-in' && e.key === 'Enter') {
      e.preventDefault();
      $('[data-duo="join"]').click();
    }
  });
  $('#duo-panel').addEventListener('input', e => {
    if (e.target.id === 'code-in') {
      e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      typed = e.target.value;
    }
  });

  Object.assign(duoUi, {
    changed() {
      err = '';
      if (currentScreen() === 'scr-menu') renderMenu();
    },
    start(m) {
      hideNotice();
      resetLevelView();
      resetHud();
      lastView = null;
      show(null);
      $('#hud').hidden = false;
      $('#toasts').innerHTML = '';
      save.mode = m.mode;
    },
    view(k, v) {
      lastView = [k, v];
      // l'écran arrive juste avant l'instantané qui fait passer la partie dans cet état
      if (G && G.state !== 'over') G.state = k;
      if (currentScreen() === 'scr-pause') return;
      if (k === 'level') showLevel(v);
      else showShop(v);
    },
    say(n, a) {
      if (Sfx[n]) Sfx[n]();
      if (n === 'deny') shakeCard(a);
    },
    toast: toastRaw,
    wait(name, left) {
      if (left > 0) notice(`Connexion de ${name} perdue · la partie l’attend encore ${left} s`, 'warn', 0);
      else hideNotice();
    },
    over(d) {
      hideNotice();
      showOver(d);
      refreshMeta();
    },
    lost(msg) {
      notice(msg, 'err', 5000);
      openMenu();
    },
  });
}

// Pause en duo : seul le menu s'affiche, la partie continue pour le partenaire
export function duoPause() {
  show('scr-pause');
}

export function duoResume() {
  show(null);
  if (!lastView || !G) return;
  if (G.state === 'level' && lastView[0] === 'level') showLevel(lastView[1]);
  else if (G.state === 'shop' && lastView[0] === 'shop') showShop(lastView[1]);
}

// La partie avance : on quitte l'écran de niveau ou de boutique quand le serveur relance l'action
export function duoScreens() {
  if (!G || !G.online) return;
  const cur = currentScreen();
  if ((cur === 'scr-level' && G.state !== 'level') || (cur === 'scr-shop' && G.state !== 'shop')) show(null);
}

// Après la connexion : reprise d'une partie interrompue par un rechargement de la page
export function resumeDuoGame() {
  return resumeSaved();
}
