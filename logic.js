// ============================================================
//  logic.js — Lógica PURA (sin DOM) · Lectura Crítica
//  Modelo de una lectura (pregunta PICO, referencia, filtro de dos minutos,
//  plantilla y respuestas, desenlaces, confusores, veredicto), preguntas de
//  eliminación y aviso de parada, semáforo por bloque y decisión propuesta
//  (aplicar · esperar · descartar), árbol «¿Qué tipo de estudio tengo?»,
//  avisos didácticos por paso, progreso y «tu siguiente paso», calculadoras
//  guardadas con la lectura (las fórmulas viven en calculos.js), saneado y fusión.
//  window.Logica en navegador y module.exports en Node (tests).
// ============================================================
(function (raiz) {
  "use strict";
  const enNode = typeof module !== "undefined" && module.exports;
  const PL = enNode ? require("./plantillas.js") : raiz.Plantillas;
  const CA = enNode ? require("./calculos.js") : raiz.Calculos;

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
    { n: 6, k: "aplicabilidad", titulo: "¿Me sirve?", corto: "Sirve", que: "¿Se parecen tus pacientes? ¿Están todos los resultados importantes? ¿Compensa?", entrega: 1 },
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
  const CLAVE_APLICA = new Set(["ec-9", "rs-8", "dx-10", "co-10", "cc-10", "cu-10", "ee-9", "ee-11", "rp-11", "ad-9"]);

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
  // Una calculadora guardada con la lectura: solo lo escrito; los resultados se calculan siempre (calculos.js)
  const CAMPOS_CALC = ["nc", "pc", "ec", "ne", "pe", "ee", "peer", "f", "a", "b", "c", "d", "pre", "umbral", "s", "e", "cn", "ch", "en", "eh", "unidad",
    // fase 2: supervivencia, metaanálisis y umbrales
    "modo", "hr", "li", "ls", "oe", "v", "oe1", "ee1", "oc1", "ec1", "ev1", "ev2", "evt", "n1", "n2", "p", "sentido", "m1", "m2", "e1", "s1", "e2", "s2", "medida", "metodo", "dano", "rprueba", "beneficio"];
  const CAMPOS_ESTUDIO = ["nombre", "ee", "ne", "ec", "nc", "hr", "li", "ls", "v", "n1", "m1", "d1", "n2", "m2", "d2"];
  const nuevoEstudio = () => Object.fromEntries(CAMPOS_ESTUDIO.map(k => [k, ""]));
  const matrizVacia = k => Array.from({ length: k }, () => Array.from({ length: k }, () => ""));
  const TIPOS_CALC = Object.keys(CA.CALCS);
  const nuevaEntrada = () => Object.fromEntries(CAMPOS_CALC.map(k => [k, ""]));
  const nuevoNivel = () => ({ nombre: "", a: "", b: "" });
  function nuevoCalculo(id, tipo) {
    const c = { id, tipo, nombre: "", entrada: nuevaEntrada(), niveles: tipo === "niveles" ? [nuevoNivel(), nuevoNivel(), nuevoNivel()] : [], estudios: tipo === "metaanalisis" ? [nuevoEstudio(), nuevoEstudio(), nuevoEstudio()] : [], matriz: tipo === "kappa" ? matrizVacia(2) : [], nota: "" };
    if (tipo === "supervivencia") c.entrada.modo = "ic";
    if (tipo === "metaanalisis") Object.assign(c.entrada, { medida: "or", metodo: "mh" });
    return c;
  }
  const resultadoCalculo = c => CA.calcular(c.tipo, Object.assign({}, c.entrada, { niveles: c.niveles, estudios: c.estudios || [], matriz: c.matriz || [] }));
  // Las calculadoras de la lectura que sirven a una pregunta (por su «calc»)
  const calculosDe = (l, q) => { const t = q && CA.CALCS_DE_PREGUNTA[q.calc]; return t ? l.calculos.filter(c => t.includes(c.tipo)) : []; };
  const nuevoVeredicto = () => ({ semaforo: { validez: "", resultados: "", aplicabilidad: "" }, motivoSemaforo: { validez: "", resultados: "", aplicabilidad: "" }, decision: "", motivo: "", acciones: [], mensaje: "" });
  function nuevaLectura(id, fecha) {
    return {
      id, titulo: "",
      referencia: { texto: "", autores: "", revista: "", anio: "", doi: "", pmid: "", url: "" },
      pico: { p: "", i: "", c: "", o: "" }, pregunta: "", resumen: "",
      filtro: { responde: "", tipoResumen: "", reciente: "", nota: "" },
      plantilla: "", plantillaVersion: 0,
      respuestas: {}, aparte: {},
      desenlaces: [], confusores: [], calculos: [],
      veredicto: nuevoVeredicto(),
      club: { asistentes: [], votos: {} },
      notas: "", fecha: String(fecha || "").slice(0, 10), creado: fecha || "", modificado: fecha || ""
    };
  }

  // ---------- Respuestas ----------
  const resp = (l, id) => l.respuestas[id] || nuevaRespuesta();
  const valor = (l, id) => resp(l, id).valor;
  // Una pregunta está contestada si tiene valor; las abiertas, si tienen texto o una calculadora con resultado
  const contestada = (l, q) => q.resp === "abierta" ? lleno(resp(l, q.id).nota) || calculosDe(l, q).some(c => resultadoCalculo(c).ok) : lleno(resp(l, q.id).valor);
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
      if (!snd.length) {
        // Sin preguntas de Sí/No: propone la primera calculadora con resultado de este bloque
        const c = qs.reduce((a, q) => a.concat(calculosDe(l, q)), []).map(x => CA.semaforoCalculo(x.tipo, resultadoCalculo(x))).find(Boolean);
        if (c) return { color: c.color, motivo: "Según la calculadora: " + c.motivo, completo };
        return { color: "", motivo: completo ? "Decide tú: ¿el efecto es importante y preciso?" : "Escribe primero los resultados o usa la calculadora.", completo };
      }
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
    const res = preguntasDe(pl, "resultados").map(q => resp(l, q.id).nota).filter(lleno)[0] || textoCalculo(l.calculos[0]);
    const base = { aplicar: `Este ${tipo} es fiable y aplicable a nuestro medio`, esperar: `Este ${tipo} es prometedor, pero con dudas importantes`, descartar: `Este ${tipo} no nos sirve para decidir` }[d];
    return base + (res && d !== "descartar" ? `: ${corto(res.replace(/\s+/g, " "), 160)}` : ".");
  }

  // Frase en lenguaje llano de una calculadora guardada
  function textoCalculo(c) {
    if (!c) return "";
    const r = resultadoCalculo(c);
    if (!r.ok) return "";
    if (c.tipo === "tratamiento") return CA.textoTratamiento(r, c.nombre);
    if (c.tipo === "diagnostico" || c.tipo === "bayes") return CA.textoDiagnostico(r);
    if (c.tipo === "or") return CA.textoOR(r);
    if (c.tipo === "cei") return CA.textoCEI(r, c.entrada.unidad);
    if (c.tipo === "supervivencia") return (c.nombre ? c.nombre + ": " : "") + CA.textoSupervivencia(r);
    if (c.tipo === "metaanalisis") return CA.textoMeta(r);
    if (c.tipo === "niveles") return r.filas.map((x, i) => `${x.nombre || "Nivel " + (i + 1)}: LR ${CA.fmt(x.lr.v)} (IC 95 %: ${CA.icTxt(x.lr)})`).join("; ") + ".";
    if (c.tipo === "kappa") return `Kappa ${CA.fmt(r.kappa.v)} (IC 95 %: ${CA.icTxt(r.kappa)}): concordancia ${CA.kappaFuerza(r.kappa.v)}${r.k > 2 ? `; ponderado ${CA.fmt(r.kappaW)}` : ""}.`;
    if (c.tipo === "umbrales") return `Umbral diagnóstico ${CA.pct(r.dx)} y terapéutico ${CA.pct(r.tx)}.${r.decision ? " " + CA.DECISION_UMBRAL[r.decision] : ""}`;
    return "";
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

  // ---------- Club de lectura: cada asistente contesta (mejora A) ----------
  const nuevoAsistente = (id, nombre) => ({ id, nombre: nombre || "" });
  function ponerVoto(l, qid, aid, v) {
    const V = l.club.votos[qid] || (l.club.votos[qid] = {});
    if (!v || V[aid] === v) delete V[aid]; else V[aid] = v;
    if (!Object.keys(V).length) delete l.club.votos[qid];
  }
  // Reparto de los votos de una pregunta (solo de los asistentes que siguen en la lista)
  function reparto(l, qid) {
    const V = l.club.votos[qid] || {}, ids = new Set(l.club.asistentes.map(a => a.id)), r = { si: 0, no: 0, nose: 0, total: 0 };
    Object.keys(V).forEach(aid => { if (ids.has(aid) && r[V[aid]] != null) { r[V[aid]]++; r.total++; } });
    return r;
  }
  // La respuesta más votada (si hay empate en cabeza, ninguna) y si hay discrepancia (a la vez «Sí» y «No»)
  function mayoria(l, qid) {
    const r = reparto(l, qid), orden = ["si", "no", "nose"].sort((a, b) => r[b] - r[a]);
    return r.total && r[orden[0]] > r[orden[1]] ? orden[0] : "";
  }
  const discrepancia = (l, qid) => { const r = reparto(l, qid); return r.si > 0 && r.no > 0 && Math.min(r.si, r.no) / r.total >= 0.25; };

  // ---------- Sesiones: varias lecturas sobre la misma pregunta (mejora G) ----------
  const nuevaSesion = (id, fecha) => ({ id, titulo: "", pregunta: "", unidad: "", fecha: String(fecha || "").slice(0, 10), lecturas: [], conclusion: "", decision: "", creado: fecha || "", modificado: fecha || "" });
  const lecturasDeSesion = (s, lecturas) => s.lecturas.map(id => lecturas.find(l => l.id === id)).filter(Boolean);

  // ---------- Resultado clave de una lectura (para la ficha, el Excel y el intercambio) ----------
  function resultadoClave(l) {
    for (const c of l.calculos) {
      const r = resultadoCalculo(c); if (!r.ok) continue;
      if (c.tipo === "tratamiento") return { desenlace: c.nombre, medida: r.nnt.v === Infinity ? "RAR" : r.nnt.tipo, valor: r.nnt.v === Infinity ? 0 : r.nnt.v, icInf: r.nnt.cruza ? null : r.nnt.inf, icSup: r.nnt.cruza ? null : r.nnt.sup, texto: (c.nombre ? c.nombre + ": " : "") + CA.nntTxt(r.nnt) };
      if (c.tipo === "diagnostico" || c.tipo === "bayes") return { desenlace: c.nombre, medida: "LR+", valor: r.lrp.v, icInf: r.lrp.inf != null ? r.lrp.inf : null, icSup: r.lrp.sup != null ? r.lrp.sup : null, texto: `LR+ ${CA.fmt(r.lrp.v)}; LR− ${CA.fmt(r.lrn.v)}` };
      if (c.tipo === "or") return { desenlace: c.nombre, medida: "OR", valor: r.or.v, icInf: r.or.inf, icSup: r.or.sup, texto: `OR ${CA.fmt(r.or.v)} (IC 95 %: ${CA.icTxt(r.or)})` };
      if (c.tipo === "cei" && isFinite(r.rcei)) return { desenlace: c.entrada.unidad, medida: "RCEI", valor: r.rcei, icInf: null, icSup: null, texto: CA.textoCEI(r, c.entrada.unidad) };
      if (c.tipo === "supervivencia") return { desenlace: c.nombre, medida: "HR", valor: r.hr.v, icInf: r.hr.inf, icSup: r.hr.sup, texto: `HR ${CA.fmt(r.hr.v)} (IC 95 %: ${CA.icTxt(r.hr)})` };
      if (c.tipo === "metaanalisis") { const A = r.aleatorio, f = x => CA.fmt(x, r.log ? 2 : 2); return { desenlace: c.nombre, medida: { or: "OR", rr: "RR", dr: "DR", hr: "HR", dm: "DM", hedges: "g", cohen: "d", glass: "Δ" }[r.medida], valor: A.v, icInf: A.inf, icSup: A.sup, texto: `${CA.MEDIDAS_META[r.medida].nom} combinada ${f(A.v)} (IC 95 %: ${f(A.inf)} a ${f(A.sup)}); I² ${CA.pct(r.i2, 0)}` }; }
      if (c.tipo === "kappa") return { desenlace: "", medida: "kappa", valor: r.kappa.v, icInf: r.kappa.inf, icSup: r.kappa.sup, texto: `Kappa ${CA.fmt(r.kappa.v)} (IC 95 %: ${CA.icTxt(r.kappa)})` };
      if (c.tipo === "niveles") return { desenlace: "", medida: "LR", valor: r.filas[0].lr.v, icInf: r.filas[0].lr.inf, icSup: r.filas[0].lr.sup, texto: r.filas.map((x, i) => `${x.nombre || "Nivel " + (i + 1)}: LR ${CA.fmt(x.lr.v)}`).join("; ") };
    }
    const q = preguntasDe(plantilla(l.plantilla), "resultados").find(x => lleno(resp(l, x.id).nota));
    return q ? { desenlace: "", medida: "", valor: null, icInf: null, icSup: null, texto: corto(resp(l, q.id).nota.replace(/\s+/g, " "), 300) } : null;
  }

  // ---------- Paquete de intercambio «lecturacritica-lecturas» v1 (Diseño, 6.4) ----------
  const FORMATO_INTERCAMBIO = "lecturacritica-lecturas", VERSION_INTERCAMBIO = 1;
  const numONull = v => typeof v === "number" && isFinite(v) ? Number(v.toPrecision(6)) : null;
  function paqueteIntercambio(lecturas, appVersion, generado) {
    return {
      formato: FORMATO_INTERCAMBIO, version: VERSION_INTERCAMBIO, app: "lecturacritica", appVersion, generado,
      lecturas: lecturas.filter(l => !/^ej-/.test(l.id)).map(l => {
        const pl = plantilla(l.plantilla), rc = resultadoClave(l), el = eliminacion(l).estado, s = b => semaforo(l, b).color || null;
        return {
          id: l.id, titulo: l.titulo, cita: l.referencia.texto, doi: l.referencia.doi, pmid: l.referencia.pmid, url: l.referencia.url, anio: l.referencia.anio,
          pregunta: lleno(l.pregunta) ? l.pregunta : preguntaSugerida(l), pico: Object.assign({}, l.pico),
          tipo: l.plantilla || null, tipoNombre: pl ? pl.nombre : null,
          eliminacion: el === "falla" ? "falla" : el === "dudosa" ? "dudosa" : el === "supera" ? "supera" : null,
          semaforo: { validez: s("validez"), resultados: s("resultados"), aplicabilidad: s("aplicabilidad") },
          decision: l.veredicto.decision || null, motivo: l.veredicto.motivo,
          resultadosClave: rc ? [{ desenlace: rc.desenlace, medida: rc.medida, valor: numONull(rc.valor), icInf: numONull(rc.icInf), icSup: numONull(rc.icSup), texto: rc.texto }] : [],
          mensaje: l.veredicto.mensaje, fecha: l.fecha
        };
      })
    };
  }
  // Lee y valida un paquete (para las apps que lo traigan; aquí se usa en los tests)
  function leerIntercambio(o) {
    if (!o || o.formato !== FORMATO_INTERCAMBIO || o.version !== VERSION_INTERCAMBIO || !Array.isArray(o.lecturas)) return null;
    return o.lecturas.filter(x => x && typeof x.id === "string");
  }

  // ---------- Buscar en PubMed desde la PICO (mejora I) ----------
  const FILTROS_PUBMED = { "": "Sin filtro", ensayo: "Ensayos clínicos", revision: "Revisiones sistemáticas", diagnostico: "Diagnóstico" };
  const SUFIJO_PUBMED = { ensayo: "randomized controlled trial[pt]", revision: "systematic[sb]", diagnostico: "(sensitiv*[Title/Abstract] OR sensitivity and specificity[MeSH Terms] OR diagnos*[Title/Abstract])" };
  function busquedaPubMed(l, filtro) {
    const t = x => String(x || "").replace(/[()"\[\]]/g, " ").replace(/\s+/g, " ").trim();
    const partes = [l.pico.p, l.pico.i, l.pico.o].map(t).filter(lleno).map(x => /\s/.test(x) ? `(${x})` : x);
    if (!partes.length) return null;
    const q = partes.join(" AND ") + (SUFIJO_PUBMED[filtro] ? " AND " + SUFIJO_PUBMED[filtro] : "");
    return { consulta: q, url: "https://pubmed.ncbi.nlm.nih.gov/?term=" + encodeURIComponent(q) };
  }

  // ---------- Documentos (lista de bloques para Word, vista previa y PDF) ----------
  const FONDO = { si: "DCFCE7", no: "FFE4E6", nose: "FEF3C7", verde: "DCFCE7", ambar: "FEF3C7", rojo: "FFE4E6" };
  const COLOR_NOM = { verde: "Verde", ambar: "Ámbar", rojo: "Rojo" };
  const refTexto = l => lleno(l.referencia.texto) ? l.referencia.texto : [l.referencia.autores, l.titulo, l.referencia.revista, l.referencia.anio, lleno(l.referencia.doi) ? "doi: " + l.referencia.doi : ""].filter(lleno).join(". ");
  const citaPie = pl => pl ? (pl.propia ? pl.cita : `Preguntas propias de la app, basadas en los criterios de la plantilla CASPe. ${pl.cita}`) : "";
  function documentoFicha(l, fecha) {
    const B = [], pl = plantilla(l.plantilla), nom = nombreLectura(l) || "Lectura sin título", d = l.veredicto.decision;
    B.push({ t: "portada", titulo: "Lectura crítica · Ficha", sub: nom, extra: [pl ? pl.nombre : "", refTexto(l) !== nom ? refTexto(l) : "", "Fecha: " + (fmtFecha(l.fecha) || fecha)].filter(lleno) });
    const preg = lleno(l.pregunta) ? l.pregunta : preguntaSugerida(l);
    B.push({ t: "h1", texto: "1. La pregunta" }, { t: "p", texto: preg || "Sin pregunta escrita." });
    if ([l.pico.p, l.pico.i, l.pico.c, l.pico.o].some(lleno)) B.push({ t: "tabla", fuente: 9, sinCab: true, anchos: [22, 78], filas: [["Pacientes (P)", l.pico.p], ["Intervención (I)", l.pico.i], ["Comparación (C)", l.pico.c], ["Resultado (O)", l.pico.o]].filter(f => lleno(f[1])).map(([a, b]) => [{ texto: a, negrita: true }, b]) });
    if (l.filtro.responde === "no") B.push({ t: "p", runs: [{ texto: "Filtro de dos minutos: ", negrita: true }, { texto: "no responde a la pregunta. Se descartó sin leerlo entero." }] });
    if (pl) {
      B.push({ t: "h1", texto: `2. ${pl.nombre}: las preguntas` });
      const el = eliminacion(l);
      if (el.estado === "falla") B.push({ t: "p", runs: [{ texto: "No supera las preguntas de eliminación. ", negrita: true }, { texto: "No merece la pena seguir." }] });
      pl.bloques.forEach(b => {
        B.push({ t: "h2", texto: `${PL.BLOQUES[b.id].titulo} ${PL.BLOQUES[b.id].sub}` });
        B.push({ t: "tabla", fuente: 8, cab: ["Nº", "Pregunta", "Respuesta", "Nota o resultado"], anchos: [5, 47, 14, 34], filas: preguntasDe(pl, b.id).map(q => {
          const r = resp(l, q.id), v = r.valor;
          const cel = q.resp === "abierta" ? { texto: contestada(l, q) ? "Ver nota" : "—", centro: true } : { texto: v ? RESPUESTAS[v] : "—", centro: true, negrita: !!v, fondo: FONDO[v] };
          const nota = q.resp === "abierta" && !lleno(r.nota) ? calculosDe(l, q).map(textoCalculo).filter(lleno).join("\n") : r.nota;
          return [{ texto: String(numeroDe(pl, q.id)), centro: true }, (q.elim ? "[Eliminación] " : "") + q.texto, cel, nota];
        }) });
      });
      if (l.desenlaces.some(x => lleno(x.nombre))) B.push({ t: "h2", texto: "Desenlaces y su importancia (GRADE, 1-9)" }, { t: "tabla", fuente: 9, cab: ["Desenlace", "Importancia", "Tipo"], anchos: [60, 22, 18], filas: l.desenlaces.filter(x => lleno(x.nombre)).map(x => [x.nombre, lleno(x.importancia) ? `${x.importancia} · ${IMPORTANCIA(Number(x.importancia))}` : "—", x.sentido === "dano" ? "Daño" : "Beneficio"]) });
      if (l.confusores.some(x => lleno(x.texto))) B.push({ t: "h2", texto: "Factores de confusión" }, { t: "tabla", fuente: 9, cab: ["Factor", "¿Lo tuvieron en cuenta?"], anchos: [70, 30], filas: l.confusores.filter(x => lleno(x.texto)).map(x => [x.texto, { texto: x.tenido ? RESPUESTAS[x.tenido] : "—", fondo: FONDO[x.tenido] }]) });
      const cs = l.calculos.map(textoCalculo).filter(lleno);
      if (cs.length) B.push({ t: "h2", texto: "Resultados calculados" }, { t: "lista", items: cs });
      B.push({ t: "h1", texto: "3. Veredicto" }, { t: "tabla", fuente: 9, cab: ["Bloque", "Semáforo", "Por qué"], anchos: [24, 14, 62], filas: ["validez", "resultados", "aplicabilidad"].map(k => { const x = semaforo(l, k); return [{ texto: PL.BLOQUES[k].titulo, negrita: true }, { texto: COLOR_NOM[x.color] || "—", centro: true, negrita: true, fondo: FONDO[x.color] }, x.motivo]; }) });
    } else B.push({ t: "h1", texto: "3. Veredicto" });
    B.push({ t: "p", runs: [{ texto: "Decisión: ", negrita: true }, { texto: d ? DECISIONES[d].nom : "Sin decidir" }, ...(lleno(l.veredicto.motivo) ? [{ texto: ". " + l.veredicto.motivo }] : [])] });
    const acc = l.veredicto.acciones.filter(a => lleno(a.que));
    if (acc.length) B.push({ t: "h2", texto: "Qué hacemos ahora" }, { t: "tabla", fuente: 9, cab: ["Qué", "Quién", "Cuándo"], anchos: [56, 26, 18], filas: acc.map(a => [a.que, a.quien, a.cuando]) });
    if (lleno(l.veredicto.mensaje)) B.push({ t: "h2", texto: "Mensaje para llevar" }, { t: "p", runs: [{ texto: l.veredicto.mensaje, negrita: true }] });
    if (lleno(l.notas)) B.push({ t: "h2", texto: "Notas" }, { t: "p", texto: l.notas });
    if (pl) B.push({ t: "p", estilo: "nota", texto: citaPie(pl) });
    return { titulo: "Lectura crítica · " + corto(nom, 80), bloques: B };
  }
  function documentoSesion(s, lecturas, fecha) {
    const B = [], L_ = lecturasDeSesion(s, lecturas), nom = s.titulo || "Sesión bibliográfica";
    B.push({ t: "portada", titulo: "Lectura crítica · Sesión", sub: nom, extra: [s.unidad, "Fecha: " + (fmtFecha(s.fecha) || fecha), plural(L_.length, "artículo", "artículos")].filter(lleno) });
    B.push({ t: "h1", texto: "La pregunta" }, { t: "p", texto: s.pregunta || "Sin pregunta escrita." });
    B.push({ t: "h1", texto: "Los artículos" }, { t: "tabla", fuente: 8, cab: ["Artículo", "Tipo", "Válido", "Qué dice", "Me sirve", "Resultado clave", "Decisión"], anchos: [26, 12, 8, 8, 8, 24, 14], filas: L_.map(l => {
      const pl = plantilla(l.plantilla), c = k => { const x = pl ? semaforo(l, k).color : ""; return { texto: COLOR_NOM[x] || "—", centro: true, fondo: FONDO[x] }; }, rc = resultadoClave(l);
      return [{ texto: nombreLectura(l) || "Sin título", negrita: true }, pl ? pl.corto : (l.filtro.responde === "no" ? "Filtro" : "—"), c("validez"), c("resultados"), c("aplicabilidad"), rc ? rc.texto : "", { texto: l.veredicto.decision ? DECISIONES[l.veredicto.decision].nom : "—", negrita: true, fondo: { aplicar: "DCFCE7", esperar: "FEF3C7", descartar: "FFE4E6" }[l.veredicto.decision] }];
    }) });
    L_.filter(l => lleno(l.veredicto.mensaje)).forEach(l => B.push({ t: "p", runs: [{ texto: (nombreLectura(l) || "Lectura") + ": ", negrita: true }, { texto: l.veredicto.mensaje }] }));
    B.push({ t: "h1", texto: "Conclusión de la sesión" }, { t: "p", runs: [{ texto: "Decisión: ", negrita: true }, { texto: s.decision ? DECISIONES[s.decision].nom : "Sin decidir" }] });
    if (lleno(s.conclusion)) B.push({ t: "p", texto: s.conclusion });
    return { titulo: "Lectura crítica · Sesión · " + corto(nom, 80), bloques: B };
  }
  // Plantilla en blanco para contestar a lápiz (mejora J)
  function documentoPlantilla(pl) {
    const B = [], hueco = "_______________________________________________";
    B.push({ t: "portada", titulo: "Plantilla de lectura crítica", sub: pl.nombre, extra: ["Artículo: " + hueco, "Tu pregunta (PICO): " + hueco, "Lo lee: ____________________   Fecha: ____ / ____ / ________"] });
    B.push({ t: "p", texto: "Contesta cada pregunta con Sí, No o No se puede saber (NS). Las preguntas de eliminación van primero: si alguna es «No», no merece la pena seguir." });
    pl.bloques.forEach(b => {
      B.push({ t: "h1", texto: `${PL.BLOQUES[b.id].titulo} ${PL.BLOQUES[b.id].sub}` });
      const qs = preguntasDe(pl, b.id);
      B.push({ t: "tabla", fuente: 8, cab: ["Nº", "Pregunta y pistas", "Sí", "No", "NS", "Notas"], anchos: [5, 55, 6, 6, 6, 22], filas: qs.map(q => [{ texto: String(numeroDe(pl, q.id)), centro: true }, `${q.elim ? "[Eliminación] " : ""}${q.texto}\n${q.pistas.map(x => "· " + x).join("\n")}`, ...(q.resp === "abierta" ? [{ texto: "Escribe el resultado →", centro: true }, "", ""] : q.resp === "sn" ? ["☐", "☐", "—"] : ["☐", "☐", "☐"]).map(x => typeof x === "string" ? { texto: x, centro: true } : x), " "]) });
      if (b.id === "validez") B.push({ t: "p", runs: [{ texto: "¿Merece la pena seguir? ", negrita: true }, { texto: "☐ Sí   ☐ No" }] });
    });
    B.push({ t: "h1", texto: "Decisión" }, { t: "p", texto: "☐ Aplicar   ☐ Esperar   ☐ Descartar" }, { t: "p", texto: "Motivo: " + hueco }, { t: "p", texto: "Qué hacemos ahora (quién, qué, cuándo): " + hueco });
    B.push({ t: "p", estilo: "nota", texto: citaPie(pl) });
    return { titulo: "Plantilla · " + pl.nombre, bloques: B };
  }

  // ---------- Excel ----------
  const ESTILOS_XLSX = {
    titulo: { negrita: true, tamano: 14, colorTexto: "FFFFFF", colorFondo: "9D174D", borde: false },
    sub: { cursiva: true, colorTexto: "444444", borde: false },
    cab: { negrita: true, colorTexto: "FFFFFF", colorFondo: "0D1B2A", alineacion: "center", ajustarTexto: true },
    celda: { ajustarTexto: true, vertical: "top" },
    negrita: { negrita: true, ajustarTexto: true, vertical: "top" },
    centro: { alineacion: "center", vertical: "top", ajustarTexto: true },
    verde: { negrita: true, alineacion: "center", vertical: "top", colorFondo: "DCFCE7", colorTexto: "14532D" },
    ambar: { negrita: true, alineacion: "center", vertical: "top", colorFondo: "FEF3C7", colorTexto: "92400E" },
    rojo: { negrita: true, alineacion: "center", vertical: "top", colorFondo: "FFE4E6", colorTexto: "881337" }
  };
  const ESTILO_DE = { si: "verde", no: "rojo", nose: "ambar", verde: "verde", ambar: "ambar", rojo: "rojo", aplicar: "verde", esperar: "ambar", descartar: "rojo" };
  function hojasExcel(lecturas, sesiones, fecha) {
    const T = (texto, estilo = "celda") => ({ texto: texto == null ? "" : String(texto), estilo });
    const cabecera = (titulo, cols) => { const f = [[T(titulo, "titulo")], [T("Exportado de la app Lectura Crítica · " + fecha, "sub")], cols.map(x => T(x, "cab"))]; f[0][0].combinar = cols.length; return f; };
    const L_ = lecturas.slice().sort((a, b) => String(b.modificado).localeCompare(String(a.modificado)));
    const h1 = cabecera("Mis lecturas", ["Título", "Referencia", "DOI", "Pregunta", "Tipo de estudio", "Eliminación", "Válido", "Qué dice", "Me sirve", "Resultado clave", "Decisión", "Motivo", "Mensaje para llevar", "Fecha"]);
    L_.forEach(l => {
      const pl = plantilla(l.plantilla), c = k => { const x = pl ? semaforo(l, k).color : ""; return T(COLOR_NOM[x] || "", ESTILO_DE[x] || "centro"); }, rc = resultadoClave(l), el = eliminacion(l).estado;
      h1.push([T(nombreLectura(l), "negrita"), T(refTexto(l)), T(l.referencia.doi), T(lleno(l.pregunta) ? l.pregunta : preguntaSugerida(l)), T(pl ? pl.nombre : ""), T({ falla: "No la supera", dudosa: "Dudosa", supera: "La supera", pendiente: "" }[el], "centro"), c("validez"), c("resultados"), c("aplicabilidad"), T(rc ? rc.texto : ""), T(l.veredicto.decision ? DECISIONES[l.veredicto.decision].nom : "", ESTILO_DE[l.veredicto.decision] || "centro"), T(l.veredicto.motivo), T(l.veredicto.mensaje), T(fmtFecha(l.fecha), "centro")]);
    });
    const h2 = cabecera("Respuestas", ["Lectura", "Tipo", "Nº", "Bloque", "Pregunta", "Eliminación", "Respuesta", "Nota o resultado"]);
    L_.forEach(l => { const pl = plantilla(l.plantilla); preguntasDe(pl).forEach(q => { const r = resp(l, q.id); h2.push([T(nombreLectura(l), "negrita"), T(pl.corto), T(numeroDe(pl, q.id), "centro"), T(PL.BLOQUES[q.bloque].titulo), T(q.texto), T(q.elim ? "Sí" : "", "centro"), T(q.resp === "abierta" ? "" : (RESPUESTAS[r.valor] || ""), ESTILO_DE[r.valor] || "centro"), T(r.nota)]); }); });
    const h3 = cabecera("Cálculos", ["Lectura", "Calculadora", "Desenlace", "Datos", "Resultado"]);
    L_.forEach(l => l.calculos.forEach(c => { const e = Object.entries(c.entrada).filter(([, v]) => lleno(v)).map(([k, v]) => `${k} = ${v}`).concat(c.niveles.filter(n => lleno(n.a) || lleno(n.b)).map((n, i) => `${n.nombre || "nivel " + (i + 1)}: ${n.a} / ${n.b}`)).concat((c.estudios || []).filter(x => CAMPOS_ESTUDIO.slice(1).some(k => lleno(x[k]))).map((x, i) => `${x.nombre || "estudio " + (i + 1)}: ${CAMPOS_ESTUDIO.slice(1).filter(k => lleno(x[k])).map(k => `${k} ${x[k]}`).join(", ")}`)).concat((c.matriz || []).length ? ["tabla: " + c.matriz.map(f => f.join(" ")).join(" / ")] : []).join("; "); h3.push([T(nombreLectura(l), "negrita"), T(CA.CALCS[c.tipo].titulo), T(c.nombre), T(e), T(textoCalculo(c))]); }));
    const h4 = cabecera("Desenlaces y acciones", ["Lectura", "Qué", "Detalle", "Quién / importancia", "Cuándo / tipo"]);
    L_.forEach(l => { l.desenlaces.filter(x => lleno(x.nombre)).forEach(x => h4.push([T(nombreLectura(l), "negrita"), T("Desenlace"), T(x.nombre), T(x.importancia ? `${x.importancia} · ${IMPORTANCIA(Number(x.importancia))}` : "", "centro"), T(x.sentido === "dano" ? "Daño" : "Beneficio")])); l.veredicto.acciones.filter(a => lleno(a.que)).forEach(a => h4.push([T(nombreLectura(l), "negrita"), T("Acción"), T(a.que), T(a.quien), T(a.cuando)])); });
    const hojas = [
      { nombre: "Lecturas", filas: h1, opciones: { anchoColumnas: [34, 40, 18, 40, 18, 13, 9, 9, 9, 34, 11, 34, 34, 11], congelar: { filas: 3, columnas: 0 }, altoFilas: { 1: 24 }, primera: true } },
      { nombre: "Respuestas", filas: h2, opciones: { anchoColumnas: [30, 14, 5, 12, 50, 11, 16, 50], congelar: { filas: 3, columnas: 0 } } },
      { nombre: "Cálculos", filas: h3, opciones: { anchoColumnas: [30, 30, 24, 40, 70], congelar: { filas: 3, columnas: 0 } } },
      { nombre: "Desenlaces y acciones", filas: h4, opciones: { anchoColumnas: [30, 12, 50, 22, 16], congelar: { filas: 3, columnas: 0 } } }
    ];
    if (sesiones && sesiones.length) {
      const h5 = cabecera("Sesiones", ["Sesión", "Fecha", "Unidad", "Pregunta", "Artículos", "Decisión", "Conclusión"]);
      sesiones.forEach(s => h5.push([T(s.titulo, "negrita"), T(fmtFecha(s.fecha), "centro"), T(s.unidad), T(s.pregunta), T(lecturasDeSesion(s, lecturas).map(nombreLectura).join("\n")), T(s.decision ? DECISIONES[s.decision].nom : "", ESTILO_DE[s.decision] || "centro"), T(s.conclusion)]));
      hojas.push({ nombre: "Sesiones", filas: h5, opciones: { anchoColumnas: [30, 11, 18, 40, 44, 11, 50], congelar: { filas: 3, columnas: 0 } } });
    }
    return { estilos: ESTILOS_XLSX, hojas };
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
    entradaCalc: Object.fromEntries(CAMPOS_CALC.map(k => [k, [k === "unidad" ? 80 : 30]])),
    nivel: { nombre: [100], a: [12], b: [12] },
    asistente: { id: "id", nombre: [120] },
    club: { asistentes: { de: "asistente", max: 40 } },
    sesion: { id: "id", titulo: [400], pregunta: [1200], unidad: [200], fecha: [20], lecturas: { lista: "ref", max: 50 }, conclusion: [4000], decision: { en: ["", "aplicar", "esperar", "descartar"] }, creado: [40], modificado: [40] },
    estudio: Object.fromEntries(CAMPOS_ESTUDIO.map(k => [k, [k === "nombre" ? 120 : 20]])),
    calculo: { id: "id", tipo: { en: TIPOS_CALC }, nombre: [300], entrada: { obj: "entradaCalc" }, niveles: { de: "nivel", max: 5 }, estudios: { de: "estudio", max: 30 }, matriz: { matriz: 6 }, nota: [1500] },
    semaforos: { validez: COLOR_EN, resultados: COLOR_EN, aplicabilidad: COLOR_EN },
    motivos: { validez: [600], resultados: [600], aplicabilidad: [600] },
    veredicto: { semaforo: { obj: "semaforos" }, motivoSemaforo: { obj: "motivos" }, decision: { en: ["", "aplicar", "esperar", "descartar"] }, motivo: [2000], acciones: { de: "accion", max: 20 }, mensaje: [800] },
    lectura: { id: "id", titulo: [400], referencia: { obj: "referencia" }, pico: { obj: "pico" }, pregunta: [1200], filtro: { obj: "filtro" },
      plantilla: { en: ["", ...PL.PLANTILLAS.map(p => p.id)] }, plantillaVersion: "ent",
      respuestas: { mapa: "respuesta", max: 60 }, aparte: { mapa: "respuesta", max: 200 },
      desenlaces: { de: "desenlace", max: 30 }, confusores: { de: "confusor", max: 30 }, calculos: { de: "calculo", max: 20 }, veredicto: { obj: "veredicto" }, club: { obj: "club" }, resumen: [8000],
      notas: [4000], fecha: [20], creado: [40], modificado: [40] }
  };
  const FABRICA = {
    referencia: () => nuevaLectura("x").referencia, pico: () => nuevaLectura("x").pico, filtro: () => nuevaLectura("x").filtro,
    entradaCalc: nuevaEntrada, nivel: nuevoNivel, estudio: nuevoEstudio, asistente: id => nuevoAsistente(id), club: () => ({ asistentes: [], votos: {} }), sesion: id => nuevaSesion(id, ""), calculo: id => nuevoCalculo(id, "tratamiento"),
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
      else if (regla.lista) r[k] = Array.isArray(v) ? [...new Set(v.slice(0, regla.max * 2).map(x => regla.lista === "ref" ? (idValido(x) ? x : "") : txt(x, regla.lista)).filter(Boolean))].slice(0, regla.max) : [];
      else if (regla.de) r[k] = Array.isArray(v) ? v.slice(0, regla.max).map(x => sanear(regla.de, x, genId)).filter(Boolean) : [];
      else if (regla.obj) r[k] = sanear(regla.obj, v, genId) || r[k];
      // Tabla cuadrada de textos (kappa): hasta 6 × 6
      else if (regla.matriz) { const n = Array.isArray(v) ? Math.min(regla.matriz, v.length) : 0; r[k] = n >= 2 && v.slice(0, n).every(f => Array.isArray(f)) ? v.slice(0, n).map(f => Array.from({ length: n }, (_, j) => txt(f[j], 12))) : r[k]; }
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
    // Votos del club: { idPregunta: { idAsistente: "si"|"no"|"nose" } }, solo de asistentes que existen
    const ids = new Set(l.club.asistentes.map(a => a.id)), V = o.club && o.club.votos;
    if (V && typeof V === "object" && !Array.isArray(V)) Object.keys(V).filter(idPregunta).slice(0, 80).forEach(q => {
      const x = V[q]; if (!x || typeof x !== "object") return;
      const limpio = {}; Object.keys(x).forEach(aid => { if (ids.has(aid) && ["si", "no", "nose"].includes(x[aid])) limpio[aid] = x[aid]; });
      if (Object.keys(limpio).length) l.club.votos[q] = limpio;
    });
    return l;
  }
  function sanearSesion(o, genId, fecha) {
    const s = sanear("sesion", o, genId); if (!s) return null;
    if (!s.creado) s.creado = fecha; if (!s.modificado) s.modificado = s.creado;
    return s;
  }
  function sanearDatos(o, genId, fecha) {
    if (!o || typeof o !== "object" || !Array.isArray(o.lecturas)) return null;
    const lecturas = o.lecturas.slice(0, 1000).map(x => sanearLectura(x, genId, fecha)).filter(Boolean), ids = new Set(lecturas.map(l => l.id));
    const sesiones = (Array.isArray(o.sesiones) ? o.sesiones : []).slice(0, 300).map(x => sanearSesion(x, genId, fecha)).filter(Boolean);
    sesiones.forEach(s => { s.lecturas = s.lecturas.filter(id => ids.has(id)); });
    return { lecturas, sesiones };
  }
  // Fusiona sin duplicar: si un id ya existe se conserva el más reciente
  function fusionar(actual, nuevo) {
    const m = new Map(actual.lecturas.map(x => [x.id, x]));
    nuevo.lecturas.forEach(x => { const y = m.get(x.id); if (!y || String(x.modificado) > String(y.modificado)) m.set(x.id, x); });
    const ms = new Map((actual.sesiones || []).map(x => [x.id, x]));
    (nuevo.sesiones || []).forEach(x => { const y = ms.get(x.id); if (!y || String(x.modificado) > String(y.modificado)) ms.set(x.id, x); });
    return { lecturas: Array.from(m.values()), sesiones: Array.from(ms.values()) };
  }

  const API = {
    VERSION_DATOS, URL_AUD, URL_IND, URL_TM, URL_AMFE, URL_FLUJO, URL_DAFO, URL_MAPA, URL_RONDAS, URL_NORM, URL_PORTAL,
    lleno, sinTildes, corto, plural, fmtFecha,
    PASOS, PASO_BLOQUE, BLOQUE_PASO, RESPUESTAS, DECISIONES, COLORES, IMPORTANCIA, CLAVE_APLICA,
    plantilla, preguntasDe, numeroDe, PREFIJOS,
    CAMPOS_CALC, CAMPOS_ESTUDIO, TIPOS_CALC, nuevoCalculo, nuevoEstudio, matrizVacia, nuevoNivel, resultadoCalculo, calculosDe, textoCalculo,
    nuevaLectura, nuevaRespuesta, nuevoDesenlace, nuevoConfusor, nuevaAccion, nuevoVeredicto,
    resp, valor, contestada, ponerRespuesta, cambiarPlantilla,
    eliminacion, paradas, cerradaPronto, semaforoPropuesto, semaforo, decisionPropuesta,
    recorrerArbol, pareceDatoPaciente, preguntaSugerida, mensajeSugerido, avisos,
    progreso, pasoPendiente, resumen, nombreLectura, siguientePaso,
    nuevoAsistente, ponerVoto, reparto, mayoria, discrepancia, nuevaSesion, lecturasDeSesion,
    resultadoClave, FORMATO_INTERCAMBIO, VERSION_INTERCAMBIO, paqueteIntercambio, leerIntercambio, FILTROS_PUBMED, busquedaPubMed,
    documentoFicha, documentoSesion, documentoPlantilla, ESTILOS_XLSX, hojasExcel, refTexto,
    ESQ, sanear, sanearLectura, sanearSesion, sanearDatos, fusionar
  };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else raiz.Logica = API;
})(typeof window !== "undefined" ? window : this);
