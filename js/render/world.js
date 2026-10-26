// Dessin du monde : zones, ennemis, joueurs, armes, projectiles, butin, textes.

import { BOXES } from '../data/loot.js';
import { WEAPONS } from '../data/weapons.js';
import { ctx } from './canvas.js';
import { drawGlow, drawSprite, inView } from './render.js';
import { SPR, SPRB, SPRE, glow, splat } from './sprites.js';
import { plName } from '../sim/player.js';
import { G, ME } from '../sim/state.js';
import { TAU, hexA, lerp, rand } from '../util.js';

export function drawWorld(cam) {
  // decals
  for (const d of G.decals) {
    if (!inView(cam, d.x, d.y, 60)) continue;
    ctx.globalAlpha = 0.5 * Math.min(1, (d.life / d.max) * 2);
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(d.rot);
    ctx.drawImage(splat(d.col)[d.v], -d.s / 2, -d.s / 2, d.s, d.s);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'lighter';
  // player light
  if (G.state !== 'dying' && G.state !== 'over')
    for (const pl of G.players) if (!pl.down) drawGlow(pl.col, pl.x, pl.y, 300, 0.22);
  // zones
  for (const z of G.zones) {
    if (!inView(cam, z.x, z.y, z.R)) continue;
    const a = Math.min(1, z.life / 0.4, (z.max - z.life) / 0.15 + 0.2);
    if (z.k === 'hole') {
      const c = z.evo ? '#d36bff' : '#9d7bff';
      drawGlow(c, z.x, z.y, z.R * 2.2, 0.35 * a);
      ctx.strokeStyle = hexA(c, 0.45 * a);
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 10]);
      ctx.lineDashOffset = G.t * 60;
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.R, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      for (let k = 0; k < 3; k++) {
        ctx.strokeStyle = hexA(k ? '#d8c8ff' : c, 0.6 * a);
        ctx.lineWidth = 3 - k * 0.7;
        ctx.beginPath();
        ctx.arc(z.x, z.y, z.R * (0.25 + 0.14 * k), G.t * (5 - k) + k * 2, G.t * (5 - k) + k * 2 + Math.PI * 1.2);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#020206';
      ctx.beginPath();
      ctx.arc(z.x, z.y, 14 + (z.evo ? 8 : 0), 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.globalCompositeOperation = 'lighter';
      continue;
    }
    const c = z.evo ? '#ff9a2a' : '#ff6a1a';
    drawGlow(c, z.x, z.y, z.R * 2.6, 0.55 * a);
    ctx.strokeStyle = hexA(c, 0.5 * a);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(z.x, z.y, z.R, 0, TAU);
    ctx.stroke();
    for (let k = 0; k < 5; k++) {
      const ang = G.t * 1.3 + k * 1.26,
        r = z.R * (0.35 + 0.3 * Math.sin(G.t * 3 + k));
      drawGlow('#ffb03e', z.x + Math.cos(ang) * r, z.y + Math.sin(ang) * r, z.R * 0.9, 0.35 * a);
    }
  }
  // aura
  for (const P of G.players) {
    if (P.down) continue;
    for (const w of P.weapons) {
      if (w.id !== 'aura' || !w.R || G.state === 'dying') continue;
      const c = w.evo ? '#ffd23e' : '#4affc4';
      drawGlow(c, P.x, P.y, w.R * 2.4, 0.18);
      ctx.strokeStyle = hexA(c, 0.55);
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 8]);
      ctx.lineDashOffset = -G.t * 30;
      ctx.beginPath();
      ctx.arc(P.x, P.y, w.R, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = hexA(c, 0.22);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(P.x, P.y, w.R * (0.6 + 0.4 * ((G.t * 0.8) % 1)), 0, TAU);
      ctx.stroke();
    }
  }
  // mines
  for (const m of G.mines) {
    if (!inView(cam, m.x, m.y, 30)) continue;
    const c = m.evo ? '#ffd23e' : '#ffe14a';
    const blink = m.arm > 0 ? 0.3 : Math.sin(m.t * 10) > 0 ? 1 : 0.35;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#0a0e18';
    ctx.strokeStyle = c;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      const x = m.x + Math.cos(a) * 9,
        y = m.y + Math.sin(a) * 9;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.globalCompositeOperation = 'lighter';
    drawGlow(c, m.x, m.y, 22, blink);
  }
  // pickups
  for (const k of G.pickups) {
    if (!inView(cam, k.x, k.y, 20)) continue;
    drawPickup(k);
  }
  ctx.globalCompositeOperation = 'source-over';
  // enemies
  for (const e of G.enemies) {
    if (e.dead || !inView(cam, e.x, e.y, e.r * 2 + 20)) continue;
    if (e.type === 'boss' && e.ai.ph === 'tele') {
      const a = e.ai.ang,
        L = 700,
        w = e.r * 1.7;
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(a);
      ctx.fillStyle = hexA(e.col, 0.1 + 0.08 * Math.sin(G.t * 30));
      ctx.fillRect(0, -w / 2, L, w);
      ctx.strokeStyle = hexA(e.col, 0.6);
      ctx.setLineDash([12, 10]);
      ctx.lineWidth = 2;
      ctx.strokeRect(0, -w / 2, L, w);
      ctx.setLineDash([]);
      ctx.restore();
    }
    // Piqueur qui vise : ligne d'avertissement ; Neurone qui va se téléporter : anneau qui clignote
    if (e.tele > 0 && e.type === 'dasher') {
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(e.ang);
      ctx.strokeStyle = hexA(e.col, 0.35 + 0.3 * Math.sin(G.t * 40));
      ctx.setLineDash([10, 8]);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(e.r, 0);
      ctx.lineTo(220, 0);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    } else if (e.tele > 0 && e.type === 'blinker') {
      ctx.globalCompositeOperation = 'lighter';
      drawGlow(e.col, e.x, e.y, e.r * 5 * (1 + Math.sin(G.t * 50) * 0.3), 0.7);
      ctx.globalCompositeOperation = 'source-over';
    }
    const wob = Math.sin(e.t * (e.type === 'runner' ? 16 : 9)) * 0.07;
    const spr = e.type === 'boss' ? SPRB[e.bv || 'crown'] : e.elite ? SPRE[e.type] : SPR[e.type];
    if (e.type === 'bomber' && e.fuse > 0) {
      ctx.globalCompositeOperation = 'lighter';
      drawGlow('#ff4a3d', e.x, e.y, e.r * 6 * (1 + Math.sin(G.t * 40) * 0.3), 0.8);
      ctx.globalCompositeOperation = 'source-over';
    }
    if (e.elite) {
      ctx.strokeStyle = 'rgba(255,210,62,.85)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.lineDashOffset = G.t * 20;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r + 9, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    drawSprite(
      spr,
      e.x,
      e.y,
      e.ang,
      e.frozen > 0 ? 1 : 1 + wob,
      e.frozen > 0 ? 1 : 1 - wob,
      e.flash > 0 || (e.fuse > 0 && Math.sin(G.t * 40) > 0),
    );
    if (e.frozen > 0) {
      ctx.globalCompositeOperation = 'lighter';
      drawGlow('#8fe8ff', e.x, e.y, e.r * 4, 0.65);
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(191,249,255,.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * TAU + 0.3;
        const x = e.x + Math.cos(a) * e.r * 1.05,
          y = e.y + Math.sin(a) * e.r * 1.05;
        k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }
    if ((e.elite || e.type === 'tank') && e.hp < e.maxHp) {
      const w = e.r * 1.6;
      ctx.fillStyle = 'rgba(0,0,0,.6)';
      ctx.fillRect(e.x - w / 2, e.y - e.r - 12, w, 4);
      ctx.fillStyle = e.elite ? '#ffd23e' : e.col;
      ctx.fillRect(e.x - w / 2, e.y - e.r - 12, w * Math.max(0, e.hp / e.maxHp), 4);
    }
  }
  for (const pl of G.players) if (!pl.gone) for (const w of pl.weapons) if (w.id === 'turret' && w.tur) drawTurrets(w);
  // hero
  if (G.state !== 'dying' && G.state !== 'over') {
    for (const pl of G.players) if (pl.down && !pl.gone) drawDowned(pl);
    for (const pl of G.players) if (!pl.down) drawHero(pl);
  }
  ctx.globalCompositeOperation = 'lighter';
  // weapons visuals
  for (const P of G.players) {
    if (P.down) continue;
    for (const w of P.weapons) {
      if (w.id === 'drones' && w.n && G.state !== 'dying') {
        const c = w.evo ? '#ffd23e' : '#5ad1ff';
        ctx.strokeStyle = hexA(c, 0.12);
        ctx.lineWidth = w.br * 1.6;
        ctx.beginPath();
        ctx.arc(P.x, P.y, w.R, 0, TAU);
        ctx.stroke();
        for (let i = 0; i < w.n; i++) {
          const a = w.ang + (i * TAU) / w.n,
            x = P.x + Math.cos(a) * w.R,
            y = P.y + Math.sin(a) * w.R;
          drawGlow(c, x, y, w.br * 4, 0.7);
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(a + G.t * (w.evo ? 14 : 0));
          ctx.fillStyle = hexA(c, 0.5);
          ctx.strokeStyle = c;
          ctx.lineWidth = 2;
          ctx.beginPath();
          if (w.evo) {
            for (let k = 0; k < 8; k++) {
              const r = k % 2 ? w.br * 0.4 : w.br * 1.1;
              const aa = (k / 8) * TAU;
              k ? ctx.lineTo(Math.cos(aa) * r, Math.sin(aa) * r) : ctx.moveTo(Math.cos(aa) * r, Math.sin(aa) * r);
            }
          } else {
            ctx.moveTo(w.br, 0);
            ctx.lineTo(0, w.br * 0.45);
            ctx.lineTo(-w.br * 0.7, 0);
            ctx.lineTo(0, -w.br * 0.45);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      }
      if (w.id === 'laser' && w.len && G.state !== 'dying') {
        for (let i = 0; i < w.n; i++) {
          const a = w.ang + (i * TAU) / w.n;
          const x2 = P.x + Math.cos(a) * w.len,
            y2 = P.y + Math.sin(a) * w.len;
          const c = w.evo ? `hsl(${(G.t * 200 + i * 90) % 360},100%,62%)` : '#ff3df0';
          ctx.strokeStyle = c;
          ctx.globalAlpha = 0.25;
          ctx.lineWidth = 14;
          ctx.beginPath();
          ctx.moveTo(P.x, P.y);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          ctx.globalAlpha = 0.9;
          ctx.lineWidth = 4;
          ctx.stroke();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.globalAlpha = 1;
          drawGlow(w.evo ? '#ffffff' : '#ff3df0', x2, y2, 30, 0.8);
        }
      }
      if (w.id === 'cryo' && w.pts && w.pts.length && G.state === 'play') {
        const c = w.evo ? '#ffffff' : '#8fe8ff';
        for (let i = 0; i < w.pts.length; i += 2) {
          const x2 = w.pts[i],
            y2 = w.pts[i + 1];
          const wob = Math.sin(G.t * 40 + i) * 1.5;
          ctx.strokeStyle = c;
          ctx.globalAlpha = 0.25;
          ctx.lineWidth = 12 + wob;
          ctx.beginPath();
          ctx.moveTo(P.x, P.y);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          ctx.globalAlpha = 0.9;
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.globalAlpha = 1;
          drawGlow('#8fe8ff', x2, y2, 36, 0.9);
        }
      }
    }
  }
  // bullets
  for (const b of G.bullets) {
    if (!inView(cam, b.x, b.y, 40)) continue;
    if (b.k === 'shot') {
      ctx.strokeStyle = b.col;
      ctx.lineWidth = b.r * 0.8;
      ctx.beginPath();
      ctx.moveTo(b.x - b.dx * b.r * 4, b.y - b.dy * b.r * 4);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      drawGlow(b.col, b.x, b.y, b.r * 5, 0.9);
    } else if (b.k === 'disc') {
      drawGlow(b.col, b.x, b.y, b.r * 4, 0.6);
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.spin);
      ctx.strokeStyle = b.col;
      ctx.lineWidth = 2.5;
      ctx.fillStyle = hexA(b.col, 0.25);
      ctx.beginPath();
      for (let k = 0; k < 16; k++) {
        const r = k % 2 ? b.r * 0.78 : b.r;
        const aa = (k / 16) * TAU;
        k ? ctx.lineTo(Math.cos(aa) * r, Math.sin(aa) * r) : ctx.moveTo(Math.cos(aa) * r, Math.sin(aa) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, b.r * 0.3, 0, TAU);
      ctx.stroke();
      ctx.restore();
    } else if (b.k === 'lob') {
      const y = b.y - b.h;
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, 6, 3, 0, 0, TAU);
      ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      ctx.save();
      ctx.translate(b.x, y);
      ctx.rotate(b.rot);
      ctx.strokeStyle = '#ff7a2a';
      ctx.lineWidth = 2;
      ctx.strokeRect(-4, -7, 8, 12);
      ctx.fillStyle = 'rgba(255,122,42,.4)';
      ctx.fillRect(-4, -7, 8, 12);
      ctx.fillStyle = '#ffe14a';
      ctx.fillRect(-2, -11, 4, 4);
      ctx.restore();
      drawGlow('#ffb03e', b.x + Math.cos(b.rot) * 6, y + Math.sin(b.rot) * 6, 20, 0.9);
    } else if (b.k === 'rocket') {
      const s = b.small ? 0.75 : 1;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.a);
      ctx.scale(s, s);
      ctx.fillStyle = hexA(b.col, 0.4);
      ctx.strokeStyle = b.col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(-6, -5);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-6, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      drawGlow('#ffb03e', b.x - Math.cos(b.a) * 8, b.y - Math.sin(b.a) * 8, 22 * s, 0.9);
    }
  }
  // enemy bullets
  for (const b of G.ebullets) {
    if (!inView(cam, b.x, b.y, 20)) continue;
    drawGlow(b.col, b.x, b.y, b.r * 5, 0.9);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r * 0.45, 0, TAU);
    ctx.fill();
  }
  // flashes
  for (const f of G.flashes) drawGlow(f.col, f.x, f.y, f.R * 2 * (1.2 - (f.life / f.max) * 0.4), f.life / f.max);
  // particles
  for (const q of G.parts) {
    if (!inView(cam, q.x, q.y, 10)) continue;
    const a = q.life / q.max;
    if (q.kind === 1) {
      ctx.globalAlpha = a;
      ctx.strokeStyle = q.col;
      ctx.lineWidth = q.size * 0.7;
      ctx.beginPath();
      ctx.moveTo(q.x, q.y);
      ctx.lineTo(q.x - q.vx * 0.035, q.y - q.vy * 0.035);
      ctx.stroke();
    } else {
      ctx.globalAlpha = a;
      const s = q.size * (2 + 2 * a);
      ctx.drawImage(glow(q.col.startsWith('#') ? q.col : '#ffffff'), q.x - s, q.y - s, s * 2, s * 2);
    }
  }
  ctx.globalAlpha = 1;
  // fx
  for (const f of G.fx) {
    const a = f.life / f.max;
    if (f.k === 'ring') {
      const r = lerp(f.r1, f.r0, a);
      ctx.strokeStyle = f.col;
      ctx.globalAlpha = a;
      ctx.lineWidth = 2 + 4 * a;
      ctx.beginPath();
      ctx.arc(f.x, f.y, r, 0, TAU);
      ctx.stroke();
    } else if (f.k === 'beam') {
      ctx.strokeStyle = f.col;
      ctx.globalAlpha = a * 0.35;
      ctx.lineWidth = f.w * 2 * a + 2;
      ctx.beginPath();
      ctx.moveTo(f.x1, f.y1);
      ctx.lineTo(f.x2, f.y2);
      ctx.stroke();
      ctx.globalAlpha = a;
      ctx.lineWidth = f.w * 0.4 * a + 1;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    } else if (f.k === 'slash') {
      const sw = 1 - a;
      ctx.globalAlpha = a;
      ctx.strokeStyle = f.col;
      ctx.lineCap = 'round';
      for (const [lw, rr, al] of [
        [16, 1, 0.35],
        [6, 0.96, 0.9],
        [2, 0.92, 1],
      ]) {
        ctx.globalAlpha = a * al;
        ctx.lineWidth = lw;
        ctx.strokeStyle = lw === 2 ? '#ffffff' : f.col;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.R * rr * (0.85 + 0.15 * sw), f.a - f.h, f.a - f.h + 2 * f.h * Math.min(1, sw * 2.5 + 0.2));
        ctx.stroke();
      }
      ctx.lineCap = 'butt';
    } else if (f.k === 'bolt') {
      ctx.globalAlpha = a;
      for (const [lw, col] of [
        [6, f.col],
        [2, '#ffffff'],
      ]) {
        ctx.strokeStyle = col;
        ctx.lineWidth = lw;
        ctx.beginPath();
        const p = f.pts;
        ctx.moveTo(p[0], p[1]);
        for (let i = 2; i < p.length; i += 2) {
          const x0 = p[i - 2],
            y0 = p[i - 1],
            x1 = p[i],
            y1 = p[i + 1];
          const segs = 4;
          for (let s = 1; s <= segs; s++) {
            const t = s / segs;
            const j = s === segs ? 0 : 14;
            ctx.lineTo(lerp(x0, x1, t) + rand(-j, j), lerp(y0, y1, t) + rand(-j, j));
          }
        }
        ctx.stroke();
      }
    }
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  // texts
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  for (const t of G.texts) {
    if (!inView(cam, t.x, t.y, 30)) continue;
    const a = Math.min(1, (t.life / t.max) * 2.2);
    const pop = 1 + Math.max(0, t.life / t.max - 0.75) * 2.4;
    const size = (t.crit ? 20 : 13) * pop;
    ctx.font = `700 ${size.toFixed(1)}px "Chakra Petch",system-ui,sans-serif`;
    ctx.globalAlpha = a;
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#05070e';
    const s = typeof t.v === 'number' ? (t.crit ? t.v + '!' : String(t.v)) : t.v;
    ctx.strokeText(s, t.x, t.y);
    ctx.fillStyle = t.col || (t.crit ? '#ffd23e' : '#ffffff');
    ctx.fillText(s, t.x, t.y);
  }
  ctx.globalAlpha = 1;
}

