'use strict';
/* Test de regresión headless (Chrome + CDP, sin dependencias npm) de la app
 * independiente «Tutoría de tesis · Director». Requiere dist/index.html
 * (node build/build.js) y Chrome. CHROME env apunta al binario (en CI se usa
 * browser-actions/setup-chrome).
 * Uso: node build/test.js            # salida 0 = todo OK
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const ROOT = path.join(__dirname, '..');
const FILE = path.join(ROOT, 'dist', 'index.html');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

if (!fs.existsSync(FILE)) {
  console.error('No existe dist/index.html — ejecuta primero: node build/build.js');
  process.exit(2);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pass = 0, fail = 0;
function ok(m) { pass++; console.log('  ✔ ' + m); }
function bad(m) { fail++; console.log('  ✘ ' + m); }

async function httpGet(url) {
  const r = await fetch(url);
  return r.json();
}

class CDP {
  constructor() { this.ws = null; this.id = 0; this.pending = new Map(); this.events = []; this.waiters = []; }
  async connect(url) {
    this.ws = new WebSocket(url);
    await new Promise((res, rej) => { this.ws.onopen = () => res(); this.ws.onerror = () => rej(new Error('WS error')); });
    this.ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && this.pending.has(m.id)) {
        const p = this.pending.get(m.id); this.pending.delete(m.id);
        m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result);
      } else {
        this.events.push(m);
        this.waiters.slice().forEach((w) => { if (w.method === m.method) { clearTimeout(w.t); this.waiters = this.waiters.filter((x) => x !== w); w.resolve(m); } });
      }
    };
  }
  send(method, params) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params: params || {} }));
    });
  }
  waitFor(method, timeout) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => { this.waiters = this.waiters.filter((x) => x !== w); reject(new Error('timeout ' + method)); }, timeout);
      const w = { method, resolve, reject, t };
      this.waiters.push(w);
    });
  }
}

(async () => {
  const cp = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-sandbox',
    '--remote-debugging-port=0', '--user-data-dir=/tmp/tutest-' + Date.now(), 'about:blank'
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  const port = await new Promise(async (resolve, reject) => {
    let buf = '';
    cp.stderr.on('data', (c) => {
      buf += c;
      const m = /DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)/.exec(buf);
      if (m) resolve(parseInt(m[1], 10));
    });
    cp.once('exit', () => reject(new Error('Chrome salió antes de iniciar')));
    setTimeout(() => reject(new Error('timeout esperando puerto DevTools')), 20000);
  });

  const cdp = new CDP();
  try {
    let target = null;
    for (let i = 0; i < 40 && !target; i++) {
      try { const list = await httpGet('http://127.0.0.1:' + port + '/json/list'); target = (list || []).find((x) => x.type === 'page'); } catch (e) { }
      if (!target) await sleep(250);
    }
    if (!target) throw new Error('sin target de página');

    await cdp.connect(target.webSocketDebuggerUrl);
    await cdp.send('Runtime.enable');
    await cdp.send('Page.enable');
    await cdp.send('Log.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });

    const cargado = cdp.waitFor('Page.loadEventFired', 30000);
    await cdp.send('Page.navigate', { url: pathToFileURL(FILE).href });
    await cargado;
    await sleep(900);

    const ev = async function (expr) {
      const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true });
      if (r.exceptionDetails) return 'ERR';
      const v = r.result && r.result.value;
      return (typeof v === 'object' && v !== null && !Array.isArray(v)) ? JSON.stringify(v) : v;
    };
    const A = async (expr) => {
      const v = await ev(expr);
      return v === true ? ok(expr.slice(0, 72)) : bad(expr.slice(0, 72) + ' → ' + JSON.stringify(v));
    };

    console.log('[1] App carga como página independiente');
    await A("typeof A360Tutor==='object' && typeof A360Tutor.refresh==='function'");
    await A("document.title.indexOf('Tutoría de tesis')===0");
    await A("!!document.querySelector('.td-bar') && !!document.querySelector('.td-foot')");
    await A("document.querySelectorAll('#wtr .wtr-tabs button').length===5");
    await A("document.querySelectorAll('#wtr .wtr-ritmo').length===0 && document.querySelector('#wtr .wtr-hero h1').textContent.indexOf('Tutoría')>=0");

    console.log('[2] Motor por alumno (riesgo por fase, ritmo, modalidad)');
    await ev("window.__tid=A360Tutor.addAlumno({nombre:'Ana Prueba',lic:'Contaduría',modalidad:'Cuantitativa'});A360Tutor.marcar(window.__tid,'b0-0',true);A360Tutor.marcar(window.__tid,'b1-1',true);A360Tutor.marcar(window.__tid,'b3-0',true);");
    await A("A360Tutor.alumnos().length===1");
    await ev("window.__r=A360Tutor.riesgo(window.__tid)");
    await A("['bajo','medio','alto'].indexOf(window.__r.nivel)>=0 && window.__r.next && window.__r.next.key==='b0-1' && window.__r.fases.length===5");
    await ev("window.__id2=A360Tutor.addAlumno({nombre:'Marco Mixto',lic:'Admon',modalidad:'Mixta',ritmo:'acelerado'})");
    await A("A360Tutor.riesgo(window.__id2).ritmo==='acelerado' && A360Tutor.riesgo(window.__id2).fases.length===5");

    console.log('[3] Paneles, ruta y modalidad');
    await ev("A360Tutor.panel('ruta')");
    await A("document.querySelectorAll('#wtr .wtr-dets').length===15");
    await A("document.querySelectorAll('#wtr .wtr-it').length>=30");
    await A("document.querySelector('#wtr .wtr-plan') && document.querySelector('#wtr .wtr-plan').textContent.length>0");
    await ev("A360Tutor.panel('alumnos')");

    console.log('[4] Informe imprimible, CSV, matriz y evidencia');
    await ev("A360Tutor.abreInforme(window.__tid)");
    await A("document.querySelector('.wtr-modal') && document.querySelector('.wtr-modal').textContent.indexOf('Informe de avance')>=0 && document.querySelector('.wtr-modal').textContent.indexOf('Validación psicométrica')>=0 && document.querySelector('.wtr-modal').textContent.indexOf('por saturación')<0");
    await ev("document.querySelector('[data-act=printClose]').click()");
    await A("!document.querySelector('.wtr-modal')");
    await A("window.__cv=A360Tutor.csv();window.__cv.indexOf('Ana Prueba')>=0 && window.__cv.indexOf('Marco Mixto')>=0");
    await A("typeof A360Tutor.puertaScore(window.__tid,1).score==='number' && typeof A360Tutor.leerMatriz()==='number'");
    await ev("window.__ev=A360Tutor.setEvidencia(window.__tid,'b10-2',{f:'2026-08-20',u:'https://ev',n:'OK'});A360Tutor.panel('ruta')");
    await A("window.__ev.f==='2026-08-20' && A360Tutor.evidencia(window.__tid,'b10-2').u==='https://ev'");
    await A("document.querySelectorAll('#wtr .wtr-evid').length>=1");

    console.log('[5] Agenda, iCal y navegación standalone');
    await ev("(function(){A360Tutor.panel('citas');var b=document.querySelector('[data-act=addCita]');b.click();return 1})()");
    await A("A360Tutor.citas().length===1");
    await A("A360Tutor.ics().indexOf('Asesoría de tesis - Ana Prueba')>=0");
    await A("typeof A360Tutor.alertas==='function' && Array.isArray(A360Tutor.alertas())");
    await ev("window.__alertTxt='';A360Tutor.panel('alumnos');(function(){var b=document.querySelector('[data-act=fichaGuia]');window._orig=window.alert;window.alert=function(m){window.__alertTxt=String(m)};b.click();window.alert=window._orig;return 1})()");
    await A("window.__alertTxt.length>0 && window.__alertTxt.indexOf('guía')>=0");

    console.log('[6] Sin errores de consola');
    const errors = cdp.events.filter((m) =>
      m.method === 'Runtime.exceptionThrown' ||
      (m.method === 'Log.entryAdded' && (m.params.entry.level || m.params.entry) && m.params.entry.source === 'javascript' && (m.params.entry.level === 'error')) ||
      (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error'));
    errors.length === 0 ? ok('0 errores de javascript') : bad('errores de consola: ' + JSON.stringify(errors.map((e) => (e.params.exceptionDetails || {}).text || (e.params.entry || {}).text).filter(Boolean)));

    console.log('\nRESULTADO: ' + pass + ' OK · ' + fail + ' fallos');
    process.exitCode = fail ? 1 : 0;
  } finally {
    try { cdp.ws && cdp.ws.close(); } catch (e) { }
    cp.kill('SIGTERM');
  }
})().catch((e) => { console.error('ERROR:', e && e.stack || e); process.exit(1); });