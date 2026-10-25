// Pruebas de la lógica pura y de las plantillas · node tests/logic.test.mjs
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const L = require("../logic.js");
const PL = require("../plantillas.js");

let ok = 0, fallos = 0;
const t = (nombre, cond) => { if (cond) ok++; else { fallos++; console.error("✗ " + nombre); } };
const eq = (nombre, a, b) => t(`${nombre} (esperado ${JSON.stringify(b).slice(0, 300)}, obtenido ${JSON.stringify(a).slice(0, 300)})`, JSON.stringify(a) === JSON.stringify(b));
let n = 0; const gid = () => "id" + (++n);

// ---------- Plantillas: las cuentas del capítulo 26 y las preguntas de eliminación de cada original ----------
const CUENTAS = { ensayo: 11, revision: 10, diagnostico: 10, cohortes: 11, casos: 11, cualitativo: 10, economica: 11, prediccion: 11 };
const ELIM = { ensayo: 3, revision: 2, diagnostico: 3, cohortes: 2, casos: 2, cualitativo: 3, economica: 2, prediccion: 3 };
eq("Ocho plantillas", PL.PLANTILLAS.map(p => p.id).sort(), Object.keys(CUENTAS).sort());
PL.PLANTILLAS.forEach(p => {
  const qs = L.preguntasDe(p);
  eq(`${p.nombre}: número de preguntas`, qs.length, CUENTAS[p.id]);
  eq(`${p.nombre}: preguntas de eliminación`, qs.filter(q => q.elim).length, ELIM[p.id]);
  t(`${p.nombre}: las de eliminación van primero`, qs.slice(0, ELIM[p.id]).every(q => q.elim));
  eq(`${p.nombre}: tres bloques en orden`, p.bloques.map(b => b.id), ["validez", "resultados", "aplicabilidad"]);
  t(`${p.nombre}: ids únicos y con su prefijo`, new Set(qs.map(q => q.id)).size === qs.length && qs.every((q, i) => q.id === `${L.PREFIJOS[p.id]}-${i + 1}`));
  t(`${p.nombre}: todas con texto y pistas`, qs.every(q => q.texto.length > 10 && q.pistas.length >= 1));
  t(`${p.nombre}: cita y enlace`, p.cita.includes("CASPe") && /^https:\/\/redcaspe\.org\//.test(p.url));
  t(`${p.nombre}: respuestas válidas`, qs.every(q => ["snd", "sn", "abierta"].includes(q.resp)));
});
t("Prefijos distintos", new Set(Object.values(L.PREFIJOS)).size === 8);
t("Las preguntas clave de aplicabilidad existen", [...L.CLAVE_APLICA].every(id => PL.PLANTILLAS.some(p => L.preguntasDe(p, "aplicabilidad").some(q => q.id === id))));
// Nuestras preguntas no son las de CASPe: ninguna coincide con la frase original de la pregunta 1 del ensayo
t("Texto propio (ec-1)", !/orienta el ensayo a una pregunta claramente definida/i.test(L.preguntasDe(L.plantilla("ensayo"))[0].texto));

// ---------- Árbol ----------
eq("Árbol: revisión", L.recorrerArbol([{ id: "a1", r: "si" }]).fin, "revision");
eq("Árbol: ensayo", L.recorrerArbol(["a1", "a2", "a3", "a4", "a5"].map(id => ({ id, r: "no" })).concat([{ id: "a6", r: "si" }, { id: "a7", r: "si" }])).fin, "ensayo");
eq("Árbol: antes y después", L.recorrerArbol(["a1", "a2", "a3", "a4", "a5"].map(id => ({ id, r: "no" })).concat([{ id: "a6", r: "si" }, { id: "a7", r: "no" }])).fin, "antesdespues");
eq("Árbol: cohortes", L.recorrerArbol(["a1", "a2", "a3", "a4", "a5", "a6"].map(id => ({ id, r: "no" })).concat([{ id: "a8", r: "si" }])).fin, "cohortes");
eq("Árbol: casos y controles", L.recorrerArbol(["a1", "a2", "a3", "a4", "a5", "a6", "a8"].map(id => ({ id, r: "no" })).concat([{ id: "a9", r: "si" }])).fin, "casos");
eq("Árbol: sin plantilla", L.recorrerArbol(["a1", "a2", "a3", "a4", "a5", "a6", "a8", "a9"].map(id => ({ id, r: "no" }))).fin, "sinplantilla");
{
  const r = L.recorrerArbol([{ id: "a1", r: "nose" }, { id: "a2", r: "no" }, { id: "a3", r: "no" }, { id: "a4", r: "si" }]);
  eq("Árbol: «No lo sé» sigue y se recuerda", [r.fin, r.dudas], ["diagnostico", ["revision"]]);
}
eq("Árbol: a medias", L.recorrerArbol([{ id: "a1", r: "no" }]).nodo.id, "a2");
eq("Árbol: respuestas fuera de orden se ignoran", L.recorrerArbol([{ id: "a3", r: "si" }]).nodo.id, "a1");
// Todo nodo lleva a otro nodo o a un final que existe
t("Árbol: sin caminos rotos", PL.ARBOL.every(nd => [nd.si, nd.no].every(s => typeof s === "object" ? (L.plantilla(s.fin) || PL.FINALES[s.fin]) : PL.ARBOL.some(x => x.id === s))));

// ---------- Una lectura de ensayo ----------
const l = L.nuevaLectura("l1", "2026-10-25");
eq("Nueva lectura sin progreso", L.progreso(l), { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false });
eq("Paso pendiente: 1", L.pasoPendiente(l).n, 1);
t("Aviso: sin pregunta", L.avisos(l, 1).some(a => /sin pregunta/.test(a.texto)));
Object.assign(l.pico, { p: "pacientes en la sala de espera de Urgencias", i: "reevaluar a los 90 minutos con un aviso", c: "la reevaluación a demanda", o: "los empeoramientos no detectados" });
eq("Pregunta propuesta", L.preguntaSugerida(l), "En pacientes en la sala de espera de Urgencias, ¿reevaluar a los 90 minutos con un aviso, frente a la reevaluación a demanda, mejora los empeoramientos no detectados?");
l.filtro.responde = "si";
L.cambiarPlantilla(l, "ensayo");
eq("Plantilla y versión", [l.plantilla, l.plantillaVersion], ["ensayo", 1]);
eq("Eliminación pendiente", L.eliminacion(l).estado, "pendiente");
L.ponerRespuesta(l, "ec-1", "valor", "si"); L.ponerRespuesta(l, "ec-2", "valor", "si"); L.ponerRespuesta(l, "ec-3", "valor", "nose");
eq("Eliminación dudosa", L.eliminacion(l).estado, "dudosa");
L.ponerRespuesta(l, "ec-3", "valor", "si");
eq("Eliminación superada", L.eliminacion(l).estado, "supera");
eq("Semáforo validez: faltan", L.semaforoPropuesto(l, "validez").color, "");
["ec-4", "ec-5", "ec-6"].forEach(id => L.ponerRespuesta(l, id, "valor", "si"));
eq("Semáforo validez verde", L.semaforoPropuesto(l, "validez").color, "verde");
L.ponerRespuesta(l, "ec-4", "valor", "no");
eq("Semáforo validez ámbar por un «No» de detalle", L.semaforoPropuesto(l, "validez").color, "ambar");
t("Motivo con el número de pregunta", /4/.test(L.semaforoPropuesto(l, "validez").motivo));
L.ponerRespuesta(l, "ec-4", "valor", "si");
["ec-4", "ec-5", "ec-6"].forEach(id => L.ponerRespuesta(l, id, "valor", "nose"));
eq("Semáforo validez ámbar por tres «No se puede saber»", L.semaforoPropuesto(l, "validez").color, "ambar");
["ec-4", "ec-5", "ec-6"].forEach(id => L.ponerRespuesta(l, id, "valor", "si"));
// Resultados: solo abiertas en el ensayo → lo decide la persona
eq("Resultados: decide tú (sin texto)", L.semaforoPropuesto(l, "resultados").color, "");
L.ponerRespuesta(l, "ec-7", "nota", "RAR 5 %, NNT 20"); L.ponerRespuesta(l, "ec-8", "nota", "IC 95 % del NNT 11 a 91");
const rs = L.semaforoPropuesto(l, "resultados");
eq("Resultados completos pero sin color propuesto", [rs.color, rs.completo], ["", true]);
eq("Decisión propuesta: falta el semáforo de resultados", L.decisionPropuesta(l).decision, "");
l.veredicto.semaforo.resultados = "verde";
eq("El semáforo manual manda", [L.semaforo(l, "resultados").color, L.semaforo(l, "resultados").manual], ["verde", true]);
["ec-9", "ec-10", "ec-11"].forEach(id => L.ponerRespuesta(l, id, "valor", "si"));
eq("Aplicabilidad verde", L.semaforoPropuesto(l, "aplicabilidad").color, "verde");
eq("Decisión propuesta: aplicar", L.decisionPropuesta(l).decision, "aplicar");
L.ponerRespuesta(l, "ec-9", "valor", "no");
eq("Aplicabilidad roja por la pregunta clave", L.semaforoPropuesto(l, "aplicabilidad").color, "rojo");
eq("Válido pero no aplicable: esperar (como en el capítulo 26)", L.decisionPropuesta(l).decision, "esperar");
L.ponerRespuesta(l, "ec-9", "valor", "si"); L.ponerRespuesta(l, "ec-10", "valor", "no");
eq("Aplicabilidad ámbar por un «No» que no es clave", L.semaforoPropuesto(l, "aplicabilidad").color, "ambar");
eq("Algún ámbar: esperar", L.decisionPropuesta(l).decision, "esperar");
L.ponerRespuesta(l, "ec-10", "valor", "si");
eq("Progreso hasta el 6", L.progreso(l), { 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: false });
eq("Paso pendiente: 7", L.pasoPendiente(l).n, 7);
t("Mensaje propuesto con el resultado", /NNT 20/.test(L.mensajeSugerido(l)));
l.veredicto.decision = "descartar";
t("Aviso: decisión distinta de la propuesta sin motivo", L.avisos(l, 7).some(a => /Falta el motivo/.test(a.texto)));
l.veredicto.decision = "aplicar";
t("Aviso: aplicar sin acciones", L.avisos(l, 7).some(a => /quién hace qué/.test(a.texto)));

// Fallar una de eliminación: rojo y descartar
L.ponerRespuesta(l, "ec-2", "valor", "no");
eq("Eliminación falla", L.eliminacion(l).estado, "falla");
eq("Validez roja aunque falten respuestas", L.semaforoPropuesto(l, "validez").color, "rojo");
eq("Descartar", L.decisionPropuesta(l).decision, "descartar");
t("Aviso de parada en el paso 4", L.avisos(l, 4).some(a => a.nivel === "error" && /no merece la pena seguir/.test(a.texto)));

// Borrar una respuesta vacía la quita del todo
L.ponerRespuesta(l, "ec-2", "valor", "");
t("Respuesta vacía se borra", !("ec-2" in l.respuestas));

// Cambiar de plantilla guarda las respuestas aparte y las recupera
L.cambiarPlantilla(l, "cohortes");
t("Al cambiar, las del ensayo van aparte", !Object.keys(l.respuestas).length && "ec-1" in l.aparte);
L.ponerRespuesta(l, "co-1", "valor", "si");
L.cambiarPlantilla(l, "ensayo");
t("Al volver, vuelven", l.respuestas["ec-1"].valor === "si" && "co-1" in l.aparte && !("ec-1" in l.aparte));

// Filtro de dos minutos: descartar pronto
const l2 = L.nuevaLectura("l2", "2026-10-25");
Object.assign(l2.pico, { p: "a", i: "b", o: "c" });
l2.filtro.responde = "no";
eq("Filtro: descartar", L.decisionPropuesta(l2).decision, "descartar");
t("Filtro: aviso", L.avisos(l2, 2).some(a => a.nivel === "error"));
l2.veredicto.decision = "descartar";
eq("Descartada en el filtro: lectura terminada", L.progreso(l2), { 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true });
eq("Sin paso pendiente", L.pasoPendiente(l2), null);

// Casos y controles: la parada intermedia de la pregunta 9
const l3 = L.nuevaLectura("l3", "2026-10-25");
L.cambiarPlantilla(l3, "casos");
L.ponerRespuesta(l3, "cc-9", "valor", "no");
eq("Parada de casos y controles", L.paradas(l3).map(q => q.id), ["cc-9"]);
eq("Resultados en rojo si no te lo crees", L.semaforoPropuesto(l3, "resultados").color, "rojo");
t("Aviso de parada en el paso 5", L.avisos(l3, 5).some(a => a.nivel === "error"));

// Cualitativo: resultados con Sí/No → semáforo propuesto
const l4 = L.nuevaLectura("l4", "2026-10-25");
L.cambiarPlantilla(l4, "cualitativo");
L.ponerRespuesta(l4, "cu-8", "valor", "si"); L.ponerRespuesta(l4, "cu-9", "valor", "si");
eq("Cualitativo: resultados verdes", L.semaforoPropuesto(l4, "resultados").color, "verde");
L.ponerRespuesta(l4, "cu-9", "valor", "nose");
eq("Cualitativo: resultados ámbar", L.semaforoPropuesto(l4, "resultados").color, "ambar");

// Protección de datos
t("Dato de paciente: NHC", L.pareceDatoPaciente("revisé la historia NHC 1234"));
t("Dato de paciente: nombre", L.pareceDatoPaciente("el Sr. García"));
t("Texto normal", !L.pareceDatoPaciente("pacientes mayores de 65 años"));
l4.notas = "Paciente Sra. López"; t("Aviso de datos en la lectura", L.avisos(l4, 1).some(a => /datos de pacientes/.test(a.texto)));
l4.notas = ""; l4.referencia.pmid = "12345678"; l4.referencia.autores = "Dr. Smith";
t("La referencia no dispara el aviso", !L.avisos(l4, 1).some(a => /datos de pacientes/.test(a.texto)));

// Siguiente paso
eq("Siguiente paso sin lecturas", L.siguientePaso({ lecturas: [] }).href, "#/lecturas/nueva");
l.modificado = "2026-10-25T10:00"; l2.modificado = "2026-10-25T09:00";
l.veredicto.decision = "";
eq("Siguiente paso: falta la pregunta 2", L.siguientePaso({ lecturas: [l2, l] }).href, "#/lectura/l1/4");
L.ponerRespuesta(l, "ec-2", "valor", "si");
eq("Siguiente paso: la más reciente", L.siguientePaso({ lecturas: [l2, l] }).href, "#/lectura/l1/7");

// ---------- Calculadoras guardadas con la lectura ----------
{
  const lc = L.nuevaLectura("lc", "2026-10-26");
  L.cambiarPlantilla(lc, "ensayo");
  const q7 = L.preguntasDe(L.plantilla("ensayo")).find(q => q.id === "ec-7");
  t("Sin calculadora la abierta no está contestada", !L.contestada(lc, q7));
  const c = L.nuevoCalculo("c1", "tratamiento");
  Object.assign(c.entrada, { nc: "400", ne: "400", ec: "80", ee: "40" }); c.nombre = "empeoramiento";
  lc.calculos.push(c);
  t("Con una calculadora con resultado, contestada", L.contestada(lc, q7) && L.contestada(lc, L.preguntasDe(L.plantilla("ensayo")).find(q => q.id === "ec-8")));
  const sr = L.semaforoPropuesto(lc, "resultados");
  eq("Semáforo de resultados desde la calculadora", sr.color, "verde");
  t("Motivo de la calculadora", /Según la calculadora/.test(sr.motivo));
  t("Texto llano de la calculadora", /de cada 100/.test(L.textoCalculo(c)) && /«empeoramiento»/.test(L.textoCalculo(c)));
  c.entrada.ee = "78";
  eq("Calculadora sin efecto con 800 pacientes: rojo", L.semaforoPropuesto(lc, "resultados").color, "rojo");
  c.entrada.ee = "texto";
  t("Calculadora con datos malos: no cuenta", !L.contestada(lc, q7) && L.semaforoPropuesto(lc, "resultados").color === "");
  const d = L.nuevoCalculo("c2", "diagnostico");
  t("La de diagnóstico no sirve al ensayo", L.calculosDe(lc, q7).length === 1 && d.niveles.length === 0);
  eq("Niveles empieza con tres filas", L.nuevoCalculo("c3", "niveles").niveles.length, 3);
  const s = L.sanearLectura({ id: "x", calculos: [{ id: "k1", tipo: "inventada" }, { id: "k2", tipo: "diagnostico", entrada: { a: "90", z: "no" }, niveles: [{ a: 1 }, 2] }] }, gid, "");
  eq("Saneado de calculadoras", [s.calculos.length, s.calculos[0].tipo, s.calculos[1].entrada.a, "z" in s.calculos[1].entrada, s.calculos[1].niveles.length], [2, "tratamiento", "90", false, 1]);
}

// ---------- Saneado y fusión ----------
const sucio = { lecturas: [
  { id: "x1", titulo: 42, plantilla: "inventada", respuestas: { "ec-1": { valor: "quizá", nota: "n" }, "malo": { valor: "si" }, "ec-2": { valor: "si" } }, veredicto: { decision: "ya", semaforo: { validez: "morado" }, acciones: [{ que: "x" }, "basura"] }, desenlaces: [{ nombre: "Muerte", importancia: "12" }] },
  { id: "x2", plantilla: "ensayo", respuestas: { "ec-1": { valor: "si" }, "co-1": { valor: "no" } } },
  "basura", null
] };
const s = L.sanearDatos(sucio, gid, "2026-10-25");
eq("Saneado: dos lecturas", s.lecturas.length, 2);
eq("Saneado: título numérico a texto", s.lecturas[0].titulo, "42");
eq("Saneado: plantilla inventada fuera", s.lecturas[0].plantilla, "");
eq("Saneado: valor raro fuera, nota se conserva", s.lecturas[0].aparte["ec-1"], { valor: "", nota: "n" });
t("Saneado: clave rara fuera", !("malo" in s.lecturas[0].respuestas) && !("malo" in s.lecturas[0].aparte));
eq("Saneado: decisión rara fuera", s.lecturas[0].veredicto.decision, "");
eq("Saneado: color raro fuera", s.lecturas[0].veredicto.semaforo.validez, "");
eq("Saneado: acciones", s.lecturas[0].veredicto.acciones.length, 1);
eq("Saneado: importancia fuera de 1-9", s.lecturas[0].desenlaces[0].importancia, "");
t("Saneado: respuestas de otra plantilla van aparte", s.lecturas[1].respuestas["ec-1"].valor === "si" && s.lecturas[1].aparte["co-1"].valor === "no");
eq("Saneado: sin lecturas no es copia", L.sanearDatos({ amfes: [] }, gid, ""), null);
const vieja = Object.assign(L.nuevaLectura("z", ""), { titulo: "vieja", modificado: "2026-01-01" });
const nueva = Object.assign(L.nuevaLectura("z", ""), { titulo: "nueva", modificado: "2026-02-01" });
eq("Fusión: gana la más reciente", L.fusionar({ lecturas: [vieja] }, { lecturas: [nueva] }).lecturas.map(x => x.titulo), ["nueva"]);
eq("Fusión: no se pisa con una más vieja", L.fusionar({ lecturas: [nueva] }, { lecturas: [vieja] }).lecturas.map(x => x.titulo), ["nueva"]);
// Ida y vuelta: una lectura completa sobrevive al saneado sin cambios
eq("Saneado de ida y vuelta", L.sanearLectura(JSON.parse(JSON.stringify(l)), gid, ""), JSON.parse(JSON.stringify(l)));

console.log(`${ok} pruebas correctas, ${fallos} fallidas`);
if (fallos) process.exit(1);