export function drawPickup(k) {
  const bob = Math.sin(k.t * 5) * 2;
  if (k.type === 'gem') {
    const c = k.v >= 20 ? '#c66bff' : k.v >= 5 ? '#3ea8ff' : '#62ff9a';
    const s = k.v >= 20 ? 9 : k.v >= 5 ? 7 : 5;
    drawGlow(c, k.x, k.y + bob, s * 5, 0.55);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = hexA(c, 0.55);
    ctx.strokeStyle = c;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(k.x, k.y + bob - s);
    ctx.lineTo(k.x + s * 0.7, k.y + bob);
    ctx.lineTo(k.x, k.y + bob + s);
    ctx.lineTo(k.x - s * 0.7, k.y + bob);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.8)';
    ctx.beginPath();
    ctx.moveTo(k.x, k.y + bob - s);
    ctx.lineTo(k.x + s * 0.25, k.y + bob - s * 0.2);
    ctx.lineTo(k.x, k.y + bob);
    ctx.closePath();
    ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
  } else if (k.type === 'coin') {
    const w = Math.abs(Math.cos(k.t * 4)) * 5 + 1;
    drawGlow('#ffd23e', k.x, k.y + bob, 26, 0.5);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#b8860b';
    ctx.strokeStyle = '#ffd23e';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(k.x, k.y + bob, w, 6, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.globalCompositeOperation = 'lighter';
  } else if (k.type === 'heart') {
    drawGlow('#ff4a6b', k.x, k.y + bob, 50, 0.7);
    ctx.globalCompositeOperation = 'source-over';
    ctx.save();
    ctx.translate(k.x, k.y + bob);
    ctx.scale(0.55, 0.55);
    ctx.translate(-12, -12);
    ctx.fillStyle = 'rgba(255,74,107,.6)';
    ctx.strokeStyle = '#ff4a6b';
    ctx.lineWidth = 2.4;
    ctx.fill(
      new Path2D('M12 20.5s-8.5-5-8.5-11.2a4.6 4.6 0 0 1 8.5-2.5 4.6 4.6 0 0 1 8.5 2.5c0 6.2-8.5 11.2-8.5 11.2z'),
    );
    ctx.stroke(
      new Path2D('M12 20.5s-8.5-5-8.5-11.2a4.6 4.6 0 0 1 8.5-2.5 4.6 4.6 0 0 1 8.5 2.5c0 6.2-8.5 11.2-8.5 11.2z'),
    );
    ctx.restore();
    ctx.globalCompositeOperation = 'lighter';
  } else if (k.type === 'magnet') {
    drawGlow('#3ea8ff', k.x, k.y + bob, 50, 0.7);
    ctx.globalCompositeOperation = 'source-over';
    ctx.save();
    ctx.translate(k.x - 9, k.y + bob - 9);
    ctx.scale(0.75, 0.75);
    ctx.strokeStyle = '#3ea8ff';
    ctx.lineWidth = 2.6;
    ctx.stroke(new Path2D('M5.5 3.5V12a6.5 6.5 0 0 0 13 0V3.5h-4.3V12a2.2 2.2 0 0 1-4.4 0V3.5z'));
    ctx.restore();
    ctx.globalCompositeOperation = 'lighter';
  } else if (k.type === 'bomb') {
    drawGlow('#ffffff', k.x, k.y + bob, 50, 0.6 + 0.3 * Math.sin(k.t * 8));
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#0a0e18';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(k.x, k.y + bob, 8, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ff4a3d';
    ctx.beginPath();
    ctx.arc(k.x, k.y + bob, 3, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
  } else if (k.type === 'box') {
    const y = k.y + bob;
    const c = k.v === 2 ? BOXES.prem.col : BOXES.std.col;
    ctx.globalAlpha = 0.3 + 0.15 * Math.sin(k.t * 5);
    ctx.fillStyle = c;
    ctx.fillRect(k.x - 5, y - 140, 10, 140);
    ctx.globalAlpha = 1;
    drawGlow(c, k.x, y, 100, 0.9);
    ctx.globalCompositeOperation = 'source-over';
    ctx.save();
    ctx.translate(k.x, y);
    ctx.rotate(Math.sin(k.t * 2) * 0.12);
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#0b0f1e';
    ctx.strokeStyle = c;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU - Math.PI / 2;
      i ? ctx.lineTo(Math.cos(a) * 15, Math.sin(a) * 15) : ctx.moveTo(Math.cos(a) * 15, Math.sin(a) * 15);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU - Math.PI / 2;
      i ? ctx.lineTo(Math.cos(a) * 9.5, Math.sin(a) * 9.5) : ctx.moveTo(Math.cos(a) * 9.5, Math.sin(a) * 9.5);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
    ctx.globalCompositeOperation = 'lighter';
    drawGlow(c, k.x, y, 26 + 4 * Math.sin(k.t * 8), 1);
    drawGlow('#ffffff', k.x, y, 10, 0.9);
  } else if (k.type === 'chest') {
    const y = k.y + bob;
    ctx.globalAlpha = 0.25 + 0.15 * Math.sin(k.t * 4);
    ctx.fillStyle = '#ffd23e';
    ctx.fillRect(k.x - 6, y - 120, 12, 120);
    ctx.globalAlpha = 1;
    drawGlow('#ffd23e', k.x, y, 90, 0.8);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#2a1d05';
    ctx.strokeStyle = '#ffd23e';
    ctx.lineWidth = 2;
    ctx.fillRect(k.x - 13, y - 9, 26, 18);
    ctx.strokeRect(k.x - 13, y - 9, 26, 18);
    ctx.beginPath();
    ctx.moveTo(k.x - 13, y - 2);
    ctx.lineTo(k.x + 13, y - 2);
    ctx.stroke();
    ctx.fillStyle = '#ffd23e';
    ctx.fillRect(k.x - 3, y - 4, 6, 6);
    ctx.globalCompositeOperation = 'lighter';
  }
}

export function drawHero(P) {
  const blink = P.inv > 0 && Math.floor(G.t * 20) % 2 === 0;
  if (blink && G.state === 'play') ctx.globalAlpha = 0.45;
  const bob = P.moving ? Math.sin(P.step) * 0.06 : 0;
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.beginPath();
  ctx.ellipse(P.x, P.y + 12, 14, 5, 0, 0, TAU);
  ctx.fill();
  ctx.save();
  ctx.translate(P.x, P.y);
  ctx.rotate(P.aim);
  ctx.scale(1 + bob, 1 - bob);
  ctx.shadowColor = P.col;
  ctx.shadowBlur = 14;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  // backpack
  ctx.fillStyle = '#0b1828';
  ctx.strokeStyle = P.col;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(-17, -8, 8, 16, 3) : ctx.rect(-17, -8, 8, 16);
  ctx.fill();
  ctx.stroke();
  // gun
  ctx.fillStyle = '#163045';
  ctx.beginPath();
  ctx.rect(4, -3.5, 20, 7);
  ctx.fill();
  ctx.strokeStyle = '#e8fbff';
  ctx.lineWidth = 1.8;
  ctx.stroke();
  // body
  ctx.fillStyle = '#0b1c2a';
  ctx.strokeStyle = P.col;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = hexA(P.col, 0.18);
  ctx.fill();
  // shoulders
  ctx.strokeStyle = hexA(P.col, 0.7);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 0, 8, 1.9, 4.4);
  ctx.stroke();
  // visor
  ctx.shadowColor = '#ffffff';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.arc(2, 0, 7, -0.9, 0.9);
  ctx.stroke();
  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  // tiny hp bar under hero
  if (P.hp < P.maxHp) {
    ctx.fillStyle = 'rgba(0,0,0,.6)';
    ctx.fillRect(P.x - 16, P.y + 20, 32, 4);
    ctx.fillStyle = '#ff4a6b';
    ctx.fillRect(P.x - 16, P.y + 20, 32 * Math.max(0, P.hp / P.maxHp), 4);
  }
}

