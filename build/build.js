'use strict';
/* Build de la app autocontenida «Tutoría de tesis · Director».
 * Lee src/tutoria.html, estampa versión/fecha y escribe dist/index.html
 * (para GitHub Pages) y dist/Tutoria_Tesis_Director.html (para distribución
 * como archivo único). El resultado es un solo HTML, sin dependencias.
 * Uso: node build/build.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src', 'tutoria.html');
const OUT_A = path.join(ROOT, 'dist', 'index.html');
const OUT_B = path.join(ROOT, 'dist', 'Tutoria_Tesis_Director.html');
const { version } = require(path.join(ROOT, 'package.json'));

if (!fs.existsSync(SRC)) {
  console.error('Falta la fuente:', SRC);
  process.exit(2);
}

let html = fs.readFileSync(SRC, 'utf8');
const fecha = new Date().toISOString().slice(0, 10);
html = html
  .replace(/__VER__/g, version)
  .replace(/>__FECHA__</g, '>' + fecha + '<')
  .replace(/<!--( !)Build-stamp-->/g, '');

html = '<!-- Tutoría de tesis · Director · FCA-UAS\n' +
  '   v' + version + ' · ' + fecha + ' · app web autocontenida (HTML único, sin servidor ni dependencias).\n' +
  '   Licencia CC BY-NC-SA 4.0 · © 2026 Jesús Ernesto Duarte Gastélum (FCA-UAS).\n' +
  '   Opens directa: abre dist/index.html o Tutoria_Tesis_Director.html. -->' + html;

if (html.indexOf('v' + version + '</span>'.replace('__VER__')) < 0 && html.indexOf('v' + version) < 0) {
  console.error('La estampa de versión no quedó aplicada');
  process.exit(2);
}

for (const [out, name] of [[OUT_A, 'index.html'], [OUT_B, 'Tutoria_Tesis_Director.html']]) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  console.log('Escrito:', path.relative(ROOT, out), '(' + Math.round(html.length / 1024) + ' KB)');
}

const checks = {
  'sin scripts remotos': !/src=["']https?:/i.test(html),
  'sin enlaces ../ ': !/href=["']\.\.\//.test(html),
  'versión estampada': html.indexOf('v' + version) >= 0,
  'módulo A360Tutor expuesto': html.includes('window.A360Tutor ='),
  '15 bloques con entregables verificables': (html.match(/c: '[^']+'/g) || []).length >= 38,
  '4 puertas con requisitos': (html.match(/nombre: 'Puerta \d ·/g) || []).length === 4,
  'cronograma de 16 semanas': (html.match(/s: (\d+), b: \[/g) || []).length === 16
};
let fail = 0;
for (const [k, v] of Object.entries(checks)) {
  console.log((v ? '  ✔ ' : '  ✘ ') + k);
  if (!v) fail++;
  else if (['15 bloques con entregables verificables', '4 puertas con requisitos', 'cronograma de 16 semanas'].indexOf(k) >= 0) {
    const n = html.match(k === '15 bloques con entregables verificables' ? /c: '[^']+'/g : k === '4 puertas con requisitos' ? /nombre: 'Puerta \d ·/g : /s: (\d+), b: \[/g) || [];
    console.log('      → ' + n.length);
  }
}
process.exitCode = fail ? 1 : 0;