// Connexion au serveur de jeu (AntiBack) : compte, progression du joueur et requêtes.
// Le serveur fait foi : le jeu affiche la progression qu'il reçoit (prog) et lui demande chaque changement
// (achat de talent, ouverture de box, début et fin de partie…). La connexion se rétablit toute seule.

import { SERVER_URL } from '../config.js';
import { newProgress } from '../rules.js';

// 3 : duo par le serveur (salles avec hôte, duo_start, duo_in, duo_act…) et classement
// 4 : skins, box Halloween, cadeau quotidien, joueurs par niveau de carrière (v1.2)
export const PROTOCOL_VERSION = 4;
const TOKEN_KEY = 'antikor-token';

// Progression du compte connecté (copie de celle du serveur, remplacée à chaque message « state »)
export const prog = newProgress();
export const account = { name: null };
// status : 'offline' (pas connecté), 'connecting', 'online'
export const net = { status: 'offline' };

const listeners = {};
export function on(event, fn) {
  (listeners[event] = listeners[event] || []).push(fn);
}
function emit(event, ...args) {
  for (const fn of listeners[event] || []) fn(...args);
}

// Adresse du serveur. Pour les tests, ?server= peut viser un serveur local, jamais une autre adresse
// (sinon un lien piégé pourrait faire envoyer son mot de passe à un faux serveur).
function serverUrl() {
  const q = new URLSearchParams(location.search).get('server');
  if (q && /^wss?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(q)) return q;
  return SERVER_URL;
}

const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
const setToken = t => {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
};
export const hasToken = () => !!getToken();

function setProgress(p) {
  for (const k of Object.keys(prog)) delete prog[k];
  Object.assign(prog, newProgress(), p);
}

function setStatus(s) {
  net.status = s;
  emit('status', s);
}

// ---------- Connexion et identification ----------

let ws = null;
let loggedIn = false; // une session est ouverte (on se reconnecte tout seul si la connexion tombe)
let retryTimer = 0;
let retryDelay = 1000;

// Ouvre une connexion, envoie l'identification et attend la réponse : { ok } ou { ok: false, code, msg }
function openWith(first) {
  clearTimeout(retryTimer);
  if (ws) {
    ws.onclose = null;
    ws.close();
    ws = null;
  }
  setStatus('connecting');
  return new Promise(resolve => {
    let sock;
    try {
      sock = new WebSocket(serverUrl());
    } catch {
      setStatus('offline');
      resolve({ ok: false, code: 'network', msg: 'Serveur injoignable.' });
      return;
    }
    ws = sock;
    let settled = false;
    const done = r => {
      if (settled) return;
      settled = true;
      resolve(r);
    };
    sock.onopen = () => sock.send(JSON.stringify({ ...first, v: PROTOCOL_VERSION }));
    sock.onmessage = ev => {
      let m;
      try {
        m = JSON.parse(ev.data);
      } catch {
        return;
      }
      if (m.t === 'auth_ok') {
        account.name = m.user.name;
        if (m.token) setToken(m.token);
        setProgress(m.p);
        loggedIn = true;
        retryDelay = 1000;
        setStatus('online');
        flushQueue();
        emit('state');
        done({ ok: true });
      } else if (m.t === 'auth_err') {
        done({ ok: false, code: m.code, msg: m.msg, retryIn: m.retryIn });
      } else onMessage(m);
    };
    sock.onclose = () => {
      if (ws !== sock) return;
      ws = null;
      failPending();
      setStatus('offline');
      if (!settled) done({ ok: false, code: 'network', msg: 'Serveur injoignable.' });
      else if (loggedIn) scheduleReconnect();
    };
  });
}

// Connexion perdue pendant une session : nouvel essai avec le jeton, de plus en plus espacé (10 s max)
function scheduleReconnect() {
  clearTimeout(retryTimer);
  retryTimer = setTimeout(async () => {
    const token = getToken();
    if (!token) return endSession();
    const r = await openWith({ t: 'resume', token });
    if (r.ok) return;
    if (r.code === 'bad_token' || r.code === 'version') return endSession(r);
    retryDelay = Math.min(10000, retryDelay * 2);
    scheduleReconnect();
  }, retryDelay);
}

function endSession(reason) {
  loggedIn = false;
  setToken(null);
  account.name = null;
  emit('logout', reason);
}

// Au démarrage : reprise de la session gardée sur cet appareil (sans retaper le mot de passe)
export async function resumeSession() {
  const token = getToken();
  if (!token) return { ok: false, code: 'no_token' };
  const r = await openWith({ t: 'resume', token });
  if (!r.ok && r.code === 'bad_token') setToken(null);
  return r;
}

export function login(name, pass) {
  return openWith({ t: 'login', name, pass });
}

export function register(name, pass) {
  return openWith({ t: 'register', name, pass });
}

export async function logout() {
  loggedIn = false; // pas de reconnexion automatique quand le serveur ferme la connexion
  if (net.status === 'online') await request('logout', {}, { timeout: 3000 });
  setToken(null);
  account.name = null;
  if (ws) {
    ws.onclose = null;
    ws.close();
    ws = null;
  }
  setStatus('offline');
}

// ---------- Requêtes ----------

let rid = 0;
const pending = new Map(); // requêtes envoyées, en attente de réponse
const queue = []; // requêtes en attente de connexion

// Envoie une requête et attend la réponse : { ok: true, …données } ou { ok: false, code, msg }.
// retry : la requête est renvoyée après une coupure (seulement pour celles que le serveur accepte deux fois, comme run_end).
export function request(t, data = {}, { timeout = 10000, retry = false } = {}) {
  return new Promise(resolve => {
    const r = { id: ++rid, t, data, retry, resolve };
    r.timer = setTimeout(() => {
      pending.delete(r.id);
      const i = queue.indexOf(r);
      if (i >= 0) queue.splice(i, 1);
      resolve({ ok: false, code: 'timeout', msg: 'Le serveur ne répond pas.' });
    }, timeout);
    if (net.status === 'online') send(r);
    else queue.push(r);
  });
}

// Message sans réponse attendue (commandes du duo) : perdu si la connexion est coupée
export function post(t, data = {}) {
  if (net.status === 'online' && ws && ws.readyState === 1) ws.send(JSON.stringify({ t, ...data }));
}

function send(r) {
  pending.set(r.id, r);
  ws.send(JSON.stringify({ t: r.t, rid: r.id, ...r.data }));
}

function flushQueue() {
  while (queue.length && net.status === 'online') send(queue.shift());
}

function failPending() {
  for (const r of pending.values()) {
    if (r.retry) queue.push(r);
    else {
      clearTimeout(r.timer);
      r.resolve({ ok: false, code: 'network', msg: 'Connexion au serveur perdue.' });
    }
  }
  pending.clear();
}

function onMessage(m) {
  if (m.t === 'res') {
    const r = pending.get(m.rid);
    if (!r) return;
    pending.delete(m.rid);
    clearTimeout(r.timer);
    r.resolve(m.ok ? { ok: true, ...m.data } : { ok: false, code: m.code, msg: m.msg });
  } else if (m.t === 'state') {
    setProgress(m.p);
    emit('state');
  } else emit(m.t, m);
}