export function drawTurrets(w) {
  const col = WEAPONS.turret.col;
  for (const t of w.tur) {
    const fade = t.mob ? 1 : Math.min(1, t.life / 0.6);
    ctx.globalAlpha = fade;
    ctx.globalCompositeOperation = 'lighter';
    drawGlow(col, t.x, t.y, t.mob ? 46 : 58, 0.5);
    ctx.globalCompositeOperation = 'source-over';
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#0a0e18';
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    if (!t.mob) {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU;
        i ? ctx.lineTo(Math.cos(a) * 12, Math.sin(a) * 12) : ctx.moveTo(12, 0);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = hexA(col, 0.5);
      ctx.beginPath();
      ctx.arc(0, 0, 17, -Math.PI / 2, -Math.PI / 2 + TAU * Math.max(0, t.life / t.max));
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-14, -5);
      ctx.lineTo(-7, 0);
      ctx.lineTo(-14, 5);
      ctx.moveTo(14, -5);
      ctx.lineTo(7, 0);
      ctx.lineTo(14, 5);
      ctx.stroke();
    }
    ctx.rotate(t.ang);
    ctx.fillStyle = col;
    ctx.fillRect(2, -2.5, t.mob ? 13 : 17, 5);
    ctx.fillStyle = '#fff';
    ctx.shadowColor = col;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, 0, 3.3, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

// Joueur à terre : silhouette éteinte + jauge de réanimation
export function drawDowned(pl) {
  ctx.globalAlpha = 0.4 + 0.15 * Math.sin(G.t * 4);
  ctx.strokeStyle = pl.col;
  ctx.lineWidth = 2.4;
  ctx.fillStyle = 'rgba(10,16,30,.8)';
  ctx.beginPath();
  ctx.arc(pl.x, pl.y, 13, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(pl.x - 6, pl.y - 6);
  ctx.lineTo(pl.x + 6, pl.y + 6);
  ctx.moveTo(pl.x + 6, pl.y - 6);
  ctx.lineTo(pl.x - 6, pl.y + 6);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(98,255,154,.25)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(pl.x, pl.y, 24, 0, TAU);
  ctx.stroke();
  if (pl.rev > 0) {
    ctx.strokeStyle = '#62ff9a';
    ctx.shadowColor = '#62ff9a';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(pl.x, pl.y, 24, -Math.PI / 2, -Math.PI / 2 + TAU * pl.rev);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  ctx.font = '700 11px "Chakra Petch",system-ui,sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#62ff9a';
  ctx.fillText(pl.i === ME ? 'À TERRE' : 'RÉANIME ' + plName(pl), pl.x, pl.y - 36);
}
