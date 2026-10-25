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
  const L = window.Logica, PL = window.Plantillas;

  // ---------- Versión y novedades ----------
  // Al publicar cambios: añadir una entrada AL PRINCIPIO de NOVEDADES, poner su versión en los ?v= de index.html, en
  // APP_VERSION y subir CACHE_NAME en sw.js. Formato de versión: AAAA.NN.
  const APP_VERSION = "2026.01";
  const NOVEDADES = [
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
  const KEY_DATOS = "lecturacritica-datos";
  const datos = { lecturas: [], ultimaCopia: null };
  (function cargar() {
    const crudo = leer(KEY_DATOS); if (!crudo) return;
    try {
      const o = JSON.parse(crudo), s = L.sanearDatos(o, genId, hoy());
      if (s) { datos.lecturas = s.lecturas; datos.ultimaCopia = typeof o.ultimaCopia === "string" ? o.ultimaCopia : null; }
    } catch (e) { /* datos dañados: se empieza de cero sin borrar lo guardado */ }
  })();
  let tGuardar = null, avisoSinEspacio = false;
  function guardar(inmediato) {
    clearTimeout(tGuardar);
    const fn = () => {
      const ok = escribir(KEY_DATOS, JSON.stringify({ app: "lecturacritica", v: L.VERSION_DATOS, ultimaCopia: datos.ultimaCopia, lecturas: datos.lecturas }));
      if (!ok && !avisoSinEspacio) { avisoSinEspacio = true; toast("No se ha podido guardar en este navegador (¿modo privado o sin espacio?). Haz una copia de seguridad.", 6000); }
    };
    if (inmediato) fn(); else tGuardar = setTimeout(fn, 250);
  }
  window.addEventListener("pagehide", () => guardar(true));
  const buscaLectura = id => datos.lecturas.find(x => x.id === id);
  // Una lectura recién creada no se guarda hasta que se escribe algo
  const borradores = new Map();
  const esVacia = l => !Object.keys(l.respuestas).length && !l.plantilla && !lleno(l.filtro.responde) && !l.desenlaces.length && !l.confusores.length && !lleno(l.veredicto.decision)
    && ![l.titulo, l.pregunta, l.notas, ...Object.values(l.pico), ...Object.values(l.referencia)].some(lleno);

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
  const citaPlantilla = pl => `<p class="cita-pl">Preguntas propias basadas en los criterios de la plantilla CASPe para ${esc(pl.nombre.toLowerCase())}. <a href="${esc(pl.url)}" target="_blank" rel="noopener">Ver la plantilla original ↗</a></p>`;

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
        <div class="entrada entrada--prox"><span class="entrada-ic">🧮</span><b>Calcular</b><span>NNT, cocientes de probabilidad, probabilidad tras la prueba y nomograma de Fagan.</span><span class="fase-prox">Próximamente</span></div>
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
        <a class="guide-card" href="#/plantillas"><span class="guide-num">8</span><div><div class="guide-q">Las plantillas</div><div class="guide-a">Las <b>ocho plantillas</b> con sus preguntas y pistas, y el enlace a las originales de CASPe.</div></div><span class="guide-go">›</span></a>
        <a class="guide-card" href="#/tipo"><span class="guide-num">?</span><div><div class="guide-q">¿Qué tipo de estudio tengo?</div><div class="guide-a">Unas preguntas de <b>sí o no</b> con las palabras que delatan cada diseño.</div></div><span class="guide-go">›</span></a>
        <a class="guide-card guide-card--hermana" href="${L.URL_TM}" target="_blank" rel="noopener"><span class="guide-num">n</span><div><div class="guide-q">Tamaño Muestral ↗</div><div class="guide-a">App hermana: <b>¿tenía el estudio muestra suficiente?</b> Calcula cuántos casos hacían falta.</div></div><span class="guide-go">›</span></a>
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
      <div class="toolbar no-print"><a class="btn btn--primary" href="#/lecturas/nueva">+ Leer un artículo</a></div>
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
      <div class="wiz-top no-print">${volver("#/lecturas", "Mis lecturas")}${pasosHtml(l, n)}</div>
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
      </div>`;
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
    const estado = q.resp === "abierta" ? (lleno(r.nota) ? "hecha" : "") : v ? `r-${v}` : "";
    const resp = q.resp === "abierta"
      ? `<textarea class="txt-in" data-q="${q.id}" data-f="nota" rows="3" placeholder="Escribe el resultado tal como lo da el artículo (cifras e intervalos de confianza)">${esc(r.nota)}</textarea>
         ${q.calc ? `<p class="calc-prox">🧮 La calculadora para esta pregunta llegará en la próxima versión. Mientras, escribe aquí lo que dice el artículo.</p>` : ""}`
      : `${segResp(`data-act="resp" data-q="${q.id}"`, v, q.resp === "sn" ? [["si", "Sí"], ["no", "No"]] : undefined)}
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
      <div class="note">ℹ La ficha de la lectura en Word, PDF y Excel llegará en una próxima versión.</div>`;
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
      sembloque: () => bloque ? semBloqueHtml(l, bloque) : "",
      propuesta: () => propuestaHtml(L.decisionPropuesta(l)),
      msg: () => { const m = L.mensajeSugerido(l); return m && !lleno(l.veredicto.mensaje) ? `<div class="sugerida"><span>Propuesta: «${esc(m)}»</span> <button type="button" class="link-btn" data-act="usar-mensaje">Usarla</button></div>` : ""; }
    };
    $$("[data-zona]").forEach(el => { const f = Z[el.dataset.zona]; if (f) el.innerHTML = f(); });
    $$("[data-pq]").forEach(el => {
      const q = L.preguntasDe(L.plantilla(l.plantilla)).find(x => x.id === el.dataset.pq); if (!q || q.resp !== "abierta") return;
      el.classList.toggle("hecha", lleno(L.resp(l, q.id).nota));
    });
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
        <div class="cuadro-lista">${PL.PLANTILLAS.map(p => { const qs = L.preguntasDe(p); return `<div class="item-card"><a class="item-main" href="#/plantillas/${p.id}"><b class="item-t">${esc(p.nombre)}</b><span class="item-s">${esc(p.que)}</span><span class="badges"><span class="badge">${qs.length} preguntas</span><span class="badge badge--elim">${qs.filter(q => q.elim).length} de eliminación</span></span></a></div>`; }).join("")}</div>
        <p class="cita-pl"><a href="${PL.URL_CASPE}" target="_blank" rel="noopener">Plantillas originales de CASPe ↗</a></p>`;
      return;
    }
    view.innerHTML = `
      ${volver("#/plantillas", "Las plantillas")}
      <h1 class="page-title">${esc(pl.nombre)}</h1>
      <p class="page-lead">${esc(pl.que)}</p>
      <div class="toolbar"><button class="btn btn--primary" data-act="arbol-nueva" data-pl="${pl.id}">Leer un artículo con esta plantilla →</button></div>
      ${pl.bloques.map(b => `<h2 class="sec-t">${esc(PL.BLOQUES[b.id].titulo)} <span class="sec-sub">${esc(PL.BLOQUES[b.id].sub)}</span></h2>
        <ol class="pl-lista">${L.preguntasDe(pl, b.id).map(q => `<li value="${L.numeroDe(pl, q.id)}"><b>${esc(q.texto)}</b>${q.elim ? ` <span class="badge badge--elim">De eliminación</span>` : ""}${q.resp === "abierta" ? ` <span class="badge">Abierta</span>` : q.resp === "sn" ? ` <span class="badge">Sí / No</span>` : ""}<ul>${q.pistas.map(p => `<li>${esc(p)}</li>`).join("")}</ul></li>`).join("")}</ol>`).join("")}
      <div class="box box--ejemplo"><span class="box-tag">Fuente</span><p>${esc(pl.cita)}</p><p><a href="${esc(pl.url)}" target="_blank" rel="noopener">Ver la plantilla original de CASPe ↗</a></p></div>`;
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
    const contenido = JSON.stringify({ app: "lecturacritica", v: L.VERSION_DATOS, exportado: hoy(), lecturas: datos.lecturas }, null, 1);
    const nombre = `Lectura Crítica copia ${new Date().toISOString().slice(0, 10)}.json`;
    const blob = new Blob([contenido], { type: "application/json" });
    const file = new File([blob], nombre, { type: "application/json" });
    if (esIOS() && navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: nombre }); } catch (e) { if (e && e.name === "AbortError") return; }
    } else descargar(blob, nombre);
    datos.ultimaCopia = hoy(); guardar(true);
    toast("Copia guardada. Guárdala en un sitio seguro (Archivos, Drive, correo…).", 4500);
    if (rutaActual() === "#/" || rutaActual() === "") renderHome();
  }
  function importar(file) {
    const fr = new FileReader();
    fr.onload = () => {
      let s = null; try { s = L.sanearDatos(JSON.parse(fr.result), genId, hoy()); } catch (e) { /* */ }
      if (!s) { toast("Ese archivo no es una copia de Lectura Crítica.", 4000); return; }
      const aplicar = modo => {
        const r = modo === "sustituir" ? s : L.fusionar(datos, s);
        datos.lecturas = r.lecturas; guardar(true);
        toast(`Importadas ${plural(s.lecturas.length, "lectura", "lecturas")}.`, 4000);
        location.hash = "#/"; route();
      };
      if (!datos.lecturas.length) { aplicar("sustituir"); return; }
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
  const NAV = [["", "Inicio"], ["lecturas", "Mis lecturas"], ["tipo", "¿Qué estudio es?"], ["plantillas", "Plantillas"]];
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
    actual = null;
    let navR = partes[0];
    if (partes[0] === "lecturas" && partes[1] === "nueva") {
      const l = nuevaLectura();
      history.replaceState(null, "", `#/lectura/${l.id}/1`); renderLectura(l, 1); navR = "lecturas";
    } else if (partes[0] === "lectura") {
      const l = buscaLectura(partes[1]) || borradores.get(partes[1]);
      if (!l) noEncontrado("esa lectura", "#/lecturas", "Ir a mis lecturas");
      else {
        let n = parseInt(partes[2], 10);
        if (!(n >= 1 && n <= 7)) { const p = L.pasoPendiente(l); n = p ? p.n : 7; history.replaceState(null, "", `#/lectura/${l.id}/${n}`); }
        renderLectura(l, n);
      }
      navR = "lecturas";
    } else if (partes[0] === "lecturas") renderLista();
    else if (partes[0] === "tipo") {
      const para = q.get("para") || "";
      if (para !== arbolPara) { arbolPara = para; arbolResp = []; }
      renderArbol();
    } else if (partes[0] === "plantillas") renderPlantillas(partes[1]);
    else { renderHome(); navR = ""; }
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

  view.addEventListener("input", e => {
    const t = e.target, l = actual;
    if (t.matches("textarea.txt-in")) autoAlto(t);
    if (t.id === "buscar-lec") { filtroLista = t.value; $("[data-zona='lista']").innerHTML = listaInner(); return; }
    if (!l) return;
    const f = t.dataset.f, esSel = t.tagName === "SELECT";
    if (t.dataset.q) { L.ponerRespuesta(l, t.dataset.q, "nota", t.value); tocado(l); refrescar(); return; }
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
      case "arbol": arbolResp.push({ id: b.dataset.n, r: b.dataset.v }); renderArbol(); window.scrollTo(0, 0); return;
      case "arbol-atras": arbolResp.pop(); renderArbol(); return;
      case "arbol-reset": arbolResp = []; renderArbol(); return;
      case "arbol-usar": {
        const x = buscaLectura(arbolPara) || borradores.get(arbolPara); if (!x) return;
        L.cambiarPlantilla(x, b.dataset.pl); tocado(x); arbolResp = []; location.hash = `#/lectura/${x.id}/4`; return;
      }
      case "arbol-nueva": { const x = nuevaLectura(b.dataset.pl); arbolResp = []; location.hash = `#/lectura/${x.id}/1`; toast(`Lectura nueva con la plantilla de ${L.plantilla(b.dataset.pl).nombre.toLowerCase()}. Empieza por tu pregunta.`, 4000); return; }
    }
    if (!l) return;
    switch (act) {
      case "resp": { const v = b.dataset.v, q = b.dataset.q; L.ponerRespuesta(l, q, "valor", L.valor(l, q) === v ? "" : v); tocado(l); repintar(); return; }
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
    }
  });
  // «Explicado fácil» recuerda si se dejó abierto
  view.addEventListener("toggle", e => { if (e.target.matches("details[data-recordar]")) escribir(KEY_FACIL, e.target.open ? "1" : "0"); }, true);
  $("#input-importar").addEventListener("change", e => { const f = e.target.files[0]; if (f) importar(f); e.target.value = ""; });

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
