// Dessin du vaisseau du joueur, avec son skin (v1.2). Sert en partie (world.js) et pour les aperçus du labo.

import { SKINS } from '../data/skins.js';
import { TAU, hexA } from '../util.js';

// Couleur d'un angle de teinte (skin Prisme), en hexadécimal pour hexA()
function hueHex(h) {
  const f = n => {
    const k = (n + h / 30) % 12;
    const c = 0.62 - 0.38 * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return '#' + f(0) + f(8) + f(4);
}

// Couleurs du vaisseau : celles du skin, ou la couleur du joueur pour le skin Standard
export function skinLook(skin, playerCol, t, i = 0) {
  const S = SKINS[skin] || SKINS.base;
  let col = S.col || playerCol;
  if (col === 'prism') col = hueHex((t * 90 + i * 180) % 360);
  return { col, col2: S.col2 || '#ffffff', fill: S.fill || '#0b1c2a', deco: S.deco };
}

// Vaisseau centré sur (0, 0), tourné vers la droite. look = skinLook(), t = temps (animations)
export function heroBody(g, look, t) {
  const { col, col2, fill, deco } = look;
  g.shadowColor = col;
  g.shadowBlur = 14;
  g.lineJoin = 'round';
  g.lineCap = 'round';
  // ailes de chauve-souris, derrière le corps
  if (deco === 'bat') {
    g.fillStyle = hexA(col, 0.35);
    g.strokeStyle = col;
    g.lineWidth = 1.6;
    for (const s of [-1, 1]) {
      g.beginPath();
      g.moveTo(-4, s * 9);
      g.quadraticCurveTo(-8, s * 26, -20, s * 24);
      g.lineTo(-14, s * 18);
      g.lineTo(-20, s * 14);
      g.lineTo(-12, s * 11);
      g.closePath();
      g.fill();
      g.stroke();
    }
  }
  // traîne du fantôme
  if (deco === 'ghost') {
    g.fillStyle = hexA(col, 0.45);
    g.beginPath();
    g.moveTo(-6, -12);
    for (let k = 0; k <= 6; k++) g.lineTo(-24 - Math.sin(t * 8 + k) * 3, -12 + k * 4);
    g.lineTo(-6, 12);
    g.closePath();
    g.fill();
  }
  // sac à dos
  g.fillStyle = '#0b1828';
  g.strokeStyle = col;
  g.lineWidth = 2;
  g.beginPath();
  g.roundRect ? g.roundRect(-17, -8, 8, 16, 3) : g.rect(-17, -8, 8, 16);
  g.fill();
  g.stroke();
  // flammes du skin Magma, derrière le sac
  if (deco === 'flame') {
    g.fillStyle = hexA(col2, 0.7);
    for (const y of [-4, 4]) {
      const l = 7 + Math.sin(t * 20 + y) * 3;
      g.beginPath();
      g.moveTo(-17, y - 3);
      g.lineTo(-17 - l, y);
      g.lineTo(-17, y + 3);
      g.fill();
    }
  }
  // arme
  g.fillStyle = '#163045';
  g.beginPath();
  g.rect(4, -3.5, 20, 7);
  g.fill();
  g.strokeStyle = '#e8fbff';
  g.lineWidth = 1.8;
  g.stroke();
  // corps
  g.fillStyle = deco === 'pumpkin' ? hexA(col, 0.9) : fill;
  g.strokeStyle = col;
  g.lineWidth = 2.6;
  g.beginPath();
  g.arc(0, 0, 13, 0, TAU);
  g.fill();
  g.stroke();
  g.fillStyle = hexA(col, 0.18);
  g.fill();
  if (deco === 'pumpkin') {
    // côtes de la citrouille et tige
    g.strokeStyle = hexA('#7a3a00', 0.8);
    g.lineWidth = 1.4;
    for (const y of [-6, 0, 6]) {
      g.beginPath();
      g.ellipse(0, y * 0.4, 12, 4 + Math.abs(y), 0, Math.PI * 0.6, Math.PI * 1.4);
      g.stroke();
    }
    g.strokeStyle = '#62ff9a';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(-13, 0);
    g.lineTo(-17, -3);
    g.stroke();
  }
  // épaules
  g.strokeStyle = hexA(col, 0.7);
  g.lineWidth = 1.6;
  g.beginPath();
  g.arc(0, 0, 8, 1.9, 4.4);
  g.stroke();
  // visière (ou visage du skin)
  g.shadowColor = col2;
  if (deco === 'pumpkin' || deco === 'skull') {
    g.fillStyle = deco === 'pumpkin' ? '#2a1200' : '#05070e';
    for (const y of [-4.5, 4.5]) {
      g.beginPath();
      if (deco === 'pumpkin') {
        g.moveTo(8, y - 2.5);
        g.lineTo(3, y + 2.5);
        g.lineTo(8, y + 2.5);
      } else g.arc(5, y, 3.2, 0, TAU);
      g.fill();
    }
    g.fillStyle = col2;
    g.beginPath();
    g.arc(5, -4.5, 1.2, 0, TAU);
    g.arc(5, 4.5, 1.2, 0, TAU);
    g.fill();
  } else {
    g.strokeStyle = col2;
    g.lineWidth = 3.2;
    g.beginPath();
    g.arc(2, 0, 7, -0.9, 0.9);
    g.stroke();
  }
  // ornements par-dessus
  if (deco === 'crown') {
    g.fillStyle = '#ffd23e';
    g.shadowColor = '#ffd23e';
    g.beginPath();
    g.moveTo(-8, -6);
    g.lineTo(-14, -9);
    g.lineTo(-12, -3);
    g.lineTo(-15, 0);
    g.lineTo(-12, 3);
    g.lineTo(-14, 9);
    g.lineTo(-8, 6);
    g.closePath();
    g.fill();
  } else if (deco === 'halo') {
    g.strokeStyle = col2;
    g.shadowColor = col2;
    g.lineWidth = 2;
    g.beginPath();
    g.ellipse(-3, 0, 5, 17, 0, 0, TAU);
    g.stroke();
  } else if (deco === 'frost') {
    g.strokeStyle = hexA('#ffffff', 0.8);
    g.lineWidth = 1.2;
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * TAU;
      g.beginPath();
      g.moveTo(Math.cos(a) * 15, Math.sin(a) * 15);
      g.lineTo(Math.cos(a) * 19, Math.sin(a) * 19);
      g.stroke();
    }
  } else if (deco === 'shine') {
    const a = (t * 2) % TAU;
    g.fillStyle = hexA('#ffffff', 0.85);
    g.beginPath();
    g.arc(Math.cos(a) * 9, Math.sin(a) * 9, 1.8, 0, TAU);
    g.fill();
  }
  g.shadowBlur = 0;
}

// Aperçu d'un skin sur une petite toile (labo, récompenses)
export function drawSkinPreview(cv, skin, t = 0) {
  const g = cv.getContext('2d');
  // le vaisseau tient dans un carré d'environ 56 unités (ailes et arme comprises)
  const s = cv.width / 62;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, cv.width, cv.height);
  g.setTransform(s, 0, 0, s, cv.width / 2, cv.height / 2);
  heroBody(g, skinLook(skin, '#3ef2ff', t), t);
}
