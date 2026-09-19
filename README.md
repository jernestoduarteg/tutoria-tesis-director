# 🎓 Tutoría de tesis · Director (FCA-UAS)

**Seguimiento inteligente del tesista, de la idea a la defensa.** Aplicación web
autocontenida en **un solo archivo HTML** (sin servidor, sin dependencias, sin
conexión): todo se guarda en el navegador (localStorage).

> Módulo independiente del curso **«Taller de Metodología de la Investigación
> 160 h · Aula 360 · FCA-UAS»**. La misma herramienta está integrada como
> pestaña «🎓 Tutoría» en el todo-en-uno del curso; aquí se distribuye como
> **proyecto aparte** para usarla directamente.

## Cómo usarla

- **Directo:** abre `dist/Tutoria_Tesis_Director.html` en cualquier navegador
  (Chrome, Edge, Safari, Firefox). Sin instalación.
- **En línea (GitHub Pages):** <https://jernestoduarteg.github.io/tutoria-tesis-director/>
  (una vez desplegado; ver *GitHub Pages* más abajo).
- Recomendado: pulsa **«✨ Cargar ejemplo»** para explorar, y define tu perfil y la
  fecha de inicio del semestre en **Ajustes**. Haz **respaldo periódico
  (Ajustes → «⬇ Respaldo JSON»)**.

## Qué hace

| | |
|---|---|
| 👥 **Cartera** | Tesistas con tema, licenciatura, modalidad y ritmo; % de avance en vivo. **Edita** un tesista en cualquier momento y **busca/filtra** la cartera al instante. |
| 🗺 **Ruta idea → defensa** | 15 bloques, 38+ entregables (según modalidad) con su «definición de hecho» (estándar verificable). |
| 🚦 **Riesgo automático** | Bajo / medio / alto con causas; **riesgo por fase** y **ritmo calibral** por tesista (⚡ acelerado / ● normal / 🐢 rezagado). |
| 🚪 **4 Puertas** | Checklist ponderada (score 0–100) en las semanas 3, 7, 13 y 15. |
| 🗓 **Plan semanal** | Tareas de la semana actual + pendientes vencidas, por tesista. |
| 🧩 **Congruencia viva** | Lee la matriz (15 celdas) que el tesista llena en la guía, con **editor de 15 celdas integrado** para la app independiente, y marca la Puerta 2 con un clic. |
| 📎 **Evidencia** | Fecha real de entrega, enlace (Drive/archivo) y nota del director por entregable, con historial. |
| 🖨 **Informe PDF** | Hoja imprimible/exportable por tesista (datos, avance, puertas, entregables, bitácora, firma). |
| ⬇ **Concentrado CSV** | Tabla de la cohorte para la Unidad Académica (Excel). |
| 📅 **Agenda e iCal** | Citas con estado + exportación a Google/Outlook. |
| 💾 **Respaldo JSON** | Exportar/importar todo a otro navegador o equipo. |

Diseñado para el **director de tesis** de Contaduría y Administración
(FCA · UAS), sin necesidad de cuentas, internet o servidores.

## Reproducir y verificar

```bash
npm run build      # dist/index.html + dist/Tutoria_Tesis_Director.html (HTML único estampado)
npm run validate   # 30 comprobaciones + humo de ejecución (sin dependencias)
npm test           # regresión headless (Chrome + CDP): 22 OK · 0 fallos
```

- `npm run validate` no necesita Chrome (ejecuta el módulo en un DOM simulado con `node:vm`).
- `npm test` lanza Chrome en modo headless (`CHROME` apuntando al binario; en CI lo prepara `browser-actions/setup-chrome`).
- CI (`ci.yml`) reconstruye, valida y ejecuta los tests con `git diff --exit-code`.

## Estructura

```
└── Tutoria_Tesis_Director/
    ├── src/tutoria.html         Fuente de la app (módulo único)
    ├── build/
    │   ├── build.js              Stampa versión/fecha → dist/
    │   ├── validate.js          30 comprobaciones + humo en VM
    │   └── test.js               Regresión headless (Chrome + CDP)
    ├── dist/                     Artifacto: index.html (Pages) y Tutoria_Tesis_Director.html
    ├── .github/workflows/        CI + despliegue a GitHub Pages
    └── package.json
```

Nota: `dist/` se regenera completo en cada release; el HTML resultante es
autocontenido y no depende de `src/` ni de las herramientas de build a la hora
de ejecutarse.

## GitHub Pages

El despliegue se hace con el workflow `deploy-pages.yml` (artifacts de
Pages). Condiciones:

- Settings → Pages → **Source: GitHub Actions**.
- Tras el primer despliegue, la app queda en
  `https://<usuario>.github.io/tutoria-tesis-director/`
  y `.../Tutoria_Tesis_Director.html` como copia con nombre explícito.

## Datos y privacidad

- **Sin backend**: los datos personales de los tesistas viven solo en el navegador
  del director (`localStorage`). El repositorio no recibe ni almacena datos de alumnos.
- Usa **PIN o copias de seguridad** si compartes el equipo; en Ajustes se puede
  restablecer todo.

## Licencia

**CC BY-NC-SA 4.0** · © 2026 Jesús Ernesto Duarte Gastélum · Facultad de
Contaduría y Administración, Universidad Autónoma de Sinaloa.
Puedes compartir y adaptar el material con atribución, sin uso comercial y
compartiendo las adaptaciones bajo la misma licencia.
Resumen: <https://creativecommons.org/licenses/by-nc-sa/4.0/>

## Créditos y curso

Herramienta derivada del **«Taller de Metodología de la Investigación 160 h ·
Aula 360 · FCA-UAS»** (todo-en-uno v7.1 con deck, taller, guía, tutoría,
cronograma y avance). Repositorio del curso:
<https://github.com/jernestoduarteg/taller-metodologia-investigacion-160h>

Dudas y sugerencias: <ernesto.duarte@uas.edu.mx>