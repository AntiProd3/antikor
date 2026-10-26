// Dessins des ennemis et des boss, lueurs et taches. Ce fichier ne contient que des dessins.

import {BOSSV,ETYPES} from '../data/enemies.js';
import {TAU,hexA} from '../util.js';

export function fillBody(g,c,a=.22){g.fillStyle='#0a0e18';g.fill();g.fillStyle=hexA(c,a);g.fill();g.stroke();}
export const DRAW={
 walker(g,r,c){g.strokeStyle=c;g.lineWidth=r*.17;g.beginPath();g.moveTo(-r*.1,-r*.55);g.quadraticCurveTo(r*.5,-r*.95,r*1.05,-r*.62);g.moveTo(-r*.1,r*.55);g.quadraticCurveTo(r*.5,r*.85,r*1,r*.42);g.stroke();
  g.lineWidth=r*.09;for(const[x,y]of[[r*1.05,-r*.62],[r*1,r*.42]]){g.beginPath();for(let k=-1;k<=1;k++){g.moveTo(x,y);g.lineTo(x+r*.28,y+k*r*.17);}g.stroke();}
  g.lineWidth=r*.14;g.beginPath();g.ellipse(-r*.2,0,r*.62,r*.82,0,0,TAU);fillBody(g,c);
  g.lineWidth=r*.07;g.strokeStyle=hexA(c,.75);g.beginPath();g.moveTo(-r*.6,-r*.32);g.lineTo(-r*.18,-r*.26);g.moveTo(-r*.66,r*.02);g.lineTo(-r*.22,0);g.moveTo(-r*.6,r*.36);g.lineTo(-r*.2,r*.28);g.stroke();
  g.strokeStyle=c;g.lineWidth=r*.13;g.beginPath();g.arc(r*.42,0,r*.4,0,TAU);fillBody(g,c,.32);
  g.fillStyle='#fff';g.shadowColor='#fff';for(const y of[-r*.15,r*.15]){g.beginPath();g.arc(r*.6,y,r*.085,0,TAU);g.fill();}},
 runner(g,r,c){g.strokeStyle=hexA(c,.85);g.lineWidth=r*.14;g.beginPath();g.moveTo(-r*.3,-r*.3);g.lineTo(-r*1.1,-r*.78);g.moveTo(-r*.3,r*.3);g.lineTo(-r*1.15,r*.58);g.stroke();
  g.strokeStyle=hexA(c,.4);g.lineWidth=r*.08;g.beginPath();g.moveTo(-r*.9,-r*.1);g.lineTo(-r*1.35,-r*.1);g.moveTo(-r*.8,r*.18);g.lineTo(-r*1.25,r*.18);g.stroke();
  g.strokeStyle=c;g.lineWidth=r*.15;g.beginPath();g.moveTo(r*1.15,0);g.lineTo(-r*.5,-r*.74);g.lineTo(-r*.15,0);g.lineTo(-r*.5,r*.74);g.closePath();fillBody(g,c,.28);
  g.strokeStyle='#fff';g.shadowColor='#fff';g.lineWidth=r*.12;g.beginPath();g.moveTo(r*.15,-r*.24);g.lineTo(r*.58,-r*.07);g.moveTo(r*.15,r*.24);g.lineTo(r*.58,r*.07);g.stroke();},
 tank(g,r,c){g.strokeStyle=c;g.lineWidth=r*.08;for(const sy of[-1,1]){g.beginPath();g.moveTo(-r*.4,sy*r*.78);g.lineTo(-r*.08,sy*r*1.25);g.lineTo(r*.26,sy*r*.78);g.closePath();fillBody(g,c,.35);}
  g.lineWidth=r*.1;g.beginPath();for(let i=0;i<6;i++){const a=i/6*TAU+Math.PI/6;i?g.lineTo(Math.cos(a)*r,Math.sin(a)*r):g.moveTo(Math.cos(a)*r,Math.sin(a)*r);}g.closePath();fillBody(g,c,.2);
  g.strokeStyle=hexA(c,.6);g.lineWidth=r*.05;g.beginPath();for(let i=0;i<6;i++){const a=i/6*TAU+Math.PI/6;const x=Math.cos(a)*r*.55,y=Math.sin(a)*r*.55;i?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();
  for(let i=0;i<6;i++){const a=i/6*TAU+Math.PI/6;g.moveTo(Math.cos(a)*r*.55,Math.sin(a)*r*.55);g.lineTo(Math.cos(a)*r*.95,Math.sin(a)*r*.95);}g.stroke();
  g.fillStyle=hexA(c,.5);g.beginPath();g.arc(-r*.1,0,r*.2,0,TAU);g.fill();
  g.strokeStyle='#fff';g.shadowColor='#fff';g.lineWidth=r*.1;g.beginPath();g.moveTo(r*.62,-r*.24);g.lineTo(r*.62,r*.24);g.stroke();},
 spitter(g,r,c){g.strokeStyle=c;g.lineWidth=r*.12;g.beginPath();g.moveTo(r*.3,-r*.26);g.lineTo(r*.95,-r*.34);g.lineTo(r*.95,r*.34);g.lineTo(r*.3,r*.26);g.closePath();fillBody(g,c,.3);
  g.beginPath();g.arc(-r*.22,0,r*.78,0,TAU);fillBody(g,c,.2);
  g.strokeStyle=hexA(c,.75);g.lineWidth=r*.06;for(const[x,y,rr]of[[-r*.5,-r*.32,r*.16],[-r*.6,r*.26,r*.12],[-r*.12,r*.38,r*.1],[-r*.2,-r*.05,r*.08]]){g.beginPath();g.arc(x,y,rr,0,TAU);g.stroke();}
  g.fillStyle=c;g.beginPath();g.arc(r*1,0,r*.2,0,TAU);g.fill();g.fillStyle='#0a0e18';g.beginPath();g.arc(r*1.02,0,r*.1,0,TAU);g.fill();
  g.fillStyle='#fff';g.shadowColor='#fff';for(const y of[-r*.45,r*.45]){g.beginPath();g.arc(r*.2,y,r*.08,0,TAU);g.fill();}},
 bomber(g,r,c){g.strokeStyle=c;g.lineWidth=r*.1;g.beginPath();g.moveTo(-r*.55,-r*.55);g.quadraticCurveTo(-r*1.05,-r*.7,-r*1.05,-r*1.1);g.stroke();
  g.lineWidth=r*.13;g.beginPath();g.arc(0,0,r*.84,0,TAU);fillBody(g,c,.22);
  g.save();g.beginPath();g.arc(0,0,r*.78,0,TAU);g.clip();g.strokeStyle=hexA(c,.6);g.lineWidth=r*.1;g.beginPath();g.moveTo(-r*.35,-r);g.lineTo(-r*.35,r);g.moveTo(-r*.05,-r);g.lineTo(-r*.05,r);g.stroke();g.restore();
  g.strokeStyle='#fff';g.shadowColor='#fff';g.lineWidth=r*.1;for(const y of[-r*.28,r*.28]){g.beginPath();g.moveTo(r*.3,y-r*.12);g.lineTo(r*.54,y+r*.12);g.moveTo(r*.54,y-r*.12);g.lineTo(r*.3,y+r*.12);g.stroke();}
  g.fillStyle='#ffd23e';g.shadowColor='#ffd23e';g.beginPath();g.arc(-r*1.05,-r*1.1,r*.16,0,TAU);g.fill();},
 splitter(g,r,c){g.strokeStyle=c;g.lineWidth=r*.11;g.beginPath();for(let i=0;i<=14;i++){const a=i/14*TAU;const rr=r*(.9+.1*Math.sin(i*2.7));i?g.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):g.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}g.closePath();fillBody(g,c,.16);
  g.setLineDash([r*.15,r*.12]);g.strokeStyle=hexA(c,.7);g.lineWidth=r*.06;g.beginPath();g.moveTo(-r*.02,-r*.8);g.lineTo(-r*.02,r*.8);g.stroke();g.setLineDash([]);
  g.fillStyle=hexA(c,.6);for(const x of[-r*.42,r*.38]){g.beginPath();g.arc(x,0,r*.25,0,TAU);g.fill();}
  g.fillStyle='#fff';g.shadowColor='#fff';for(const y of[-r*.1,r*.1]){g.beginPath();g.arc(r*.48,y,r*.07,0,TAU);g.fill();}},
 mini(g,r,c){g.strokeStyle=c;g.lineWidth=r*.15;g.beginPath();for(let i=0;i<=10;i++){const a=i/10*TAU;const rr=r*(.9+.1*Math.sin(i*3.1));i?g.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):g.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}g.closePath();fillBody(g,c,.2);
  g.fillStyle=hexA(c,.6);g.beginPath();g.arc(0,0,r*.32,0,TAU);g.fill();g.fillStyle='#fff';g.shadowColor='#fff';for(const y of[-r*.2,r*.2]){g.beginPath();g.arc(r*.45,y,r*.1,0,TAU);g.fill();}},
 boss(g,r,c){const gold='#ffd23e';g.strokeStyle=c;g.lineWidth=r*.05;
  for(let i=0;i<12;i++){const a=i/12*TAU;const ca=Math.cos(a),sa=Math.sin(a);const w=.17;g.beginPath();g.moveTo(Math.cos(a-w)*r*.8,Math.sin(a-w)*r*.8);g.lineTo(ca*r*1.2,sa*r*1.2);g.lineTo(Math.cos(a+w)*r*.8,Math.sin(a+w)*r*.8);g.closePath();fillBody(g,c,.4);}
  g.lineWidth=r*.07;g.beginPath();g.arc(0,0,r*.86,0,TAU);fillBody(g,c,.18);
  g.strokeStyle=hexA(gold,.8);g.lineWidth=r*.03;g.setLineDash([r*.1,r*.07]);g.beginPath();g.arc(0,0,r*.64,0,TAU);g.stroke();g.setLineDash([]);
  g.strokeStyle='#fff';g.shadowColor='#fff';g.lineWidth=r*.04;g.beginPath();g.arc(r*.22,0,r*.42,-.95,.95);g.stroke();
  g.fillStyle='#fff';for(let i=-3;i<=3;i++){const a=i*.26;const x=r*.22+Math.cos(a)*r*.42,y=Math.sin(a)*r*.42;g.beginPath();g.moveTo(x,y-r*.04);g.lineTo(x-r*.11,y);g.lineTo(x,y+r*.04);g.fill();}
  g.shadowColor=gold;g.fillStyle=gold;for(const[x,y]of[[-r*.05,-r*.3],[-r*.05,r*.3],[r*.12,0]]){g.beginPath();g.arc(x,y,r*.1,0,TAU);g.fill();}
  g.fillStyle='#0a0e18';for(const[x,y]of[[-r*.05,-r*.3],[-r*.05,r*.3],[r*.12,0]]){g.beginPath();g.ellipse(x,y,r*.03,r*.08,0,0,TAU);g.fill();}},
};
// Germes des mondes 2 à 5 (v1.1)
Object.assign(DRAW,{
 dasher(g,r,c){g.strokeStyle=hexA(c,.5);g.lineWidth=r*.1;for(const y of[-r*.32,0,r*.32]){g.beginPath();g.moveTo(-r*.7,y);g.lineTo(-r*1.3,y*1.4);g.stroke();}
  g.strokeStyle=c;g.lineWidth=r*.14;g.beginPath();g.moveTo(r*.55,0);g.quadraticCurveTo(r*.1,-r*.72,-r*.75,-r*.42);g.quadraticCurveTo(-r*.95,0,-r*.75,r*.42);g.quadraticCurveTo(r*.1,r*.72,r*.55,0);g.closePath();fillBody(g,c,.26);
  g.strokeStyle='#fff';g.shadowColor='#fff';g.lineWidth=r*.13;g.beginPath();g.moveTo(r*.45,0);g.lineTo(r*1.45,0);g.stroke();
  g.fillStyle='#fff';g.beginPath();g.arc(r*.05,-r*.22,r*.09,0,TAU);g.arc(r*.05,r*.22,r*.09,0,TAU);g.fill();},
 healer(g,r,c){const gr='#62ff9a';g.strokeStyle=c;g.lineWidth=r*.11;g.beginPath();for(let i=0;i<=16;i++){const a=i/16*TAU;const rr=r*(.92+.08*Math.sin(i*2.2));i?g.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):g.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}g.closePath();fillBody(g,c,.12);
  g.strokeStyle=hexA(c,.55);g.lineWidth=r*.07;for(const[x,y,rr]of[[-r*.28,-r*.22,r*.24],[-r*.3,r*.24,r*.22],[r*.08,0,r*.2]]){g.beginPath();g.arc(x,y,rr,0,TAU);g.stroke();}
  g.strokeStyle=gr;g.shadowColor=gr;g.lineWidth=r*.16;g.beginPath();g.moveTo(r*.48,-r*.26);g.lineTo(r*.48,r*.26);g.moveTo(r*.22,0);g.lineTo(r*.74,0);g.stroke();},
 brood(g,r,c){g.strokeStyle=c;g.lineWidth=r*.09;g.beginPath();g.ellipse(-r*.1,0,r*.95,r*.75,0,0,TAU);fillBody(g,c,.14);
  g.lineWidth=r*.06;for(const[x,y,rr]of[[-r*.5,-r*.22,r*.17],[-r*.45,r*.26,r*.16],[-r*.08,-r*.32,r*.14],[-r*.05,r*.2,r*.18],[r*.3,-r*.05,r*.13]]){g.beginPath();g.arc(x,y,rr,0,TAU);g.fillStyle=hexA(c,.4);g.fill();g.stroke();}
  g.strokeStyle=c;g.lineWidth=r*.1;g.beginPath();g.arc(r*.72,0,r*.26,-1.2,1.2);g.stroke();
  g.fillStyle='#fff';g.shadowColor='#fff';for(const y of[-r*.13,r*.13]){g.beginPath();g.arc(r*.66,y,r*.06,0,TAU);g.fill();}},
 blinker(g,r,c){g.strokeStyle=hexA(c,.8);g.lineWidth=r*.09;for(let i=0;i<6;i++){const a=i/6*TAU+.3;const x1=Math.cos(a)*r*.5,y1=Math.sin(a)*r*.5,x2=Math.cos(a+.25)*r*1.25,y2=Math.sin(a+.25)*r*1.25;g.beginPath();g.moveTo(x1,y1);g.quadraticCurveTo(Math.cos(a)*r*1.05,Math.sin(a)*r*1.05,x2,y2);g.stroke();
   g.fillStyle=c;g.beginPath();g.arc(x2,y2,r*.1,0,TAU);g.fill();}
  g.strokeStyle=c;g.lineWidth=r*.13;g.beginPath();g.arc(0,0,r*.58,0,TAU);fillBody(g,c,.25);
  g.fillStyle='#fff';g.shadowColor='#fff';g.beginPath();g.arc(r*.1,0,r*.2,0,TAU);g.fill();g.fillStyle='#05070e';g.beginPath();g.arc(r*.16,0,r*.09,0,TAU);g.fill();},
});
// Seconds germes des mondes 2 à 5 (v1.2)
Object.assign(DRAW,{
 zigzag(g,r,c){g.strokeStyle=c;g.lineWidth=r*.16;g.beginPath();g.ellipse(0,0,r*.95,r*.6,0,0,TAU);fillBody(g,c,.3);
  g.strokeStyle=hexA(c,.6);g.lineWidth=r*.1;g.beginPath();g.moveTo(-r*.55,-r*.15);g.lineTo(-r*.2,r*.15);g.lineTo(r*.15,-r*.15);g.stroke();
  g.fillStyle='#fff';g.shadowColor='#fff';g.beginPath();g.arc(r*.55,0,r*.14,0,TAU);g.fill();},
 latcher(g,r,c){g.strokeStyle=c;g.lineWidth=r*.15;for(const sy of[-1,1]){g.beginPath();g.moveTo(-r*.2,0);g.lineTo(r*.55,sy*r*.65);g.lineTo(r*1.1,sy*r*.95);g.moveTo(r*.55,sy*r*.65);g.lineTo(r*1.15,sy*r*.4);g.stroke();}
  g.lineWidth=r*.13;g.beginPath();g.moveTo(-r*.2,0);g.lineTo(-r*1,0);g.stroke();
  g.beginPath();g.arc(-r*.25,0,r*.45,0,TAU);fillBody(g,c,.3);
  g.fillStyle='#fff';g.shadowColor='#fff';g.beginPath();g.arc(-r*.12,0,r*.13,0,TAU);g.fill();},
 spiker(g,r,c){g.strokeStyle=c;g.lineWidth=r*.07;for(let i=0;i<8;i++){const a=i/8*TAU;g.beginPath();g.moveTo(Math.cos(a-.18)*r*.7,Math.sin(a-.18)*r*.7);g.lineTo(Math.cos(a)*r*1.2,Math.sin(a)*r*1.2);g.lineTo(Math.cos(a+.18)*r*.7,Math.sin(a+.18)*r*.7);g.closePath();fillBody(g,c,.35);}
  g.lineWidth=r*.1;g.beginPath();g.arc(0,0,r*.78,0,TAU);fillBody(g,c,.15);
  g.strokeStyle=hexA(c,.55);g.lineWidth=r*.06;g.beginPath();g.arc(0,0,r*.45,0,TAU);g.stroke();
  g.fillStyle='#ff4a3d';g.shadowColor='#ff4a3d';for(const y of[-r*.2,r*.2]){g.beginPath();g.arc(r*.42,y,r*.1,0,TAU);g.fill();}},
 pulser(g,r,c){g.strokeStyle=hexA(c,.7);g.lineWidth=r*.08;for(let i=0;i<3;i++){g.beginPath();g.arc(0,0,r*(.75+i*.22),-.6+i*.25,.6-i*.25);g.stroke();g.beginPath();g.arc(0,0,r*(.75+i*.22),Math.PI-.6+i*.25,Math.PI+.6-i*.25);g.stroke();}
  g.strokeStyle=c;g.lineWidth=r*.13;g.beginPath();for(let i=0;i<4;i++){const a=i/4*TAU+Math.PI/4;const x=Math.cos(a)*r*.62,y=Math.sin(a)*r*.62;i?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();fillBody(g,c,.3);
  g.fillStyle='#fff';g.shadowColor='#fff';g.beginPath();g.arc(0,0,r*.18,0,TAU);g.fill();},
});
export function hexPath(g,x,y,r,rot){g.beginPath();for(let i=0;i<6;i++){const a=rot+i/6*TAU;const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;i?g.lineTo(px,py):g.moveTo(px,py);}g.closePath();}
// Variantes de boss : même style néon que la Couronne, silhouettes et couleurs différentes
Object.assign(DRAW,{
 bhive(g,r,c){const amber='#ff9b3d';g.strokeStyle=c;g.lineWidth=r*.05;
  for(let i=0;i<6;i++){const a=i/6*TAU+Math.PI/6;g.beginPath();g.moveTo(Math.cos(a-.12)*r*.82,Math.sin(a-.12)*r*.82);g.lineTo(Math.cos(a+.16)*r*1.24,Math.sin(a+.16)*r*1.24);g.lineTo(Math.cos(a+.14)*r*.84,Math.sin(a+.14)*r*.84);g.closePath();fillBody(g,c,.35);}
  g.lineWidth=r*.07;hexPath(g,0,0,r*.92,0);fillBody(g,c,.16);
  g.lineWidth=r*.035;g.strokeStyle=hexA(c,.8);const cr=r*.2;
  for(const[x,y]of[[0,0],[cr*1.75,0],[-cr*1.75,0],[cr*.87,cr*1.5],[-cr*.87,cr*1.5],[cr*.87,-cr*1.5],[-cr*.87,-cr*1.5]]){hexPath(g,x,y,cr*.92,Math.PI/6);g.fillStyle=hexA(amber,.28);g.fill();g.stroke();}
  g.fillStyle=amber;g.shadowColor=amber;g.beginPath();g.arc(0,0,r*.09,0,TAU);g.fill();
  g.fillStyle='#fff';g.shadowColor='#fff';for(const[x,y]of[[r*.62,-r*.2],[r*.62,r*.2],[r*.74,0]]){g.beginPath();g.arc(x,y,r*.06,0,TAU);g.fill();}},
 beye(g,r,c){g.strokeStyle=c;g.lineWidth=r*.07;
  for(let i=0;i<8;i++){const a=i/8*TAU+Math.PI/8;g.beginPath();g.moveTo(Math.cos(a)*r*.8,Math.sin(a)*r*.8);g.quadraticCurveTo(Math.cos(a+.35)*r*1.12,Math.sin(a+.35)*r*1.12,Math.cos(a-.08)*r*1.36,Math.sin(a-.08)*r*1.36);g.stroke();
   g.fillStyle=c;g.beginPath();g.arc(Math.cos(a-.08)*r*1.36,Math.sin(a-.08)*r*1.36,r*.05,0,TAU);g.fill();}
  g.lineWidth=r*.07;g.beginPath();g.arc(0,0,r*.86,0,TAU);fillBody(g,c,.18);
  g.lineWidth=r*.035;g.strokeStyle=hexA(c,.6);g.setLineDash([r*.08,r*.06]);g.beginPath();g.arc(0,0,r*.7,0,TAU);g.stroke();g.setLineDash([]);
  g.fillStyle='#e8f4ff';g.shadowColor='#ffffff';g.beginPath();g.ellipse(r*.16,0,r*.5,r*.36,0,0,TAU);g.fill();
  g.fillStyle=c;g.shadowColor=c;g.beginPath();g.arc(r*.3,0,r*.24,0,TAU);g.fill();
  g.fillStyle='#05070e';g.beginPath();g.ellipse(r*.35,0,r*.06,r*.18,0,0,TAU);g.fill();
  g.fillStyle='#ffffff';g.beginPath();g.arc(r*.4,-r*.09,r*.045,0,TAU);g.fill();},
 btitan(g,r,c){const gold='#ffd23e';g.strokeStyle=c;g.lineWidth=r*.06;
  for(const sy of[-1,1]){g.beginPath();g.rect(-r*.4,sy*r*.8-r*.24,r*.95,r*.48);fillBody(g,c,.3);g.beginPath();g.rect(r*.5,sy*r*.8-r*.1,r*.62,r*.2);fillBody(g,c,.5);
   g.fillStyle='#fff';g.shadowColor='#fff';g.beginPath();g.arc(r*1.12,sy*r*.8,r*.05,0,TAU);g.fill();}
  g.lineWidth=r*.08;g.beginPath();for(let i=0;i<8;i++){const a=i/8*TAU+Math.PI/8;const x=Math.cos(a)*r*.84,y=Math.sin(a)*r*.84;i?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();fillBody(g,c,.2);
  g.strokeStyle=hexA(c,.65);g.lineWidth=r*.035;g.beginPath();g.moveTo(-r*.62,-r*.32);g.lineTo(r*.2,-r*.32);g.moveTo(-r*.62,r*.32);g.lineTo(r*.2,r*.32);g.moveTo(-r*.22,-r*.62);g.lineTo(-r*.22,r*.62);g.stroke();
  g.strokeStyle='#fff';g.shadowColor='#fff';g.lineWidth=r*.09;g.beginPath();g.moveTo(r*.46,-r*.34);g.lineTo(r*.64,0);g.lineTo(r*.46,r*.34);g.stroke();
  g.fillStyle=gold;g.shadowColor=gold;g.beginPath();g.arc(-r*.22,0,r*.11,0,TAU);g.fill();},
});
export function makeSprite(type,r,c){const half=Math.ceil(r*1.5+14);const S=2;
 const mk=flash=>{const cv=document.createElement('canvas');cv.width=cv.height=half*2*S;const g=cv.getContext('2d');g.scale(S,S);g.translate(half,half);g.shadowColor=c;g.shadowBlur=10;g.lineCap='round';g.lineJoin='round';DRAW[type](g,r,c);
  if(flash){g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='source-atop';g.fillStyle='rgba(255,255,255,0.88)';g.fillRect(0,0,cv.width,cv.height);}return cv;};
 return{n:mk(false),f:mk(true),half};}
export const SPR={},SPRE={},SPRB={};
// Les sprites sont dessinés une fois au démarrage (pas au chargement du module)
export function initSprites(){
 for(const t in ETYPES){const T=ETYPES[t];SPR[t]=makeSprite(t,T.r,T.col);if(t!=='boss'&&t!=='mini')SPRE[t]=makeSprite(t,T.r*1.5,T.col);}
 for(const k in BOSSV)SPRB[k]=k==='crown'?SPR.boss:makeSprite(BOSSV[k].draw,ETYPES.boss.r,BOSSV[k].col);
}
export const GLOW={};
export function glow(col){let g=GLOW[col];if(g)return g;const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const gr=x.createRadialGradient(32,32,0,32,32,32);
 gr.addColorStop(0,'rgba(255,255,255,0.95)');gr.addColorStop(.18,hexA(col,.85));gr.addColorStop(.5,hexA(col,.22));gr.addColorStop(1,hexA(col,0));x.fillStyle=gr;x.fillRect(0,0,64,64);GLOW[col]=c;return c;}
export const SPLAT={};
export function splat(col){if(SPLAT[col])return SPLAT[col];const arr=[];let seed=1;for(const ch of col)seed=(seed*31+ch.charCodeAt(0))%2147483647;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;for(let v=0;v<3;v++){const c=document.createElement('canvas');c.width=c.height=96;const g=c.getContext('2d');g.translate(48,48);g.fillStyle=hexA(col,.55);
 g.beginPath();const n=11;for(let i=0;i<=n;i++){const a=i/n*TAU;const rr=20+rnd()*12;i?g.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):g.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}g.fill();
 for(let k=0;k<7;k++){const a=rnd()*TAU,d=28+rnd()*16;g.beginPath();g.arc(Math.cos(a)*d,Math.sin(a)*d,2+rnd()*4,0,TAU);g.fill();}
 g.globalCompositeOperation='destination-out';g.fillStyle='rgba(0,0,0,.45)';g.beginPath();g.arc(0,0,12,0,TAU);g.fill();arr.push(c);}SPLAT[col]=arr;return arr;}
