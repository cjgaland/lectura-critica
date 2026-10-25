# CLAUDE.md — Lectura Crítica

> Documento común a todas las apps (lista, carpetas, identidad visual e intercambio de datos): `/Users/Trabajo/Desktop/Calidad&Seguridad/Ecosistema Calidad/ECOSISTEMA.md`.

Guía de referencia para el desarrollo asistido por IA. Léela antes de proponer cambios. Responder siempre en español y en lenguaje claro (el autor no es programador). El diseño completo, las decisiones del autor y el plan por entregas están en `/Users/Trabajo/Desktop/Calidad&Seguridad/Ecosistema Calidad/LecturaCritica/Diseño/DISEÑO_LECTURA_CRITICA.md` (léelo también al empezar una sesión).

## 1. Descripción
PWA estática (sin build, sin dependencias, sin CDN) para **leer críticamente un artículo** paso a paso y de forma didáctica: pregunta PICO y referencia, filtro de dos minutos, tipo de estudio, las tres preguntas de la lectura crítica (¿es válido?, ¿qué dice?, ¿me sirve?) con las **preguntas de eliminación primero**, y veredicto con semáforo y decisión (aplicar · esperar · descartar). Idea de Carlos. Acompaña al capítulo 26 de la Guía («Leer un artículo en diez minutos»).

Es una **herramienta** del ecosistema (funciona sola). Hermana de Tamaño Muestral, Indicadores, Auditorías, AMFE, Flujograma, DAFO · CAME, Mapa de Riesgos y Rondas de Seguridad (enlazadas en «Acerca de»). En la portada enlaza Tamaño Muestral, el Normalizador Bibliográfico y el portal.

Autoría (idéntica en el pie de index.html, «Acerca de» y el README; orden alfabético, sin centro de trabajo): Carlos J. Galán Doval (Médico de Familia · Técnico en Calidad y Seguridad del Paciente) y Rafael J. Romero de Castilla Gil (Médico de Familia · Responsable del Área de Calidad y Seguridad del Paciente), Área de Gestión Sanitaria Sur de Córdoba · Andalucía.

## 2. Derechos de las plantillas (importante)
Las plantillas CASPe no tienen licencia abierta. Decisión del autor (2026-10-25): **preguntas y pistas propias**, escritas con nuestras palabras sobre los mismos criterios; **se cita CASPe** en cada plantilla (`cita`, con la forma que pide CASPe) y **se enlaza** su original (`url`). **Nunca copiar el texto de las plantillas de `../Apoyo/`.** Hay una carta para pedir permiso (`../Diseño/CARTA_CASPe.md`); si CASPe lo concede, se puede acercar el texto y decirlo en «Acerca de». El test «Texto propio (ec-1)» comprueba que la pregunta 1 del ensayo no es la frase original.

