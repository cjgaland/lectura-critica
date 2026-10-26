// ============================================================
//  app.js — UI y estado · Lectura Crítica
//  Las reglas viven en logic.js (funciones puras) y las plantillas y el árbol
//  de tipos de estudio en plantillas.js. Aquí: datos en localStorage, enrutado
//  por hash, inicio, mis lecturas, lectura guiada en 7 pasos, árbol «¿Qué tipo
//  de estudio tengo?», plantillas, copias de seguridad.
//  Base copiada de AMFE (mismos patrones: data-k, refrescar sin perder el foco,
//  repintar conservando el scroll, borradores).
// ============================================================
(function () {
  "use strict";
  const L = window.Logica, PL = window.Plantillas, CA = window.Calculos, C = window.Contenido;

  // ---------- Versión y novedades ----------
  // Al publicar cambios: añadir una entrada AL PRINCIPIO de NOVEDADES, poner su versión en los ?v= de index.html, en
  // APP_VERSION y subir CACHE_NAME en sw.js. Formato de versión: AAAA.NN.
  const APP_VERSION = "2026.05";
  const NOVEDADES = [
    { version: "2026.05", fecha: "Octubre 2026", titulo: "Tus lecturas, en las demás apps", cambios: [
      "AMFE, DAFO · CAME, Auditorías e Indicadores ya pueden traer tus lecturas con su botón «Traer de Lectura Crítica»: la referencia, el resultado principal, el mensaje y tu decisión, como evidencia de una acción de mejora, una fuente del DAFO, el origen y el criterio de una auditoría o el criterio de un indicador.",
      "Corregido el texto del metaanálisis: ahora dice «Efecto combinado (riesgo relativo)» en lugar de «Riesgo relativo combinada»."] },
    { version: "2026.04", fecha: "Octubre 2026", titulo: "Metaanálisis, supervivencia, umbrales y concordancia", cambios: [
      "Metaanálisis con diagrama de bosque: odds ratio, riesgo relativo, diferencia de riesgos, hazard ratio y diferencias de medias (también estandarizadas), con efectos fijos (Mantel-Haenszel, Peto o inverso de la varianza) y aleatorios (DerSimonian-Laird), heterogeneidad (Q, I² con su intervalo y τ²), gráfico en embudo y prueba de Egger.",
      "Supervivencia: el hazard ratio de un estudio, también cuando el artículo solo da la p del log-rank, los eventos observados y esperados o las medianas (métodos de Parmar).",
      "Umbrales de decisión: ¿hacer la prueba, tratar sin ella o ninguna de las dos?",
      "Concordancia entre observadores: índice kappa, simple y ponderado.",
      "La revisión sistemática ya tiene su calculadora, y el ejemplo de Urgencias, su diagrama de bosque.",
      "Arreglado: en las calculadoras sueltas, escribir en una casilla podía dar un error; y «1» en una casilla «en %» se leía como 100 %."] },
    { version: "2026.03", fecha: "Octubre 2026", titulo: "Fichas, sesiones, club de lectura y Aprende", cambios: [
      "Ficha de la lectura en Word y PDF: la pregunta, cada respuesta, los resultados con su dibujo o su nomograma, el semáforo y la decisión. Y un Excel con todas tus lecturas.",
      "Plantillas en blanco para imprimir y contestar a lápiz en el club de lectura.",
      "Sesiones: junta varias lecturas sobre la misma pregunta y saca una conclusión conjunta, con su ficha.",
      "Club de lectura: cada asistente vota Sí, No o No se puede saber; la app enseña el reparto, avisa si hay discrepancia y propone la mayoría. Con modo proyector.",
      "Nueva plantilla propia para estudios antes-después o de mejora, el diseño más frecuente en calidad.",
      "Buscar en PubMed con tu pregunta PICO, y un sitio para pegar el resumen del artículo.",
      "Aprende (10 temas), Ponte a prueba (26 preguntas, adivina el tipo de estudio y calcula) y un glosario de 65 términos.",
      "Ejemplo completo de Urgencias (una sesión con siete artículos ficticios) y siete minicasos para practicar."] },
    { version: "2026.02", fecha: "Octubre 2026", titulo: "Calculadoras de resultados", cambios: [
      "Calculadora de tratamiento: riesgos, riesgo relativo, reducción relativa y absoluta, NNT (para beneficiar o para dañar, también cuando el intervalo cruza el «sin efecto») y odds ratio, con sus intervalos de confianza.",
      "¿Y si los perdidos hubieran tenido el evento? Análisis de sensibilidad de las pérdidas con tres supuestos, y NNT para tu paciente según su riesgo.",
      "Calculadora de diagnóstico: sensibilidad, especificidad, valores predictivos, cocientes de probabilidad y probabilidad antes y después de la prueba, con el nomograma de Fagan y tu umbral de acción.",
      "También: pruebas con varios niveles, probabilidad tras la prueba desde la sensibilidad y la especificidad, odds ratio de casos y controles, y coste-efectividad incremental.",
      "Las calculadoras aparecen en la pregunta de la plantilla donde se necesitan, proponen el color del semáforo de «¿Qué dice?» y escriben el resultado en lenguaje llano, con un dibujo de 100 personas.",
      "Avisos de las trampas más habituales: reducción relativa grande con absoluta pequeña, intervalos que incluyen el «sin efecto», pérdidas, odds ratio frente a riesgo relativo, valor predictivo y prevalencia.",
      "Comprobadas con las calculadoras Excel de CASPe: dan los mismos resultados (salvo errores de las hojas, que se corrigen)."] },
    { version: "2026.01", fecha: "Octubre 2026", titulo: "Primera versión: leer un artículo con método", cambios: [
      "Lectura guiada en 7 pasos: tu pregunta (PICO) y el artículo, filtro de dos minutos, tipo de estudio, ¿es válido?, ¿qué dice?, ¿me sirve? y veredicto.",
      "Ocho plantillas con preguntas y pistas propias: ensayo clínico, revisión sistemática, diagnóstico, cohortes, casos y controles, cualitativo, evaluación económica y reglas de predicción clínica.",
      "Las preguntas de eliminación van primero: si el estudio falla en ellas, la app te avisa de que no merece la pena seguir.",
      "«¿Qué tipo de estudio tengo?»: unas preguntas sencillas que te llevan a la plantilla adecuada.",
      "Veredicto con semáforo por bloque y una decisión propuesta: aplicar, esperar o descartar.",
      "Mis lecturas y copia de seguridad."] }
  ];

  // ---------- Utilidades ----------
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const view = $("#view");
  const hoy = () => new Date().toISOString();
  const fechaCorta = iso => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleDateString("es-ES"); };
  const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const lleno = L.lleno, plural = L.plural;
  const clon = o => JSON.parse(JSON.stringify(o));
  const leer = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const escribir = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };

  // ---------- Datos (solo en este dispositivo) ----------
  const KEY_DATOS = "lecturacritica-datos", KEY_INTERCAMBIO = "lecturacritica-intercambio";
  const datosUsuario = { lecturas: [], sesiones: [], ultimaCopia: null };
  (function cargar() {
    const crudo = leer(KEY_DATOS); if (!crudo) return;
    try {
      const o = JSON.parse(crudo), s = L.sanearDatos(o, genId, hoy());
      if (s) { datosUsuario.lecturas = s.lecturas; datosUsuario.sesiones = s.sesiones; datosUsuario.ultimaCopia = typeof o.ultimaCopia === "string" ? o.ultimaCopia : null; }
    } catch (e) { /* datos dañados: se empieza de cero sin borrar lo guardado */ }
  })();
  // Los datos del usuario son los únicos que se guardan. Los ejemplos viven aparte, en memoria
  // (ids «ej-…»): se pueden tocar, pero ni se guardan ni se mezclan con los suyos.
  let datos = datosUsuario, datosEjemplo = null, modoEjemplo = false;
  const esIdEjemplo = id => /^ej-/.test(id || "");
  function ejemplos() {
    if (!datosEjemplo) datosEjemplo = { lecturas: C.EJEMPLOS.lecturas.map(x => L.sanearLectura(clon(x), genId, hoy())), sesiones: [L.sanearSesion(clon(C.EJEMPLOS.sesion), genId, hoy())], ultimaCopia: null };
    return datosEjemplo;
  }
  let tGuardar = null, avisoSinEspacio = false;
  function guardar(inmediato) {
    clearTimeout(tGuardar);
    const fn = () => {
      const ok = escribir(KEY_DATOS, JSON.stringify({ app: "lecturacritica", v: L.VERSION_DATOS, ultimaCopia: datosUsuario.ultimaCopia, lecturas: datosUsuario.lecturas, sesiones: datosUsuario.sesiones }));
      // Paquete con forma fija para que otras apps del mismo dominio lo lean («Traer de Lectura Crítica»); nunca leen lecturacritica-datos
      try { escribir(KEY_INTERCAMBIO, JSON.stringify(L.paqueteIntercambio(datosUsuario.lecturas, APP_VERSION, hoy()))); } catch (e) { /* */ }
      if (!ok && !avisoSinEspacio) { avisoSinEspacio = true; toast("No se ha podido guardar en este navegador (¿modo privado o sin espacio?). Haz una copia de seguridad.", 6000); }
    };
    if (inmediato) fn(); else tGuardar = setTimeout(fn, 250);
  }
  window.addEventListener("pagehide", () => guardar(true));
  const buscaLectura = id => datos.lecturas.find(x => x.id === id);
  const buscaSesion = id => datos.sesiones.find(x => x.id === id);
  // Una lectura recién creada no se guarda hasta que se escribe algo
  const borradores = new Map();
  const esVacia = l => !Object.keys(l.respuestas).length && !l.plantilla && !lleno(l.filtro.responde) && !l.desenlaces.length && !l.confusores.length && !lleno(l.veredicto.decision)
    && !l.calculos.length && ![l.titulo, l.pregunta, l.notas, l.resumen, ...Object.values(l.pico), ...Object.values(l.referencia)].some(lleno);

  // ---------- Textos de ayuda reutilizables ----------
  const box = (tipo, tag, html) => `<div class="box box--${tipo}"><span class="box-tag">${tag}</span>${html}</div>`;
  const idea = html => box("idea", "Idea clave", `<p>${html}</p>`);
  const trampa = html => box("trampa", "Ojo, trampa", `<p>${html}</p>`);
  const practica = html => box("practica", "En la práctica", `<p>${html}</p>`);
  const KEY_FACIL = "lecturacritica-facil-abierto";
  const facil = (html, titulo = "Explicado fácil") => `<details class="facil" data-recordar="1"${leer(KEY_FACIL) === "1" ? " open" : ""}><summary>${titulo}</summary><div class="facil-body">${html}</div></details>`;
  const avisoHtml = a => a.nivel === "nota" ? `<div class="note">ℹ ${esc(a.texto)}</div>` : a.nivel === "error" ? `<div class="aviso-error">✕ ${esc(a.texto)}</div>` : `<div class="warn">⚠ ${esc(a.texto)}</div>`;

  // ---------- Campos ----------
  function getPath(o, path) { return path.split(".").reduce((a, k) => (a == null ? undefined : a[k]), o); }
  function setPath(o, path, v) {
    const ks = path.split("."), ult = ks.pop();
    let a = o; ks.forEach(k => { if (a[k] == null || typeof a[k] !== "object") a[k] = {}; a = a[k]; });
    a[ult] = v;
  }
  let nAyuda = 0;
  function ayudaBtn(help) {
    if (!help) return { btn: "", box: "" };
    const id = "h" + (++nAyuda);
    return { btn: `<button type="button" class="info-btn" data-info="${id}" aria-expanded="false" aria-label="Ayuda">i</button>`, box: `<p class="help" id="help-${id}" hidden>${help}</p>` };
  }
  function campo(obj, path, label, o = {}) {
    const v = getPath(obj, path) || "", a = ayudaBtn(o.help);
    const bind = o.bind || `data-k="${path}"`;
    const ctrl = o.area
      ? `<textarea class="txt-in" ${bind} rows="${o.rows || 2}" placeholder="${esc(o.ph || "")}">${esc(v)}</textarea>`
      : `<div class="input-wrap"><input class="txt-in" ${bind} value="${esc(v)}" placeholder="${esc(o.ph || "")}"${o.tipo ? ` type="${o.tipo}"` : ""}${o.modo ? ` inputmode="${o.modo}"` : ""} autocomplete="off" /></div>`;
    return `<div class="field${o.destacado ? " field--destacado" : ""}"><div class="field-head"><label class="field-label">${label}</label>${o.opt ? '<span class="field-opt">(opcional)</span>' : ""}${a.btn}</div>${a.box}${o.sub ? `<p class="field-sub">${o.sub}</p>` : ""}${ctrl}${o.extra || ""}</div>`;
  }
  // Botones Sí / No / No se puede saber (o los que se pasen); al pulsar el activo se quita
  function segResp(attrs, actual, opciones = [["si", "Sí"], ["no", "No"], ["nose", "No se puede saber"]]) {
    return `<div class="seg seg--resp" role="group">${opciones.map(([v, t]) => `<button type="button" class="seg-${v}${actual === v ? " active" : ""}" ${attrs} data-v="${v}" aria-pressed="${actual === v}">${t}</button>`).join("")}</div>`;
  }

  // ---------- Pasos ----------
  function pasosInner(l, actual, g = L.progreso(l)) {
    return L.PASOS.map(p => `<li><a href="#/lectura/${l.id}/${p.n}" class="wiz-step${p.n === actual ? " actual" : g[p.n] ? " hecho" : ""}"${p.n === actual ? ' aria-current="step"' : ""} title="${esc(p.titulo)}"><span class="wiz-num">${g[p.n] && p.n !== actual ? "✓" : p.n}</span><span class="wiz-lbl">${p.corto}</span></a></li>`).join("");
  }
  const pasosHtml = (l, actual) => `<ol class="wiz-steps wiz-steps--7 no-print" aria-label="Pasos de la lectura" data-zona="pasos">${pasosInner(l, actual)}</ol>`;

  // ---------- Pequeñas piezas comunes ----------
  const volver = (href, txt) => `<a class="volver-cuadro" href="${href}">← ${txt}</a>`;
  const nombreLectura = l => L.nombreLectura(l) || "";
  const COLOR_TXT = { verde: "Verde", ambar: "Ámbar", rojo: "Rojo", "": "Sin decidir" };
  const luz = (c, txt) => `<span class="luz luz--${c || "sin"}" aria-hidden="true"></span>${txt ? `<span>${esc(txt)}</span>` : ""}`;
  const decisionBadge = d => d ? `<span class="badge badge--dec badge--${d}">${esc(L.DECISIONES[d].nom)}</span>` : "";
  const citaPlantilla = pl => pl.propia ? `<p class="cita-pl">Plantilla propia, basada en SQUIRE 2.0 y en los criterios de Cochrane EPOC para series temporales. <a href="${esc(pl.url)}" target="_blank" rel="noopener">SQUIRE ↗</a></p>`
    : `<p class="cita-pl">Preguntas propias basadas en los criterios de la plantilla CASPe para ${esc(pl.nombre.toLowerCase())}. <a href="${esc(pl.url)}" target="_blank" rel="noopener">Ver la plantilla original ↗</a></p>`;

  // ---------- Inicio ----------
  function renderHome() {
    const d = datos, sig = L.siguientePaso(d), n = d.lecturas.length;
    const term = d.lecturas.filter(l => lleno(l.veredicto.decision)).length;
    const diasCopia = d.ultimaCopia ? Math.floor((Date.now() - new Date(d.ultimaCopia)) / 864e5) : null;
    const avisoCopia = n && (diasCopia === null || diasCopia > 30)
      ? `<div class="warn">⚠ ${diasCopia === null ? "Aún no has hecho ninguna copia de seguridad." : `Tu última copia de seguridad es de hace ${diasCopia} días.`} Tus datos solo están en este dispositivo: guarda una copia.</div>` : "";
    const ult = d.lecturas.slice().sort((x, y) => String(y.modificado).localeCompare(String(x.modificado)))[0];
    view.innerHTML = `
      <section class="hero">
        <h1 class="hero-t"><span>Lectura Crítica</span></h1>
        <p class="hero-p">Lee un artículo <b>con método</b>, paso a paso y aprendiendo mientras lo haces: ¿es válido?, ¿qué dice?, ¿me sirve? Y termina con una decisión: <b>aplicar, esperar o descartar</b>.</p>
        <div class="hero-btns">
          <a class="btn btn--primary btn--grande" href="#/lecturas/nueva">+ Leer un artículo</a>
          <a class="btn btn--grande" href="#/lecturas">Mis lecturas${n ? ` <span class="contador">${n}</span>` : ""}</a>
          <a class="btn btn--grande" href="#/ejemplos">Ver un ejemplo</a>
        </div>
      </section>
      <div class="siguiente">
        <span class="siguiente-tag">Tu siguiente paso</span>
        <p>${esc(sig.texto)}</p>
        <a class="btn btn--primary" href="${sig.href}">${esc(sig.btn)} →</a>
      </div>
      <h2 class="sec-t">¿Qué tienes entre manos?</h2>
      <div class="entradas">
        <a class="entrada" href="#/lecturas/nueva"><span class="entrada-ic">📄</span><b>Leer un artículo</b><span>De tu pregunta a la decisión, con la plantilla de su tipo de estudio.</span></a>
        <a class="entrada" href="#/tipo"><span class="entrada-ic">🧭</span><b>¿Qué tipo de estudio tengo?</b><span>Unas preguntas sencillas que te llevan a la plantilla adecuada.</span></a>
        <a class="entrada" href="#/calc"><span class="entrada-ic">🧮</span><b>Calcular</b><span>NNT, cocientes de probabilidad, probabilidad tras la prueba con el nomograma de Fagan, odds ratio y coste-efectividad.</span></a>
      </div>
      ${facil(`<p>Leer un artículo es como <b>comprar un coche de segunda mano</b>. Primero miras si es el coche que buscas: si no lo es, no pierdes el tiempo. Después compruebas que no tiene trampa: el kilometraje, el motor, los papeles (<b>¿es fiable?</b>). Luego ves qué ofrece de verdad (<b>¿cuánto consume, cuánto corre?</b>). Y por último te preguntas si te sirve a ti: en tu garaje, con tu presupuesto, para tus viajes (<b>¿me sirve?</b>).</p>
        <p>Por eso la lectura crítica son tres preguntas, en este orden: <b>¿son válidos los resultados?, ¿cuáles son? y ¿me sirven?</b> Si la primera falla, no sigas.</p>`)}
      <h2 class="sec-t">El camino, en 7 pasos</h2>
      <p class="page-lead">De tu pregunta a la decisión. Cada paso tiene su explicación y sus avisos.</p>
      <ol class="fases">
        ${L.PASOS.map(p => `<li><a class="fase fase--acc" href="${ult ? `#/lectura/${ult.id}/${p.n}` : "#/lecturas/nueva"}">
          <span class="fase-cab"><span class="pdca-num">${p.n}</span><b>${p.titulo}</b></span>
          <span class="fase-que">${p.que}</span>
        </a></li>`).join("")}
      </ol>
      <h2 class="sec-t">Tus datos</h2>
      <div class="card datos-card">
        <div class="datos-cifras">
          <a href="#/lecturas"><b>${n}</b><span>${n === 1 ? "lectura" : "lecturas"}</span></a>
          <a href="#/lecturas"><b>${term}</b><span>con decisión</span></a>
          <a href="#/lecturas"><b>${d.lecturas.filter(l => l.veredicto.decision === "aplicar").length}</b><span>para aplicar</span></a>
        </div>
        ${avisoCopia}
        <p class="field-sub">Se guardan <b>solo en este dispositivo</b>. Para el club de lectura, pasa tu copia a los demás: al importarla se junta con lo suyo sin duplicar.${d.ultimaCopia ? ` Última copia: ${fechaCorta(d.ultimaCopia)}.` : ""}</p>
        <div class="toolbar"><button class="btn" data-act="copia">⬇ Copia de seguridad</button><button class="btn" data-act="importar">⬆ Importar copia</button></div>
      </div>
      <div class="guide">
        <a class="guide-card" href="#/ejemplos"><span class="guide-num">Ej</span><div><div class="guide-q">Ejemplos</div><div class="guide-a">La sesión completa de <b>Urgencias</b> (siete artículos, de la pregunta a la decisión) y <b>siete minicasos</b> para practicar.</div></div><span class="guide-go">›</span></a>
        <a class="guide-card" href="#/aprende"><span class="guide-num">?</span><div><div class="guide-q">Aprende</div><div class="guide-a">${C.TEMAS.length} temas <b>explicados fácil</b>: del método a los sesgos, el NNT o los cocientes de probabilidad.</div></div><span class="guide-go">›</span></a>
        <a class="guide-card" href="#/prueba"><span class="guide-num">✓</span><div><div class="guide-q">Ponte a prueba</div><div class="guide-a">${C.TEST.length} preguntas con su <b>explicación</b>, adivina el tipo de estudio y calcula.</div></div><span class="guide-go">›</span></a>
        <a class="guide-card" href="#/glosario"><span class="guide-num">A–Z</span><div><div class="guide-q">Glosario</div><div class="guide-a">${C.GLOSARIO.length} términos <b>en lenguaje llano</b>, con buscador.</div></div><span class="guide-go">›</span></a>
        <a class="guide-card" href="#/plantillas"><span class="guide-num">9</span><div><div class="guide-q">Las plantillas</div><div class="guide-a">Las <b>ocho plantillas</b> CASPe con nuestras preguntas, la propia de <b>antes-después</b> y su versión <b>en blanco</b> para imprimir.</div></div><span class="guide-go">›</span></a>
        <a class="guide-card" href="#/tipo"><span class="guide-num">?</span><div><div class="guide-q">¿Qué tipo de estudio tengo?</div><div class="guide-a">Unas preguntas de <b>sí o no</b> con las palabras que delatan cada diseño.</div></div><span class="guide-go">›</span></a>
        <a class="guide-card guide-card--hermana" href="${L.URL_TM}" target="_blank" rel="noopener"><span class="guide-num">n</span><div><div class="guide-q">Tamaño Muestral ↗</div><div class="guide-a">App hermana: <b>¿tenía el estudio muestra suficiente?</b> Calcula cuántos casos hacían falta.</div></div><span class="guide-go">›</span></a>
        <a class="guide-card guide-card--hermana" href="${L.URL_IND}" target="_blank" rel="noopener"><span class="guide-num">%</span><div><div class="guide-q">Indicadores ↗</div><div class="guide-a">App hermana: <b>convierte lo que decides aplicar en un indicador</b> con su estándar, para medir si se cumple.</div></div><span class="guide-go">›</span></a>
        <a class="guide-card guide-card--hermana" href="${L.URL_AUD}" target="_blank" rel="noopener"><span class="guide-num">✓</span><div><div class="guide-q">Auditorías ↗</div><div class="guide-a">App hermana: <b>audita si la práctica que adoptaste se aplica</b>, con su plan anual y la mejora continua.</div></div><span class="guide-go">›</span></a>
        <a class="guide-card guide-card--hermana" href="${L.URL_AMFE}" target="_blank" rel="noopener"><span class="guide-num">!</span><div><div class="guide-q">AMFE ↗</div><div class="guide-a">App hermana: <b>analiza qué puede fallar</b> en el proceso que vas a cambiar.</div></div><span class="guide-go">›</span></a>
        <a class="guide-card guide-card--hermana" href="${L.URL_FLUJO}" target="_blank" rel="noopener"><span class="guide-num">→</span><div><div class="guide-q">Flujograma ↗</div><div class="guide-a">App hermana: <b>dibuja el proceso</b> donde aplicarás el cambio, con sus puntos críticos.</div></div><span class="guide-go">›</span></a>
        <a class="guide-card guide-card--hermana" href="${L.URL_DAFO}" target="_blank" rel="noopener"><span class="guide-num">D</span><div><div class="guide-q">DAFO · CAME ↗</div><div class="guide-a">App hermana: <b>analiza tu unidad</b> y decide qué problema merece buscar evidencia.</div></div><span class="guide-go">›</span></a>
        <a class="guide-card guide-card--hermana" href="${L.URL_MAPA}" target="_blank" rel="noopener"><span class="guide-num">◆</span><div><div class="guide-q">Mapa de Riesgos ↗</div><div class="guide-a">App hermana: <b>elabora el mapa de riesgos</b> de un proceso, con su flujograma y su AMFE.</div></div><span class="guide-go">›</span></a>
        <a class="guide-card guide-card--hermana" href="${L.URL_RONDAS}" target="_blank" rel="noopener"><span class="guide-num">✓</span><div><div class="guide-q">Rondas de Seguridad ↗</div><div class="guide-a">App hermana: <b>comprueba en las rondas</b> de tu unidad si la práctica segura se cumple.</div></div><span class="guide-go">›</span></a>
        <a class="guide-card guide-card--hermana" href="${L.URL_NORM}" target="_blank" rel="noopener"><span class="guide-num">“”</span><div><div class="guide-q">Normalizador Bibliográfico ↗</div><div class="guide-a">Herramienta de apoyo: pon la <b>referencia del artículo</b> en Vancouver, APA y otros estilos.</div></div><span class="guide-go">›</span></a>
        <a class="guide-card guide-card--hermana" href="${L.URL_PORTAL}" target="_blank" rel="noopener"><span class="guide-num">⌂</span><div><div class="guide-q">Todas las apps ↗</div><div class="guide-a">El <b>portal</b> del ecosistema de calidad y seguridad del paciente.</div></div><span class="guide-go">›</span></a>
      </div>
      ${practica("<b>Protección de datos:</b> leer un artículo no necesita datos de pacientes. No escribas nombres de pacientes ni números de historia clínica.")}`;
  }

  // ---------- Mis lecturas ----------
  let filtroLista = "";
  function renderLista() {
    view.innerHTML = `
      <h1 class="page-title">Mis lecturas</h1>
      <p class="page-lead">Cada lectura es un artículo leído con su plantilla, hasta una decisión.</p>
      <div class="toolbar no-print"><a class="btn btn--primary" href="#/lecturas/nueva">+ Leer un artículo</a><a class="btn" href="#/sesiones/nueva">+ Nueva sesión</a>${datos.lecturas.length ? `<button type="button" class="btn" data-act="excel">⬇ Excel de todas</button>` : ""}</div>
      ${datos.sesiones.length ? `<h2 class="sec-t">Sesiones</h2><p class="field-sub">Varias lecturas sobre la misma pregunta, con una conclusión conjunta.</p><div class="cuadro-lista">${datos.sesiones.slice().sort((a, b) => String(b.modificado).localeCompare(String(a.modificado))).map(tarjetaSesion).join("")}</div><h2 class="sec-t">Lecturas</h2>` : ""}
      ${datos.lecturas.length > 3 ? `<div class="buscar"><input class="txt-in" id="buscar-lec" type="search" placeholder="Buscar por título, pregunta, tipo o decisión" value="${esc(filtroLista)}" autocomplete="off" /></div>` : ""}
      <div data-zona="lista">${listaInner()}</div>`;
  }
  function listaInner() {
    const f = L.sinTildes(filtroLista);
    const lista = datos.lecturas.slice().sort((a, b) => String(b.modificado).localeCompare(String(a.modificado)))
      .filter(l => !f || L.sinTildes([nombreLectura(l), l.pregunta, Object.values(l.pico).join(" "), (L.plantilla(l.plantilla) || {}).nombre, l.veredicto.decision && L.DECISIONES[l.veredicto.decision].nom].join(" ")).includes(f));
    if (!datos.lecturas.length) return `<div class="placeholder-box"><p><b>Todavía no has leído ningún artículo con la app.</b></p><p>Empieza por tu pregunta y el artículo que tienes entre manos.</p></div>`;
    if (!lista.length) return `<div class="placeholder-box"><p>Ninguna lectura coincide con «${esc(filtroLista)}».</p></div>`;
    return `<div class="cuadro-lista">${lista.map(tarjeta).join("")}</div>`;
  }
  function tarjetaSesion(x) {
    const L_ = L.lecturasDeSesion(x, datos.lecturas);
    return `<div class="item-card item-card--sesion">
      <a class="item-main" href="#/sesion/${x.id}"><b class="item-t">📚 ${esc(x.titulo || "Sesión sin título")}</b>${lleno(x.pregunta) ? `<span class="item-s">${esc(L.corto(x.pregunta, 160))}</span>` : ""}
        <span class="badges">${decisionBadge(x.decision)}<span class="badge">${plural(L_.length, "artículo", "artículos")}</span>${x.fecha ? `<span class="badge">${esc(L.fmtFecha(x.fecha))}</span>` : ""}</span></a>
      <div class="item-pie"><span>Modificada: ${fechaCorta(x.modificado)}</span><span><button class="link-btn link-btn--peligro" data-act="ses-del" data-id="${x.id}">Borrar</button></span></div>
    </div>`;
  }
  function tarjeta(l) {
    const r = L.resumen(l), pl = L.plantilla(l.plantilla), g = L.progreso(l), hechos = L.PASOS.filter(p => g[p.n]).length;
    const sem = pl ? ["validez", "resultados", "aplicabilidad"].map(b => luz(L.semaforo(l, b).color)).join("") : "";
    const preg = lleno(l.pregunta) ? l.pregunta : L.preguntaSugerida(l), sub = preg && preg !== nombreLectura(l) ? L.corto(preg, 160) : "";
    return `<div class="item-card">
      <a class="item-main" href="#/lectura/${l.id}">
        <b class="item-t">${lleno(nombreLectura(l)) ? esc(L.corto(nombreLectura(l), 140)) : '<span class="vacio">Lectura sin título</span>'}</b>
        ${sub ? `<span class="item-s">${esc(sub)}</span>` : ""}
        <span class="badges">${decisionBadge(r.decision)}${pl ? `<span class="badge">${esc(pl.nombre)}</span>` : ""}${sem ? `<span class="badge badge--luces" title="Validez · Resultados · Me sirve">${sem}</span>` : ""}${pl ? `<span class="badge">${r.contestadas}/${r.total} preguntas</span>` : ""}${hechos < 7 ? `<span class="badge badge--prog">Pasos ${hechos}/7</span>` : ""}</span>
      </a>
      <div class="item-pie"><span>Modificada: ${fechaCorta(l.modificado)}</span><span><button class="link-btn" data-act="lec-dup" data-id="${l.id}">Duplicar</button> · <button class="link-btn link-btn--peligro" data-act="lec-del" data-id="${l.id}">Borrar</button></span></div>
    </div>`;
  }

  // ---------- Una lectura: armazón común de los pasos ----------
  let actual = null, pasoActual = 1;
  const seguirIgual = new Set();        // lecturas en las que se eligió «seguir de todos modos» tras fallar la eliminación
  function renderLectura(l, n) {
    actual = l; pasoActual = n; nAyuda = 0;
    const p = L.PASOS[n - 1], prev = L.PASOS[n - 2], next = L.PASOS[n];
    view.innerHTML = `
      <div class="wiz-top no-print">${volver(modoEjemplo ? "#/ejemplos" : "#/lecturas", modoEjemplo ? "Ejemplos" : "Mis lecturas")}${pasosHtml(l, n)}</div>
      <div class="wiz-titulo"><span class="wiz-paso">Paso ${n} de 7${lleno(nombreLectura(l)) ? " · " + esc(L.corto(nombreLectura(l), 60)) : ""}</span><h1 class="page-title">${p.titulo}</h1></div>
      ${RENDER[n](l)}
      <div class="wiz-nav no-print">${prev ? `<a class="btn" href="#/lectura/${l.id}/${prev.n}">← ${prev.corto}</a>` : `<span></span>`}${next ? `<a class="btn btn--primary" href="#/lectura/${l.id}/${next.n}">${next.corto} →</a>` : `<a class="btn btn--primary" href="#/lecturas">Terminar</a>`}</div>`;
  }
  const avisosZona = (l, n) => `<div data-zona="avisos">${L.avisos(l, n).map(avisoHtml).join("")}</div>`;

  // ---------- Paso 1 · Tu pregunta y el artículo ----------
  function paso1(l) {
    const sug = L.preguntaSugerida(l);
    return `<p class="page-lead">${L.PASOS[0].que}</p>
      ${facil(`<p>Antes de leer, escribe <b>qué quieres saber</b>. Una buena pregunta tiene cuatro partes, el formato <b>PICO</b>:</p>
        <ul><li><b>P</b>acientes: ¿quiénes? (por ejemplo, pacientes que esperan en Urgencias).</li><li><b>I</b>ntervención: ¿qué se hace? (reevaluar a los 90 minutos con un aviso automático).</li><li><b>C</b>omparación: ¿frente a qué? (la reevaluación a demanda). Puede no haberla.</li><li>Resultado (<b>O</b>, de <i>outcome</i>): ¿qué se mide? (los empeoramientos no detectados).</li></ul>
        <p>Con la pregunta escrita sabrás enseguida si un artículo te sirve o no.</p>`)}
      ${avisosZona(l, 1)}
      <div class="card">
        <h2 class="sub-h">Tu pregunta (PICO)</h2>
        ${campo(l, "pico.p", "P · Pacientes", { ph: "¿A quién se refiere tu pregunta?", area: true, rows: 1 })}
        ${campo(l, "pico.i", "I · Intervención", { ph: "¿Qué se hace? (tratamiento, prueba, exposición, programa)", area: true, rows: 1 })}
        ${campo(l, "pico.c", "C · Comparación", { ph: "¿Frente a qué? Puede no haberla", area: true, rows: 1, opt: true })}
        ${campo(l, "pico.o", "O · Resultado", { ph: "¿Qué se mide? (outcome)", area: true, rows: 1 })}
        ${campo(l, "pregunta", "Tu pregunta, en una frase", { area: true, rows: 2, ph: "En [pacientes], ¿[intervención], frente a [comparación], mejora [resultado]?", extra: `<div data-zona="sugerida">${sugeridaHtml(l, sug)}</div>` })}
        <details class="mas-datos pubmed"${modoEjemplo ? "" : ""}><summary>🔎 Buscar en PubMed con tu PICO</summary>
          <p class="field-sub">PubMed busca en inglés: escribe los términos de P, I y O en inglés para encontrar más. Se abre en otra pestaña; la app no guarda nada fuera.</p>
          <div class="seg seg--mini seg--wrap" role="group">${Object.entries(L.FILTROS_PUBMED).map(([k, t]) => `<button type="button" class="${filtroPubMed === k ? "active" : ""}" data-act="pubmed-filtro" data-v="${k}">${t}</button>`).join("")}</div>
          <div data-zona="pubmed">${pubmedHtml(l)}</div></details>
      </div>
      <div class="card">
        <h2 class="sub-h">El artículo</h2>
        ${campo(l, "titulo", "Título", { area: true, rows: 1, ph: "Título del artículo" })}
        ${campo(l, "referencia.texto", "Referencia", { area: true, rows: 2, ph: "Autores. Título. Revista. Año;volumen(número):páginas. DOI", help: "Pégala tal como la tengas. Con «Normalizar la cita» la pasas al Normalizador Bibliográfico para ponerla en Vancouver, APA u otro estilo." })}
        <div class="toolbar"><button class="btn" data-act="normalizar">“” Normalizar la cita ↗</button></div>
        <details class="mas-datos"><summary>Más datos de la referencia</summary>
          ${campo(l, "referencia.autores", "Autores", { opt: true })}
          ${campo(l, "referencia.revista", "Revista", { opt: true })}
          ${campo(l, "referencia.anio", "Año", { opt: true, modo: "numeric" })}
          ${campo(l, "referencia.doi", "DOI", { opt: true, ph: "10.xxxx/…" })}
          ${campo(l, "referencia.pmid", "PMID", { opt: true, modo: "numeric" })}
          ${campo(l, "referencia.url", "Enlace", { opt: true, ph: "https://…", tipo: "url" })}
        </details>
        ${campo(l, "resumen", "Resumen del artículo", { area: true, rows: 3, opt: true, ph: "Pega aquí el resumen (abstract) o tus notas del artículo, para tenerlo a mano mientras contestas" })}
      </div>`;
  }
  let filtroPubMed = "";
  function pubmedHtml(l) {
    const b = L.busquedaPubMed(l, filtroPubMed);
    return b ? `<p class="formula">${esc(b.consulta)}</p><a class="btn" href="${esc(b.url)}" target="_blank" rel="noopener">Abrir en PubMed ↗</a>` : `<p class="calc-vacia">Escribe los pacientes, la intervención o el resultado.</p>`;
  }
  const sugeridaHtml = (l, sug) => sug && !lleno(l.pregunta) ? `<div class="sugerida"><span>Propuesta: «${esc(sug)}»</span> <button type="button" class="link-btn" data-act="usar-pregunta">Usarla</button></div>` : "";

  // ---------- Paso 2 · Filtro de dos minutos ----------
  function paso2(l) {
    const f = l.filtro;
    return `<p class="page-lead">Lee <b>solo el título y el resumen</b> y contesta tres preguntas rápidas.</p>
      ${facil(`<p>La decisión que más tiempo ahorra es <b>descartar pronto</b> lo que no responde a tu pregunta. Para eso basta con el título y el resumen.</p><p>Si el artículo pasa el filtro, ya sí merece la pena leer los métodos y los resultados completos.</p>`)}
      ${lleno(l.pregunta) || L.preguntaSugerida(l) ? `<div class="recuerda"><span>Tu pregunta</span><p>${esc(lleno(l.pregunta) ? l.pregunta : L.preguntaSugerida(l))}</p></div>` : ""}
      <div class="card">
        <div class="field"><div class="field-head"><label class="field-label">1. ¿Responde a tu pregunta?</label></div><p class="field-sub">¿Son los mismos pacientes, la misma intervención y el mismo resultado que te interesan?</p>${segResp('data-act="filtro" data-f="responde"', f.responde, [["si", "Sí"], ["no", "No"], ["nose", "No lo sé"]])}</div>
        ${campo(l, "filtro.tipoResumen", "2. ¿Qué tipo de estudio dice el resumen que es?", { ph: "Ensayo aleatorizado, revisión sistemática, cohortes…", sub: "Lo confirmarás en el paso siguiente." })}
        <div class="field"><div class="field-head"><label class="field-label">3. ¿Es lo más reciente sobre lo mismo?</label></div><p class="field-sub">¿O hay algo más nuevo, sobre todo una revisión sistemática?</p>${segResp('data-act="filtro" data-f="reciente"', f.reciente, [["si", "Sí, es lo más reciente"], ["no", "Hay algo más nuevo"], ["nose", "No lo sé"]])}</div>
        ${campo(l, "filtro.nota", "Notas del filtro", { area: true, opt: true })}
      </div>
      ${avisosZona(l, 2)}
      ${f.responde === "no" ? `<div class="toolbar"><button class="btn btn--peligro" data-act="descartar-ya">Descartarlo ya</button></div>` : ""}`;
  }

  // ---------- Paso 3 · Tipo de estudio ----------
  function paso3(l) {
    return `<p class="page-lead">Cada tipo de estudio tiene su plantilla. Elige la del tuyo${lleno(l.filtro.tipoResumen) ? ` (el resumen dice: «${esc(l.filtro.tipoResumen)}»)` : ""}.</p>
      ${facil(`<p>Cada diseño responde a un tipo de pregunta y tiene sus propias trampas. Por eso cada uno tiene su plantilla: un ensayo se juzga por cómo se repartió a los pacientes; una prueba diagnóstica, por la prueba de referencia; un estudio cualitativo, por cómo se eligió a los participantes.</p>`)}
      <div class="toolbar"><a class="btn" href="#/tipo?para=${l.id}">🧭 Averiguarlo con unas preguntas</a></div>
      <div class="opt-grid">${PL.PLANTILLAS.map(p => `<button type="button" class="opt-card${l.plantilla === p.id ? " active" : ""}" data-act="plantilla" data-pl="${p.id}" aria-pressed="${l.plantilla === p.id}">
        <span class="opt-letra">${L.preguntasDe(p).length}</span><span><b>${esc(p.nombre)}</b><span class="opt-desc">${esc(p.que)}</span></span></button>`).join("")}</div>
      ${avisosZona(l, 3)}
      ${Object.keys(l.aparte).length ? `<div class="note">ℹ Tienes respuestas guardadas de otra plantilla: si vuelves a ella, las recuperas.</div>` : ""}`;
  }

  // ---------- Pasos 4, 5 y 6 · Los tres bloques ----------
  function pasoBloque(l, n) {
    const bloque = L.PASO_BLOQUE[n], pl = L.plantilla(l.plantilla), B = PL.BLOQUES[bloque];
    if (!pl) return `<div class="placeholder-box"><p><b>Elige antes el tipo de estudio.</b></p><p>Cada tipo de estudio tiene sus preguntas.</p><div class="toolbar" style="justify-content:center"><a class="btn btn--primary" href="#/lectura/${l.id}/3">Ir al paso 3</a></div></div>`;
    const qs = L.preguntasDe(pl, bloque), el = L.eliminacion(l);
    const descartada = L.cerradaPronto(l) && n > 4;
    return `<p class="page-lead">${esc(B.sub)} <span class="tipo-chip">${esc(pl.nombre)}</span></p>
      ${facil(FACIL_BLOQUE[bloque])}
      ${descartada ? `<div class="note">ℹ Has descartado este estudio. Puedes seguir contestando para aprender, pero no hace falta.</div>` : ""}
      <div class="toolbar no-print"><a class="btn btn--ghost" href="#/lectura/${l.id}/club?q=${L.preguntasDe(pl).findIndex(q => q.bloque === bloque) + 1}">👥 Club de lectura: que vote cada asistente</a></div>
      ${lleno(l.resumen) ? `<details class="recuerda recuerda--det"><summary>El resumen del artículo</summary><p>${esc(l.resumen)}</p></details>` : ""}
      ${avisosZona(l, n)}
      <div class="preguntas">${qs.map((q, i) => preguntaHtml(l, pl, q) + (n === 4 && q.elim && !(qs[i + 1] || {}).elim ? `<div data-zona="parada">${paradaHtml(l, el)}</div>` : "")).join("")}</div>
      <div class="sem-bloque" data-zona="sembloque">${semBloqueHtml(l, bloque)}</div>
      ${citaPlantilla(pl)}`;
  }
  const FACIL_BLOQUE = {
    validez: `<p>Un estudio es <b>válido</b> si sus resultados se pueden creer: si lo que encuentra se debe a lo que estudia y no a un error en cómo se hizo (un <b>sesgo</b>).</p><p>Las primeras preguntas son <b>de eliminación</b>: se contestan rápido y, si alguna es «No», no merece la pena seguir. Las demás miran los detalles que más suelen fallar.</p><p>«No se puede saber» también informa: el artículo no explica lo que hizo.</p>`,
    resultados: `<p>Aquí importa <b>cuánto</b> cambia el resultado y con qué <b>precisión</b>, no solo si la «p» es menor de 0,05.</p><ul><li>Un efecto puede ser estadísticamente significativo y, a la vez, demasiado pequeño para importar.</li><li>Fíjate en el <b>intervalo de confianza</b>: si es muy ancho, el estudio dice poco; si incluye el «sin efecto», el resultado es incierto.</li><li>Una reducción relativa del 50 % puede ser pasar de 2 a 1 de cada 100: mira también la reducción absoluta y el NNT.</li></ul>`,
    aplicabilidad: `<p>Un estudio válido y con un buen efecto puede no servirte: <b>¿se parecen tus pacientes</b> a los del estudio? ¿Tienes los mismos medios? ¿Se han contado todos los resultados que importan, también los daños y los costes?</p><p>Si tus pacientes son muy distintos, lo prudente suele ser <b>esperar</b> y buscar estudios más parecidos a tu contexto.</p>`
  };
  function preguntaHtml(l, pl, q) {
    const r = L.resp(l, q.id), num = L.numeroDe(pl, q.id), v = r.valor;
    const estado = q.resp === "abierta" ? (L.contestada(l, q) ? "hecha" : "") : v ? `r-${v}` : "";
    const resp = q.resp === "abierta"
      ? `${q.calc ? calcEnPregunta(l, pl, q) : ""}
         <label class="nota-lbl" for="nota-${q.id}">Resultado${q.calc ? " (escríbelo tú o pulsa «Usar en la respuesta»)" : ""}</label>
         <textarea class="txt-in" id="nota-${q.id}" data-q="${q.id}" data-f="nota" rows="3" placeholder="Escribe el resultado tal como lo da el artículo (cifras e intervalos de confianza)">${esc(r.nota)}</textarea>`
      : `${segResp(`data-act="resp" data-q="${q.id}"`, v, q.resp === "sn" ? [["si", "Sí"], ["no", "No"]] : undefined)}
         ${q.calc ? calcEnPregunta(l, pl, q) : ""}
         <details class="nota-q"${lleno(r.nota) ? " open" : ""}><summary>Nota${lleno(r.nota) ? "" : " (¿dónde lo ves en el artículo?)"}</summary><textarea class="txt-in" data-q="${q.id}" data-f="nota" rows="2" placeholder="Dónde lo ves en el artículo, dudas, comentarios">${esc(r.nota)}</textarea></details>`;
    return `<article class="preg ${estado}${q.elim ? " preg--elim" : ""}" data-pq="${q.id}">
      <div class="preg-cab"><span class="preg-num">${num}</span><div class="preg-txt">${q.elim ? `<span class="badge badge--elim">De eliminación</span>` : ""}<h3>${esc(q.texto)}</h3></div></div>
      <details class="pistas"><summary>Pistas</summary><ul>${q.pistas.map(p => `<li>${esc(p)}</li>`).join("")}</ul></details>
      ${resp}
      ${q.lista === "desenlaces" ? desenlacesHtml(l) : q.lista === "confusores" ? confusoresHtml(l) : ""}
    </article>`;
  }
  function paradaHtml(l, el) {
    if (el.estado !== "falla") return "";
    const pl = L.plantilla(l.plantilla), cerrada = l.veredicto.decision === "descartar";
    return `<div class="parada">
      <b>✋ Este estudio no supera las preguntas de eliminación: no merece la pena seguir.</b>
      <p>Falla ${el.falla.length === 1 ? "la pregunta" : "las preguntas"} ${el.falla.map(q => L.numeroDe(pl, q.id)).join(", ")}. ${cerrada ? "Ya lo has descartado." : "Puedes terminar aquí y descartarlo, o seguir para aprender."}</p>
      ${cerrada ? `<div class="toolbar"><a class="btn" href="#/lectura/${l.id}/7">Ver el veredicto</a></div>` : `<div class="toolbar"><button class="btn btn--peligro" data-act="descartar-ya">Terminar y descartarlo</button>${seguirIgual.has(l.id) ? "" : `<button class="btn" data-act="seguir-igual">Seguir de todos modos</button>`}</div>`}
    </div>`;
  }
  function semBloqueHtml(l, bloque) {
    const s = L.semaforo(l, bloque), p = s.propuesto;
    // Si la app no puede proponer un color (resultados sin preguntas de Sí/No), lo elige la persona aquí mismo
    const elegir = !p.color && p.completo && bloque === "resultados";
    const guia = "¿El efecto es importante y preciso? Verde: importa y el intervalo es estrecho. Ámbar: es pequeño o impreciso. Rojo: el intervalo incluye el «sin efecto» o no te lo crees.";
    return `<span class="sem-tag">Semáforo · ${esc(PL.BLOQUES[bloque].titulo)}</span><p>${luz(s.color, COLOR_TXT[s.color])}<span class="sem-mot">${esc(elegir || s.manual ? guia : s.motivo)}</span></p>
      ${elegir || s.manual ? `<div class="seg seg--mini seg--luz" role="group">${["verde", "ambar", "rojo"].map(c => `<button type="button" class="seg-${c}${l.veredicto.semaforo[bloque] === c ? " active" : ""}" data-act="sem" data-b="${bloque}" data-v="${c}">${COLOR_TXT[c]}</button>`).join("")}</div>` : ""}`;
  }
  function desenlacesHtml(l) {
    return `<div class="sublista"><div class="sublista-cab"><b>Desenlaces del estudio</b><span>Puntúa su importancia para decidir: 1-3 poco importante, 4-6 importante, 7-9 crítico (escala GRADE).</span></div>
      ${l.desenlaces.map(d => `<div class="fila-des">
        <input class="txt-in" data-des="${d.id}" data-f="nombre" value="${esc(d.nombre)}" placeholder="Desenlace (por ejemplo, ingreso en UCI)" autocomplete="off" />
        <select class="txt-in" data-des="${d.id}" data-f="importancia" aria-label="Importancia"><option value="">Importancia</option>${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => `<option value="${k}"${String(k) === d.importancia ? " selected" : ""}>${k} · ${L.IMPORTANCIA(k)}</option>`).join("")}</select>
        <select class="txt-in" data-des="${d.id}" data-f="sentido" aria-label="Tipo"><option value="beneficio"${d.sentido === "beneficio" ? " selected" : ""}>Beneficio</option><option value="dano"${d.sentido === "dano" ? " selected" : ""}>Daño</option></select>
        <button type="button" class="icon-btn icon-btn--mini" data-act="del-des" data-id="${d.id}" aria-label="Quitar">✕</button></div>`).join("")}
      <button type="button" class="btn btn--ghost" data-act="nuevo-des">+ Añadir desenlace</button></div>`;
  }
  function confusoresHtml(l) {
    return `<div class="sublista"><div class="sublista-cab"><b>Tu lista de factores de confusión</b><span>Escribe los que crees importantes y marca si los autores los tuvieron en cuenta.</span></div>
      ${l.confusores.map(c => `<div class="fila-con">
        <input class="txt-in" data-con="${c.id}" data-f="texto" value="${esc(c.texto)}" placeholder="Factor (por ejemplo, edad, tabaco)" autocomplete="off" />
        <select class="txt-in" data-con="${c.id}" data-f="tenido" aria-label="¿Lo tuvieron en cuenta?"><option value="">¿Lo tuvieron en cuenta?</option><option value="si"${c.tenido === "si" ? " selected" : ""}>Sí</option><option value="no"${c.tenido === "no" ? " selected" : ""}>No</option><option value="nose"${c.tenido === "nose" ? " selected" : ""}>No se sabe</option></select>
        <button type="button" class="icon-btn icon-btn--mini" data-act="del-con" data-id="${c.id}" aria-label="Quitar">✕</button></div>`).join("")}
      <button type="button" class="btn btn--ghost" data-act="nuevo-con">+ Añadir factor</button></div>`;
  }

  // ---------- Calculadoras: formularios y resultados ----------
  // bind: atributos que identifican la calculadora (data-calc="<id>" dentro de una lectura; data-cs="<tipo>" en las sueltas)
  const cIn = (bind, f, v, o = {}) => `<input class="txt-in calc-in" ${bind} data-f="${f}" value="${esc(v)}" inputmode="${o.modo || "numeric"}" placeholder="${esc(o.ph || "")}" aria-label="${esc(o.aria || f)}" autocomplete="off" />`;
  const resBox = (et, val, ic, o = {}) => `<div class="res${o.main ? " res--main" : ""}"><span class="res-et">${et}</span><b class="res-v">${val}</b>${ic ? `<span class="res-ic">IC 95 %: ${ic}</span>` : ""}${o.sub ? `<span class="res-sub">${o.sub}</span>` : ""}</div>`;
  const avisosCalc = l => l.map(avisoHtml).join("");
  // ---------- Fase 2: formularios, resultados y gráficos ----------
  const selCalc = (bind, f, v, opciones, aria) => `<select class="txt-in calc-sel" ${bind} data-f="${f}" aria-label="${esc(aria)}">${opciones.map(([k, t]) => `<option value="${k}"${k === v ? " selected" : ""}>${esc(t)}</option>`).join("")}</select>`;
  const CAMPOS_MODO = {
    ic: [["hr", "Hazard ratio"], ["li", "Límite inferior del IC 95 %"], ["ls", "Límite superior del IC 95 %"]],
    oev: [["oe", "O − E (observados menos esperados) del grupo intervención"], ["v", "Varianza del log-rank"]],
    obsesp: [["oe1", "Eventos observados · intervención"], ["ee1", "Eventos esperados · intervención"], ["oc1", "Eventos observados · control"], ["ec1", "Eventos esperados · control"]],
    logrank: [["p", "p del log-rank"], ["ev1", "Eventos · intervención"], ["ev2", "Eventos · control"], ["evt", "O bien: total de eventos"], ["n1", "Pacientes · intervención (si no es 1:1)"], ["n2", "Pacientes · control (si no es 1:1)"]],
    medianas: [["m1", "Mediana de supervivencia · intervención"], ["m2", "Mediana de supervivencia · control"], ["ev1", "Eventos · intervención"], ["ev2", "Eventos · control"]],
    riesgo: [["e1", "Con el evento · intervención"], ["s1", "Sin el evento · intervención"], ["e2", "Con el evento · control"], ["s2", "Sin el evento · control"]]
  };
  function formFase2(tipo, e, x, bind) {
    if (tipo === "supervivencia") {
      const modo = CAMPOS_MODO[e.modo] ? e.modo : "ic";
      return `<div class="tabla-calc tabla-calc--2"><span>¿Qué da el artículo?</span>${selCalc(bind, "modo", modo, Object.entries(CA.MODOS_SUPERV), "Qué da el artículo")}
        ${CAMPOS_MODO[modo].map(([k, t]) => `<span>${esc(t)}</span>${cIn(bind, k, e[k], { modo: "decimal", aria: t })}`).join("")}
        ${modo === "logrank" ? `<span>¿A favor de quién?</span>${selCalc(bind, "sentido", e.sentido || "favor", [["favor", "Menos eventos con la intervención"], ["contra", "Más eventos con la intervención"]], "Sentido")}` : ""}</div>
        <p class="calc-ayuda">${modo === "logrank" ? "Si solo da la p del log-rank, se estima el HR con los eventos (Parmar, 1998). Con los eventos de cada grupo se supone reparto 1:1." : modo === "medianas" ? "Con las medianas se supone que el riesgo es constante en el tiempo (exponencial): es una aproximación." : modo === "riesgo" ? "Los datos de un momento concreto, leídos de la curva o de la tabla de «número en riesgo»." : "Métodos de Parmar (1998) para sacar el hazard ratio de lo que publica el artículo."}</p>`;
    }
    if (tipo === "metaanalisis") {
      const med = CA.MEDIDAS_META[e.medida] ? e.medida : "or", d = CA.MEDIDAS_META[med].datos, E = x.estudios || [];
      const cols = d === "dic" ? [["ee", "Eventos (int.)"], ["ne", "Total (int.)"], ["ec", "Eventos (ctrl.)"], ["nc", "Total (ctrl.)"]] : d === "hr" ? [["hr", "HR"], ["li", "IC inf"], ["ls", "IC sup"]] : [["n1", "n (int.)"], ["m1", "Media (int.)"], ["d1", "DE (int.)"], ["n2", "n (ctrl.)"], ["m2", "Media (ctrl.)"], ["d2", "DE (ctrl.)"]];
      return `<div class="tabla-calc tabla-calc--2"><span>Medida</span>${selCalc(bind, "medida", med, Object.entries(CA.MEDIDAS_META).map(([k, m]) => [k, m.nom]), "Medida")}
        ${d === "dic" ? `<span>Método de efectos fijos</span>${selCalc(bind, "metodo", e.metodo || "mh", Object.entries(CA.METODOS_META).filter(([k]) => k !== "peto" || med === "or"), "Método")}` : ""}</div>
        <div class="tabla-scroll"><table class="tabla-est"><thead><tr><th>Estudio</th>${cols.map(([, t]) => `<th>${t}</th>`).join("")}<th></th></tr></thead><tbody>
          ${E.map((s, i) => `<tr><td><input class="txt-in calc-in calc-in--txt" ${bind} data-est="${i}" data-f="nombre" value="${esc(s.nombre)}" placeholder="Estudio ${i + 1}" aria-label="Nombre del estudio ${i + 1}" autocomplete="off" /></td>${cols.map(([k, t]) => `<td><input class="txt-in calc-in" ${bind} data-est="${i}" data-f="${k}" value="${esc(s[k])}" inputmode="decimal" aria-label="${esc(t)}, estudio ${i + 1}" autocomplete="off" /></td>`).join("")}<td><button type="button" class="icon-btn icon-btn--mini" data-act="est-del" ${bind} data-i="${i}" aria-label="Quitar el estudio"${E.length <= 2 ? " disabled" : ""}>✕</button></td></tr>`).join("")}
        </tbody></table></div>
        ${E.length < 30 ? `<button type="button" class="btn btn--ghost" data-act="est-nuevo" ${bind}>+ Añadir estudio</button>` : ""}
        <p class="calc-ayuda">${d === "dic" ? "Int. = grupo intervención (o expuestos); ctrl. = control." : d === "hr" ? "El hazard ratio de cada estudio con su intervalo de confianza del 95 %." : "Medias y desviaciones estándar (DE) de cada grupo."}</p>`;
    }
    if (tipo === "umbrales") return `<div class="tabla-calc tabla-calc--2">
        <span>Sensibilidad de la prueba, en %</span>${cIn(bind, "s", e.s, { modo: "decimal", ph: "p. ej. 90", aria: "Sensibilidad" })}
        <span>Especificidad de la prueba, en %</span>${cIn(bind, "e", e.e, { modo: "decimal", ph: "p. ej. 80", aria: "Especificidad" })}
        <span>Daño de tratar a quien no tiene la enfermedad, en %</span>${cIn(bind, "dano", e.dano, { modo: "decimal", ph: "p. ej. 10", aria: "Daño del tratamiento innecesario" })}
        <span>Beneficio de tratar a quien sí la tiene, en %</span>${cIn(bind, "beneficio", e.beneficio, { modo: "decimal", ph: "p. ej. 30", aria: "Beneficio del tratamiento" })}
        <span>Riesgo de la propia prueba, en %</span>${cIn(bind, "rprueba", e.rprueba, { modo: "decimal", ph: "p. ej. 1", aria: "Riesgo de la prueba" })}
        <span>Probabilidad de tu paciente antes de la prueba, en % <small>(opcional)</small></span>${cIn(bind, "pre", e.pre, { modo: "decimal", ph: "p. ej. 30", aria: "Probabilidad antes de la prueba" })}</div>
      <p class="calc-ayuda">Daño y beneficio en la misma escala: por ejemplo, el porcentaje de complicaciones graves que provoca el tratamiento y el porcentaje que evita.</p>`;
    if (tipo === "kappa") {
      const M = x.matriz && x.matriz.length ? x.matriz : L.matrizVacia(2), k = M.length;
      return `<div class="tabla-calc tabla-calc--2"><span>Número de categorías</span>${selCalc(bind, "kk", String(k), [2, 3, 4, 5, 6].map(n => [String(n), n === 2 ? "2 (sí / no)" : String(n)]), "Número de categorías")}</div>
        <div class="tabla-scroll"><table class="tabla-est"><thead><tr><th>Observador 1 ↓ · 2 →</th>${M.map((_, j) => `<th>${k === 2 ? (j ? "No" : "Sí") : j + 1}</th>`).join("")}</tr></thead><tbody>
          ${M.map((f, i) => `<tr><th>${k === 2 ? (i ? "No" : "Sí") : i + 1}</th>${f.map((v, j) => `<td><input class="txt-in calc-in" ${bind} data-mx="${i}-${j}" value="${esc(v)}" inputmode="numeric" aria-label="Fila ${i + 1}, columna ${j + 1}" autocomplete="off" /></td>`).join("")}</tr>`).join("")}
        </tbody></table></div><p class="calc-ayuda">En la diagonal, las veces que los dos coinciden. ${k > 2 ? "Con categorías ordenadas, el kappa ponderado cuenta los desacuerdos cercanos como medio acuerdo." : ""}</p>`;
    }
    return "";
  }
  function resFase2(tipo, e, r, nombre) {
    const F = CA.fmt, P = CA.pct, IC = CA.icTxt;
    if (tipo === "supervivencia") return `<div class="res-grid">${resBox("Hazard ratio (HR)", F(r.hr.v), IC(r.hr), { main: true })}${resBox("p", r.p < 0.001 ? "< 0,001" : F(r.p, 3), "")}${resBox("ln HR y su varianza", `${F(r.lnhr, 3)} · ${F(r.var, 4)}`, "", { sub: "para un metaanálisis" })}</div>
      <p class="llano">${esc((nombre ? nombre + ": " : "") + CA.textoSupervivencia(r))}</p>${CA.incluye(r.hr, 1) ? `<div class="warn">⚠ El intervalo incluye el 1: el resultado es compatible con que no haya diferencia.</div>` : ""}`;
    if (tipo === "metaanalisis") {
      const M = CA.MEDIDAS_META[r.medida], A = r.aleatorio, Fi = r.fijo, f = x => F(x, M.log || r.medida === "dr" ? 2 : 2);
      return `<div class="res-grid">
          ${resBox("Efectos aleatorios (DerSimonian-Laird)", f(A.v), `${f(A.inf)} a ${f(A.sup)}`, { main: true, sub: `p ${A.p < 0.001 ? "< 0,001" : "= " + F(A.p, 3)}` })}
          ${resBox(`Efectos fijos (${CA.METODOS_META[r.metodo]})`, f(Fi.v), `${f(Fi.inf)} a ${f(Fi.sup)}`, { sub: `p ${Fi.p < 0.001 ? "< 0,001" : "= " + F(Fi.p, 3)}` })}
          ${resBox("Heterogeneidad (I²)", P(r.i2, 0), CA.incluye({ inf: 0, sup: 1 }, r.i2Inf) ? `${P(r.i2Inf, 0)} a ${P(r.i2Sup, 0)}` : "", { sub: `Q ${F(r.q, 1)}, ${r.gl} gl, p ${r.pQ < 0.001 ? "< 0,001" : "= " + F(r.pQ, 3)} · τ² ${F(r.tau2, 3)}` })}
        </div>
        <p class="llano">${esc(CA.textoMeta(r))}</p>
        ${forestSvg(r)}
        ${avisosCalc(CA.trampasMeta(r))}
        <details class="calc-mas"><summary>Sesgo de publicación: gráfico en embudo y prueba de Egger</summary>${funnelSvg(r)}
          ${r.egger ? `<p class="calc-ayuda">Prueba de Egger: intercepto ${F(r.egger.b0, 2)} (IC 90 %: ${F(r.egger.inf90, 2)} a ${F(r.egger.sup90, 2)}), p = ${F(r.egger.p, 3)}. Un intercepto lejos de 0 (p &lt; 0,10) indica asimetría: pueden faltar estudios pequeños sin efecto. Con menos de 10 estudios, la prueba tiene poca potencia.</p>` : `<p class="calc-ayuda">La prueba de Egger necesita al menos 3 estudios.</p>`}</details>`;
    }
    if (tipo === "umbrales") return `<div class="res-grid res-grid--2">${resBox("Umbral diagnóstico", P(r.dx), "", { sub: "por debajo, ni prueba ni tratamiento" })}${resBox("Umbral terapéutico", P(r.tx), "", { sub: "por encima, tratar sin la prueba" })}</div>
      ${umbralSvg(r)}${r.decision ? `<p class="llano"><b>Con tu paciente (${P(r.pre)}):</b> ${esc(CA.DECISION_UMBRAL[r.decision])}</p>` : ""}${!r.util ? `<div class="warn">⚠ El umbral diagnóstico supera al terapéutico: con estos riesgos y beneficios la prueba no aporta; la decisión depende solo de la probabilidad.</div>` : ""}`;
    if (tipo === "kappa") return `<div class="res-grid">${resBox("Índice kappa", F(r.kappa.v), IC(r.kappa), { main: true, sub: `concordancia ${CA.kappaFuerza(r.kappa.v)}` })}${resBox("Concordancia observada", P(r.po), "", { sub: `esperada por azar: ${P(r.pe)}` })}${r.k > 2 ? resBox("Kappa ponderado (lineal)", F(r.kappaW), "", { sub: `concordancia ${CA.kappaFuerza(r.kappaW)}` }) : ""}</div>
      <p class="calc-ayuda">Escala de Landis y Koch: hasta 0,20 insignificante; 0,21-0,40 débil; 0,41-0,60 moderada; 0,61-0,80 buena; más de 0,80 muy buena.</p>`;
    return "";
  }
  // Diagrama de bosque: un cuadrado por estudio (tamaño = peso) con su intervalo, y los rombos del efecto combinado
  // compacto: para pantallas estrechas (sin las columnas de cifras, que van en la tabla de debajo)
  function forestSvg(r, compacto) {
    if (compacto === undefined) return `<div class="forest-ancho">${forestSvg(r, false)}</div><div class="forest-estrecho">${forestSvg(r, true)}</div>
      <details class="calc-mas"><summary>Las cifras de cada estudio</summary><div class="tabla-scroll"><table class="tabla-res"><thead><tr><th>Estudio</th><th>${esc(CA.MEDIDAS_META[r.medida].nom)} (IC 95 %)</th><th>Peso fijo</th><th>Peso aleatorio</th></tr></thead><tbody>${r.estudios.map(e => `<tr><td>${esc(e.nombre)}</td><td>${CA.fmt(e.v, 2)} (${CA.fmt(e.inf, 2)} a ${CA.fmt(e.sup, 2)})</td><td>${CA.fmt(e.peso * 100, 1)} %</td><td>${CA.fmt(e.pesoAl * 100, 1)} %</td></tr>`).join("")}</tbody></table></div></details>`;
    const M = CA.MEDIDAS_META[r.medida], E = r.estudios, filas = E.length + 3, H = 28 * filas + 40, W = compacto ? 400 : 680, x0 = compacto ? 132 : 190, x1 = compacto ? 388 : 470;
    const vals = E.flatMap(e => [e.inf, e.sup]).concat([r.aleatorio.inf, r.aleatorio.sup, r.fijo.inf, r.fijo.sup, r.nula]).filter(v => isFinite(v) && (!M.log || v > 0));
    const T = M.log ? Math.log : (v => v), lo0 = T(Math.min(...vals)), hi0 = T(Math.max(...vals)), mg = (hi0 - lo0) * 0.06 || 0.1, lo = lo0 - mg, hi = hi0 + mg;
    const X = v => x0 + (T(v) - lo) / (hi - lo) * (x1 - x0), clip = v => Math.max(x0, Math.min(x1, X(v)));
    const ticks = M.log ? [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100].filter(v => T(v) >= lo && T(v) <= hi) : (() => { const paso = Math.pow(10, Math.floor(Math.log10((hi - lo) / 4))), p = [1, 2, 5].map(m => m * paso).find(m => (hi - lo) / m <= 6) || paso * 10, l = []; for (let v = Math.ceil(lo / p) * p; v <= hi; v += p) l.push(Number(v.toFixed(10))); return l; })();
    const wmax = Math.max(...E.map(e => e.peso)), f = v => CA.fmt(v, 2), lmax = compacto ? 17 : 24, nom = s => esc(s.length > lmax ? s.slice(0, lmax - 1) + "…" : s);
    const fila = (e, i) => { const y = 34 + i * 28, lado = 4 + 10 * Math.sqrt(e.peso / wmax); return `<text x="8" y="${y + 4}" class="fo-txt">${nom(e.nombre)}</text><line x1="${clip(e.inf)}" x2="${clip(e.sup)}" y1="${y}" y2="${y}" class="fo-ic"/><rect x="${X(e.v) - lado / 2}" y="${y - lado / 2}" width="${lado}" height="${lado}" class="fo-cuad"/>${compacto ? "" : `<text x="${x1 + 12}" y="${y + 4}" class="fo-num">${f(e.v)} [${f(e.inf)}; ${f(e.sup)}]</text><text x="${W - 8}" y="${y + 4}" text-anchor="end" class="fo-num">${CA.fmt(e.peso * 100, 1)} %</text>`}`; };
    const rombo = (R, i, et, cl) => { const y = 34 + i * 28; return `<text x="8" y="${y + 4}" class="fo-txt fo-txt--b">${compacto ? et.replace("Efectos ", "") : et}${compacto ? ` ${f(R.v)}` : ""}</text><polygon points="${clip(R.inf)},${y} ${X(R.v)},${y - 7} ${clip(R.sup)},${y} ${X(R.v)},${y + 7}" class="fo-rombo fo-rombo--${cl}"/>${compacto ? "" : `<text x="${x1 + 12}" y="${y + 4}" class="fo-num fo-txt--b">${f(R.v)} [${f(R.inf)}; ${f(R.sup)}]</text>`}`; };
    const yEje = 34 + (E.length + 2) * 28 - 6;
    return `<figure class="forest${compacto ? " forest--c" : ""}"><div class="tabla-scroll"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Diagrama de bosque: ${E.length} estudios; efecto combinado ${f(r.aleatorio.v)} (${f(r.aleatorio.inf)} a ${f(r.aleatorio.sup)})">
      <text x="8" y="14" class="fo-tit">Estudio</text><text x="${(x0 + x1) / 2}" y="14" text-anchor="middle" class="fo-tit">${esc(compacto ? M.nom.replace(/ \(.*\)$/, "") : M.nom + " (IC 95 %)")}</text>${compacto ? "" : `<text x="${W - 8}" y="14" text-anchor="end" class="fo-tit">Peso</text>`}
      <line x1="${X(r.nula)}" x2="${X(r.nula)}" y1="22" y2="${yEje}" class="fo-nula"/>
      ${E.map(fila).join("")}
      ${rombo(r.fijo, E.length, "Efectos fijos", "fijo")}${rombo(r.aleatorio, E.length + 1, "Efectos aleatorios", "al")}
      <line x1="${x0}" x2="${x1}" y1="${yEje}" y2="${yEje}" class="fo-eje"/>
      ${ticks.map(v => `<line x1="${X(v)}" x2="${X(v)}" y1="${yEje}" y2="${yEje + 4}" class="fo-eje"/><text x="${X(v)}" y="${yEje + 15}" text-anchor="middle" class="fo-num">${CA.fmt(v, 2)}</text>`).join("")}
      <text x="${X(r.nula) - 6}" y="${H - 4}" text-anchor="end" class="fo-lado">← a favor de la intervención</text><text x="${X(r.nula) + 6}" y="${H - 4}" class="fo-lado">a favor del control →</text>
    </svg></div><figcaption>Diagrama de bosque. Cada cuadrado es un estudio (más grande cuanto más peso) y su raya, el intervalo; los rombos son el efecto combinado. La línea vertical es el «sin efecto».${["dm", "hedges", "cohen", "glass"].includes(r.medida) ? " Si un valor alto es mejor, los lados se invierten." : ""}</figcaption></figure>`;
  }
  // Gráfico en embudo: efecto (x) frente a error estándar (y, invertido), con los límites del 95 % alrededor del efecto fijo
  function funnelSvg(r) {
    const M = CA.MEDIDAS_META[r.medida], E = r.estudios, W = 420, H = 280, m = 36, T = M.log ? Math.log : (v => v);
    const seMax = Math.max(...E.map(e => e.se)) * 1.1, c = r.fijo.th, xs = E.map(e => e.th).concat([c - 1.96 * seMax, c + 1.96 * seMax]), lo = Math.min(...xs), hi = Math.max(...xs);
    const X = t => m + (t - lo) / (hi - lo) * (W - 2 * m), Y = s => 14 + s / seMax * (H - m - 14);
    return `<figure class="funnel"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico en embudo de ${E.length} estudios">
      <polygon points="${X(c)},${Y(0)} ${X(c - 1.96 * seMax)},${Y(seMax)} ${X(c + 1.96 * seMax)},${Y(seMax)}" class="fu-cono"/>
      <line x1="${X(c)}" x2="${X(c)}" y1="${Y(0)}" y2="${Y(seMax)}" class="fo-nula"/>
      ${E.map(e => `<circle cx="${X(e.th)}" cy="${Y(e.se)}" r="5" class="fu-pt"><title>${esc(e.nombre)}</title></circle>`).join("")}
      <line x1="${m}" x2="${W - m}" y1="${Y(seMax)}" y2="${Y(seMax)}" class="fo-eje"/><line x1="${m}" x2="${m}" y1="${Y(0)}" y2="${Y(seMax)}" class="fo-eje"/>
      <text x="${W / 2}" y="${H - 6}" text-anchor="middle" class="fo-num">${M.log ? "ln " : ""}${esc(M.nom.toLowerCase())}</text><text x="12" y="${H / 2}" transform="rotate(-90 12 ${H / 2})" text-anchor="middle" class="fo-num">error estándar</text>
    </svg><figcaption>Sin sesgo de publicación, los estudios forman un embudo simétrico: los grandes (arriba) cerca del efecto y los pequeños (abajo) repartidos a los dos lados.</figcaption></figure>`;
  }
  // Barra de 0 a 100 % con los dos umbrales y tu paciente
  function umbralSvg(r) {
    const W = 600, X = p => 20 + Math.max(0, Math.min(1, p)) * (W - 40), dx = Math.max(0, Math.min(1, r.dx)), tx = Math.max(0, Math.min(1, r.tx));
    return `<figure class="umbral-fig"><svg viewBox="0 0 ${W} 74" role="img" aria-label="Umbral diagnóstico ${CA.pct(r.dx)}, umbral terapéutico ${CA.pct(r.tx)}">
      <rect x="${X(0)}" y="22" width="${X(Math.min(dx, tx)) - X(0)}" height="16" class="um-no"/>
      ${dx < tx ? `<rect x="${X(dx)}" y="22" width="${X(tx) - X(dx)}" height="16" class="um-prueba"/>` : ""}
      <rect x="${X(Math.max(dx, tx))}" y="22" width="${X(1) - X(Math.max(dx, tx))}" height="16" class="um-tratar"/>
      <text x="${X(0)}" y="56" class="fo-num">0 %</text><text x="${X(1)}" y="56" text-anchor="end" class="fo-num">100 %</text>
      <text x="${X(dx)}" y="16" text-anchor="middle" class="fo-num">${CA.pct(r.dx, 0)}</text><text x="${X(tx)}" y="16" text-anchor="middle" class="fo-num">${CA.pct(r.tx, 0)}</text>
      ${r.pre >= 0 && r.pre <= 1 ? `<polygon points="${X(r.pre)},40 ${X(r.pre) - 6},50 ${X(r.pre) + 6},50" class="um-pac"/><text x="${X(r.pre)}" y="66" text-anchor="middle" class="fo-txt--b fo-num">tu paciente</text>` : ""}
    </svg><figcaption><span class="um-ley um-no"></span>ni prueba ni tratamiento · <span class="um-ley um-prueba"></span>hacer la prueba · <span class="um-ley um-tratar"></span>tratar sin la prueba</figcaption></figure>`;
  }
  // x: la calculadora (o la suelta) con sus niveles, estudios y tabla
  function calcForm(tipo, e, x, bind) {
    const niveles = x.niveles || [];
    if (["supervivencia", "metaanalisis", "umbrales", "kappa"].includes(tipo)) return formFase2(tipo, e, x, bind);
    if (tipo === "tratamiento") return `
      <div class="tabla-calc tabla-calc--3"><span></span><b>Grupo control<small>o no expuestos</small></b><b>Grupo intervención<small>o expuestos</small></b>
        <span>Incluidos</span>${cIn(bind, "nc", e.nc, { aria: "Incluidos en el grupo control" })}${cIn(bind, "ne", e.ne, { aria: "Incluidos en el grupo intervención" })}
        <span>Perdidos <small>(opcional)</small></span>${cIn(bind, "pc", e.pc, { aria: "Perdidos en el grupo control", ph: "0" })}${cIn(bind, "pe", e.pe, { aria: "Perdidos en el grupo intervención", ph: "0" })}
        <span>Con el evento</span>${cIn(bind, "ec", e.ec, { aria: "Con el evento en el grupo control" })}${cIn(bind, "ee", e.ee, { aria: "Con el evento en el grupo intervención" })}</div>
      <p class="calc-ayuda">Los evaluados son los incluidos menos los perdidos. Si el artículo da porcentajes, multiplica: 12 % de 150 = 18.</p>
      <details class="calc-mas"${lleno(e.peer) || lleno(e.f) ? " open" : ""}><summary>NNT para tu paciente</summary>
        <div class="tabla-calc tabla-calc--2"><span>Su riesgo sin tratar, en % (PEER)</span>${cIn(bind, "peer", e.peer, { modo: "decimal", ph: "p. ej. 5", aria: "Riesgo basal de tu paciente" })}
        <span>O bien: cuántas veces más riesgo tiene que el grupo control (F)</span>${cIn(bind, "f", e.f, { modo: "decimal", ph: "p. ej. 2", aria: "Factor F" })}</div></details>`;
    if (tipo === "or") return `
      <div class="tabla-calc tabla-calc--3"><span></span><b>Casos<small>con el desenlace</small></b><b>Controles<small>sin el desenlace</small></b>
        <span>Expuestos</span>${cIn(bind, "a", e.a, { aria: "Casos expuestos" })}${cIn(bind, "b", e.b, { aria: "Controles expuestos" })}
        <span>No expuestos</span>${cIn(bind, "c", e.c, { aria: "Casos no expuestos" })}${cIn(bind, "d", e.d, { aria: "Controles no expuestos" })}</div>`;
    const prePost = `<div class="tabla-calc tabla-calc--2">
        <span>Probabilidad antes de la prueba en tu medio, en %${tipo === "bayes" ? "" : " <small>(opcional: si no, la del estudio)</small>"}</span>${cIn(bind, "pre", e.pre, { modo: "decimal", ph: tipo === "bayes" ? "p. ej. 20" : "la del estudio", aria: "Probabilidad antes de la prueba" })}
        <span>Tu umbral de acción, en % <small>(opcional: por encima tratarías)</small></span>${cIn(bind, "umbral", e.umbral, { modo: "decimal", ph: "p. ej. 50", aria: "Umbral de acción" })}</div>`;
    if (tipo === "diagnostico") return `
      <div class="tabla-calc tabla-calc--3"><span></span><b>Con la enfermedad<small>prueba de referencia +</small></b><b>Sin la enfermedad<small>prueba de referencia −</small></b>
        <span>Prueba positiva</span>${cIn(bind, "a", e.a, { aria: "Verdaderos positivos (a)", ph: "a" })}${cIn(bind, "b", e.b, { aria: "Falsos positivos (b)", ph: "b" })}
        <span>Prueba negativa</span>${cIn(bind, "c", e.c, { aria: "Falsos negativos (c)", ph: "c" })}${cIn(bind, "d", e.d, { aria: "Verdaderos negativos (d)", ph: "d" })}</div>
      ${prePost}`;
    if (tipo === "bayes") return `
      <div class="tabla-calc tabla-calc--2"><span>Sensibilidad, en %</span>${cIn(bind, "s", e.s, { modo: "decimal", ph: "p. ej. 85", aria: "Sensibilidad" })}
        <span>Especificidad, en %</span>${cIn(bind, "e", e.e, { modo: "decimal", ph: "p. ej. 90", aria: "Especificidad" })}</div>${prePost}`;
    if (tipo === "niveles") return `
      <div class="tabla-niv"><b>Nivel o resultado</b><b>Con la enfermedad</b><b>Sin la enfermedad</b><span></span>
        ${niveles.map((n, i) => `<input class="txt-in calc-in calc-in--txt" ${bind} data-nv="${i}" data-f="nombre" value="${esc(n.nombre)}" placeholder="Nivel ${i + 1}" aria-label="Nombre del nivel ${i + 1}" autocomplete="off" />
          <input class="txt-in calc-in" ${bind} data-nv="${i}" data-f="a" value="${esc(n.a)}" inputmode="numeric" aria-label="Con la enfermedad, nivel ${i + 1}" autocomplete="off" />
          <input class="txt-in calc-in" ${bind} data-nv="${i}" data-f="b" value="${esc(n.b)}" inputmode="numeric" aria-label="Sin la enfermedad, nivel ${i + 1}" autocomplete="off" />
          <button type="button" class="icon-btn icon-btn--mini" data-act="nivel-del" ${bind} data-nv="${i}" aria-label="Quitar el nivel"${niveles.length <= 2 ? " disabled" : ""}>✕</button>`).join("")}</div>
      ${niveles.length < 5 ? `<button type="button" class="btn btn--ghost" data-act="nivel-nuevo" ${bind}>+ Añadir nivel</button>` : ""}
      <div class="tabla-calc tabla-calc--2"><span>Probabilidad antes de la prueba en tu medio, en % <small>(opcional)</small></span>${cIn(bind, "pre", e.pre, { modo: "decimal", ph: "la del estudio", aria: "Probabilidad antes de la prueba" })}</div>`;
    if (tipo === "cei") return `
      <div class="tabla-calc tabla-calc--3"><span></span><b>Alternativa nueva</b><b>Alternativa habitual</b>
        <span>Coste por paciente (€)</span>${cIn(bind, "cn", e.cn, { modo: "decimal", aria: "Coste de la nueva" })}${cIn(bind, "ch", e.ch, { modo: "decimal", aria: "Coste de la habitual" })}
        <span>Efecto por paciente</span>${cIn(bind, "en", e.en, { modo: "decimal", aria: "Efecto de la nueva" })}${cIn(bind, "eh", e.eh, { modo: "decimal", aria: "Efecto de la habitual" })}</div>
      <div class="tabla-calc tabla-calc--2"><span>Unidad del efecto</span><input class="txt-in calc-in calc-in--txt" ${bind} data-f="unidad" value="${esc(e.unidad)}" placeholder="AVAC, año de vida, caso evitado…" aria-label="Unidad del efecto" autocomplete="off" /></div>`;
    return "";
  }
  function calcRes(tipo, e, x, nombre) {
    const niveles = x.niveles || [], r = CA.calcular(tipo, Object.assign({}, e, { niveles, estudios: x.estudios || [], matriz: x.matriz || [] }));
    if (!r.ok) return r.errores.length && Object.values(e).some(lleno) ? `<div class="note">ℹ ${esc(r.errores[0])}</div>` : `<p class="calc-vacia">Escribe los datos y verás aquí los resultados.</p>`;
    const F = CA.fmt, P = CA.pct, IC = CA.icTxt;
    if (["supervivencia", "metaanalisis", "umbrales", "kappa"].includes(tipo)) return resFase2(tipo, e, r, nombre);
    if (tipo === "tratamiento") {
      const n = r.nnt, peer = CA.porc(e.peer), f = CA.num(e.f);
      const ancho = CA.incluye(r.rr, 1) || r.rr.sup / r.rr.inf > 4;
      const tm = `${L.URL_TM}#/dos-proporciones?d=${encodeURIComponent(JSON.stringify({ p1: F(r.rc.v * 100, 1).replace(",", "."), efecto: "p2", p2: F(r.re.v * 100, 1).replace(",", ".") }))}`;
      const sens = (r.perdidas.c || r.perdidas.e) ? sensHtml(e, r) : "";
      return `<div class="res-grid">
          ${resBox("Riesgo control", P(r.rc.v), IC(r.rc, P))}${resBox("Riesgo intervención", P(r.re.v), IC(r.re, P))}
          ${resBox("Riesgo relativo (RR)", F(r.rr.v), IC(r.rr))}${resBox(r.rrr.v >= 0 ? "Reducción relativa (RRR)" : "Aumento relativo", P(Math.abs(r.rrr.v), 0), r.rrr.v >= 0 ? IC(r.rrr, P) : IC({ inf: -r.rrr.sup, sup: -r.rrr.inf }, P))}
          ${resBox(r.rar.v >= 0 ? "Reducción absoluta (RAR)" : "Aumento absoluto", P(Math.abs(r.rar.v)), r.rar.v >= 0 ? IC(r.rar, P) : IC({ inf: -r.rar.sup, sup: -r.rar.inf }, P))}
          ${resBox(n.v === Infinity ? "NNT" : n.tipo === "NNTB" ? "NNT para beneficiar (NNTB)" : "NNT para dañar (NNTD)", n.v === Infinity ? "∞" : F(Math.ceil(n.v), 0), n.cruza ? `NNTB ${F(n.nntb, 1)} a ∞ a NNTD ${F(n.nntd, 1)}` : `${F(n.inf, 1)} a ${F(n.sup, 1)}`, { main: true, sub: n.v === Infinity ? "" : "se redondea hacia arriba" })}
          ${resBox("Odds ratio (OR)", F(r.or.v), IC(r.or))}
        </div>
        <p class="llano">${esc(CA.textoTratamiento(r, nombre))}</p>
        ${pictograma(r)}
        ${peer > 0 || f > 0 ? `<div class="res-grid res-grid--2">${peer > 0 ? resBox("NNT para tu paciente (con su riesgo)", isFinite(CA.nntPaciente(peer, r.rrr.v)) ? F(Math.ceil(CA.nntPaciente(peer, r.rrr.v)), 0) : "—", "", { sub: `Riesgo sin tratar ${P(peer)} × RRR ${P(Math.abs(r.rrr.v), 0)}` }) : ""}${f > 0 ? resBox("NNT para tu paciente (con F)", F(Math.ceil(CA.nntConF(r.nnt.v, f)), 0), "", { sub: `NNT del estudio ÷ ${F(f)}` }) : ""}</div>` : ""}
        ${sens}
        ${avisosCalc(CA.trampasTratamiento(r))}
        ${ancho ? `<p class="calc-enlace">¿Tenía el estudio muestra suficiente? <a href="${tm}" target="_blank" rel="noopener">Calcúlalo en Tamaño Muestral ↗</a></p>` : ""}`;
    }
    if (tipo === "or") return `<div class="res-grid res-grid--2">${resBox("Odds ratio (OR)", F(r.or.v), IC(r.or), { main: true })}${resBox("Expuestos", `${P(r.expCasos, 0)} · ${P(r.expControles, 0)}`, "", { sub: "de los casos · de los controles" })}</div>
        <p class="llano">${esc(CA.textoOR(r))}</p>${avisosCalc(CA.trampasOR(r))}`;
    if (tipo === "diagnostico" || tipo === "bayes") {
      const umbral = CA.porc(e.umbral), dx = tipo === "diagnostico";
      const lineas = [{ lr: r.lrp.v, et: "Positivo", c: "pos" }, { lr: r.lrn.v, et: "Negativo", c: "neg" }];
      return `<div class="res-grid">
          ${dx ? resBox("Sensibilidad", P(r.s.v), IC(r.s, P)) + resBox("Especificidad", P(r.e.v), IC(r.e, P)) : ""}
          ${resBox("LR+ (cociente positivo)", F(r.lrp.v), dx ? IC(r.lrp) : "", { main: true, sub: CA.LR_FUERZA_TXT[CA.lrFuerza(r.lrp.v)] })}
          ${resBox("LR− (cociente negativo)", F(r.lrn.v), dx ? IC(r.lrn) : "", { main: true, sub: CA.LR_FUERZA_TXT[CA.lrFuerza(r.lrn.v)] })}
          ${dx ? resBox("Valor predictivo positivo", P(r.vpp.v), IC(r.vpp, P), { sub: "en la prevalencia del estudio" }) + resBox("Valor predictivo negativo", P(r.vpn.v), IC(r.vpn, P), { sub: "en la prevalencia del estudio" }) : ""}
        </div>
        <h4 class="calc-h">Tu paciente: antes y después de la prueba</h4>
        <div class="res-grid res-grid--3">
          ${resBox("Antes de la prueba", P(r.pre), "", { sub: dx && !r.prePropia ? "prevalencia del estudio" : "la que has escrito" })}
          ${resBox("Si da positivo", P(r.post.pos.v), dx ? IC(r.post.pos, P) : "", { main: true })}
          ${resBox("Si da negativo", P(r.post.neg.v), dx ? IC(r.post.neg, P) : "", { main: true })}
        </div>
        ${umbral > 0 && umbral < 1 ? `<p class="llano">${esc(umbralTxt(r, umbral))}</p>` : ""}
        ${faganSvg(r.pre, lineas, umbral)}
        ${dx ? `<details class="calc-mas"><summary>Más medidas</summary><div class="res-grid">${resBox("Odds ratio diagnóstica", F(r.ord.v, 1), IC(r.ord, x => F(x, 1)))}${resBox("Exactitud", P(r.exactitud.v), IC(r.exactitud, P))}${resBox("Prevalencia del estudio", P(r.prevalencia.v), IC(r.prevalencia, P))}${resBox("Índice de Youden", F(r.youden), "")}${resBox("Falsos positivos", P(r.pfp.v), IC(r.pfp, P))}${resBox("Falsos negativos", P(r.pfn.v), IC(r.pfn, P))}</div></details>` : ""}
        ${dx ? avisosCalc(CA.trampasDiagnostico(r)) : ""}`;
    }
    if (tipo === "niveles") return `<div class="tabla-scroll"><table class="tabla-res"><thead><tr><th>Nivel</th><th>LR (IC 95 %)</th><th>Si da este resultado</th></tr></thead><tbody>
        ${r.filas.map((x, i) => `<tr><td>${esc(x.nombre || "Nivel " + (i + 1))}</td><td><b>${F(x.lr.v)}</b> <small>${IC(x.lr)}</small><br><small>${esc(CA.LR_FUERZA_TXT[CA.lrFuerza(x.lr.v)])}</small></td><td><b>${P(x.post.v)}</b> <small>${IC(x.post, P)}</small></td></tr>`).join("")}</tbody></table></div>
        <p class="calc-ayuda">Probabilidad antes de la prueba: ${P(r.pre)}${r.prePropia ? "" : " (la del estudio)"}.${r.filas.some(x => x.cero) ? " Algún nivel tiene un 0: se suma 0,5 a ese nivel." : ""}</p>
        ${faganSvg(r.pre, r.filas.map((x, i) => ({ lr: x.lr.v, et: x.nombre || "Nivel " + (i + 1), c: "n" + i })), NaN)}`;
    if (tipo === "cei") return `<div class="res-grid res-grid--3">${resBox("Diferencia de coste", F(r.dC, 0) + " €", "")}${resBox("Diferencia de efecto", F(r.dE, 3), "", { sub: esc(e.unidad || "") })}${resBox("RCEI", isFinite(r.rcei) ? F(r.rcei, 0) + " €" : "—", "", { main: true, sub: isFinite(r.rcei) ? `por ${esc(e.unidad || "unidad de efecto")}` : "" })}</div>
        <p class="llano">${esc(CA.textoCEI(r, e.unidad))}</p><div class="note">ℹ ${esc(CA.CUADRANTES[r.cuadrante])}</div>`;
    return "";
  }
  function umbralTxt(r, u) {
    const P = CA.pct, pos = r.post.pos.v, neg = r.post.neg.v;
    if (r.pre >= u && neg >= u) return `Ya estás por encima de tu umbral (${P(u)}) y un negativo no te baja de él: la prueba no cambiará lo que haces.`;
    if (r.pre < u && pos < u) return `Estás por debajo de tu umbral (${P(u)}) y ni un positivo te hace cruzarlo: la prueba no cambiará lo que haces.`;
    return `Con tu umbral del ${P(u)}, ${r.pre < u ? "un positivo te hace cruzarlo" : "un negativo te baja de él"}: la prueba sí puede cambiar lo que haces.`;
  }
  const nntCorto = n => n.v === Infinity ? "∞" : `${n.tipo} ${CA.fmt(n.v, 1)} (${CA.nntIcTxt(n)})`;
  // Análisis de sensibilidad de las pérdidas: los tres supuestos
  function sensHtml(e, r) {
    const fila = (nom, x) => x && x.ok ? `<tr><td>${esc(nom)}</td><td>${CA.pct(x.rc.v)}</td><td>${CA.pct(x.re.v)}</td><td>${CA.pct(x.rar.v)}</td><td>${esc(nntCorto(x.nnt))}</td></tr>` : "";
    const sup = Object.keys(CA.SUPUESTOS).map(k => [k, CA.supuesto(e, k, r)]);
    const cambia = sup.some(([, x]) => x && x.ok && (Math.sign(x.rar.v) !== Math.sign(r.rar.v) || CA.incluye(x.rr, 1) !== CA.incluye(r.rr, 1)));
    return `<details class="calc-mas"${cambia ? " open" : ""}><summary>¿Y si los perdidos hubieran tenido el evento? (análisis de sensibilidad)</summary>
      <div class="tabla-scroll"><table class="tabla-res"><thead><tr><th>Supuesto</th><th>Riesgo control</th><th>Riesgo intervención</th><th>RAR</th><th>NNT</th></tr></thead><tbody>
        <tr class="fila-base"><td>Solo los evaluados</td><td>${CA.pct(r.rc.v)}</td><td>${CA.pct(r.re.v)}</td><td>${CA.pct(r.rar.v)}</td><td>${esc(nntCorto(r.nnt))}</td></tr>
        ${sup.map(([k, x]) => fila(CA.SUPUESTOS[k].nom, x)).join("")}</tbody></table></div>
      <p class="calc-ayuda">${Object.values(CA.SUPUESTOS).map(s => `<b>${esc(s.nom)}</b>: ${esc(s.txt)}`).join(" ")}</p>
      ${cambia ? `<div class="warn">⚠ La conclusión cambia según lo que les pasara a los perdidos: el resultado no es robusto.</div>` : `<div class="note">ℹ La conclusión se mantiene en todos los supuestos: el resultado es robusto frente a las pérdidas.</div>`}</details>`;
  }
  // 100 personas en cada grupo: las coloreadas tienen el evento
  function pictograma(r) {
    const bloque = (p, tit) => {
      const n = Math.round(p * 100);
      return `<figure class="picto"><svg viewBox="0 0 100 100" role="img" aria-label="${esc(tit)}: ${n} de cada 100">${Array.from({ length: 100 }, (_, i) => `<circle cx="${5 + (i % 10) * 10}" cy="${5 + Math.floor(i / 10) * 10}" r="3.6" class="${i < n ? "pic-si" : "pic-no"}"/>`).join("")}</svg><figcaption><b>${n}</b> de cada 100 · ${esc(tit)}</figcaption></figure>`;
    };
    return `<div class="pictos">${bloque(r.rc.v, "sin la intervención")}${bloque(r.re.v, "con la intervención")}</div>`;
  }
  // Nomograma de Fagan: probabilidad previa (izquierda), LR (centro) y posterior (derecha)
  function faganSvg(pre, lineas, umbral) {
    const W = 400, H = 400, M = 24, X = [70, 185, 290], g = CA.faganGeo(H, M), P = CA.pct;
    const pl = p => p * 100 >= 1 ? CA.fmt(p * 100, 1) : CA.fmt(p * 100, 1);
    const ejeP = (x, yf, lado) => CA.P_TICKS.map(p => `<line x1="${x - 4}" x2="${x + 4}" y1="${yf(p)}" y2="${yf(p)}" class="fg-tick"/><text x="${x + (lado < 0 ? -8 : 8)}" y="${yf(p) + 3}" text-anchor="${lado < 0 ? "end" : "start"}" class="fg-txt">${pl(p)}</text>`).join("");
    const ETQ_LR = [0.001, 0.01, 0.1, 0.5, 1, 2, 10, 100, 1000];   // en el eje central no caben todas las etiquetas
    const ejeLR = CA.LR_TICKS.map(v => `<line x1="${X[1] - 4}" x2="${X[1] + 4}" y1="${g.yLR(v)}" y2="${g.yLR(v)}" class="fg-tick"/>${ETQ_LR.includes(v) ? `<text x="${X[1] + 8}" y="${g.yLR(v) + 3}" class="fg-txt">${CA.fmt(v, 3)}</text>` : ""}`).join("");
    const lin = lineas.filter(x => isFinite(x.lr) && x.lr > 0).map(x => {
      const post = CA.bayes(pre, x.lr), y1 = g.yPre(pre), y2 = g.yPost(post);
      return `<line x1="${X[0]}" y1="${y1}" x2="${X[2]}" y2="${y2}" class="fg-lin fg-lin--${x.c}"/><circle cx="${X[2]}" cy="${y2}" r="4" class="fg-pt fg-pt--${x.c}"/><text x="${X[2] + 36}" y="${y2 + 4}" class="fg-et fg-et--${x.c}">${esc(x.et)} ${P(post, 0)}</text>`;
    }).join("");
    const um = umbral > 0 && umbral < 1 ? `<line x1="${X[2] - 24}" x2="${X[2] + 32}" y1="${g.yPost(umbral)}" y2="${g.yPost(umbral)}" class="fg-umbral"/><text x="${X[2] + 36}" y="${g.yPost(umbral) + 3}" class="fg-txt fg-txt--um">Umbral ${P(umbral, 0)}</text>` : "";
    const resumen = lineas.filter(x => isFinite(x.lr)).map(x => `${x.et}: ${P(CA.bayes(pre, x.lr))}`).join("; ");
    return `<figure class="fagan"><svg viewBox="0 0 ${W} ${H + 24}" role="img" aria-label="Nomograma de Fagan. Antes de la prueba ${P(pre)}. ${esc(resumen)}">
      <text x="${X[0]}" y="14" text-anchor="middle" class="fg-tit">Antes (%)</text><text x="${X[1]}" y="14" text-anchor="middle" class="fg-tit">LR</text><text x="${X[2]}" y="14" text-anchor="middle" class="fg-tit">Después (%)</text>
      <g transform="translate(0,16)">
        <line x1="${X[0]}" x2="${X[0]}" y1="${g.yPre(0.001)}" y2="${g.yPre(0.999)}" class="fg-eje"/><line x1="${X[1]}" x2="${X[1]}" y1="${g.yLR(1000)}" y2="${g.yLR(0.001)}" class="fg-eje"/><line x1="${X[2]}" x2="${X[2]}" y1="${g.yPost(0.999)}" y2="${g.yPost(0.001)}" class="fg-eje"/>
        ${ejeP(X[0], g.yPre, -1)}${ejeLR}${ejeP(X[2], g.yPost, 1).replace(/class="fg-txt"/g, 'class="fg-txt fg-txt--r"')}
        ${um}${lin}<circle cx="${X[0]}" cy="${g.yPre(pre)}" r="5" class="fg-pre"/>
      </g></svg><figcaption>Nomograma de Fagan: une la probabilidad antes de la prueba con el cociente de probabilidad y lee la de después.</figcaption></figure>`;
  }
  // Una calculadora dentro de una pregunta de la lectura
  function calcCard(l, c, q) {
    const bind = `data-calc="${c.id}"`, info = CA.CALCS[c.tipo];
    return `<div class="calc-card" data-calcid="${c.id}">
      <div class="calc-cab"><span class="calc-tag">🧮 ${esc(info.titulo)}</span><button type="button" class="icon-btn icon-btn--mini" data-act="calc-del" data-id="${c.id}" aria-label="Quitar esta calculadora">✕</button></div>
      ${["tratamiento", "supervivencia", "metaanalisis"].includes(c.tipo) ? `<input class="txt-in" ${bind} data-f="nombre" value="${esc(c.nombre)}" placeholder="Desenlace (por ejemplo, empeoramiento no detectado)" list="dl-des" aria-label="Desenlace" autocomplete="off" />` : ""}
      ${calcForm(c.tipo, c.entrada, c, bind)}
      <div data-zcalc="${c.id}">${calcRes(c.tipo, c.entrada, c, c.nombre)}</div>
      <div class="toolbar"><button type="button" class="btn" data-act="calc-usar" data-id="${c.id}" data-q="${q.id}">Usar en la respuesta</button></div>
    </div>`;
  }
  function calcResumen(l, c) {
    const r = L.resultadoCalculo(c);
    if (!r.ok) return "";
    const t = c.tipo === "tratamiento" ? `${c.nombre ? c.nombre + ": " : ""}RR ${CA.fmt(r.rr.v)} (${CA.icTxt(r.rr)}); RAR ${CA.pct(r.rar.v)} (${CA.icTxt(r.rar, CA.pct)}); ${CA.nntTxt(r.nnt)}`
      : c.tipo === "diagnostico" ? `LR+ ${CA.fmt(r.lrp.v)} (${CA.icTxt(r.lrp)}); LR− ${CA.fmt(r.lrn.v)} (${CA.icTxt(r.lrn)}); sensibilidad ${CA.pct(r.s.v)} (${CA.icTxt(r.s, CA.pct)}); especificidad ${CA.pct(r.e.v)} (${CA.icTxt(r.e, CA.pct)})`
      : c.tipo === "or" ? `OR ${CA.fmt(r.or.v)} (${CA.icTxt(r.or)})` : CA.textoCEI(r, c.entrada.unidad);
    return `<li>${esc(t)}</li>`;
  }
  // Lo que se pinta en una pregunta que usa una calculadora
  function calcEnPregunta(l, pl, q) {
    const tipo = CA.CALC_DE_PREGUNTA[q.calc]; if (!tipo) return "";
    const tipos = CA.CALCS_DE_PREGUNTA[q.calc], qs = L.preguntasDe(pl), primera = qs.find(x => CA.CALC_DE_PREGUNTA[x.calc] === tipo), cs = l.calculos.filter(c => tipos.includes(c.tipo));
    if (q.calc === "fagan") {
      const c = cs.map(x => ({ x, r: L.resultadoCalculo(x) })).find(y => y.r.ok);
      if (!c) return `<p class="calc-prox">🧮 Calcula antes los cocientes de probabilidad en la pregunta ${L.numeroDe(pl, primera.id)}: aquí verás el nomograma de Fagan con tu umbral de acción.</p>`;
      const u = CA.porc(c.x.entrada.umbral);
      return `<div class="calc-card"><span class="calc-tag">🧮 ¿Cambia lo que haces?</span>
        <p class="calc-ayuda">Probabilidad antes de la prueba: ${CA.pct(c.r.pre)}. Si da positivo, ${CA.pct(c.r.post.pos.v)}; si da negativo, ${CA.pct(c.r.post.neg.v)}. ${u > 0 && u < 1 ? esc(umbralTxt(c.r, u)) : `Escribe tu umbral de acción en la calculadora de la pregunta ${L.numeroDe(pl, primera.id)}.`}</p>
        ${faganSvg(c.r.pre, [{ lr: c.r.lrp.v, et: "Positivo", c: "pos" }, { lr: c.r.lrn.v, et: "Negativo", c: "neg" }], u)}</div>`;
    }
    if (primera.id !== q.id) {
      const res = cs.map(c => calcResumen(l, c)).join("");
      return res ? `<div class="calc-resumen"><span class="calc-tag">🧮 Lo que da la calculadora (pregunta ${L.numeroDe(pl, primera.id)})</span><ul>${res}</ul></div>` : `<p class="calc-prox">🧮 Usa la calculadora de la pregunta ${L.numeroDe(pl, primera.id)}: aquí verás sus intervalos de confianza.</p>`;
    }
    const btn = (t, i) => `<button type="button" class="btn ${cs.length || i ? "btn--ghost" : "btn--primary"}" data-act="calc-nuevo" data-tipo="${t}">${t === "supervivencia" ? "⏱ Supervivencia (hazard ratio)" : t === "niveles" ? "+ Prueba con varios niveles" : cs.length ? (t === "tratamiento" ? "+ Calcular otro desenlace" : "+ Otra calculadora") : "🧮 Abrir la calculadora"}</button>`;
    return `${cs.map(c => calcCard(l, c, q)).join("")}
      <div class="toolbar">${tipos.map(btn).join("")}</div>
      ${tipo === "tratamiento" && l.desenlaces.some(d => lleno(d.nombre)) ? `<datalist id="dl-des">${l.desenlaces.filter(d => lleno(d.nombre)).map(d => `<option value="${esc(d.nombre)}">`).join("")}</datalist>` : ""}`;
  }

  // ---------- Calculadoras sueltas ----------
  const sueltas = {};
  // Lo que viaja en el enlace: solo lo escrito
  const estadoSuelta = s => { const d = {}; Object.keys(s.entrada).forEach(k => { if (lleno(s.entrada[k])) d[k] = s.entrada[k]; }); if (s.niveles.some(n => lleno(n.a) || lleno(n.b) || lleno(n.nombre))) d.niveles = s.niveles; if (s.estudios.some(x => Object.values(x).some(lleno))) d.estudios = s.estudios; if (s.matriz.some(f => f.some(lleno))) d.matriz = s.matriz; if (lleno(s.nombre)) d.nombre = s.nombre; return d; };
  const suelta = tipo => sueltas[tipo] || (sueltas[tipo] = (({ entrada, niveles, estudios, matriz }) => ({ entrada, niveles, estudios, matriz, nombre: "" }))(L.nuevoCalculo("x", tipo)));
  function renderCalc(tipo, d) {
    if (!CA.CALCS[tipo]) {
      view.innerHTML = `
        <h1 class="page-title">Calcular</h1>
        <p class="page-lead">Las calculadoras de los resultados, sueltas. Dentro de una lectura aparecen en la pregunta donde se necesitan.</p>
        <div class="cuadro-lista cuadro-lista--2">${Object.entries(CA.CALCS).map(([k, c]) => `<a class="item-card item-main" href="#/calc/${k}"><b class="item-t">🧮 ${esc(c.titulo)}</b><span class="item-s">${esc(c.que)}</span></a>`).join("")}
</div>
        ${trampa("Una calculadora no arregla un mal estudio: primero, <b>¿es válido?</b> Los números de un estudio con sesgos son números sesgados.")}`;
      return;
    }
    const s = suelta(tipo);
    if (d) { try { const o = JSON.parse(d); Object.keys(s.entrada).forEach(k => { if (typeof o[k] === "string" || typeof o[k] === "number") s.entrada[k] = String(o[k]).slice(0, 40); }); if (Array.isArray(o.niveles)) s.niveles = o.niveles.slice(0, 5).map(n => ({ nombre: String(n.nombre || "").slice(0, 100), a: String(n.a || "").slice(0, 12), b: String(n.b || "").slice(0, 12) })); if (typeof o.nombre === "string") s.nombre = o.nombre.slice(0, 300);
      // Estudios y tabla del kappa: pasan por el mismo saneado que una calculadora guardada
      if (Array.isArray(o.estudios) || Array.isArray(o.matriz)) { const c = L.sanearLectura({ id: "x", calculos: [{ id: "x", tipo, estudios: o.estudios, matriz: o.matriz }] }, genId, hoy()).calculos[0]; if (c.estudios.length) s.estudios = c.estudios; if (c.matriz.length) s.matriz = c.matriz; } } catch (e) { /* enlace dañado */ } }
    const info = CA.CALCS[tipo], bind = `data-cs="${tipo}"`;
    const lecturas = datos.lecturas.slice().sort((a, b) => String(b.modificado).localeCompare(String(a.modificado)));
    view.innerHTML = `
      ${volver("#/calc", "Calcular")}
      <h1 class="page-title">${esc(info.titulo)}</h1>
      <p class="page-lead">${esc(info.que)}</p>
      ${facil(FACIL_CALC[tipo])}
      <div class="calc-card">
        ${tipo === "tratamiento" ? `<input class="txt-in" ${bind} data-f="nombre" value="${esc(s.nombre)}" placeholder="Desenlace (por ejemplo, ingreso en UCI)" aria-label="Desenlace" autocomplete="off" />` : ""}
        ${calcForm(tipo, s.entrada, s, bind)}
        <div data-zcalc="cs-${tipo}">${calcRes(tipo, s.entrada, s, s.nombre)}</div>
      </div>
      <div class="card">
        <h2 class="sub-h">Guardar o compartir</h2>
        ${lecturas.length ? `<div class="guardar-en"><select class="txt-in" id="cs-lectura" aria-label="Lectura">${lecturas.map(l => `<option value="${l.id}">${esc(L.corto(nombreLectura(l) || "Lectura sin título", 70))}</option>`).join("")}</select><button type="button" class="btn btn--primary" data-act="cs-guardar" data-tipo="${tipo}">Guardar en esta lectura</button></div>` : `<p class="field-sub">Cuando tengas una lectura, podrás guardar aquí el cálculo con ella.</p>`}
        <div class="toolbar"><button type="button" class="btn" data-act="cs-enlace" data-tipo="${tipo}">🔗 Copiar el enlace con los datos</button><button type="button" class="btn btn--ghost" data-act="cs-limpiar" data-tipo="${tipo}">Vaciar</button></div>
      </div>`;
  }
  const FACIL_CALC = {
    tratamiento: `<p>Compara cuántos tienen el evento en cada grupo:</p><ul><li><b>Riesgo relativo (RR)</b>: el riesgo con la intervención dividido entre el riesgo sin ella. RR 0,5 = la mitad de riesgo.</li><li><b>Reducción relativa (RRR)</b>: 1 − RR. Suena muy bien («reduce un 50 %») aunque el riesgo de partida sea pequeño.</li><li><b>Reducción absoluta (RAR)</b>: la resta de los dos riesgos. Es lo que de verdad ganan tus pacientes.</li><li><b>NNT</b>: 1 / RAR. A cuántos hay que tratar para evitar un evento. Cuanto más bajo, mejor.</li></ul><p>Mira siempre el <b>intervalo de confianza</b>: si el del RR incluye el 1, el resultado es compatible con que no haya efecto.</p>`,
    or: `<p>En un estudio de casos y controles no se pueden calcular riesgos (los investigadores eligen cuántos casos y controles hay), así que se compara la <b>odds</b> de exposición: la <b>odds ratio (OR)</b>.</p><p>OR mayor que 1: la exposición se asocia al desenlace; menor que 1: protege. Si el intervalo incluye el 1, la asociación podría no existir.</p>`,
    diagnostico: `<p>Una prueba no dice «sí» o «no»: <b>cambia la probabilidad</b> de que tu paciente tenga la enfermedad.</p><ul><li><b>Sensibilidad</b>: de los enfermos, cuántos dan positivo. <b>Especificidad</b>: de los sanos, cuántos dan negativo.</li><li>Los <b>cocientes de probabilidad (LR)</b> dicen cuánto mueve la probabilidad un resultado. LR+ mayor de 10 o LR− menor de 0,1: cambio grande.</li><li>Los <b>valores predictivos</b> dependen de la prevalencia: en tu medio pueden ser muy distintos a los del estudio.</li></ul><p>Con el <b>nomograma de Fagan</b> unes la probabilidad antes de la prueba con el LR y lees la de después.</p>`,
    niveles: `<p>Muchas pruebas no son solo positivas o negativas (una escala de 0 a 10, un valor de laboratorio por tramos). Partirlas en dos pierde información: es mejor un <b>cociente de probabilidad para cada nivel</b>.</p>`,
    bayes: `<p>Si el artículo solo da la sensibilidad y la especificidad, puedes calcular los cocientes de probabilidad (LR+ = S / (1 − E); LR− = (1 − S) / E) y, con la probabilidad que tiene tu paciente antes de la prueba, la de después.</p>`,
    supervivencia: `<p>Cuando importa <b>cuándo</b> ocurre el evento (muerte, recaída), se comparan curvas de supervivencia. El <b>hazard ratio (HR)</b> compara el riesgo instantáneo de evento en los dos grupos a lo largo del seguimiento: HR 0,70 = en cada momento, un 30 % menos de riesgo.</p><p>Muchos artículos no dan el HR. Con los métodos de Parmar se puede estimar con la p del log-rank y los eventos, con los observados y esperados, o, de forma aproximada, con las medianas.</p>`,
    metaanalisis: `<p>Un <b>metaanálisis</b> combina los resultados de varios estudios en una sola cifra, dando más peso a los más precisos.</p><ul><li><b>Efectos fijos</b>: supone que todos los estudios miden el mismo efecto.</li><li><b>Efectos aleatorios</b> (DerSimonian-Laird): admite que el efecto varíe de un estudio a otro; su intervalo es más ancho y más honesto si hay heterogeneidad.</li><li><b>I²</b>: cuánto discrepan los estudios más allá del azar. Más del 50 %, mucho.</li><li>El <b>embudo</b> y la prueba de <b>Egger</b> buscan sesgo de publicación.</li></ul>`,
    umbrales: `<p>Una prueba solo merece la pena si su resultado puede cambiar lo que haces. Con los riesgos y beneficios del tratamiento y de la prueba salen dos umbrales (Pauker y Kassirer):</p><ul><li>Por debajo del <b>umbral diagnóstico</b>, la enfermedad es tan poco probable que ni se hace la prueba ni se trata.</li><li>Por encima del <b>umbral terapéutico</b>, es tan probable que se trata sin hacer la prueba.</li><li>Entre los dos, se hace la prueba y se decide según su resultado.</li></ul>`,
    kappa: `<p>El <b>índice kappa</b> mide si dos observadores (o dos pruebas) coinciden más de lo que coincidirían por azar: 0 = como el azar, 1 = acuerdo perfecto.</p><p>Importa en las pruebas que dependen de quien las interpreta (una radiografía, una escala): si la concordancia es mala, en tu medio la prueba funcionará peor que en el estudio.</p>`,
    cei: `<p>La <b>razón de coste-efectividad incremental (RCEI)</b> es lo que cuesta de más cada unidad de efecto que se gana con la alternativa nueva: diferencia de costes ÷ diferencia de efectos.</p><p>Si la nueva cuesta menos y consigue más, <b>domina</b>: no hace falta calcular nada. Si cuesta más y consigue más, hay que decidir si la RCEI merece la pena (por ejemplo, frente a un umbral por AVAC).</p>`
  };

  // ---------- Paso 7 · Veredicto ----------
  function paso7(l) {
    const pl = L.plantilla(l.plantilla), prop = L.decisionPropuesta(l), d = l.veredicto.decision, msg = L.mensajeSugerido(l);
    return `<p class="page-lead">${L.PASOS[6].que}</p>
      ${facil(`<p>Termina siempre con una de tres decisiones, y anótala con la referencia:</p><ul>${Object.values(L.DECISIONES).map(x => `<li><b>${x.nom}</b>: ${esc(x.txt.charAt(0).toLowerCase() + x.txt.slice(1))}</li>`).join("")}</ul><p>La app te propone una a partir de tus respuestas, pero <b>decides tú</b>.</p>`)}
      ${pl ? `<div class="card"><h2 class="sub-h">Semáforo</h2><div class="semaforos">${["validez", "resultados", "aplicabilidad"].map(b => semCard(l, b)).join("")}</div></div>` : (l.filtro.responde === "no" ? `<div class="note">ℹ Lo descartaste en el filtro de dos minutos: no responde a tu pregunta.</div>` : `<div class="note">ℹ Sin tipo de estudio no hay semáforo. <a href="#/lectura/${l.id}/3">Elígelo en el paso 3</a>.</div>`)}
      <div class="card">
        <h2 class="sub-h">Tu decisión</h2>
        <div data-zona="propuesta">${propuestaHtml(prop)}</div>
        <div class="decisiones">${Object.entries(L.DECISIONES).map(([k, x]) => `<button type="button" class="dec-card dec-card--${k}${d === k ? " active" : ""}" data-act="decision" data-v="${k}" aria-pressed="${d === k}"><b>${x.nom}</b><span>${esc(x.txt)}</span></button>`).join("")}</div>
        ${campo(l, "veredicto.motivo", "Motivo", { area: true, rows: 2, ph: prop.motivo || "Por qué decides esto" })}
      </div>
      <div data-zona="avisos">${L.avisos(l, 7).map(avisoHtml).join("")}</div>
      <div class="card">
        <h2 class="sub-h">Qué hacemos ahora</h2>
        <p class="field-sub">Quién hace qué y cuándo: buscar una revisión, llevarlo a la comisión, medirlo con un ciclo de mejora…</p>
        ${l.veredicto.acciones.map(a => `<div class="fila-acc">
          <input class="txt-in" data-acc="${a.id}" data-f="que" value="${esc(a.que)}" placeholder="Qué" autocomplete="off" />
          <input class="txt-in" data-acc="${a.id}" data-f="quien" value="${esc(a.quien)}" placeholder="Quién (cargo o perfil)" autocomplete="off" />
          <input class="txt-in" data-acc="${a.id}" data-f="cuando" value="${esc(a.cuando)}" placeholder="Cuándo" autocomplete="off" />
          <button type="button" class="icon-btn icon-btn--mini" data-act="del-acc" data-id="${a.id}" aria-label="Quitar">✕</button></div>`).join("")}
        <button type="button" class="btn btn--ghost" data-act="nueva-acc">+ Añadir</button>
      </div>
      <div class="card">
        ${campo(l, "veredicto.mensaje", "Mensaje para llevar", { area: true, rows: 2, sub: "Una frase con la idea principal, para la sesión o para el equipo.", extra: `<div data-zona="msg">${msg && !lleno(l.veredicto.mensaje) ? `<div class="sugerida"><span>Propuesta: «${esc(msg)}»</span> <button type="button" class="link-btn" data-act="usar-mensaje">Usarla</button></div>` : ""}</div>` })}
        ${campo(l, "notas", "Notas", { area: true, rows: 3, opt: true })}
      </div>
      <h2 class="sec-t">Ficha de la lectura</h2>
      <p class="field-sub">Una página para la sesión bibliográfica o el club de lectura: la pregunta, cada respuesta, los resultados, el semáforo y la decisión.</p>
      ${btnDocs(`#/lectura/${l.id}/7`)}
      ${modoEjemplo ? "" : sesionesDeLecturaHtml(l)}`;
  }
  function sesionesDeLecturaHtml(l) {
    const en = datos.sesiones.filter(x => x.lecturas.includes(l.id)), otras = datos.sesiones.filter(x => !x.lecturas.includes(l.id));
    return `<div class="card"><h2 class="sub-h">Sesión bibliográfica</h2>
      ${en.length ? `<p class="field-sub">Forma parte de: ${en.map(x => `<a href="#/sesion/${x.id}">${esc(x.titulo || "Sesión sin título")}</a>`).join(", ")}.</p>` : `<p class="field-sub">Junta esta lectura con otras sobre la misma pregunta para sacar una conclusión conjunta.</p>`}
      <div class="toolbar">${otras.length ? `<select class="txt-in" id="ses-de-lec" aria-label="Sesión">${otras.map(x => `<option value="${x.id}">${esc(L.corto(x.titulo || "Sesión sin título", 60))}</option>`).join("")}</select><button type="button" class="btn" data-act="lec-a-ses">Añadir a esta sesión</button>` : ""}<button type="button" class="btn" data-act="lec-nueva-ses">+ Nueva sesión con esta lectura</button></div></div>`;
  }
  const propuestaHtml = prop => prop.decision ? `<div class="propuesta propuesta--${prop.decision}"><span>Propuesta de la app</span><b>${esc(L.DECISIONES[prop.decision].nom)}</b><p>${esc(prop.motivo)}</p></div>` : `<div class="propuesta"><span>Propuesta de la app</span><p>${esc(prop.motivo)}</p></div>`;
  function semCard(l, b) {
    const s = L.semaforo(l, b), m = l.veredicto.semaforo[b], p = s.propuesto;
    return `<div class="sem-card">
      <div class="sem-cab"><b>${esc(PL.BLOQUES[b].titulo)}</b><a href="#/lectura/${l.id}/${L.BLOQUE_PASO[b]}">Paso ${L.BLOQUE_PASO[b]}</a></div>
      <p class="sem-luz">${luz(s.color, COLOR_TXT[s.color])}</p>
      <p class="sem-mot">${esc(p.color ? `Propuesto: ${COLOR_TXT[p.color].toLowerCase()}. ${p.motivo}` : p.motivo)}</p>
      <div class="seg seg--mini seg--luz" role="group"><button type="button" class="${!m ? "active" : ""}" data-act="sem" data-b="${b}" data-v="">Propuesta</button>${["verde", "ambar", "rojo"].map(c => `<button type="button" class="seg-${c}${m === c ? " active" : ""}" data-act="sem" data-b="${b}" data-v="${c}">${COLOR_TXT[c]}</button>`).join("")}</div>
      ${m ? `<input class="txt-in" data-k="veredicto.motivoSemaforo.${b}" value="${esc(l.veredicto.motivoSemaforo[b])}" placeholder="${p.color ? "¿Por qué lo cambias?" : "Motivo (opcional)"}" autocomplete="off" />` : ""}
    </div>`;
  }

  const RENDER = { 1: paso1, 2: paso2, 3: paso3, 4: l => pasoBloque(l, 4), 5: l => pasoBloque(l, 5), 6: l => pasoBloque(l, 6), 7: paso7 };

  // Repinta solo las zonas que dependen de lo escrito (sin perder el foco)
  function refrescar() {
    const l = actual; if (!l) return;
    const n = pasoActual, bloque = L.PASO_BLOQUE[n];
    const Z = {
      pasos: () => pasosInner(l, n),
      avisos: () => L.avisos(l, n).map(avisoHtml).join(""),
      sugerida: () => sugeridaHtml(l, L.preguntaSugerida(l)),
      pubmed: () => pubmedHtml(l),
      sembloque: () => bloque ? semBloqueHtml(l, bloque) : "",
      propuesta: () => propuestaHtml(L.decisionPropuesta(l)),
      msg: () => { const m = L.mensajeSugerido(l); return m && !lleno(l.veredicto.mensaje) ? `<div class="sugerida"><span>Propuesta: «${esc(m)}»</span> <button type="button" class="link-btn" data-act="usar-mensaje">Usarla</button></div>` : ""; }
    };
    $$("[data-zona]").forEach(el => { const f = Z[el.dataset.zona]; if (f) el.innerHTML = f(); });
    $$("[data-pq]").forEach(el => {
      const q = L.preguntasDe(L.plantilla(l.plantilla)).find(x => x.id === el.dataset.pq); if (!q || q.resp !== "abierta") return;
      el.classList.toggle("hecha", L.contestada(l, q));
    });
    $$("[data-zcalc]").forEach(el => { const c = l.calculos.find(x => x.id === el.dataset.zcalc); if (c) el.innerHTML = calcRes(c.tipo, c.entrada, c, c.nombre); });
  }
  function repintar() { const y = window.scrollY; renderLectura(actual, pasoActual); window.scrollTo(0, y); }

  // ---------- «¿Qué tipo de estudio tengo?» ----------
  let arbolResp = [], arbolPara = "";
  function renderArbol() {
    const r = L.recorrerArbol(arbolResp), para = arbolPara && (buscaLectura(arbolPara) || borradores.get(arbolPara));
    const camino = r.camino.map(x => { const nd = PL.ARBOL.find(a => a.id === x.id); return `<li><span>${esc(nd.pregunta)}</span><b class="cam-r cam-r--${x.r}">${x.r === "si" ? "Sí" : x.r === "no" ? "No" : "No lo sé"}</b></li>`; }).join("");
    let cuerpo;
    if (r.fin) {
      const pl = L.plantilla(r.fin), F = PL.FINALES[r.fin], destino = pl || L.plantilla(F && F.plantilla);
      cuerpo = `<div class="arbol-fin">
        <span class="sem-tag">Tu estudio parece</span>
        <h2>${esc(pl ? pl.nombre : F.titulo)}</h2>
        <p>${esc(pl ? pl.que : F.texto)}</p>
        ${r.dudas.length ? `<div class="warn">⚠ Contestaste «No lo sé» en alguna pregunta: también podría ser ${r.dudas.map(id => `<b>${esc(L.plantilla(id).nombre.toLowerCase())}</b>`).join(" o ")}. Mira los métodos del artículo para salir de dudas.</div>` : ""}
        <div class="toolbar">${destino ? (para ? `<button class="btn btn--primary" data-act="arbol-usar" data-pl="${destino.id}">Leer con la plantilla de ${esc(destino.nombre.toLowerCase())} →</button>` : `<button class="btn btn--primary" data-act="arbol-nueva" data-pl="${destino.id}">Leer un artículo con esta plantilla →</button><a class="btn" href="#/plantillas/${destino.id}">Ver sus preguntas</a>`) : ""}<button class="btn" data-act="arbol-reset">Empezar otra vez</button></div>
      </div>`;
    } else {
      const nd = r.nodo;
      cuerpo = `<div class="arbol-preg card">
        <span class="sem-tag">Pregunta ${r.camino.length + 1}</span>
        <h2>${esc(nd.pregunta)}</h2>
        <p class="field-sub">${esc(nd.pista)}</p>
        <p class="palabras"><span>Palabras que lo delatan:</span> ${esc(nd.palabras)}</p>
        <div class="seg seg--resp seg--arbol" role="group">${[["si", "Sí"], ["no", "No"], ["nose", "No lo sé"]].map(([v, t]) => `<button type="button" class="seg-${v}" data-act="arbol" data-n="${nd.id}" data-v="${v}">${t}</button>`).join("")}</div>
        ${r.camino.length ? `<div class="toolbar"><button class="btn btn--ghost" data-act="arbol-atras">← Atrás</button></div>` : ""}
      </div>`;
    }
    view.innerHTML = `
      ${para ? volver(`#/lectura/${para.id}/3`, "Volver a la lectura") : ""}
      <h1 class="page-title">¿Qué tipo de estudio tengo?</h1>
      <p class="page-lead">Contesta con lo que dicen el título, el resumen y los métodos. «No lo sé» no te bloquea: sigue adelante.</p>
      ${cuerpo}
      ${camino ? `<h2 class="sec-t">Tus respuestas</h2><ol class="camino">${camino}</ol>` : ""}
      ${trampa("Lo que importa es <b>cómo se hizo</b> el estudio, no cómo se llama a sí mismo. Un «estudio prospectivo» puede ser un ensayo, una cohorte o un antes y después.")}`;
  }

  // ---------- Plantillas ----------
  function renderPlantillas(id) {
    const pl = L.plantilla(id);
    if (!pl) {
      view.innerHTML = `
        <h1 class="page-title">Las plantillas</h1>
        <p class="page-lead">Una por tipo de estudio, con las tres preguntas de la lectura crítica: ¿es válido?, ¿qué dice? y ¿me sirve?</p>
        ${idea("Las preguntas y las pistas son <b>propias</b>: siguen los criterios de las plantillas de <b>CASPe</b>, que puedes descargar gratis en su web e imprimir para contestarlas a lápiz.")}
        <div class="cuadro-lista">${PL.PLANTILLAS.map(p => { const qs = L.preguntasDe(p); return `<div class="item-card"><a class="item-main" href="#/plantillas/${p.id}"><b class="item-t">${esc(p.nombre)}</b><span class="item-s">${esc(p.que)}</span><span class="badges"><span class="badge">${qs.length} preguntas</span><span class="badge badge--elim">${qs.filter(q => q.elim).length} de eliminación</span>${p.propia ? `<span class="badge">Plantilla propia</span>` : ""}</span></a></div>`; }).join("")}</div>
        <p class="cita-pl"><a href="${PL.URL_CASPE}" target="_blank" rel="noopener">Plantillas originales de CASPe ↗</a></p>`;
      return;
    }
    view.innerHTML = `
      ${volver("#/plantillas", "Las plantillas")}
      <h1 class="page-title">${esc(pl.nombre)}</h1>
      <p class="page-lead">${esc(pl.que)}</p>
      <div class="toolbar"><button class="btn btn--primary" data-act="arbol-nueva" data-pl="${pl.id}">Leer un artículo con esta plantilla →</button><a class="btn" href="#/plantillas/${pl.id}?informe=1">🖨 Plantilla en blanco (PDF)</a><button class="btn" data-act="doc-word-ir" data-href="#/plantillas/${pl.id}">⬇ En blanco (Word)</button></div>
      ${pl.bloques.map(b => `<h2 class="sec-t">${esc(PL.BLOQUES[b.id].titulo)} <span class="sec-sub">${esc(PL.BLOQUES[b.id].sub)}</span></h2>
        <ol class="pl-lista">${L.preguntasDe(pl, b.id).map(q => `<li value="${L.numeroDe(pl, q.id)}"><b>${esc(q.texto)}</b>${q.elim ? ` <span class="badge badge--elim">De eliminación</span>` : ""}${q.resp === "abierta" ? ` <span class="badge">Abierta</span>` : q.resp === "sn" ? ` <span class="badge">Sí / No</span>` : ""}<ul>${q.pistas.map(p => `<li>${esc(p)}</li>`).join("")}</ul></li>`).join("")}</ol>`).join("")}
      <div class="box box--ejemplo"><span class="box-tag">Fuente</span><p>${esc(pl.cita)}</p><p><a href="${esc(pl.url)}" target="_blank" rel="noopener">${pl.propia ? "SQUIRE 2.0 ↗" : "Ver la plantilla original de CASPe ↗"}</a></p></div>`;
  }

  // ---------- Documentos: bloques → HTML (vista previa, imprimir y PDF) y → Word ----------
  const escMl = s => esc(s).replace(/\n/g, "<br>");
  let docActual = "";
  function bloquesHtml(bloques) {
    const celda = (c, cab) => { const o = c !== null && typeof c === "object" ? c : { texto: c }; const st = o.fondo ? ` style="background:#${o.fondo};color:#111"` : ""; const cl = [o.centro ? "c" : "", o.negrita ? "b" : ""].filter(Boolean).join(" "); return `<${cab ? "th" : "td"}${cl ? ` class="${cl}"` : ""}${st}>${escMl(o.texto)}</${cab ? "th" : "td"}>`; };
    return bloques.map(b => {
      if (b.t === "portada") return `<div class="doc-portada"><h1>${esc(b.titulo)}</h1>${b.sub ? `<p class="doc-sub">${esc(b.sub)}</p>` : ""}${(b.extra || []).map(x => `<p>${esc(x)}</p>`).join("")}</div>`;
      if (b.t === "h1") return `<h2 class="doc-h1">${esc(b.texto)}</h2>`;
      if (b.t === "h2") return `<h3 class="doc-h2">${esc(b.texto)}</h3>`;
      if (b.t === "p") return `<p class="doc-p${b.estilo === "nota" ? " doc-nota" : ""}">${b.runs ? b.runs.map(r => r.negrita ? `<b>${escMl(r.texto)}</b>` : escMl(r.texto)).join("") : escMl(b.texto)}</p>`;
      if (b.t === "lista") return `<ul class="doc-ul">${b.items.map(i => `<li>${esc(typeof i === "string" ? i : i.texto)}</li>`).join("")}</ul>`;
      if (b.t === "salto") return `<div class="doc-salto"></div>`;
      if (b.t === "html") return b.html;   // solo en la vista previa y el PDF (el Word lo ignora)
      if (b.t === "tabla") {
        const suma = (b.anchos || []).reduce((a, x) => a + x, 0);
        const cols = b.anchos ? `<colgroup>${b.anchos.map(w => `<col style="width:${(w / suma * 100).toFixed(1)}%">`).join("")}</colgroup>` : "";
        return `<div class="table-wrap"><table class="doc-t${b.fuente && b.fuente < 9 ? " doc-t--peq" : ""}">${cols}${b.cab && !b.sinCab ? `<thead><tr>${b.cab.map(c => celda(c, true)).join("")}</tr></thead>` : ""}<tbody>${b.filas.map(f => `<tr>${f.map(c => celda(c, false)).join("")}</tr>`).join("")}</tbody></table></div>`;
      }
      return "";
    }).join("");
  }
  function informePie() {
    return `<footer class="print-foot print-only">
      <span class="autor-titulo">Aplicación desarrollada por</span>
      <span class="autor"><b>Carlos J. Galán Doval</b> · Médico de Familia · Técnico en Calidad y Seguridad del Paciente</span>
      <span class="autor"><b>Rafael J. Romero de Castilla Gil</b> · Médico de Familia · Responsable del Área de Calidad y Seguridad del Paciente</span>
      <span class="autor-area">Área de Gestión Sanitaria Sur de Córdoba · Andalucía</span>
      <span class="autor-uso">De libre uso con fines docentes y divulgativos. No sustituye el criterio profesional.</span>
      <span class="footer-version">Lectura Crítica · versión ${APP_VERSION}</span>
    </footer>`;
  }
  // Documento que toca según la ruta: { doc, base (nombre del archivo) }
  function docDeRuta() {
    const fecha = new Date().toLocaleDateString("es-ES"), [ruta] = location.hash.replace(/^#\/?/, "").split("?"), p = ruta.split("/");
    if (p[0] === "lectura") {
      const l = buscaLectura(p[1]) || borradores.get(p[1]); if (!l) return null;
      const doc = L.documentoFicha(l, fecha);
      // Gráficos de las calculadoras (solo en la vista previa y el PDF), antes del veredicto
      const graf = l.calculos.map(c => { const r = L.resultadoCalculo(c); if (!r.ok) return ""; if (c.tipo === "tratamiento") return `<h3 class="doc-h2">${esc(c.nombre ? "De cada 100 personas: " + c.nombre : "De cada 100 personas")}</h3>${pictograma(r)}`; if (c.tipo === "metaanalisis") return `<h3 class="doc-h2">Diagrama de bosque</h3>${forestSvg(r)}`; if (c.tipo === "umbrales") return `<h3 class="doc-h2">Umbrales de decisión</h3>${umbralSvg(r)}`; if (c.tipo === "diagnostico" || c.tipo === "bayes") return `<h3 class="doc-h2">Nomograma de Fagan</h3>${faganSvg(r.pre, [{ lr: r.lrp.v, et: "Positivo", c: "pos" }, { lr: r.lrn.v, et: "Negativo", c: "neg" }], CA.porc(c.entrada.umbral))}`; return ""; }).join("");
      if (graf) { const i = doc.bloques.findIndex(b => b.t === "h1" && /Veredicto/.test(b.texto)); doc.bloques.splice(i < 0 ? doc.bloques.length : i, 0, { t: "html", html: `<div class="doc-graf">${graf}</div>` }); }
      return { doc, base: "Lectura crítica " + (nombreLectura(l) || "").slice(0, 60) };
    }
    if (p[0] === "sesion") { const s = buscaSesion(p[1]); return s ? { doc: L.documentoSesion(s, datos.lecturas, fecha), base: "Sesión " + (s.titulo || "").slice(0, 60) } : null; }
    if (p[0] === "plantillas") { const pl = L.plantilla(p[1]); return pl ? { doc: L.documentoPlantilla(pl), base: "Plantilla " + pl.nombre } : null; }
    return null;
  }
  function renderDoc() {
    const d = docDeRuta();
    if (!d) { noEncontrado("ese documento", "#/", "Ir al inicio"); return; }
    view.innerHTML = `<div class="informe-bar informe-only"><button class="btn" data-act="volver">← Volver</button><span class="informe-acc"><button class="btn" data-act="doc-word">⬇ Word</button><button class="btn btn--primary" data-act="imprimir">Guardar / imprimir</button></span></div>
      <div class="doc-prev doc-prev--informe">${bloquesHtml(d.doc.bloques)}</div>${informePie()}`;
  }
  const fechaArchivo = () => new Date().toLocaleDateString("es-ES").replace(/\//g, "-");
  const nombreArchivoDe = (base, ext) => `${String(base || "Lectura crítica").replace(/[\\/:*?"<>|%]/g, "").trim()} ${fechaArchivo()}.${ext}`;
  function nombreArchivo(ext) { const d = docDeRuta(); return nombreArchivoDe(d ? d.base : "Lectura crítica", ext); }
  function compartirOBajar(blob, nombre, msg) {
    const file = new File([blob], nombre, { type: blob.type });
    if (esIOS() && navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file], title: nombre }).catch(() => {});
    else { descargar(blob, nombre); toast(msg, 3000); }
  }
  function descargarWord() {
    try {
      const d = docDeRuta(); if (!d) return;
      const bytes = window.Docx.construirDocx(Object.assign({ pie: d.doc.titulo + " · Generado con la app Lectura Crítica" }, d.doc));
      compartirOBajar(new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }), nombreArchivoDe(d.base, "docx"), "Word descargado. Ábrelo con Word, Pages o LibreOffice y ajústalo a tu gusto.");
    } catch (e) { toast("No se ha podido crear el Word.", 4000); }
  }
  function exportarExcel() {
    try {
      const bytes = window.Xlsx.construirLibroXlsx(L.hojasExcel(datosUsuario.lecturas, datosUsuario.sesiones, new Date().toLocaleDateString("es-ES")));
      compartirOBajar(new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), nombreArchivoDe("Lectura crítica mis lecturas", "xlsx"), "Excel descargado.");
    } catch (e) { toast("No se ha podido crear el Excel.", 4000); }
  }
  const btnDocs = (href, conWord = true) => `<div class="toolbar">${conWord ? `<button class="btn btn--primary" data-act="doc-word-ir" data-href="${href}">⬇ Word</button>` : ""}<a class="btn" href="${href}?informe=1">Ver / PDF</a></div>`;

  // ---------- PDF en iOS (sin librerías; mismo método que Auditorías y AMFE) ----------
  // En iOS, window.print() no hace nada cuando la app está instalada en la pantalla de inicio.
  function pdfDesdeJPEGs(paginas, wPt, hPt) {
    const enc = new TextEncoder(), partes = [], offs = []; let pos = 0;
    const push = x => { const b = typeof x === "string" ? enc.encode(x) : x; partes.push(b); pos += b.length; };
    const obj = (n, cuerpo) => { offs[n] = pos; push(`${n} 0 obj\n`); cuerpo(); push("\nendobj\n"); };
    push("%PDF-1.4\n"); push(new Uint8Array([37, 226, 227, 207, 211, 10]));
    const n = paginas.length;
    obj(1, () => push("<< /Type /Catalog /Pages 2 0 R >>"));
    obj(2, () => push(`<< /Type /Pages /Kids [${paginas.map((_, i) => `${3 + i * 3} 0 R`).join(" ")}] /Count ${n} >>`));
    paginas.forEach((p, i) => {
      const pg = 3 + i * 3, cont = pg + 1, img = pg + 2, flujo = `q ${wPt} 0 0 ${hPt} 0 0 cm /Im${i} Do Q`;
      obj(pg, () => push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${wPt} ${hPt}] /Resources << /XObject << /Im${i} ${img} 0 R >> >> /Contents ${cont} 0 R >>`));
      obj(cont, () => { push(`<< /Length ${flujo.length} >>\nstream\n${flujo}\nendstream`); });
      obj(img, () => { push(`<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.bytes.length} >>\nstream\n`); push(p.bytes); push("\nendstream"); });
    });
    const total = 3 + n * 3, xref = pos;
    let x = `xref\n0 ${total}\n0000000000 65535 f \n`;
    for (let k = 1; k < total; k++) x += String(offs[k]).padStart(10, "0") + " 00000 n \n";
    push(x + `trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
    return new Blob(partes, { type: "application/pdf" });
  }
  async function generarPDF() {
    const ANCHO = 720, K = 2;
    const A4W = 595.28, A4H = 841.89, MARGEN_PT = 34;
    const PX = (A4W - 2 * MARGEN_PT) / ANCHO;
    const PW = A4W / PX, PH = A4H / PX, M = MARGEN_PT / PX, ALTO_UTIL = PH - 2 * M;
    const hoja = document.createElement("div");
    hoja.className = "view";
    hoja.style.cssText = `position:absolute;left:-20000px;top:0;width:${ANCHO}px;max-width:none;margin:0;padding:0;box-shadow:none;`;
    hoja.innerHTML = $("#view").innerHTML;
    $$(".informe-bar, [id]", hoja).forEach(el => { if (el.classList.contains("informe-bar")) el.remove(); else el.removeAttribute("id"); });
    $$("details", hoja).forEach(d => { d.open = true; });
    document.body.appendChild(hoja);
    try {
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const R0 = hoja.getBoundingClientRect();
      const ops = [], cortes = [0], bloques = [];
      const SIN_CORTE = ".print-head, .chart-card, tr, .formula, .box, .print-foot, h1, h2, h3, .ficha-cab, .leyenda";
      const rel = r => ({ x: r.left - R0.left, y: r.top - R0.top, w: r.width, h: r.height });
      const hayColor = c => !!c && c !== "transparent" && !/rgba\([^)]*,\s*0\)$/.test(c);
      const LADOS = ["Top", "Right", "Bottom", "Left"];
      const texto = (n, cs) => {
        const t = n.textContent, re = /\S+/g, rg = document.createRange(); let m;
        const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        while ((m = re.exec(t))) {
          rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length);
          const rs = rg.getClientRects(); if (!rs.length) continue;
          ops.push({ t: "txt", s: cs.textTransform === "uppercase" ? m[0].toUpperCase() : m[0], r: rel(rs[0]), font, col: cs.color, ls: cs.letterSpacing });
        }
      };
      const recorre = el => {
        const cs = getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden") return;
        const r = rel(el.getBoundingClientRect());
        if (r.h > 0) cortes.push(r.y + r.h);
        if (el.matches(SIN_CORTE)) bloques.push([r.y, r.y + r.h]);
        if (el instanceof SVGSVGElement) { ops.push({ t: "svg", el, r }); return; }
        const bordes = LADOS.map(l => [parseFloat(cs[`border${l}Width`]) || 0, cs[`border${l}Color`]]);
        if (hayColor(cs.backgroundColor) || bordes.some(b => b[0] > 0 && hayColor(b[1]))) ops.push({ t: "caja", r, bg: cs.backgroundColor, rad: parseFloat(cs.borderTopLeftRadius) || 0, bordes });
        if (el.tagName === "LI") {
          const ol = el.parentElement.tagName === "OL", idx = Array.prototype.indexOf.call(el.parentElement.children, el) + 1;
          ops.push({ t: "txt", s: ol ? idx + "." : "•", r: { x: r.x - (ol ? 20 : 14), y: r.y, w: 16, h: parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.4 }, font: `normal 700 ${cs.fontSize} ${cs.fontFamily}`, col: ol ? "#9d174d" : cs.color, ls: "normal" });
        }
        for (const n of el.childNodes) {
          if (n.nodeType === 1) recorre(n);
          else if (n.nodeType === 3 && n.textContent.trim()) texto(n, cs);
        }
      };
      recorre(hoja);
      for (const op of ops.filter(o => o.t === "svg")) {
        const cl = op.el.cloneNode(true), orig = [op.el, ...op.el.querySelectorAll("*")], copia = [cl, ...cl.querySelectorAll("*")];
        orig.forEach((o, i) => { const cs = getComputedStyle(o); copia[i].setAttribute("style", ["fill", "stroke", "stroke-width", "stroke-dasharray", "font-family", "font-size", "font-weight"].map(p => `${p}:${cs.getPropertyValue(p)}`).join(";")); });
        cl.setAttribute("xmlns", "http://www.w3.org/2000/svg"); cl.setAttribute("width", op.r.w); cl.setAttribute("height", op.r.h);
        op.img = await new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(cl)); });
      }
      const alto = Math.ceil(R0.height);
      const parte = y => bloques.some(([a, b]) => a < y - 0.5 && y + 0.5 < b && b - a < ALTO_UTIL);
      const cands = [...new Set(cortes.map(c => Math.ceil(c)))].sort((a, b) => a - b);
      const pags = []; let y0 = 0;
      while (y0 < alto - 1) {
        const lim = y0 + ALTO_UTIL;
        if (lim >= alto) { pags.push([y0, alto]); break; }
        const y = cands.filter(c => c > y0 + 80 && c <= lim && !parte(c)).pop() || Math.floor(lim);
        pags.push([y0, y]); y0 = y;
      }
      const ponFuente = (ctx, f) => { ctx.font = "10px serif"; ctx.font = f; if (ctx.font === "10px serif") ctx.font = f.replace(/^(.*?\d+(\.\d+)?px).*$/, "$1 sans-serif"); };
      const caja = (ctx, op) => {
        const { x, y, w, h } = op.r, rad = Math.min(op.rad, w / 2, h / 2);
        const camino = () => { ctx.beginPath(); if (rad > 0 && ctx.roundRect) ctx.roundRect(x, y, w, h, rad); else ctx.rect(x, y, w, h); };
        if (hayColor(op.bg)) { ctx.fillStyle = op.bg; camino(); ctx.fill(); }
        const [t, d, b, l] = op.bordes;
        if (op.bordes.every(z => z[0] === t[0] && z[1] === t[1]) && t[0] > 0 && hayColor(t[1])) { ctx.strokeStyle = t[1]; ctx.lineWidth = t[0]; ctx.beginPath(); if (rad > 0 && ctx.roundRect) ctx.roundRect(x + t[0] / 2, y + t[0] / 2, w - t[0], h - t[0], Math.max(0, rad - t[0] / 2)); else ctx.rect(x + t[0] / 2, y + t[0] / 2, w - t[0], h - t[0]); ctx.stroke(); return; }
        const lado = (z, rx, ry, rw, rh) => { if (z[0] > 0 && hayColor(z[1])) { ctx.fillStyle = z[1]; ctx.fillRect(rx, ry, rw, rh); } };
        lado(t, x, y, w, t[0]); lado(b, x, y + h - b[0], w, b[0]); lado(l, x, y, l[0], h); lado(d, x + w - d[0], y, d[0], h);
      };
      const dibujaPaginas = conSVG => pags.map(([a, b]) => {
        const cv = document.createElement("canvas"); cv.width = Math.round(PW * K); cv.height = Math.round(PH * K);
        const ctx = cv.getContext("2d");
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, cv.width, cv.height);
        ctx.scale(K, K); ctx.translate(M, M - a);
        ctx.beginPath(); ctx.rect(-2, a, ANCHO + 4, b - a); ctx.clip();
        for (const op of ops) {
          if (op.r.y >= b || op.r.y + op.r.h <= a) continue;
          if (op.t === "caja") caja(ctx, op);
          else if (op.t === "svg") { if (conSVG && op.img) ctx.drawImage(op.img, op.r.x, op.r.y, op.r.w, op.r.h); }
          else {
            ponFuente(ctx, op.font); ctx.fillStyle = op.col; ctx.textBaseline = "alphabetic";
            if ("letterSpacing" in ctx) ctx.letterSpacing = op.ls && op.ls !== "normal" ? op.ls : "0px";
            const mt = ctx.measureText(op.s), asc = mt.fontBoundingBoxAscent || mt.actualBoundingBoxAscent || op.r.h * 0.8, desc = mt.fontBoundingBoxDescent || mt.actualBoundingBoxDescent || op.r.h * 0.2;
            ctx.fillText(op.s, op.r.x, op.r.y + (op.r.h - (asc + desc)) / 2 + asc);
          }
        }
        const url = cv.toDataURL("image/jpeg", 0.9), bin = atob(url.slice(url.indexOf(",") + 1)), bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return { bytes, w: cv.width, h: cv.height };
      });
      let paginas;
      try { paginas = dibujaPaginas(true); } catch (e) { paginas = dibujaPaginas(false); }
      return pdfDesdeJPEGs(paginas, A4W, A4H);
    } finally { hoja.remove(); }
  }
  let pdfListo = null;
  function prepararPDF() {
    pdfListo = null; const r = location.hash;
    setTimeout(() => { if (location.hash === r && document.body.classList.contains("ver-informe")) generarPDF().then(b => { pdfListo = { r, blob: b }; }).catch(() => {}); }, 300);
  }
  async function guardarPDF() {
    let blob = pdfListo && pdfListo.r === location.hash ? pdfListo.blob : null;
    if (!blob) { toast("Preparando el PDF…"); try { blob = await generarPDF(); pdfListo = { r: location.hash, blob }; } catch (e) { toast("No se ha podido crear el PDF.", 4000); return; } }
    const file = new File([blob], nombreArchivo("pdf"), { type: "application/pdf" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: file.name }); toast(""); }
      catch (e) { if (e && e.name === "AbortError") { toast(""); return; } toast("PDF listo: pulsa otra vez «Guardar / imprimir».", 4000); }
      return;
    }
    descargar(blob, file.name); toast("PDF descargado.", 3000);
  }
  function imprimir() { if (esIOS()) { guardarPDF(); return; } window.print(); }
  let cerrados = [];
  window.addEventListener("beforeprint", () => { cerrados = $$("details").filter(d => !d.open); cerrados.forEach(d => { d.open = true; }); });
  window.addEventListener("afterprint", () => { cerrados.forEach(d => { d.open = false; }); cerrados = []; });

  // ---------- Club de lectura: cada asistente contesta (mejora A) ----------
  function renderClub(l, n) {
    actual = l; pasoActual = 0; nAyuda = 0;
    const pl = L.plantilla(l.plantilla);
    if (!pl) { view.innerHTML = `${volver(`#/lectura/${l.id}/3`, "Volver a la lectura")}<div class="placeholder-box"><p><b>Elige antes el tipo de estudio.</b></p></div>`; return; }
    const qs = L.preguntasDe(pl), i = Math.min(Math.max(n || 1, 1), qs.length), q = qs[i - 1], A = l.club.asistentes;
    const pill = (x, k) => { const v = x.resp === "abierta" ? (L.contestada(l, x) ? "hecha" : "") : L.valor(l, x.id); return `<a href="#/lectura/${l.id}/club?q=${k + 1}" class="club-pill${k + 1 === i ? " actual" : ""} club-pill--${v || "nada"}${x.elim ? " club-pill--elim" : ""}" title="${esc(x.texto)}">${k + 1}</a>`; };
    const rep = L.reparto(l, q.id), may = L.mayoria(l, q.id), V = l.club.votos[q.id] || {};
    const barra = rep.total ? `<div class="club-barra" aria-label="Reparto de votos">${["si", "no", "nose"].filter(k => rep[k]).map(k => `<span class="club-b club-b--${k}" style="flex:${rep[k]}">${L.RESPUESTAS[k]} · ${rep[k]}</span>`).join("")}</div>` : `<p class="field-sub">Todavía no ha votado nadie.</p>`;
    view.innerHTML = `
      <div class="club-top no-print">${volver(`#/lectura/${l.id}/${L.BLOQUE_PASO[q.bloque]}`, "Volver a la lectura")}<button type="button" class="btn btn--ghost" data-act="proyector">${document.body.classList.contains("modo-proyector") ? "Salir del modo proyector" : "📽 Modo proyector"}</button></div>
      <h1 class="page-title">Club de lectura</h1>
      <p class="page-lead">${esc(L.corto(nombreLectura(l) || "Lectura", 90))} · ${esc(pl.nombre)}. Cada asistente contesta; después, el grupo decide la respuesta.</p>
      <details class="card club-asist"${A.length ? "" : " open"}><summary><b>Asistentes (${A.length})</b></summary>
        <p class="field-sub">Basta con el perfil o las iniciales. No hace falta el nombre completo.</p>
        <div class="club-asis">${A.map(a => `<span class="club-a"><input class="txt-in" data-as="${a.id}" value="${esc(a.nombre)}" placeholder="Perfil o iniciales" aria-label="Asistente" autocomplete="off" /><button type="button" class="icon-btn icon-btn--mini" data-act="as-del" data-id="${a.id}" aria-label="Quitar">✕</button></span>`).join("")}</div>
        <button type="button" class="btn btn--ghost" data-act="as-nuevo">+ Añadir asistente</button></details>
      <div class="club-pills no-print" aria-label="Preguntas">${qs.map(pill).join("")}</div>
      <article class="card club-q">
        <span class="wiz-paso">Pregunta ${L.numeroDe(pl, q.id)} de ${qs.length} · ${esc(PL.BLOQUES[q.bloque].titulo)}${q.elim ? " · de eliminación" : ""}</span>
        <h2>${esc(q.texto)}</h2>
        <details class="pistas"><summary>Pistas</summary><ul>${q.pistas.map(x => `<li>${esc(x)}</li>`).join("")}</ul></details>
        ${q.resp === "abierta" ? `${L.calculosDe(l, q).map(c => L.textoCalculo(c)).filter(lleno).map(x => `<p class="llano">${esc(x)}</p>`).join("")}
          <label class="nota-lbl" for="club-nota">Resultado</label><textarea class="txt-in" id="club-nota" data-q="${q.id}" data-f="nota" rows="3">${esc(L.resp(l, q.id).nota)}</textarea>`
        : `${A.length ? `<div class="club-votos">${A.map(a => `<div class="club-fila"><span>${esc(a.nombre || "Sin nombre")}</span>${segResp(`data-act="voto" data-q="${q.id}" data-a="${a.id}"`, V[a.id], q.resp === "sn" ? [["si", "Sí"], ["no", "No"]] : [["si", "Sí"], ["no", "No"], ["nose", "NS"]])}</div>`).join("")}</div>` : `<div class="note">ℹ Añade los asistentes para que cada uno vote.</div>`}
          ${barra}
          ${L.discrepancia(l, q.id) ? `<div class="warn">⚠ Hay votos de «Sí» y de «No»: habladlo antes de decidir la respuesta del grupo.</div>` : ""}
          <h3 class="sub-h">Respuesta del grupo</h3>
          ${segResp(`data-act="resp" data-q="${q.id}"`, L.valor(l, q.id), q.resp === "sn" ? [["si", "Sí"], ["no", "No"]] : undefined)}
          ${may && may !== L.valor(l, q.id) ? `<div class="toolbar"><button type="button" class="btn" data-act="usar-mayoria" data-q="${q.id}" data-v="${may}">Usar la mayoría: ${esc(L.RESPUESTAS[may])}</button></div>` : ""}`}
      </article>
      ${q.elim && L.eliminacion(l).estado === "falla" ? `<div class="aviso-error">✕ El estudio no supera las preguntas de eliminación: no merece la pena seguir.</div>` : ""}
      <div class="wiz-nav no-print">${i > 1 ? `<a class="btn" href="#/lectura/${l.id}/club?q=${i - 1}">← Anterior</a>` : "<span></span>"}${i < qs.length ? `<a class="btn btn--primary" href="#/lectura/${l.id}/club?q=${i + 1}">Siguiente →</a>` : `<a class="btn btn--primary" href="#/lectura/${l.id}/7">Al veredicto →</a>`}</div>`;
  }

  // ---------- Sesiones (mejora G) ----------
  let actualSesion = null;
  function renderSesion(s) {
    actualSesion = s; actual = null; nAyuda = 0;
    const L_ = L.lecturasDeSesion(s, datos.lecturas), resto = datos.lecturas.filter(l => !s.lecturas.includes(l.id));
    const fila = l => { const pl = L.plantilla(l.plantilla), rc = L.resultadoClave(l); return `<div class="ses-fila">
      <a href="#/lectura/${l.id}"><b>${esc(L.corto(nombreLectura(l) || "Lectura sin título", 110))}</b></a>
      <span class="badges">${decisionBadge(l.veredicto.decision)}${pl ? `<span class="badge">${esc(pl.nombre)}</span><span class="badge badge--luces" title="Validez · Resultados · Me sirve">${["validez", "resultados", "aplicabilidad"].map(b => luz(L.semaforo(l, b).color)).join("")}</span>` : l.filtro.responde === "no" ? `<span class="badge">Descartado en el filtro</span>` : ""}</span>
      ${rc ? `<span class="ses-rc">${esc(rc.texto)}</span>` : ""}
      ${modoEjemplo ? "" : `<button type="button" class="link-btn link-btn--peligro" data-act="ses-quitar" data-id="${l.id}">Quitar de la sesión</button>`}</div>`; };
    view.innerHTML = `
      ${volver(modoEjemplo ? "#/ejemplos" : "#/lecturas", modoEjemplo ? "Ejemplos" : "Mis lecturas")}
      <h1 class="page-title">${esc(s.titulo || "Sesión bibliográfica")}</h1>
      <p class="page-lead">Varias lecturas sobre la misma pregunta y una conclusión conjunta.</p>
      <div class="card">
        ${campo(s, "titulo", "Título de la sesión", { bind: 'data-sk="titulo"', ph: "Por ejemplo, escalas de alerta en la sala de espera" })}
        ${campo(s, "pregunta", "La pregunta", { bind: 'data-sk="pregunta"', area: true, rows: 2, ph: "En [pacientes], ¿[intervención], frente a [comparación], mejora [resultado]?" })}
        <div class="dos-col">${campo(s, "unidad", "Unidad o servicio", { bind: 'data-sk="unidad"', opt: true })}${campo(s, "fecha", "Fecha", { bind: 'data-sk="fecha"', tipo: "date" })}</div>
      </div>
      <h2 class="sec-t">Los artículos (${L_.length})</h2>
      ${L_.length ? `<div class="ses-lista">${L_.map(fila).join("")}</div>` : `<div class="placeholder-box"><p>Todavía no hay artículos en esta sesión.</p></div>`}
      ${modoEjemplo ? "" : `<div class="card ses-anadir">
        <button type="button" class="btn btn--primary" data-act="ses-leer">+ Leer un artículo nuevo para esta sesión</button>
        ${resto.length ? `<div class="guardar-en"><select class="txt-in" id="ses-otra" aria-label="Lectura">${resto.map(l => `<option value="${l.id}">${esc(L.corto(nombreLectura(l) || "Lectura sin título", 70))}</option>`).join("")}</select><button type="button" class="btn" data-act="ses-anadir">Añadir una lectura que ya tengo</button></div>` : ""}
      </div>`}
      <h2 class="sec-t">Conclusión de la sesión</h2>
      <div class="card">
        <div class="decisiones">${Object.entries(L.DECISIONES).map(([k, x]) => `<button type="button" class="dec-card dec-card--${k}${s.decision === k ? " active" : ""}" data-act="ses-dec" data-v="${k}" aria-pressed="${s.decision === k}"><b>${x.nom}</b><span>${esc(x.txt)}</span></button>`).join("")}</div>
        ${campo(s, "conclusion", "Conclusión", { bind: 'data-sk="conclusion"', area: true, rows: 4, ph: "Qué decidimos, por qué y qué haremos (quién, qué, cuándo)" })}
      </div>
      <h2 class="sec-t">Ficha de la sesión</h2>
      <p class="field-sub">Una tabla con todos los artículos, su semáforo, su resultado clave y su decisión, y la conclusión.</p>
      ${btnDocs(`#/sesion/${s.id}`)}`;
  }

  // ---------- Aprende ----------
  function renderAprende(n) {
    const T = C.TEMAS, t = T.find(x => x.n === n);
    if (!t) {
      view.innerHTML = `
        <h1 class="page-title">Aprende</h1>
        <p class="page-lead">${T.length} temas cortos, explicados fácil, para tener a mano mientras lees un artículo.</p>
        <div class="temas">${T.map(x => `<a class="tema-card pdca--${x.c}" href="#/aprende/${x.n}"><span class="tema-n">${x.n}</span><span><b>${x.titulo}</b><span>${x.sub}</span></span></a>`).join("")}</div>
        ${practica("El método de lectura (pregunta PICO, filtro de dos minutos, tres preguntas y decisión) es el del capítulo «Leer un artículo en diez minutos» de la <i>Guía de Calidad y Seguridad del Paciente</i> de los autores, en preparación.")}`;
      return;
    }
    const prev = T.find(x => x.n === n - 1), next = T.find(x => x.n === n + 1);
    view.innerHTML = `
      <div class="wiz-top no-print">${volver("#/aprende", "Aprende")}<div class="tema-pills tema-pills--wrap">${T.map(x => `<a href="#/aprende/${x.n}" class="pdca--${x.c}${x.n === n ? " actual" : ""}">${x.n}</a>`).join("")}</div></div>
      <div class="wiz-titulo"><span class="wiz-paso">Tema ${n} de ${T.length}</span><h1 class="page-title">${t.titulo}</h1><p class="page-lead">${t.sub}</p></div>
      <div class="card minuto pdca--${t.c}"><h2 class="sub-h">En un minuto</h2><ul>${t.minuto.map(x => `<li>${x}</li>`).join("")}</ul></div>
      ${t.secciones.map((x, i) => `<details class="facil"${i === 0 ? " open" : ""}><summary>${x.t}</summary><div class="facil-body">${x.h}</div></details>`).join("")}
      ${box("ejemplo", "Minicaso", t.minicaso)}
      <div class="toolbar"><a class="btn" href="#/prueba/${PRUEBA_DE_TEMA[t.n] || ""}">✓ Ponte a prueba</a><a class="btn btn--primary" href="${t.practica.href}">${t.practica.texto} →</a></div>
      <div class="wiz-nav no-print">${prev ? `<a class="btn" href="#/aprende/${prev.n}">← ${prev.titulo}</a>` : "<span></span>"}${next ? `<a class="btn" href="#/aprende/${next.n}">${next.titulo} →</a>` : "<span></span>"}</div>`;
  }

  // ---------- Ponte a prueba ----------
  const PRUEBA_DE_TEMA = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: "tipo", 10: "calcula" };
  const respuestasQuiz = {}, respTipo = {}, respCalc = {};
  // Orden de las opciones barajado pero estable (para que la correcta no esté siempre en el mismo sitio)
  const barajar = (n, semilla) => { const a = Array.from({ length: n }, (_, i) => i); let s = semilla * 9301 + 49297; for (let i = n - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor(s / 233280 * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pillsPrueba = act => `<div class="tema-pills tema-pills--wrap prueba-pills no-print"><a href="#/prueba" class="pdca--P${!act ? " actual" : ""}" title="Todas las preguntas">T</a>${Object.keys(C.TEMAS_TEST).map(k => `<a href="#/prueba/${k}" class="pdca--P${String(act) === k ? " actual" : ""}" title="${esc(C.TEMAS_TEST[k].nom)}">${k}</a>`).join("")}<a href="#/prueba/tipo" class="pdca--H${act === "tipo" ? " actual" : ""}" title="¿Qué tipo de estudio es?">?</a><a href="#/prueba/calcula" class="pdca--V${act === "calcula" ? " actual" : ""}" title="Calcula">=</a></div>`;
  function renderPrueba(tema) {
    if (tema === "tipo") { renderEjTipo(); return; }
    if (tema === "calcula") { renderEjCalc(); return; }
    const Q = C.TEST.map((q, i) => Object.assign({ i }, q)).filter(q => !tema || q.t === tema);
    const hechas = Q.filter(q => q.i in respuestasQuiz), bien = hechas.filter(q => respuestasQuiz[q.i] === q.ok).length;
    view.innerHTML = `
      <h1 class="page-title">Ponte a prueba</h1>
      <p class="page-lead">${C.TEST.length} preguntas${tema ? ` (aquí, las de «${esc(C.TEMAS_TEST[tema].nom)}»)` : ""}. Toca la respuesta que creas correcta y lee la explicación. En <b>?</b>, adivina el tipo de estudio; en <b>=</b>, calcula.</p>
      ${pillsPrueba(tema)}
      <div class="marcador">${hechas.length ? `<span><b>${bien}</b> aciertos de ${hechas.length} respondidas (de ${Q.length})</span>${hechas.length === Q.length ? `<span class="sem-b sem-b--${bien / Q.length >= 0.8 ? "verde" : bien / Q.length >= 0.6 ? "ambar" : "rojo"}">${bien / Q.length >= 0.8 ? "¡Muy bien!" : bien / Q.length >= 0.6 ? "Bien: repasa los fallos" : "Repasa «Aprende»"}</span>` : ""}` : `<span class="field-sub">Aciertos: 0 de ${Q.length}</span>`}</div>
      <div class="card">${Q.map(q => { const ord = barajar(q.o.length, q.i + 1), r = respuestasQuiz[q.i]; return `<div class="quiz-q">
        <p><span class="badge">${esc(C.TEMAS_TEST[q.t].nom)}</span> <b>${esc(q.q)}</b></p>
        ${ord.map(j => `<button type="button" class="quiz-o${r != null ? (j === q.ok ? " quiz-o--ok" : j === r ? " quiz-o--mal" : "") : ""}" data-act="quiz" data-q="${q.i}" data-o="${j}">${esc(q.o[j])}</button>`).join("")}
        ${r != null ? `<p class="quiz-fb">${r === q.ok ? "<b>¡Correcto!</b> " : "<b>No.</b> "}${esc(q.e)} <a href="#/aprende/${C.TEMAS_TEST[q.t].aprende}">Repasar en «Aprende»</a></p>` : ""}
      </div>`; }).join("")}</div>
      <div class="toolbar no-print"><button type="button" class="btn" data-act="quiz-reset">Empezar de nuevo</button><a class="btn btn--primary" href="#/prueba/tipo">¿Qué tipo de estudio es? →</a></div>`;
  }
  function renderEjTipo() {
    const E = C.EJ_TIPO, bien = E.filter((x, i) => respTipo[i] === x.ok).length, hechas = Object.keys(respTipo).length;
    view.innerHTML = `
      <h1 class="page-title">¿Qué tipo de estudio es?</h1>
      <p class="page-lead">Resúmenes cortos inventados. Elige el tipo de estudio de cada uno. ${hechas ? `<b>${bien} de ${hechas}</b> bien.` : ""}</p>
      ${pillsPrueba("tipo")}
      <div class="card">${E.map((x, i) => { const r = respTipo[i]; return `<div class="quiz-q">
        <p><b>«${esc(x.texto)}»</b></p>
        <div class="ej-tipos">${PL.PLANTILLAS.map(p => `<button type="button" class="chip${r === p.id ? (p.id === x.ok ? " chip--ok" : " chip--mal") : r && p.id === x.ok ? " chip--ok" : ""}" data-act="ej-tipo" data-i="${i}" data-v="${p.id}">${esc(p.corto)}</button>`).join("")}</div>
        ${r ? `<p class="quiz-fb">${r === x.ok ? "<b>¡Correcto!</b> " : "<b>No.</b> "}${esc(x.e)}</p>` : ""}
      </div>`; }).join("")}</div>
      <div class="toolbar no-print"><button type="button" class="btn" data-act="ej-tipo-reset">Empezar de nuevo</button><a class="btn btn--primary" href="#/prueba/calcula">Calcula →</a></div>`;
  }
  function renderEjCalc() {
    view.innerHTML = `
      <h1 class="page-title">Calcula</h1>
      <p class="page-lead">Con papel y lápiz (o de cabeza). Escribe tu resultado y compruébalo.</p>
      ${pillsPrueba("calcula")}
      <div class="card">${C.EJ_CALC.map((x, i) => { const r = respCalc[i] || {}, v = CA.num(r.v), okv = r.ver && Math.abs(v - x.ok) <= x.tol; return `<div class="quiz-q">
        <p><b>${esc(x.texto)}</b></p>
        <div class="ej-calc"><input class="txt-in calc-in" data-ejc="${i}" value="${esc(r.v || "")}" inputmode="decimal" aria-label="Tu resultado" autocomplete="off" /><button type="button" class="btn" data-act="ej-calc" data-i="${i}">Comprobar</button></div>
        ${r.ver ? `<p class="quiz-fb">${okv ? "<b>¡Correcto!</b> " : `<b>No.</b> La respuesta es ${esc(CA.fmt(x.ok, 2))}. `}${esc(x.e)}</p>` : ""}
      </div>`; }).join("")}</div>
      <div class="toolbar no-print"><a class="btn" href="#/calc">Abrir las calculadoras</a><a class="btn" href="#/prueba">← Preguntas del test</a></div>`;
  }

  // ---------- Glosario ----------
  function renderGlosario() {
    view.innerHTML = `<h1 class="page-title">Glosario</h1><p class="page-lead">${C.GLOSARIO.length} términos en lenguaje llano.</p>
      <div class="input-wrap glos-buscar"><input id="glos-q" type="search" placeholder="Buscar término…" autocomplete="off" /></div>
      <dl class="glos-lista" id="glos-lista"></dl>`;
    const pinta = q => {
      const t = L.sinTildes(q);
      const l = C.GLOSARIO.filter(([a, b]) => !t || L.sinTildes(a + " " + b).includes(t)).sort((x, y) => x[0].localeCompare(y[0], "es"));
      $("#glos-lista").innerHTML = l.length ? l.map(([a, b]) => `<div class="glos-item"><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join("") : `<p class="placeholder-box">Sin resultados.</p>`;
    };
    pinta(""); $("#glos-q").addEventListener("input", e => pinta(e.target.value));
  }

  // ---------- Ejemplos ----------
  function renderEjemplos() {
    const E = ejemplos(), S = E.sesiones[0], U = L.lecturasDeSesion(S, E.lecturas);
    view.innerHTML = `
      <h1 class="page-title">Ejemplos</h1>
      <p class="page-lead">Para ver cómo queda una lectura antes de hacer la tuya. Están aparte: puedes tocarlos, pero <b>no se guardan ni se mezclan con tus datos</b>. Si te sirve de punto de partida, pulsa «Copiar a mis datos».</p>
      <h2 class="sec-t">Ejemplo completo: la sala de espera de Urgencias</h2>
      <p class="field-sub">Tras el análisis de un caso de sepsis, el equipo de Urgencias se pregunta si una escala de alerta temprana en la sala de espera reduce los empeoramientos no detectados. Encuentran seis artículos: tres se descartan en el filtro de dos minutos y se leen una revisión, un ensayo, un estudio cualitativo y la validación de la escala. <b>Todo es ficticio</b>: la escala «EAT» no existe.</p>
      <a class="ej-card ej-card--sesion" href="#/sesion/${S.id}"><b>${esc(S.titulo)}</b><span>La sesión completa: los siete artículos, su semáforo, su resultado clave y la conclusión del equipo.</span></a>
      <div class="ej-grid">${U.map(l => { const pl = L.plantilla(l.plantilla); return `<a class="ej-card" href="#/lectura/${l.id}"><b>${esc(L.corto(l.titulo.replace(/ \(ficticio\)$/, ""), 80))}</b><span>${pl ? esc(pl.nombre) : "Descartado en el filtro"} · ${esc(l.veredicto.decision ? L.DECISIONES[l.veredicto.decision].nom : "")}</span></a>`; }).join("")}</div>
      <h2 class="sec-t">Minicasos</h2>
      <p class="field-sub">Artículos cortos e inventados para practicar una cosa. Cada uno se abre en el paso que trabaja.</p>
      <div class="ej-grid ej-grid--mini">${C.EJEMPLOS.minicasos.map(m => `<a class="ej-card" href="#/lectura/${m.id}/${m.paso}"><b>${esc(m.que)}</b><span>${esc(L.corto(m.titulo.replace(/ \(ficticio\)$/, ""), 80))}</span></a>`).join("")}</div>
      ${practica("Las cifras de los ejemplos son inventadas, pero verosímiles. Cuando leas un artículo de verdad, escribe lo que dice él.")}`;
  }
  // Copia el ejemplo que se está viendo (una lectura o la sesión con sus lecturas) a los datos del usuario
  function copiarAMisDatos() {
    const [ruta] = location.hash.replace(/^#\/?/, "").split("?"), p = ruta.split("/");
    if (p[0] === "lectura") {
      const x = buscaLectura(p[1]); if (!x || !esIdEjemplo(x.id)) return;
      const c = Object.assign(clon(x), { id: genId(), creado: hoy(), modificado: hoy() });
      c.titulo = c.titulo.replace(/ \(ficticio\)$/, "") + " (copia del ejemplo)";
      datosUsuario.lecturas.push(c); guardar(true); location.hash = `#/lectura/${c.id}/${p[2] || 1}`;
    } else if (p[0] === "sesion") {
      const s = buscaSesion(p[1]); if (!s || !esIdEjemplo(s.id)) return;
      const mapa = {};
      L.lecturasDeSesion(s, datos.lecturas).forEach(x => { const c = Object.assign(clon(x), { id: genId(), creado: hoy(), modificado: hoy() }); mapa[x.id] = c.id; datosUsuario.lecturas.push(c); });
      const cs = Object.assign(clon(s), { id: genId(), lecturas: s.lecturas.map(id => mapa[id]).filter(Boolean), creado: hoy(), modificado: hoy() });
      datosUsuario.sesiones.push(cs); guardar(true); location.hash = `#/sesion/${cs.id}`;
    } else return;
    toast("Copiado a tus datos. Ya es tuyo: cámbialo a tu gusto.", 4000);
  }

  // ---------- Utilidades de interfaz ----------
  function esIOS() { return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); }
  function toast(msg, ms) {
    let t = $("#toast");
    if (!msg) { if (t) t.hidden = true; return; }
    if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false; clearTimeout(toast.h);
    if (ms) toast.h = setTimeout(() => { t.hidden = true; }, ms);
  }
  function descargar(blob, nombre) {
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nombre;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 200);
  }

  // ---------- Copia de seguridad e importar ----------
  async function copiaSeguridad() {
    const contenido = JSON.stringify({ app: "lecturacritica", v: L.VERSION_DATOS, exportado: hoy(), lecturas: datosUsuario.lecturas, sesiones: datosUsuario.sesiones, intercambio: L.paqueteIntercambio(datosUsuario.lecturas, APP_VERSION, hoy()) }, null, 1);
    const nombre = `Lectura Crítica copia ${new Date().toISOString().slice(0, 10)}.json`;
    const blob = new Blob([contenido], { type: "application/json" });
    const file = new File([blob], nombre, { type: "application/json" });
    if (esIOS() && navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: nombre }); } catch (e) { if (e && e.name === "AbortError") return; }
    } else descargar(blob, nombre);
    datosUsuario.ultimaCopia = hoy(); guardar(true);
    toast("Copia guardada. Guárdala en un sitio seguro (Archivos, Drive, correo…).", 4500);
    if (rutaActual() === "#/" || rutaActual() === "") renderHome();
  }
  function importar(file) {
    const fr = new FileReader();
    fr.onload = () => {
      let s = null; try { s = L.sanearDatos(JSON.parse(fr.result), genId, hoy()); } catch (e) { /* */ }
      if (!s) { toast("Ese archivo no es una copia de Lectura Crítica.", 4000); return; }
      // Nunca se importa nada con id de ejemplo
      s.lecturas.forEach(x => { if (esIdEjemplo(x.id)) x.id = genId(); });
      s.sesiones = s.sesiones.filter(x => !esIdEjemplo(x.id));
      const aplicar = modo => {
        const r = modo === "sustituir" ? s : L.fusionar(datosUsuario, s);
        datosUsuario.lecturas = r.lecturas; datosUsuario.sesiones = r.sesiones; guardar(true);
        toast(`Importadas ${plural(s.lecturas.length, "lectura", "lecturas")}.`, 4000);
        location.hash = "#/"; route();
      };
      if (!datosUsuario.lecturas.length && !datosUsuario.sesiones.length) { aplicar("sustituir"); return; }
      confirmar(`<p>La copia tiene <b>${plural(s.lecturas.length, "lectura", "lecturas")}</b>.</p><p><b>Añadir</b> las junta con las tuyas (si una está en las dos, se queda la más reciente): así se trabaja en equipo. Si prefieres <b>sustituir</b> todo lo tuyo por la copia, pulsa «Sustituir».</p>`, "Añadir a mis datos", () => aplicar("anadir"), { titulo: "Importar copia", peligro: false, otro: ["Sustituir", () => confirmar("<p>Se borrarán tus lecturas actuales y se quedará solo lo de la copia. Esto no se puede deshacer.</p>", "Sustituir", () => aplicar("sustituir"))] });
    };
    fr.readAsText(file);
  }

  // ---------- Confirmación ----------
  function confirmar(html, siTxt, alSi, o = {}) {
    const m = $("#modal-confirmar");
    $("#conf-titulo").textContent = o.titulo || "¿Seguro?";
    $("#conf-texto").innerHTML = html;
    const si = $("#btn-conf-si"), no = $("#btn-conf-no");
    si.textContent = siTxt; si.className = "btn " + (o.peligro === false ? "btn--primary" : "btn--peligro");
    let extra = $("#btn-conf-otro"); if (extra) extra.remove();
    if (o.otro) { extra = document.createElement("button"); extra.id = "btn-conf-otro"; extra.className = "btn"; extra.textContent = o.otro[0]; no.after(extra); extra.onclick = () => { m.hidden = true; o.otro[1](); }; }
    si.onclick = () => { m.hidden = true; alSi(); };
    no.onclick = () => { m.hidden = true; };
    m.hidden = false; si.focus();
  }

  // ---------- Enrutado ----------
  const NAV = [["", "Inicio"], ["lecturas", "Mis lecturas"], ["tipo", "¿Qué estudio es?"], ["calc", "Calcular"], ["plantillas", "Plantillas"], ["ejemplos", "Ejemplos"], ["aprende", "Aprende"], ["prueba", "Ponte a prueba"], ["glosario", "Glosario"]];
  function buildNav() { $("#calc-nav").innerHTML = NAV.map(([r, t]) => `<a href="#/${r}" data-r="${r}">${t}</a>`).join(""); }
  function noEncontrado(que, href, txt) { view.innerHTML = `<div class="error-box">No se encuentra ${que} en este dispositivo.</div><p><a href="${href}">${txt}</a></p>`; }
  const rutaActual = () => location.hash.split("?")[0];
  function nuevaLectura(plantilla) {
    const l = L.nuevaLectura(genId(), hoy());
    if (plantilla) { L.cambiarPlantilla(l, plantilla); datos.lecturas.push(l); guardar(); }
    else borradores.set(l.id, l);
    return l;
  }
  function route() {
    const [ruta, qs] = (location.hash.replace(/^#\/?/, "") || "").split("?");
    const partes = ruta.split("/"), q = new URLSearchParams(qs || "");
    actual = null; actualSesion = null;
    const informe = q.get("informe") === "1";
    document.body.classList.toggle("ver-informe", informe);
    if (partes[0] !== "lectura" || partes[2] !== "club") document.body.classList.remove("modo-proyector");
    const idR = partes[1] || "";
    modoEjemplo = partes[0] === "ejemplos" || (["lectura", "sesion"].includes(partes[0]) && esIdEjemplo(idR));
    datos = modoEjemplo ? ejemplos() : datosUsuario;
    $("#banner-ejemplo").hidden = !modoEjemplo || informe || partes[0] === "ejemplos";
    let navR = partes[0];
    if (informe && ["lectura", "sesion", "plantillas"].includes(partes[0])) { renderDoc(); if (esIOS()) prepararPDF(); window.scrollTo(0, 0); return; }
    if (partes[0] === "lecturas" && partes[1] === "nueva") {
      const l = nuevaLectura();
      history.replaceState(null, "", `#/lectura/${l.id}/1`); renderLectura(l, 1); navR = "lecturas";
    } else if (partes[0] === "lectura") {
      const l = buscaLectura(partes[1]) || borradores.get(partes[1]);
      if (!l) noEncontrado("esa lectura", "#/lecturas", "Ir a mis lecturas");
      else if (partes[2] === "club") renderClub(l, parseInt(q.get("q"), 10) || 1);
      else {
        let n = parseInt(partes[2], 10);
        if (!(n >= 1 && n <= 7)) { const p = L.pasoPendiente(l); n = p ? p.n : 7; history.replaceState(null, "", `#/lectura/${l.id}/${n}`); }
        renderLectura(l, n);
      }
      navR = "lecturas";
    } else if (partes[0] === "sesiones" && partes[1] === "nueva") {
      const x = L.nuevaSesion(genId(), hoy()); datosUsuario.sesiones.push(x); guardar();
      history.replaceState(null, "", `#/sesion/${x.id}`); renderSesion(x); navR = "lecturas";
    } else if (partes[0] === "sesion") {
      const x = buscaSesion(partes[1]);
      if (!x) noEncontrado("esa sesión", "#/lecturas", "Ir a mis lecturas"); else renderSesion(x);
      navR = "lecturas";
    } else if (partes[0] === "lecturas") renderLista();
    else if (partes[0] === "ejemplos") renderEjemplos();
    else if (partes[0] === "aprende") renderAprende(parseInt(partes[1], 10) || 0);
    else if (partes[0] === "prueba") renderPrueba(["tipo", "calcula"].includes(partes[1]) ? partes[1] : (C.TEMAS_TEST[partes[1]] ? Number(partes[1]) : 0));
    else if (partes[0] === "glosario") renderGlosario();
    else if (partes[0] === "tipo") {
      const para = q.get("para") || "";
      if (para !== arbolPara) { arbolPara = para; arbolResp = []; }
      renderArbol();
    } else if (partes[0] === "plantillas") renderPlantillas(partes[1]);
    else if (partes[0] === "calc") renderCalc(partes[1], q.get("d"));
    else { renderHome(); navR = ""; }
    if (modoEjemplo) navR = "ejemplos";
    $$("#calc-nav a").forEach(a => a.classList.toggle("active", a.dataset.r === navR));
    const act = $("#calc-nav a.active"); if (act && act.scrollIntoView) act.scrollIntoView({ block: "nearest", inline: "center" });
    window.scrollTo(0, 0);
  }

  // ---------- Eventos ----------
  function tocado(l) {
    l.modificado = hoy();
    if (!esVacia(l) && !datos.lecturas.includes(l)) { datos.lecturas.push(l); borradores.delete(l.id); }
    guardar();
  }
  const buscaEn = (lista, id) => lista.find(x => x.id === id);
  // Los cuadros de texto crecen con lo escrito
  function autoAlto(el) { el.style.height = "auto"; el.style.height = el.scrollHeight + 2 + "px"; }
  new MutationObserver(() => $$("textarea.txt-in", view).forEach(el => { if (!el.closest("[hidden]") && el.offsetParent) autoAlto(el); })).observe(view, { childList: true, subtree: true });
  view.addEventListener("toggle", e => { if (e.target.matches("details")) $$("textarea.txt-in", e.target).forEach(autoAlto); }, true);

  // Escribe un dato en una calculadora (guardada o suelta). Devuelve true si el formulario cambia de forma (hay que repintarlo)
  function ponerEnCalc(c, t, f) {
    if (t.dataset.nv) { c.niveles[Number(t.dataset.nv)][f] = t.value; return false; }
    if (t.dataset.est) { c.estudios[Number(t.dataset.est)][f] = t.value; return false; }
    if (t.dataset.mx) { const [i, j] = t.dataset.mx.split("-").map(Number); c.matriz[i][j] = t.value; return false; }
    if (f === "kk") { const k = Number(t.value), M = L.matrizVacia(k); (c.matriz || []).forEach((fi, i) => fi.forEach((v, j) => { if (i < k && j < k) M[i][j] = v; })); c.matriz = M; return true; }
    if (f === "nombre") { c.nombre = t.value; return false; }
    c.entrada[f] = t.value;
    if (f === "medida" && c.entrada.medida !== "or" && c.entrada.metodo === "peto") c.entrada.metodo = "mh";
    return ["modo", "medida", "metodo"].includes(f);
  }
  view.addEventListener("input", e => {
    const t = e.target, l = actual;
    if (t.matches("textarea.txt-in")) autoAlto(t);
    if (t.id === "buscar-lec") { filtroLista = t.value; $("[data-zona='lista']").innerHTML = listaInner(); return; }
    const f = t.dataset.f, esSel = t.tagName === "SELECT";
    if (t.dataset.sk && actualSesion) { actualSesion[t.dataset.sk] = t.value; actualSesion.modificado = hoy(); guardar(); return; }
    if (t.dataset.ejc) { (respCalc[t.dataset.ejc] = respCalc[t.dataset.ejc] || {}).v = t.value; respCalc[t.dataset.ejc].ver = false; return; }
    if (t.dataset.as && l) { const a = buscaEn(l.club.asistentes, t.dataset.as); if (a) { a.nombre = t.value; tocado(l); } return; }
    if (t.dataset.cs) {
      const tipo = t.dataset.cs, s = suelta(tipo);
      if (ponerEnCalc(s, t, f)) { history.replaceState(null, "", `#/calc/${tipo}?d=${encodeURIComponent(JSON.stringify(estadoSuelta(s)))}`); const y = window.scrollY; renderCalc(tipo); window.scrollTo(0, y); return; }
      const z = $(`[data-zcalc="cs-${tipo}"]`); if (z) z.innerHTML = calcRes(tipo, s.entrada, s, s.nombre);
      history.replaceState(null, "", `#/calc/${tipo}?d=${encodeURIComponent(JSON.stringify(estadoSuelta(s)))}`);
      return;
    }
    if (!l) return;
    if (t.dataset.q) { L.ponerRespuesta(l, t.dataset.q, "nota", t.value); tocado(l); refrescar(); return; }
    if (t.dataset.calc) {
      const c = buscaEn(l.calculos, t.dataset.calc); if (!c) return;
      const rehacer = ponerEnCalc(c, t, f);
      tocado(l); if (rehacer) repintar(); else refrescar(); return;
    }
    if (t.dataset.des) { const d = buscaEn(l.desenlaces, t.dataset.des); if (!d) return; d[f] = t.value; tocado(l); refrescar(); return; }
    if (t.dataset.con) { const c = buscaEn(l.confusores, t.dataset.con); if (!c) return; c[f] = t.value; tocado(l); refrescar(); return; }
    if (t.dataset.acc) { const a = buscaEn(l.veredicto.acciones, t.dataset.acc); if (!a) return; a[f] = t.value; tocado(l); refrescar(); return; }
    if (t.dataset.k) { setPath(l, t.dataset.k, t.value); tocado(l); refrescar(); }
  });

  view.addEventListener("click", e => {
    const info = e.target.closest("[data-info]");
    if (info) { const h = $("#help-" + info.dataset.info); if (h) { h.hidden = !h.hidden; info.setAttribute("aria-expanded", String(!h.hidden)); } return; }
    const b = e.target.closest("[data-act]"); if (!b) return;
    const act = b.dataset.act, l = actual;
    switch (act) {
      case "copia": copiaSeguridad(); return;
      case "importar": $("#input-importar").click(); return;
      case "lec-del": {
        const x = buscaLectura(b.dataset.id); if (!x) return;
        confirmar(`<p>Se borrará la lectura <b>«${esc(L.corto(nombreLectura(x) || "sin título", 80))}»</b> con todas sus respuestas. Esto no se puede deshacer.</p>`, "Borrar", () => { datos.lecturas = datos.lecturas.filter(y => y.id !== x.id); guardar(true); renderLista(); toast("Lectura borrada.", 3000); });
        return;
      }
      case "lec-dup": {
        const x = buscaLectura(b.dataset.id); if (!x) return;
        const c = Object.assign(clon(x), { id: genId(), titulo: (x.titulo || "Lectura") + " (copia)", creado: hoy(), modificado: hoy() });
        datos.lecturas.push(c); guardar(true); renderLista(); toast("Lectura duplicada.", 3000); return;
      }
      case "volver": location.hash = location.hash.split("?")[0]; return;
      case "imprimir": imprimir(); return;
      case "doc-word": descargarWord(); return;
      case "doc-word-ir": { const h = b.dataset.href, prev = location.hash; history.replaceState(null, "", h); descargarWord(); history.replaceState(null, "", prev); return; }
      case "excel": exportarExcel(); return;
      case "quiz": respuestasQuiz[b.dataset.q] = Number(b.dataset.o); { const y = window.scrollY; route(); window.scrollTo(0, y); } return;
      case "quiz-reset": Object.keys(respuestasQuiz).forEach(k => delete respuestasQuiz[k]); route(); return;
      case "ej-tipo": respTipo[b.dataset.i] = b.dataset.v; { const y = window.scrollY; renderEjTipo(); window.scrollTo(0, y); } return;
      case "ej-tipo-reset": Object.keys(respTipo).forEach(k => delete respTipo[k]); renderEjTipo(); return;
      case "ej-calc": (respCalc[b.dataset.i] = respCalc[b.dataset.i] || {}).ver = true; { const y = window.scrollY; renderEjCalc(); window.scrollTo(0, y); } return;
      case "ses-del": {
        const x = buscaSesion(b.dataset.id); if (!x) return;
        confirmar(`<p>Se borrará la sesión <b>«${esc(L.corto(x.titulo || "sin título", 80))}»</b>. Sus lecturas no se borran.</p>`, "Borrar", () => { datosUsuario.sesiones = datosUsuario.sesiones.filter(y => y.id !== x.id); guardar(true); renderLista(); toast("Sesión borrada.", 3000); });
        return;
      }
      case "ses-dec": if (actualSesion) { actualSesion.decision = actualSesion.decision === b.dataset.v ? "" : b.dataset.v; actualSesion.modificado = hoy(); guardar(); const y = window.scrollY; renderSesion(actualSesion); window.scrollTo(0, y); } return;
      case "ses-quitar": if (actualSesion) { actualSesion.lecturas = actualSesion.lecturas.filter(id => id !== b.dataset.id); actualSesion.modificado = hoy(); guardar(); renderSesion(actualSesion); } return;
      case "ses-anadir": if (actualSesion) { const id = ($("#ses-otra") || {}).value; if (id && !actualSesion.lecturas.includes(id)) { actualSesion.lecturas.push(id); actualSesion.modificado = hoy(); guardar(); renderSesion(actualSesion); } } return;
      case "ses-leer": if (actualSesion) {
        const x = L.nuevaLectura(genId(), hoy()); x.pregunta = actualSesion.pregunta || "";
        datosUsuario.lecturas.push(x); actualSesion.lecturas.push(x.id); actualSesion.modificado = hoy(); guardar(true); location.hash = `#/lectura/${x.id}/1`;
      } return;
      case "copiar-ej": copiarAMisDatos(); return;
      case "proyector": document.body.classList.toggle("modo-proyector"); route(); return;
      case "arbol": arbolResp.push({ id: b.dataset.n, r: b.dataset.v }); renderArbol(); window.scrollTo(0, 0); return;
      case "arbol-atras": arbolResp.pop(); renderArbol(); return;
      case "arbol-reset": arbolResp = []; renderArbol(); return;
      case "arbol-usar": {
        const x = buscaLectura(arbolPara) || borradores.get(arbolPara); if (!x) return;
        L.cambiarPlantilla(x, b.dataset.pl); tocado(x); arbolResp = []; location.hash = `#/lectura/${x.id}/4`; return;
      }
      case "cs-guardar": {
        const x = buscaLectura(($("#cs-lectura") || {}).value), s = suelta(b.dataset.tipo); if (!x) return;
        const c = Object.assign(L.nuevoCalculo(genId(), b.dataset.tipo), clon({ entrada: s.entrada, niveles: s.niveles, estudios: s.estudios, matriz: s.matriz, nombre: s.nombre }));
        x.calculos.push(c); tocado(x);
        toast(`Guardado en «${L.corto(nombreLectura(x) || "tu lectura", 50)}».`, 3500); return;
      }
      case "cs-enlace": {
        const url = location.href;
        (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => toast("Enlace copiado: lleva los datos de la calculadora.", 3500)).catch(() => window.prompt("Copia este enlace:", url));
        return;
      }
      case "cs-limpiar": { delete sueltas[b.dataset.tipo]; history.replaceState(null, "", `#/calc/${b.dataset.tipo}`); renderCalc(b.dataset.tipo); return; }
      case "est-nuevo": case "est-del": if (b.dataset.cs) {
        const s = suelta(b.dataset.cs);
        if (act === "est-nuevo" && s.estudios.length < 30) s.estudios.push(L.nuevoEstudio());
        if (act === "est-del" && s.estudios.length > 2) s.estudios.splice(Number(b.dataset.i), 1);
        history.replaceState(null, "", `#/calc/${b.dataset.cs}?d=${encodeURIComponent(JSON.stringify(estadoSuelta(s)))}`);
        { const y = window.scrollY; renderCalc(b.dataset.cs); window.scrollTo(0, y); } return;
      } break;
      case "nivel-nuevo": case "nivel-del": if (b.dataset.cs) {
        const s = suelta(b.dataset.cs);
        if (act === "nivel-nuevo" && s.niveles.length < 5) s.niveles.push(L.nuevoNivel());
        if (act === "nivel-del" && s.niveles.length > 2) s.niveles.splice(Number(b.dataset.nv), 1);
        history.replaceState(null, "", `#/calc/${b.dataset.cs}?d=${encodeURIComponent(JSON.stringify(estadoSuelta(s)))}`);
        { const y = window.scrollY; renderCalc(b.dataset.cs); window.scrollTo(0, y); } return;
      } break;
      case "arbol-nueva": { const x = nuevaLectura(b.dataset.pl); arbolResp = []; location.hash = `#/lectura/${x.id}/1`; toast(`Lectura nueva con la plantilla de ${L.plantilla(b.dataset.pl).nombre.toLowerCase()}. Empieza por tu pregunta.`, 4000); return; }
    }
    if (!l) return;
    switch (act) {
      case "resp": { const v = b.dataset.v, q = b.dataset.q; L.ponerRespuesta(l, q, "valor", L.valor(l, q) === v ? "" : v); tocado(l); if (pasoActual) repintar(); else { const y = window.scrollY; route(); window.scrollTo(0, y); } return; }
      case "filtro": { const k = b.dataset.f; l.filtro[k] = l.filtro[k] === b.dataset.v ? "" : b.dataset.v; tocado(l); repintar(); return; }
      case "plantilla": {
        const nueva = b.dataset.pl;
        if (l.plantilla === nueva) return;
        const hacer = () => { L.cambiarPlantilla(l, nueva); tocado(l); location.hash = `#/lectura/${l.id}/4`; };
        if (Object.keys(l.respuestas).length) confirmar(`<p>Vas a cambiar de plantilla. Tus respuestas de la plantilla de ${esc(L.plantilla(l.plantilla).nombre.toLowerCase())} no se pierden: se guardan aparte y vuelven si regresas a ella.</p>`, "Cambiar", hacer, { peligro: false, titulo: "Cambiar de plantilla" });
        else hacer();
        return;
      }
      case "descartar-ya": {
        l.veredicto.decision = "descartar";
        if (!lleno(l.veredicto.motivo)) l.veredicto.motivo = L.decisionPropuesta(l).motivo;
        tocado(l); location.hash = `#/lectura/${l.id}/7`; return;
      }
      case "seguir-igual": seguirIgual.add(l.id); toast("Sigue para aprender: las demás preguntas también enseñan.", 3500); repintar(); return;
      case "sem": { l.veredicto.semaforo[b.dataset.b] = b.dataset.v; if (!b.dataset.v) l.veredicto.motivoSemaforo[b.dataset.b] = ""; tocado(l); repintar(); return; }
      case "decision": { l.veredicto.decision = l.veredicto.decision === b.dataset.v ? "" : b.dataset.v; tocado(l); repintar(); return; }
      case "usar-pregunta": l.pregunta = L.preguntaSugerida(l); tocado(l); repintar(); return;
      case "usar-mensaje": l.veredicto.mensaje = L.mensajeSugerido(l); tocado(l); repintar(); return;
      case "nuevo-des": l.desenlaces.push(L.nuevoDesenlace(genId())); tocado(l); repintar(); { const ins = $$("[data-des][data-f='nombre']"); if (ins.length) ins[ins.length - 1].focus(); } return;
      case "del-des": l.desenlaces = l.desenlaces.filter(x => x.id !== b.dataset.id); tocado(l); repintar(); return;
      case "nuevo-con": l.confusores.push(L.nuevoConfusor(genId())); tocado(l); repintar(); { const ins = $$("[data-con][data-f='texto']"); if (ins.length) ins[ins.length - 1].focus(); } return;
      case "del-con": l.confusores = l.confusores.filter(x => x.id !== b.dataset.id); tocado(l); repintar(); return;
      case "nueva-acc": l.veredicto.acciones.push(L.nuevaAccion(genId())); tocado(l); repintar(); { const ins = $$("[data-acc][data-f='que']"); if (ins.length) ins[ins.length - 1].focus(); } return;
      case "del-acc": l.veredicto.acciones = l.veredicto.acciones.filter(x => x.id !== b.dataset.id); tocado(l); repintar(); return;
      case "normalizar": normalizarCita(l); return;
      case "pubmed-filtro": filtroPubMed = b.dataset.v; repintar(); return;
      case "voto": L.ponerVoto(l, b.dataset.q, b.dataset.a, b.dataset.v); tocado(l); { const y = window.scrollY; route(); window.scrollTo(0, y); } return;
      case "usar-mayoria": L.ponerRespuesta(l, b.dataset.q, "valor", b.dataset.v); tocado(l); { const y = window.scrollY; route(); window.scrollTo(0, y); } return;
      case "as-nuevo": l.club.asistentes.push(L.nuevoAsistente(genId(), "")); tocado(l); route(); { const ins = $$("[data-as]"); if (ins.length) ins[ins.length - 1].focus(); } return;
      case "as-del": l.club.asistentes = l.club.asistentes.filter(a => a.id !== b.dataset.id); Object.values(l.club.votos).forEach(V => delete V[b.dataset.id]); tocado(l); route(); return;
      case "lec-a-ses": { const x = buscaSesion(($("#ses-de-lec") || {}).value); if (!x) return; tocado(l); x.lecturas.push(l.id); x.modificado = hoy(); guardar(); toast(`Añadida a «${L.corto(x.titulo || "la sesión", 50)}».`, 3000); repintar(); return; }
      case "lec-nueva-ses": { tocado(l); const x = Object.assign(L.nuevaSesion(genId(), hoy()), { pregunta: lleno(l.pregunta) ? l.pregunta : L.preguntaSugerida(l), lecturas: [l.id] }); datosUsuario.sesiones.push(x); guardar(true); location.hash = `#/sesion/${x.id}`; return; }
      case "calc-nuevo": l.calculos.push(L.nuevoCalculo(genId(), b.dataset.tipo)); tocado(l); repintar(); { const c = $$(".calc-card[data-calcid]").pop(); const i = c && c.querySelector(".calc-in, input"); if (i) i.focus(); } return;
      case "calc-del": {
        const c = buscaEn(l.calculos, b.dataset.id); if (!c) return;
        const quitar = () => { l.calculos = l.calculos.filter(x => x.id !== c.id); tocado(l); repintar(); };
        if (Object.entries(c.entrada).some(([k, v]) => !["modo", "medida", "metodo"].includes(k) && lleno(v)) || c.niveles.some(n => lleno(n.a) || lleno(n.b)) || c.estudios.some(x => Object.values(x).some(lleno)) || c.matriz.some(f => f.some(lleno))) confirmar("<p>Se quitará esta calculadora con sus datos.</p>", "Quitar", quitar); else quitar();
        return;
      }
      case "calc-usar": {
        const c = buscaEn(l.calculos, b.dataset.id); if (!c) return;
        const txt = L.textoCalculo(c); if (!txt) { toast("Completa antes los datos de la calculadora.", 3000); return; }
        const prev = L.resp(l, b.dataset.q).nota;
        L.ponerRespuesta(l, b.dataset.q, "nota", lleno(prev) ? prev.trim() + "\n" + txt : txt); tocado(l); repintar(); toast("Resultado copiado en la respuesta.", 2500); return;
      }
      case "est-nuevo": case "est-del": {
        const c = buscaEn(l.calculos, b.dataset.calc); if (!c) return;
        if (act === "est-nuevo" && c.estudios.length < 30) c.estudios.push(L.nuevoEstudio());
        if (act === "est-del" && c.estudios.length > 2) c.estudios.splice(Number(b.dataset.i), 1);
        tocado(l); repintar(); return;
      }
      case "nivel-nuevo": case "nivel-del": {
        const c = buscaEn(l.calculos, b.dataset.calc); if (!c) return;
        if (act === "nivel-nuevo" && c.niveles.length < 5) c.niveles.push(L.nuevoNivel());
        if (act === "nivel-del" && c.niveles.length > 2) c.niveles.splice(Number(b.dataset.nv), 1);
        tocado(l); repintar(); return;
      }
    }
  });
  // «Explicado fácil» recuerda si se dejó abierto
  view.addEventListener("toggle", e => { if (e.target.matches("details[data-recordar]")) escribir(KEY_FACIL, e.target.open ? "1" : "0"); }, true);
  $("#input-importar").addEventListener("change", e => { const f = e.target.files[0]; if (f) importar(f); e.target.value = ""; });
  $("#banner-copiar").addEventListener("click", copiarAMisDatos);

  // Copia la referencia y abre el Normalizador Bibliográfico (herramienta de apoyo: no se pasan datos)
  async function normalizarCita(l) {
    const r = l.referencia, texto = lleno(r.texto) ? r.texto : [r.autores, l.titulo, r.revista, r.anio, r.doi && "doi: " + r.doi].filter(lleno).join(". ");
    if (lleno(texto)) { try { await navigator.clipboard.writeText(texto); toast("Referencia copiada: pégala en el Normalizador.", 4000); } catch (e) { toast("Copia la referencia y pégala en el Normalizador.", 4000); } }
    else toast("Escribe antes la referencia del artículo.", 3500);
    if (lleno(texto)) window.open(L.URL_NORM, "_blank", "noopener");
  }

  // ---------- Tema ----------
  function setTema(t) {
    document.documentElement.setAttribute("data-tema", t);
    const m = $("#meta-theme-color"); if (m) m.content = t === "claro" ? "#f0f7fb" : "#0d1b2a";
  }
  setTema(document.documentElement.getAttribute("data-tema") || "claro");
  $("#btn-tema").addEventListener("click", () => {
    const t = document.documentElement.getAttribute("data-tema") === "oscuro" ? "claro" : "oscuro";
    setTema(t); escribir("lecturacritica-tema", t);
  });
  if (window.matchMedia) matchMedia("(prefers-color-scheme: dark)").addEventListener("change", ev => { if (!leer("lecturacritica-tema")) setTema(ev.matches ? "oscuro" : "claro"); });

  // ---------- Modales ----------
  const KEY_BIENV = "lecturacritica-bienvenida-vista";
  const mb = $("#modal-bienvenida"), ma = $("#modal-acerca");
  const vista = leer(KEY_BIENV);
  if (!vista) mb.hidden = false;
  $("#btn-bienv-ok").addEventListener("click", () => { if ($("#modal-no-repetir").checked) escribir(KEY_BIENV, "1"); mb.hidden = true; });
  $("#btn-acerca").addEventListener("click", () => { ma.hidden = false; });
  $("#btn-acerca-cerrar").addEventListener("click", () => { ma.hidden = true; });
  ma.addEventListener("click", e => { if (e.target === ma) ma.hidden = true; });
  document.addEventListener("keydown", e => { if (e.key === "Escape") { ma.hidden = true; $("#modal-confirmar").hidden = true; } });
  $("#acerca-citas").innerHTML = PL.PLANTILLAS.map(p => `<li>${esc(p.cita)}</li>`).join("");

  // ---------- Versiones y novedades ----------
  const KEY_VERSION = "lecturacritica-version-vista";
  const listaCambios = n => `<div class="version-item"><div class="version-cab"><b>${esc(n.titulo)}</b><span class="version-tag">v${esc(n.version)} · ${esc(n.fecha)}</span></div><ul>${n.cambios.map(c => `<li>${esc(c)}</li>`).join("")}</ul></div>`;
  $("#historial-versiones").innerHTML = NOVEDADES.map(listaCambios).join("");
  $("#about-version").textContent = $("#footer-version").textContent = `Versión ${APP_VERSION}`;
  const mn = $("#modal-novedades");
  $("#btn-novedades-ok").addEventListener("click", () => { mn.hidden = true; escribir(KEY_VERSION, APP_VERSION); });
  (function gestionarNovedades() {
    const vistaV = leer(KEY_VERSION);
    if (vistaV === APP_VERSION) return;
    if (!vistaV && !vista) { escribir(KEY_VERSION, APP_VERSION); return; }
    const idx = NOVEDADES.findIndex(n => n.version === vistaV);
    const nuevas = idx > 0 ? NOVEDADES.slice(0, idx) : [NOVEDADES[0]];
    $("#novedades-sub").textContent = nuevas.length > 1 ? "Esto es lo nuevo desde tu última visita" : "Gracias por mantener la app al día";
    $("#novedades-body").innerHTML = nuevas.map(listaCambios).join("");
    if (mb.hidden) mn.hidden = false;
  })();

  // ---------- Service worker y aviso de nueva versión ----------
  let actualizando = false;
  function avisoActualizacion(reg) {
    if ($("#update-banner")) return;
    const b = document.createElement("div");
    b.id = "update-banner"; b.className = "update-banner no-print"; b.setAttribute("role", "status");
    b.innerHTML = "<span>Nueva versión disponible</span><button type=\"button\">Actualizar</button>";
    b.querySelector("button").addEventListener("click", () => { guardar(true); actualizando = true; if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" }); b.remove(); });
    document.body.appendChild(b);
  }
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").then(reg => {
      if (reg.waiting && navigator.serviceWorker.controller) avisoActualizacion(reg);
      reg.addEventListener("updatefound", () => {
        const nw = reg.installing; if (!nw) return;
        nw.addEventListener("statechange", () => { if (nw.state === "installed" && navigator.serviceWorker.controller) avisoActualizacion(reg); });
      });
    }).catch(() => {});
    let recargando = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => { if (recargando || !actualizando) return; recargando = true; location.reload(); });
  }

  // ---------- Instalar como aplicación ----------
  let avisoInstalar = null;
  window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); avisoInstalar = e; const b = $("#btn-instalar"); if (b) b.hidden = false; });
  $("#btn-instalar").addEventListener("click", async () => { if (!avisoInstalar) return; avisoInstalar.prompt(); try { await avisoInstalar.userChoice; } catch (e) { /* */ } avisoInstalar = null; $("#btn-instalar").hidden = true; });
  window.addEventListener("appinstalled", () => { const b = $("#btn-instalar"); if (b) b.hidden = true; });
  if (matchMedia("(display-mode: standalone)").matches || navigator.standalone) { const i = $("#instalar-bloque"); if (i) i.classList.add("instalada"); }

  window.LecturaCritica = { datos: () => datos };   // solo para pruebas desde la consola

  // ---------- Arranque ----------
  buildNav();
  window.addEventListener("hashchange", route);
  route();
})();
