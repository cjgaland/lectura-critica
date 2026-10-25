// ============================================================
//  logic.js — Lógica PURA (sin DOM) · Lectura Crítica
//  Modelo de una lectura (pregunta PICO, referencia, filtro de dos minutos,
//  plantilla y respuestas, desenlaces, confusores, veredicto), preguntas de
//  eliminación y aviso de parada, semáforo por bloque y decisión propuesta
//  (aplicar · esperar · descartar), árbol «¿Qué tipo de estudio tengo?»,
//  avisos didácticos por paso, progreso y «tu siguiente paso», saneado y fusión.
//  window.Logica en navegador y module.exports en Node (tests).
// ============================================================
(function (raiz) {
  "use strict";
  const PL = typeof module !== "undefined" && module.exports ? require("./plantillas.js") : raiz.Plantillas;

  const VERSION_DATOS = 1;
  const URL_AUD = "https://cjgaland.github.io/auditorias/";
  const URL_IND = "https://cjgaland.github.io/indicadores-calidad/";
  const URL_TM = "https://cjgaland.github.io/tamano-muestral/";
  const URL_AMFE = "https://cjgaland.github.io/amfe/";
  const URL_FLUJO = "https://cjgaland.github.io/flujograma/";
  const URL_DAFO = "https://cjgaland.github.io/dafo/";
  const URL_MAPA = "https://cjgaland.github.io/mapa-riesgos/";
  const URL_RONDAS = "https://cjgaland.github.io/rondas-seguridad/";
  const URL_NORM = "https://cjgaland.github.io/normalizador-bibliografico/";
  const URL_PORTAL = "https://cjgaland.github.io/";

  // ---------- Utilidades ----------
  const lleno = v => v != null && String(v).trim() !== "";
  const sinTildes = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  const corto = (s, n = 60) => { s = String(s || "").trim(); return s.length > n ? s.slice(0, n - 1) + "…" : s || "sin título"; };
  const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
  const fmtFecha = v => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v || "").trim()); return m ? `${m[3]}/${m[2]}/${m[1]}` : String(v || ""); };

  // ---------- Pasos de una lectura ----------
  const PASOS = [
    { n: 1, k: "pregunta", titulo: "Tu pregunta y el artículo", corto: "PICO", que: "Escribe tu pregunta en formato PICO y la referencia del artículo.", entrega: 1 },
    { n: 2, k: "filtro", titulo: "Filtro de dos minutos", corto: "Filtro", que: "Con el título y el resumen: ¿responde a tu pregunta?, ¿qué tipo de estudio es?, ¿hay algo más reciente?", entrega: 1 },
    { n: 3, k: "tipo", titulo: "Tipo de estudio", corto: "Tipo", que: "Elige la plantilla que le corresponde, o averígualo con unas preguntas sencillas.", entrega: 1 },
    { n: 4, k: "validez", titulo: "¿Es válido?", corto: "Válido", que: "Primero las preguntas de eliminación; después, las que valoran el riesgo de sesgo.", entrega: 1 },
    { n: 5, k: "resultados", titulo: "¿Qué dice?", corto: "Efecto", que: "El efecto en cada desenlace y su precisión (intervalos de confianza).", entrega: 1 },
    { n: 6, k: "aplicabilidad", titulo: "¿Me sirve?", corto: "Me sirve", que: "¿Se parecen tus pacientes? ¿Están todos los resultados importantes? ¿Compensa?", entrega: 1 },
    { n: 7, k: "veredicto", titulo: "Veredicto", corto: "Decide", que: "Semáforo por bloque y tu decisión: aplicar, esperar o descartar.", entrega: 1 }
  ];
  const PASO_BLOQUE = { 4: "validez", 5: "resultados", 6: "aplicabilidad" };
  const BLOQUE_PASO = { validez: 4, resultados: 5, aplicabilidad: 6 };

  const RESPUESTAS = { si: "Sí", no: "No", nose: "No se puede saber" };
  const DECISIONES = {
    aplicar: { nom: "Aplicar", txt: "El estudio es válido, el efecto importa y tus pacientes se parecen a los del estudio." },
    esperar: { nom: "Esperar", txt: "Es prometedor, pero tiene dudas importantes: busca más estudios o una revisión sistemática." },
    descartar: { nom: "Descartar", txt: "No es válido o no se aplica a tu contexto." }
  };
  const COLORES = { verde: "Verde", ambar: "Ámbar", rojo: "Rojo" };
  const IMPORTANCIA = n => n >= 7 ? "crítico" : n >= 4 ? "importante" : n >= 1 ? "poco importante" : "";
  // Preguntas de aplicabilidad que, si se contestan «No», ponen el bloque en rojo
  const CLAVE_APLICA = new Set(["ec-9", "rs-8", "dx-10", "co-10", "cc-10", "cu-10", "ee-9", "ee-11", "rp-11"]);

  // ---------- Plantillas ----------
  const plantilla = id => PL.PLANTILLAS.find(p => p.id === id) || null;
  const preguntasDe = (pl, bloque) => !pl ? [] : pl.bloques.filter(b => !bloque || b.id === bloque).reduce((a, b) => a.concat(b.preguntas.map(q => Object.assign({ bloque: b.id }, q))), []);
  const numeroDe = (pl, id) => preguntasDe(pl).findIndex(q => q.id === id) + 1;
  const prefijo = id => String(id || "").split("-")[0];
  const PREFIJOS = Object.fromEntries(PL.PLANTILLAS.map(p => [p.id, prefijo(p.bloques[0].preguntas[0].id)]));

  // ---------- Fábricas ----------
  const nuevaRespuesta = () => ({ valor: "", nota: "" });
  const nuevoDesenlace = id => ({ id, nombre: "", importancia: "", sentido: "beneficio" });
  const nuevoConfusor = id => ({ id, texto: "", tenido: "" });
  const nuevaAccion = id => ({ id, que: "", quien: "", cuando: "" });
  const nuevoVeredicto = () => ({ semaforo: { validez: "", resultados: "", aplicabilidad: "" }, motivoSemaforo: { validez: "", resultados: "", aplicabilidad: "" }, decision: "", motivo: "", acciones: [], mensaje: "" });
  function nuevaLectura(id, fecha) {
    return {
      id, titulo: "",
      referencia: { texto: "", autores: "", revista: "", anio: "", doi: "", pmid: "", url: "" },
      pico: { p: "", i: "", c: "", o: "" }, pregunta: "",
      filtro: { responde: "", tipoResumen: "", reciente: "", nota: "" },
      plantilla: "", plantillaVersion: 0,
      respuestas: {}, aparte: {},
      desenlaces: [], confusores: [],
      veredicto: nuevoVeredicto(),
      notas: "", fecha: String(fecha || "").slice(0, 10), creado: fecha || "", modificado: fecha || ""
    };
  }

  // ---------- Respuestas ----------
  const resp = (l, id) => l.respuestas[id] || nuevaRespuesta();
  const valor = (l, id) => resp(l, id).valor;
  // Una pregunta está contestada si tiene valor; las abiertas, si tienen texto
  const contestada = (l, q) => q.resp === "abierta" ? lleno(resp(l, q.id).nota) : lleno(resp(l, q.id).valor);
  function ponerRespuesta(l, id, campo, v) {
    if (!l.respuestas[id]) l.respuestas[id] = nuevaRespuesta();
    l.respuestas[id][campo] = v;
    if (!lleno(l.respuestas[id].valor) && !lleno(l.respuestas[id].nota)) delete l.respuestas[id];
  }
  // Cambiar de plantilla no pierde nada: las respuestas de la otra se guardan aparte y vuelven si se regresa a ella
  function cambiarPlantilla(l, nueva, version) {
    if (l.plantilla === nueva) return;
    Object.keys(l.respuestas).forEach(id => { l.aparte[id] = l.respuestas[id]; });
    l.respuestas = {};
    const pre = PREFIJOS[nueva];
    Object.keys(l.aparte).forEach(id => { if (prefijo(id) === pre) { l.respuestas[id] = l.aparte[id]; delete l.aparte[id]; } });
    l.plantilla = nueva; l.plantillaVersion = nueva ? (version || (plantilla(nueva) || {}).version || 0) : 0;
    l.veredicto.semaforo = { validez: "", resultados: "", aplicabilidad: "" };
  }

  // ---------- Preguntas de eliminación ----------
  // «falla» si alguna es No; «dudosa» si alguna es No se puede saber; «supera» si todas son Sí; «pendiente» si falta alguna
  function eliminacion(l) {
    const qs = preguntasDe(plantilla(l.plantilla)).filter(q => q.elim);
    if (!qs.length) return { estado: "pendiente", falla: [], dudas: [] };
    const falla = qs.filter(q => valor(l, q.id) === "no"), dudas = qs.filter(q => valor(l, q.id) === "nose");
    const estado = falla.length ? "falla" : qs.some(q => !lleno(valor(l, q.id))) ? "pendiente" : dudas.length ? "dudosa" : "supera";
    return { estado, falla, dudas };
  }
  // Paradas intermedias («¿merece la pena seguir?»): una pregunta con parada contestada «No»
  const paradas = l => preguntasDe(plantilla(l.plantilla)).filter(q => q.parada && valor(l, q.id) === "no");
  const cerradaPronto = l => l.veredicto.decision === "descartar" && (l.filtro.responde === "no" || eliminacion(l).estado === "falla");

  // ---------- Semáforo por bloque (propuesto; la persona puede cambiarlo) ----------
  // Devuelve { color: "verde"|"ambar"|"rojo"|"", motivo, completo }
  function semaforoPropuesto(l, bloque) {
    const pl = plantilla(l.plantilla); if (!pl) return { color: "", motivo: "Elige antes el tipo de estudio.", completo: false };
    const qs = preguntasDe(pl, bloque), snd = qs.filter(q => q.resp !== "abierta");
    const v = q => valor(l, q.id), no = snd.filter(q => v(q) === "no"), nose = snd.filter(q => v(q) === "nose");
    const completo = qs.every(q => contestada(l, q));
    const nums = lista => lista.map(q => numeroDe(pl, q.id)).join(", ");
    if (bloque === "validez") {
      const el = no.filter(q => q.elim);
      if (el.length) return { color: "rojo", motivo: `Falla ${el.length === 1 ? "la pregunta de eliminación" : "las preguntas de eliminación"} ${nums(el)}.`, completo };
      if (!completo) return { color: "", motivo: "Faltan preguntas por contestar.", completo };
      const elNs = nose.filter(q => q.elim);
      if (elNs.length) return { color: "ambar", motivo: `No se puede saber la pregunta de eliminación ${nums(elNs)}.`, completo };
      if (no.length) return { color: "ambar", motivo: `Riesgo de sesgo: «No» en ${no.length === 1 ? "la pregunta" : "las preguntas"} ${nums(no)}.`, completo };
      if (nose.length >= 3) return { color: "ambar", motivo: `Hay ${nose.length} preguntas que no se pueden saber: el artículo explica poco.`, completo };
      return { color: "verde", motivo: nose.length ? `Todo bien salvo ${plural(nose.length, "pregunta que no se puede saber", "preguntas que no se pueden saber")}.` : "Supera todas las preguntas de validez.", completo };
    }
    if (bloque === "resultados") {
      const par = no.filter(q => q.parada);
      if (par.length) return { color: "rojo", motivo: `No te crees los resultados (pregunta ${nums(par)}).`, completo };
      if (!snd.length) return { color: "", motivo: completo ? "Decide tú: ¿el efecto es importante y preciso?" : "Escribe primero los resultados.", completo };
      if (!completo) return { color: "", motivo: "Faltan preguntas por contestar.", completo };
      if (no.length) return { color: "ambar", motivo: `«No» en ${no.length === 1 ? "la pregunta" : "las preguntas"} ${nums(no)}.`, completo };
      if (nose.length) return { color: "ambar", motivo: `No se puede saber ${nose.length === 1 ? "la pregunta" : "las preguntas"} ${nums(nose)}.`, completo };
      return { color: "verde", motivo: "Resultados claros.", completo };
    }
    const clave = no.filter(q => CLAVE_APLICA.has(q.id));
    if (clave.length) return { color: "rojo", motivo: `«No» en la pregunta ${nums(clave)}: no se aplica a tu medio o no cambia lo que haces.`, completo };
    if (!completo) return { color: "", motivo: "Faltan preguntas por contestar.", completo };
    if (no.length) return { color: "ambar", motivo: `«No» en ${no.length === 1 ? "la pregunta" : "las preguntas"} ${nums(no)}.`, completo };
    if (nose.length) return { color: "ambar", motivo: `No se puede saber ${nose.length === 1 ? "la pregunta" : "las preguntas"} ${nums(nose)}.`, completo };
    return { color: "verde", motivo: "Aplicable a tu medio.", completo };
  }
  // El color que vale: el que puso la persona o, si no, el propuesto
  function semaforo(l, bloque) {
    const p = semaforoPropuesto(l, bloque), m = l.veredicto.semaforo[bloque];
    return m ? { color: m, motivo: l.veredicto.motivoSemaforo[bloque] || "Elegido por ti.", manual: true, propuesto: p } : Object.assign({ manual: false, propuesto: p }, p);
  }

  // ---------- Decisión propuesta ----------
  function decisionPropuesta(l) {
    if (l.filtro.responde === "no") return { decision: "descartar", motivo: "No responde a tu pregunta (filtro de dos minutos)." };
    if (!l.plantilla) return { decision: "", motivo: "Elige antes el tipo de estudio." };
    const el = eliminacion(l);
    if (el.estado === "falla") return { decision: "descartar", motivo: "No supera las preguntas de eliminación." };
    const s = { validez: semaforo(l, "validez").color, resultados: semaforo(l, "resultados").color, aplicabilidad: semaforo(l, "aplicabilidad").color };
    if (s.validez === "rojo") return { decision: "descartar", motivo: "Validez en rojo: no te puedes fiar de los resultados." };
    if (s.resultados === "rojo") return { decision: "descartar", motivo: "Resultados en rojo." };
    const falta = Object.keys(s).filter(k => !s[k]);
    if (falta.length) return { decision: "", motivo: `Falta el color del semáforo en ${falta.map(k => `«${PL.BLOQUES[k].titulo}»`).join(" y ")}.` };
    if (s.aplicabilidad === "rojo") return { decision: "esperar", motivo: "Es válido, pero no se aplica bien a tus pacientes o a tu medio: busca estudios más parecidos a tu contexto." };
    if (Object.values(s).includes("ambar")) return { decision: "esperar", motivo: "Hay dudas importantes (algún bloque en ámbar): busca más estudios o una revisión sistemática." };
    return { decision: "aplicar", motivo: "Válido, con un efecto claro y aplicable a tu medio." };
  }

  // ---------- Árbol «¿Qué tipo de estudio tengo?» ----------
  // respuestas: lista ordenada de { id, r: "si"|"no"|"nose" }. Devuelve el nodo actual o el final, y las dudas.
  function recorrerArbol(respuestas) {
    const nodo = id => PL.ARBOL.find(n => n.id === id);
    let actual = PL.ARBOL[0]; const camino = [], dudas = [];
    for (const r of respuestas) {
      if (!actual || r.id !== actual.id) break;
      camino.push(r);
      if (r.r === "nose" && PL.ARBOL_DUDA[actual.id]) dudas.push(PL.ARBOL_DUDA[actual.id]);
      const sig = r.r === "si" ? actual.si : actual.no;
      if (sig && typeof sig === "object") return { fin: sig.fin, camino, dudas: dudas.filter(d => d !== sig.fin) };
      actual = nodo(sig);
    }
    return { nodo: actual, camino, dudas };
  }

  // ---------- Protección de datos ----------
  // Se mira en lo que escribe la persona (PICO, notas, acciones), nunca en la referencia (los autores llevan nombres y el PMID tiene 8 cifras)
  const pareceDatoPaciente = s => { s = String(s || ""); return /\b(Dr|Dra|Sr|Sra|Don|Doña)\.?\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/.test(s) || /\b(NHC|NUHSA|DNI|NIF)\b/i.test(s) || /\b\d{6,}\b/.test(s) || /historia\s*(cl[ií]nica)?\s*(n[ºo°.]*)?\s*\d{4,}/i.test(s); };
  const textosPropios = l => [l.pico.p, l.pico.i, l.pico.c, l.pico.o, l.pregunta, l.filtro.nota, l.notas, l.veredicto.motivo, l.veredicto.mensaje]
    .concat(Object.values(l.respuestas).map(r => r.nota), l.veredicto.acciones.map(a => a.que + " " + a.quien));

  // ---------- Textos propuestos ----------
  function preguntaSugerida(l) {
    const { p, i, c, o } = l.pico;
    if (!lleno(p) || !lleno(i) || !lleno(o)) return "";
    return `En ${p.trim()}, ¿${i.trim()}${lleno(c) ? `, frente a ${c.trim()},` : ""} mejora ${o.trim()}?`;
  }
  function mensajeSugerido(l) {
    const d = l.veredicto.decision || decisionPropuesta(l).decision, pl = plantilla(l.plantilla);
    if (!d) return "";
    const tipo = pl ? pl.nombre.toLowerCase() : "estudio";
    const res = preguntasDe(pl, "resultados").map(q => resp(l, q.id).nota).filter(lleno)[0];
    const base = { aplicar: `Este ${tipo} es fiable y aplicable a nuestro medio`, esperar: `Este ${tipo} es prometedor, pero con dudas importantes`, descartar: `Este ${tipo} no nos sirve para decidir` }[d];
    return base + (res && d !== "descartar" ? `: ${corto(res.replace(/\s+/g, " "), 160)}` : ".");
  }

  // ---------- Avisos didácticos por paso ----------
  // { nivel: "aviso" | "nota" | "error", texto, pregunta? }
  function avisos(l, n) {
    const r = [], pl = plantilla(l.plantilla);
    if (n === 1) {
      const { p, i, o } = l.pico;
      if (![p, i, o, l.pregunta].some(lleno)) r.push({ nivel: "aviso", texto: "Buscar sin pregunta es el primer error frecuente: escribe antes qué quieres saber (pacientes, intervención, comparación y resultado)." });
      else if (!lleno(l.pregunta) && (!lleno(p) || !lleno(i) || !lleno(o))) r.push({ nivel: "nota", texto: "Completa al menos los pacientes (P), la intervención (I) y el resultado (O); la comparación (C) puede no existir." });
      if (!lleno(l.titulo) && !lleno(l.referencia.texto)) r.push({ nivel: "nota", texto: "Anota el título o la referencia del artículo: la necesitarás para la ficha de la sesión." });
    }
    if (n === 2) {
      if (l.filtro.responde === "no") r.push({ nivel: "error", texto: "No responde a tu pregunta: no merece la pena seguir. Descartarlo ahora es la decisión que más tiempo ahorra." });
      if (l.filtro.responde === "nose") r.push({ nivel: "aviso", texto: "Si el resumen no deja claro a quién se estudia y qué se compara, mira los métodos antes de seguir." });
      if (l.filtro.reciente === "no") r.push({ nivel: "aviso", texto: "Hay algo más reciente sobre lo mismo: valora leer primero lo nuevo, sobre todo si es una revisión sistemática." });
    }
    if (n === 3 && !l.plantilla) r.push({ nivel: "nota", texto: "Elige el tipo de estudio. Si dudas, pulsa «Averiguarlo con unas preguntas»." });
    if (n >= 4 && n <= 6 && pl) {
      const el = eliminacion(l);
      if (el.estado === "falla" && n === 4) r.push({ nivel: "error", texto: "Este estudio no supera las preguntas de eliminación: no merece la pena seguir." });
      if (el.estado === "dudosa" && n === 4) r.push({ nivel: "aviso", texto: "No se puede saber alguna pregunta de eliminación: sigue, pero con prudencia. Puede que el artículo explique poco sus métodos." });
      paradas(l).forEach(q => { if (BLOQUE_PASO[q.bloque] === n) r.push({ nivel: "error", texto: `Has contestado «No» a la pregunta ${numeroDe(pl, q.id)}: no merece la pena seguir.` }); });
      const sin = preguntasDe(pl, PASO_BLOQUE[n]).filter(q => !contestada(l, q));
      if (sin.length && el.estado !== "falla") r.push({ nivel: "nota", texto: `Te ${sin.length === 1 ? "falta 1 pregunta" : "faltan " + sin.length + " preguntas"} por contestar en este bloque.` });
      if (n === 4) {
        const ns = preguntasDe(pl, "validez").filter(q => valor(l, q.id) === "nose");
        if (ns.length >= 3) r.push({ nivel: "nota", texto: "Muchos «No se puede saber»: también informan. El artículo no explica bien lo que hizo." });
      }
      if (n === 4 && l.plantilla === "ensayo" && !l.desenlaces.some(d => lleno(d.nombre))) r.push({ nivel: "nota", texto: "Apunta los desenlaces del ensayo y puntúa su importancia del 1 al 9: te ayudará en las preguntas 7 y 10." });
      if (n === 6 && l.plantilla === "ensayo" && valor(l, "ec-10") === "si" && l.desenlaces.some(d => lleno(d.nombre) && !lleno(d.importancia))) r.push({ nivel: "nota", texto: "Has dicho que se tienen en cuenta todos los desenlaces importantes, pero hay desenlaces sin puntuar su importancia." });
    }
    if (n === 7) {
      const p = decisionPropuesta(l), d = l.veredicto.decision;
      if (!d) r.push({ nivel: "nota", texto: "Termina con una decisión: aplicar, esperar o descartar." });
      if (d === "aplicar" && semaforo(l, "validez").color === "rojo") r.push({ nivel: "aviso", texto: "Decides aplicar un estudio con la validez en rojo: escribe bien el motivo." });
      else if (d && p.decision && d !== p.decision) r.push({ nivel: "nota", texto: `La app proponía «${DECISIONES[p.decision].nom}». Puedes decidir otra cosa: explica el motivo.` });
      if (d && d !== p.decision && !lleno(l.veredicto.motivo)) r.push({ nivel: "aviso", texto: "Falta el motivo de tu decisión." });
      if (d === "aplicar" && !l.veredicto.acciones.some(a => lleno(a.que))) r.push({ nivel: "nota", texto: "Has decidido aplicar: anota quién hace qué y cuándo (por ejemplo, medirlo con un ciclo de mejora)." });
      if (d === "esperar" && !l.veredicto.acciones.some(a => lleno(a.que))) r.push({ nivel: "nota", texto: "Has decidido esperar: anota qué vas a buscar (otra revisión, un estudio en pacientes como los tuyos)." });
    }
    if (textosPropios(l).some(pareceDatoPaciente)) r.push({ nivel: "aviso", texto: "Parece que has escrito un nombre o un número de historia: una lectura crítica no necesita datos de pacientes. Bórralo." });
    return r.filter(x => x.texto);
  }

  // ---------- Progreso ----------
  function progreso(l) {
    const pl = plantilla(l.plantilla), pronto = cerradaPronto(l);
    const bloqueHecho = b => pronto || (!!pl && preguntasDe(pl, b).every(q => contestada(l, q)));
    return {
      1: lleno(l.pregunta) || (lleno(l.pico.p) && lleno(l.pico.i) && lleno(l.pico.o)),
      2: lleno(l.filtro.responde),
      3: !!l.plantilla || pronto,
      4: bloqueHecho("validez"), 5: bloqueHecho("resultados"), 6: bloqueHecho("aplicabilidad"),
      7: lleno(l.veredicto.decision)
    };
  }
  function pasoPendiente(l) {
    const g = progreso(l);
    return PASOS.find(p => !g[p.n]) || null;
  }
  function resumen(l) {
    const pl = plantilla(l.plantilla), qs = preguntasDe(pl);
    return { total: qs.length, contestadas: qs.filter(q => contestada(l, q)).length, eliminacion: eliminacion(l).estado, decision: l.veredicto.decision };
  }
  const nombreLectura = l => lleno(l.titulo) ? l.titulo : lleno(l.referencia.texto) ? l.referencia.texto : l.pregunta;
  function siguientePaso(d) {
    if (!d.lecturas.length) return { texto: "Aún no has leído ningún artículo con la app. Empieza por tu pregunta y el artículo que tienes entre manos.", btn: "Leer un artículo", href: "#/lecturas/nueva" };
    const ult = d.lecturas.slice().sort((a, b) => String(b.modificado).localeCompare(String(a.modificado)))[0], p = pasoPendiente(ult);
    if (p) return { texto: `Sigue con «${corto(nombreLectura(ult) || "tu lectura", 70)}»: te falta el paso ${p.n}, ${p.titulo.toLowerCase()}.`, btn: `Ir al paso ${p.n}`, href: `#/lectura/${ult.id}/${p.n}` };
    return { texto: `Terminaste «${corto(nombreLectura(ult) || "tu lectura", 70)}» (${DECISIONES[ult.veredicto.decision].nom.toLowerCase()}). ¿Lees otro artículo sobre la misma pregunta?`, btn: "Leer otro artículo", href: "#/lecturas/nueva" };
  }

  // ---------- Saneado por esquema (lo que se carga o se importa nunca se usa sin pasar por aquí) ----------
  // [max] = texto; "id" = id propio; "ent" = entero ≥ 0; {en} = enumerado; {lista: max, max} = lista de textos;
  // {de: esquema, max} = lista de objetos; {obj: esquema} = objeto anidado; {mapa: esquema, max} = objeto con claves de pregunta
  const idValido = v => typeof v === "string" && /^[a-z0-9-]{1,40}$/i.test(v);
  const idPregunta = k => /^[a-z]{2}-\d{1,2}$/.test(k);
  const txt = (v, max) => (typeof v === "string" || typeof v === "number") ? String(v).slice(0, max) : "";
  const COLOR_EN = { en: ["", "verde", "ambar", "rojo"] };
  const SNS = { en: ["", "si", "no", "nose"] };
  const ESQ = {
    referencia: { texto: [1500], autores: [800], revista: [300], anio: [10], doi: [200], pmid: [20], url: [600] },
    pico: { p: [600], i: [600], c: [600], o: [600] },
    filtro: { responde: SNS, tipoResumen: [300], reciente: SNS, nota: [2000] },
    respuesta: { valor: SNS, nota: [4000] },
    desenlace: { id: "id", nombre: [300], importancia: { en: ["", "1", "2", "3", "4", "5", "6", "7", "8", "9"] }, sentido: { en: ["beneficio", "dano"] } },
    confusor: { id: "id", texto: [300], tenido: SNS },
    accion: { id: "id", que: [800], quien: [200], cuando: [100] },
    semaforos: { validez: COLOR_EN, resultados: COLOR_EN, aplicabilidad: COLOR_EN },
    motivos: { validez: [600], resultados: [600], aplicabilidad: [600] },
    veredicto: { semaforo: { obj: "semaforos" }, motivoSemaforo: { obj: "motivos" }, decision: { en: ["", "aplicar", "esperar", "descartar"] }, motivo: [2000], acciones: { de: "accion", max: 20 }, mensaje: [800] },
    lectura: { id: "id", titulo: [400], referencia: { obj: "referencia" }, pico: { obj: "pico" }, pregunta: [1200], filtro: { obj: "filtro" },
      plantilla: { en: ["", ...PL.PLANTILLAS.map(p => p.id)] }, plantillaVersion: "ent",
      respuestas: { mapa: "respuesta", max: 60 }, aparte: { mapa: "respuesta", max: 200 },
      desenlaces: { de: "desenlace", max: 30 }, confusores: { de: "confusor", max: 30 }, veredicto: { obj: "veredicto" },
      notas: [4000], fecha: [20], creado: [40], modificado: [40] }
  };
  const FABRICA = {
    referencia: () => nuevaLectura("x").referencia, pico: () => nuevaLectura("x").pico, filtro: () => nuevaLectura("x").filtro,
    respuesta: nuevaRespuesta, desenlace: nuevoDesenlace, confusor: nuevoConfusor, accion: nuevaAccion,
    semaforos: () => nuevoVeredicto().semaforo, motivos: () => nuevoVeredicto().motivoSemaforo, veredicto: nuevoVeredicto,
    lectura: id => nuevaLectura(id, "")
  };
  function sanear(esq, o, genId) {
    if (!o || typeof o !== "object" || Array.isArray(o)) return null;
    const S = ESQ[esq], r = FABRICA[esq](genId());
    Object.keys(S).forEach(k => {
      const regla = S[k], v = o[k];
      if (regla === "id") r[k] = idValido(v) ? v : r[k];
      else if (regla === "ent") { const n = Number(v); r[k] = Number.isInteger(n) && n >= 0 && n < 1e6 ? n : 0; }
      else if (Array.isArray(regla)) { if (v !== undefined) r[k] = txt(v, regla[0]); }
      else if (regla.en && !regla.lista) r[k] = regla.en.includes(v) ? v : r[k];
      else if (regla.lista) r[k] = Array.isArray(v) ? [...new Set(v.slice(0, regla.max * 2).map(x => txt(x, regla.lista)).filter(Boolean))].slice(0, regla.max) : [];
      else if (regla.de) r[k] = Array.isArray(v) ? v.slice(0, regla.max).map(x => sanear(regla.de, x, genId)).filter(Boolean) : [];
      else if (regla.obj) r[k] = sanear(regla.obj, v, genId) || r[k];
      else if (regla.mapa) {
        r[k] = {};
        if (v && typeof v === "object" && !Array.isArray(v)) Object.keys(v).filter(idPregunta).slice(0, regla.max).forEach(q => {
          const x = sanear(regla.mapa, v[q], genId); if (x && (lleno(x.valor) || lleno(x.nota))) r[k][q] = x;
        });
      }
    });
    return r;
  }
  function sanearLectura(o, genId, fecha) {
    const l = sanear("lectura", o, genId); if (!l) return null;
    if (!l.creado) l.creado = fecha; if (!l.modificado) l.modificado = l.creado;
    // Las respuestas que no son de la plantilla elegida van aparte
    const pre = PREFIJOS[l.plantilla];
    Object.keys(l.respuestas).forEach(id => { if (prefijo(id) !== pre) { l.aparte[id] = l.respuestas[id]; delete l.respuestas[id]; } });
    return l;
  }
  function sanearDatos(o, genId, fecha) {
    if (!o || typeof o !== "object" || !Array.isArray(o.lecturas)) return null;
    return { lecturas: o.lecturas.slice(0, 1000).map(x => sanearLectura(x, genId, fecha)).filter(Boolean) };
  }
  // Fusiona sin duplicar: si un id ya existe se conserva el más reciente
  function fusionar(actual, nuevo) {
    const m = new Map(actual.lecturas.map(x => [x.id, x]));
    nuevo.lecturas.forEach(x => { const y = m.get(x.id); if (!y || String(x.modificado) > String(y.modificado)) m.set(x.id, x); });
    return { lecturas: Array.from(m.values()) };
  }

  const API = {
    VERSION_DATOS, URL_AUD, URL_IND, URL_TM, URL_AMFE, URL_FLUJO, URL_DAFO, URL_MAPA, URL_RONDAS, URL_NORM, URL_PORTAL,
    lleno, sinTildes, corto, plural, fmtFecha,
    PASOS, PASO_BLOQUE, BLOQUE_PASO, RESPUESTAS, DECISIONES, COLORES, IMPORTANCIA, CLAVE_APLICA,
    plantilla, preguntasDe, numeroDe, PREFIJOS,
    nuevaLectura, nuevaRespuesta, nuevoDesenlace, nuevoConfusor, nuevaAccion, nuevoVeredicto,
    resp, valor, contestada, ponerRespuesta, cambiarPlantilla,
    eliminacion, paradas, cerradaPronto, semaforoPropuesto, semaforo, decisionPropuesta,
    recorrerArbol, pareceDatoPaciente, preguntaSugerida, mensajeSugerido, avisos,
    progreso, pasoPendiente, resumen, nombreLectura, siguientePaso,
    ESQ, sanear, sanearLectura, sanearDatos, fusionar
  };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else raiz.Logica = API;
})(typeof window !== "undefined" ? window : this);