## 3. Arquitectura
Base copiada de `AMFE/Aplicación` (que viene de Auditorías). Archivos:
- `index.html` — esqueleto, cabecera, nav, modales (bienvenida, Acerca de con «Fuentes» y las citas de las 8 plantillas, novedades, confirmar), `<input type=file>` para importar. Script inline que fija `data-tema` antes de pintar.
- `styles.css` — líneas 1-1104 copiadas de AMFE con el **acento rosa frambuesa** (la variable sigue llamándose `--cyan`: claro `#be185d`, oscuro `#f472b6`, texto sobre acento en oscuro `#2a0616`, impreso `#9d174d`). Bloque final «Componentes propios de Lectura Crítica»: línea de 7 pasos, entradas de la portada, preguntas (`.preg`, `.preg--elim`, `.r-si/.r-no/.r-nose`), respuestas `.seg--resp`, aviso de parada `.parada`, semáforo (`.luz`, `.sem-bloque`, `.sem-card`), decisión (`.dec-card`, `.propuesta`), listas de desenlaces, confusores y acciones, árbol, plantillas.
- `plantillas.js` — solo datos (`window.Plantillas`): `PLANTILLAS` (8, con `id`, `nombre`, `version`, `que`, `cita`, `url` y `bloques` validez/resultados/aplicabilidad), `BLOQUES`, `ARBOL` (9 nodos), `FINALES` (`antesdespues`, `sinplantilla`), `ARBOL_DUDA`, `URL_CASPE`. Pregunta: `{ id (fijo: ec-1…, rs-, dx-, co-, cc-, cu-, ee-, rp-), texto, pistas, elim, resp: "snd"|"sn"|"abierta", calc, lista: "desenlaces"|"confusores"|null, parada }`. **Si se reescribe el texto de una plantilla, el id no cambia y sube su `version`.**
- `logic.js` — funciones PURAS (`window.Logica` / `module.exports`): `PASOS` (7), plantilla y preguntas, respuestas (`ponerRespuesta`, `cambiarPlantilla` guarda en `aparte` las de otra plantilla), `eliminacion` (falla/dudosa/supera/pendiente), `paradas`, `cerradaPronto`, `semaforoPropuesto` y `semaforo` (el manual manda), `decisionPropuesta`, `recorrerArbol`, `pareceDatoPaciente` (solo en lo que escribe la persona, nunca en la referencia), `preguntaSugerida`, `mensajeSugerido`, `avisos(l, paso)`, `progreso`, `pasoPendiente`, `siguientePaso`, saneado (`ESQ`, `sanear` con la regla `{mapa}` para las respuestas por id de pregunta) y `fusionar`.
- `app.js` — UI: datos, enrutado, inicio, mis lecturas (buscador), lectura en 7 pasos (`RENDER`), árbol, plantillas, copia/importar, tema, modales, SW.
- `sw.js` — network-first; sin `skipWaiting` al instalar; borra solo cachés `lecturacritica-`.
- `xlsx.js`, `docx.js` — copiados de AMFE (el `docx.js` con el color frambuesa). Aún no se usan: la ficha en Word, PDF y Excel es de la entrega 3.
- `tests/logic.test.mjs` — `node tests/logic.test.mjs` (144 pruebas): cuentas de preguntas y de eliminación de cada plantilla (las del capítulo 26), ids, citas, árbol, semáforo, decisión, parada, cambio de plantilla, filtro, protección de datos, saneado y fusión.

### Reglas del semáforo y la decisión (Diseño, 4.3)
- Validez: rojo si falla alguna de eliminación; ámbar si alguna de eliminación es «No se puede saber», o hay un «No» en las de detalle, o 3 o más «No se puede saber»; verde si todo está contestado y bien; sin color si falta alguna.
- Resultados: rojo si se contesta «No» a una pregunta con `parada` (casos y controles, 9); con preguntas Sí/No (cualitativo, económica…) como validez; si solo hay abiertas, **lo elige la persona** (en el paso 5 o en el 7).
- Aplicabilidad: rojo si «No» en una pregunta de `CLAVE_APLICA`; ámbar si otro «No» o algún «No se puede saber».
- Decisión: descartar si el filtro dice que no responde, si falla la eliminación o si validez o resultados están en rojo; esperar si aplicabilidad roja o algún ámbar; aplicar si todo verde. Siempre decide la persona.

### Rutas (hash)
`#/` inicio · `#/lecturas` · `#/lecturas/nueva` (crea un borrador y redirige) · `#/lectura/<id>` (va al primer paso pendiente) · `#/lectura/<id>/<1-7>` · `#/tipo` (árbol; `?para=<id>` aplica la plantilla a esa lectura) · `#/plantillas` y `#/plantillas/<id>`.

### Datos
- `localStorage["lecturacritica-datos"]` = `{ app: "lecturacritica", v, ultimaCopia, lecturas: [] }`. Guardado con 250 ms de retardo y al salir (`pagehide`).
- Al cargar e importar se pasa SIEMPRE por `sanearDatos`. **Al añadir un campo nuevo**: añadirlo a la fábrica y a `ESQ` en logic.js (si no, el saneado lo borra al recargar).
- Lectura: ver Diseño, 6.2. Las respuestas viven en `respuestas[idPregunta] = { valor: ""|"si"|"no"|"nose", nota }`; una respuesta vacía se borra. Las abiertas guardan el resultado en `nota`.
- Borradores: una lectura nueva vive en `borradores` hasta que se escribe algo (`esVacia`).
- Copia `.json` (en iOS, Compartir) y aviso en inicio si no hay copia o tiene más de 30 días. Importar: añadir (fusiona por id, gana la más reciente) o sustituir (doble confirmación).
- El paquete de intercambio `lecturacritica-lecturas` v1 (Diseño, 6.4) es de la entrega 3: aún no se escribe.
- Otras claves: `lecturacritica-tema`, `lecturacritica-bienvenida-vista`, `lecturacritica-version-vista`, `lecturacritica-facil-abierto`.
- Enlaces en la UI: campos con `data-k` (ruta dentro de la lectura); respuestas `data-q` + `data-f` (nota) o `data-act="resp"` + `data-v`; desenlaces `data-des`, confusores `data-con`, acciones `data-acc` (siempre con `data-f`).

