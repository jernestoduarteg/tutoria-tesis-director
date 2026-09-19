'use strict';
/* Validación de la app «Tutoría de tesis · Director» (autocontenida).
 * Comprobaciones estáticas sobre dist/index.html + humo de ejecución en un
 * DOM simulado con node:vm (sin dependencias). Uso: node build/validate.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FILE = path.join(ROOT, 'dist', 'index.html');
if (!fs.existsSync(FILE)) {
  console.error('Falta dist/index.html — ejecuta antes: node build/build.js');
  process.exit(2);
}
const s = fs.readFileSync(FILE, 'utf8');

const ok = (m) => console.log('  ✔ ' + m);
const bad = (m) => { console.log('  ✘ ' + m); process.exitCode = 1; };
let total = 0;
function vue(name, cond) { total++; cond ? ok(name) : bad(name); }

console.log('[1] Documento autocontenido');
vue('es un HTML con lang=es y viewport', /<html lang="es">/.test(s) && /name="viewport"/.test(s));
vue('sin scripts ni CSS remotos (100% offline)', !/<script[^>]+src=/i.test(s) && !/<link[^>]*rel=["']stylesheet["']/i.test(s) && !/@import/i.test(s) && !/fetch\(/i.test(s));
vue('sin rutas ../ hacia el curso', !/href=["']\.\.\//.test(s) && !/src=["']\.\.\//.test(s));
vue('favicon propio (emoji 🎓)', s.includes("font-size='90'%3E🎓"));
vue('versión estampada por el build', /v\d+\.\d+\.\d+/.test(s) && s.includes('class="td-ver"'));
vue('barra de marca y pie de página', s.includes('class="td-bar"') && s.includes('class="td-foot"'));
vue('modo independiente STANDALONE activo', s.includes('STANDALONE = true'));
vue('navegación informativa en standalone', s.includes('Esta versión independiente no incluye las diapositivas'));

console.log('[2] Núcleo del módulo');
vue('módulo A360Tutor expuesto', s.includes('window.A360Tutor ='));
vue('5 paneles (resumen/alumnos/ruta/cronograma/citas)', s.includes("PANELES = ['resumen', 'alumnos', 'ruta', 'cronograma', 'citas']"));
vue('15 bloques con entregables verificables', (s.match(/c: '[^']+'/g) || []).length >= 38);
vue('4 puertas con requisitos', (s.match(/nombre: 'Puerta \d ·/g) || []).length === 4);
vue('cronograma de 16 semanas', (s.match(/s: (\d+), b: \[/g) || []).length === 16);
vue('motor de riesgo automático', s.includes('function riesgo(id)') && s.includes("nivel = 'alto'"));
vue('siguiente acción calculada', s.includes('nxt = { key: k'));
vue('riesgo por fase y ritmo por tesista', s.includes('var RITMO =') && s.includes('function expectedPctFor') && s.includes("'rezagado'") && s.includes('fases: fases'));
vue('entregables por modalidad (cuanti/cuali/mixta)', s.includes('var MOD =') && /Mixta: \{/.test(s));
vue('rúbrica ponderada por puerta (score)', s.includes('function puertaScore') && s.includes('wtr-escore'));
vue('plan semanal automático', s.includes('function planSemanal') && s.includes('Plan de esta semana'));
vue('congruencia viva con la matriz de la guía', s.includes('function leerMatriz') && s.includes('a360_mz_') && s.includes('data-act="synMZ"'));
vue('evidencia por entregable (fecha/enlace/nota)', s.includes('function saveEvidencia') && s.includes('wtr-ev-f') && s.includes('wtr-ev-u'));
vue('informe imprimible por tesista', s.includes('function informeHTML') && s.includes('wtr-modal') && s.includes('data-act="print"'));
vue('concentrado de cohorte CSV', s.includes('function csvCohorte') && s.includes('data-act="csv"'));
vue('agenda de citas', s.includes('function renderCitas(') && s.includes('data-act="addCita"'));
vue('exportación iCal', s.includes('BEGIN:VCALENDAR') && s.includes('tutor_tesis_'));
vue('respaldo y restauración JSON', s.includes('exportJSON') && s.includes('importJSON'));
vue('botón cargar ejemplo', s.includes('data-act="demo"'));

console.log('[3] Impresión e informe');
vue('reglas @media print', s.includes('@media print') && s.includes('.td-bar,.td-foot{display:none}'));
vue('modo de impresión de informe (wtr-pr)', s.includes('body.wtr-pr') && s.includes('wtr-modal-foot{display:none}'));
vue('cierre del informe con Escape', s.includes("ev.key === 'Escape'"));

console.log('[4] Humo de ejecución (DOM simulado)');
try {
  const vm = require('vm');
  const script = s.split('<script>').pop().split('</script>')[0];
  function cl() { return { add() { }, remove() { }, toggle() { return false; }, contains() { return false; } }; }
  function mkEl() {
    const e = { style: { setProperty() { } }, dataset: {}, classList: cl(), setAttribute() { }, getAttribute() { return null; }, appendChild(c) { return c; }, insertAdjacentHTML() { }, addEventListener() { }, querySelector() { return mkEl(); }, querySelectorAll() { return []; }, closest() { return null; }, focus() { }, select() { }, scrollIntoView() { }, value: '', options: { length: 0 }, closed: false };
    let h = '';
    Object.defineProperty(e, 'innerHTML', { get() { return h; }, set(v) { h = String(v); } });
    Object.defineProperty(e, 'textContent', { get() { return h.replace(/<[^>]*>/g, ''); }, set() { } });
    return e;
  }
  const byId = {};
  const doc = { body: mkEl(), documentElement: mkEl(), getElementById(id) { return byId[id] || (byId[id] = mkEl()); }, querySelector() { return mkEl(); }, querySelectorAll() { return []; }, createElement() { return mkEl(); }, addEventListener() { }, get activeElement() { return mkEl(); } };
  const store = {};
  const LS = { getItem(k) { return k in store ? store[k] : null; }, setItem(k, v) { store[k] = String(v); }, removeItem(k) { delete store[k]; }, key(i) { return Object.keys(store)[i]; }, get length() { return Object.keys(store).length; } };
  const win = { document: doc, localStorage: LS, location: { hash: '' }, history: { replaceState() { } }, addEventListener() { }, matchMedia() { return { matches: false }; }, getSelection() { return ''; }, print() { }, open() { return null; }, scrollTo() { }, alert() { }, confirm() { return true; }, URL: { createObjectURL() { return 'blob:x'; }, revokeObjectURL() { } } };
  win.window = win;
  const sb = { window: win, document: doc, localStorage: LS, location: win.location, history: win.history, console, setTimeout, clearTimeout, setInterval, clearInterval, Math, JSON, Date, RegExp, Number, String, Array, Object, Symbol, isNaN, parseInt, parseFloat, Error, TypeError, Intl, confirm() { return true; }, alert() { }, Blob: function () { this.type = ''; } };
  sb.globalThis = sb;
  vm.createContext(sb);
  vm.runInContext(script, sb);
  const T = win.A360Tutor;
  if (!T) throw new Error('A360Tutor no se creó');
  const id1 = T.addAlumno({ nombre: 'Prueba Uno', lic: 'Contaduría', tema: 'Prueba', modalidad: 'Cuantitativa' });
  T.marcar(id1, 'b0-0', true); T.marcar(id1, 'b1-1', true); T.marcar(id1, 'b3-1', true);
  T.setConf({ inicio: '2026-08-17' });
  const r = T.riesgo(id1);
  const ps = T.planSemanal(id1);
  const sc = T.puertaScore(id1, 1);
  const csv = T.csv();
  const inf = T.informe(id1);
  const mz = T.leerMatriz();
  const id2 = T.addAlumno({ nombre: 'Prueba Mixta', lic: 'Admon', tema: 'X', modalidad: 'Mixta', ritmo: 'acelerado' });
  const r2 = T.riesgo(id2);
  let got = '';
  got += (typeof r === 'object' && r.nivel) ? '.' : 'X';
  got += (r.next && r.next.key === 'b0-1') ? '.' : 'X';
  got += T.alumnos().length === 2 ? '.' : 'X';
  got += T.ics().indexOf('BEGIN:VCALENDAR') === 0 ? '.' : 'X';
  got += (ps && typeof ps.sem === 'number' && Array.isArray(ps.tareas)) ? '.' : 'X';
  got += (sc && sc.score >= 0 && sc.tot === 5) ? '.' : 'X';
  got += (typeof csv === 'string' && csv.indexOf('Prueba Uno') >= 0) ? '.' : 'X';
  got += (inf.indexOf('Informe de avance') >= 0) ? '.' : 'X';
  got += (typeof mz === 'number' && mz >= 0) ? '.' : 'X';
  got += (r2.ritmo === 'acelerado' && r2.fases.length === 5) ? '.' : 'X';
  T.marcar(id1, 'b10-2', true);
  got += T.bpct(id1) > 0 ? '.' : 'X';
  got.length === 11 && got.indexOf('X') < 0
    ? ok('alumno, checklist, riesgo por fase+ritmo, plan semanal, score, CSV, informe, matriz y modalidad responden (riesgo=' + r.nivel + ', %=' + T.bpct(id1) + ')')
    : bad('humo → ' + got);
} catch (e) { bad('humo de tutoría: ' + (e && e.message)); }

console.log('\n' + (process.exitCode ? 'RESULTADO: ' + total + ' comprobaciones, con fallos ✘' : 'RESULTADO: ' + total + '/' + total + ' comprobaciones OK ✔'));