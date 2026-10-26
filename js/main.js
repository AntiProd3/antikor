// Point d’entrée : initialisation et boucle principale.

import { VERSION } from './config.js';
import { initInput, inputVec, keys } from './input.js';
import { resize } from './render/canvas.js';
import { initFloor } from './render/floor.js';
import { initDemo, render, updateDemo } from './render/render.js';
import { initSprites } from './render/sprites.js';
import { G, ME, P, settings } from './sim/state.js';
import { update } from './sim/update.js';
import { initBoxes } from './ui/boxes.js';
import { chooseLevel, initCards } from './ui/cards.js';
import { $, currentScreen } from './ui/dom.js';
import { duoScreens, initDuoUi } from './ui/duo.js';
import { duoUpdate, initDuo } from './online/duo.js';
import { act, initGame, startGame } from './ui/game.js';
import { initHud, updateHUD } from './ui/hud.js';
import { initInventory } from './ui/inventory.js';
import { initKeyboard } from './ui/keyboard.js';
import { initLab } from './ui/lab.js';
import { initLogin } from './ui/login.js';
import { initMap } from './ui/map.js';
import { initMenu } from './ui/menu.js';
import { initRank } from './ui/rank.js';
import { initSkins } from './ui/skins.js';
import { initDaily } from './ui/daily.js';
import { initTooltips } from './ui/tooltips.js';

// Une étape de simulation (aussi utilisée par les tests) : la commande du joueur local, puis la partie avance.
function stepGame(rdt) {
  if (G && G.online) {
    duoUpdate(rdt, currentScreen() === 'scr-pause');
    duoScreens();
    return;
  }
  if (G && (G.state === 'play' || G.state === 'clear' || G.state === 'dying')) {
    G.players[ME].in = inputVec();
    if (G.hitstop > 0) {
      G.hitstop -= rdt;
    } else {
      let dt = rdt;
      if (G.slowT > 0) {
        G.slowT -= rdt;
        dt *= 0.3;
      }
      update(dt, rdt);
    }
  }
}

let last = performance.now();

function frame(now) {
  let rdt = Math.min(0.05, (now - last) / 1000);
  last = now;
  try {
    if (G) stepGame(rdt);
    else updateDemo(rdt);
    render(rdt);
    updateHUD();
  } catch (err) {
    console.error(err);
  }
  requestAnimationFrame(frame);
}

settings.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
initSprites();
initGame();
initMenu();
initLab();
initInventory();
initBoxes();
initMap();
initCards();
initHud();
initKeyboard();
initInput();
initTooltips();
initDuo();
initDuoUi();
initRank();
initSkins();
initDaily();
addEventListener('resize', resize);
resize();
initFloor();
initDemo();

$('#ver').textContent = 'v' + VERSION;
requestAnimationFrame(frame);
// connexion au compte (écran de connexion, ou reprise de la session gardée sur cet appareil)
initLogin();

// Débogage et tests : window.__AK depuis la console du navigateur
window.__AK = {
  get G() {
    return G;
  },
  get P() {
    return P;
  },
  startGame,
  act,
  chooseLevel,
  keys,
  tick: stepGame,
};