## 4. Entorno y pruebas
- Node v26 (Homebrew). `node tests/logic.test.mjs`.
- Servir en local desde Bash en segundo plano: `cd "/Users/Trabajo/Desktop/Calidad&Seguridad/Ecosistema Calidad/LecturaCritica/Aplicación" && python3 -m http.server 8775`, y abrir la vista previa `app-lecturacritica` de `/Users/Trabajo/Desktop/Calidad&Seguridad/Ecosistema Calidad/LecturaCritica/.claude/launch.json` (solo URL). El navegador integrado no admite service workers.
- Revisar siempre en escritorio y en móvil (360 px): sin scroll horizontal (`document.documentElement.scrollWidth === 360`), y en modo oscuro y claro.
- Icono: `icon-512.svg` (hoja con líneas y lupa con marca de verificación) → PNG con `qlmanage -t -s 512 -o <carpeta> icon-512.svg` y tamaños con `sips -z`.
- Al terminar de probar, borrar del navegador los datos de prueba (`lecturacritica-datos`).

## 5. Versiones
- `APP_VERSION` y `NOVEDADES` al principio de `app.js` (formato AAAA.NN, la más reciente arriba). Al cambiar: `?v=` de index.html y `CACHE_NAME` de sw.js.

## 6. Copias de seguridad locales
```
Desktop/Calidad&Seguridad/Ecosistema Calidad/LecturaCritica/
├── Apoyo/        ← plantillas CASPe y Excel originales (solo lectura, fuera de git; no se copian)
├── Aplicación/   ← la app (este repositorio git, lo que se publica)
├── Backup/       ← 5 copias más recientes, fuera del repositorio
└── Diseño/       ← DISEÑO_LECTURA_CRITICA.md y CARTA_CASPe.md
```
`bash ~/.claude/skills/app-copia_seguridad/scripts/copia_seguridad.sh --root "/Users/Trabajo/Desktop/Calidad&Seguridad/Ecosistema Calidad/LecturaCritica" --name LecturaCritica --exclude "Apoyo" --exclude "*.docx" --exclude .claude` (copia `Aplicación/` y `Diseño/`). Hacer una antes de cada publicación.

## 7. Publicación
Sin publicar. Repositorio previsto `cjgaland/lectura-critica` (GitHub Pages desde `main`, raíz) → https://cjgaland.github.io/lectura-critica/. **Publicar solo cuando el autor lo pida.** Al publicar, cada cosa en su sesión: enlazarla desde el portal y las hermanas, y actualizar `ECOSISTEMA.md` y la guía (capítulo 26).

## 8. Estado y pendiente (plan por entregas en el documento de diseño)
- **Entrega 1 (hecha, 2026-10-25, v2026.01, sin publicar)**: esqueleto e identidad (frambuesa, icono); datos y copias; árbol «¿Qué tipo de estudio tengo?»; **las 8 plantillas** con preguntas y pistas propias (pendientes de revisión por Carlos); lectura guiada en 7 pasos con filtro de dos minutos, preguntas de eliminación y aviso de parada, desenlaces con importancia GRADE y lista de confusores; veredicto con semáforo y decisión propuesta; Mis lecturas con buscador; página de plantillas con su cita y enlace a CASPe; 144 tests.
- **Entrega 2**: calculadoras de tratamiento y diagnóstico (integradas y sueltas), Fagan, coste-efectividad incremental, oráculo con los Excel (`Diseño/oraculo/oraculo.py` → `tests/oraculo.json`), detector de trampas y traductor con pictograma. Las preguntas con `calc` muestran hoy «llegará en la próxima versión».
- **Entrega 3**: ficha de la lectura y de la sesión (Word, PDF), plantilla en blanco, Excel; Aprende, Ponte a prueba, glosario; ejemplo de Urgencias y minicasos; club de lectura con votos; PubMed; intercambio v1; plantilla propia antes-después (mejora L).
