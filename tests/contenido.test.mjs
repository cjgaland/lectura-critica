// Pruebas del contenido didáctico y de los ejemplos · node tests/contenido.test.mjs
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const C = require("../contenido.js");
const L = require("../logic.js");
const CA = require("../calculos.js");

let ok = 0, fallos = 0;
const t = (nombre, cond) => { if (cond) ok++; else { fallos++; console.error("✗ " + nombre); } };
let n = 0; const gid = () => "id" + (++n);

// Aprende
t("Diez temas numerados", C.TEMAS.length === 10 && C.TEMAS.every((x, i) => x.n === i + 1));
t("Cada tema: minuto, secciones, minicaso y práctica", C.TEMAS.every(x => x.minuto.length >= 3 && x.secciones.length >= 2 && x.minicaso && x.practica.href.startsWith("#/")));
// Test
t("Unas 25 preguntas", C.TEST.length >= 25);
t("Test: respuesta válida y bloque existente", C.TEST.every(q => q.o[q.ok] && q.o.length === 4 && C.TEMAS_TEST[q.t] && q.e));
t("Test: todos los bloques tienen preguntas", Object.keys(C.TEMAS_TEST).every(k => C.TEST.some(q => String(q.t) === k)));
t("Test: el bloque lleva a un tema de Aprende", Object.values(C.TEMAS_TEST).every(b => C.TEMAS.some(x => x.n === b.aprende)));
// Ejercicios
t("¿Qué tipo de estudio es?: plantillas que existen", C.EJ_TIPO.every(x => L.plantilla(x.ok)));
t("¿Qué tipo de estudio es?: están todas", new Set(C.EJ_TIPO.map(x => x.ok)).size === 9);
t("Calcula: NNT 10", Math.abs(CA.tratamiento({ nc: 150, ne: 150, ec: 30, ee: 15 }).nnt.v - C.EJ_CALC[0].ok) < 1e-9);
t("Calcula: LR+ 4,5", Math.abs(CA.desdeSE({ s: 90, e: 80, pre: 10 }).lrp.v - C.EJ_CALC[1].ok) < 1e-9);
t("Calcula: posterior 50 %", Math.abs(CA.bayes(0.1, 9) * 100 - C.EJ_CALC[2].ok) < 1e-9);
t("Calcula: RRR 25 %", Math.abs((1 - 0.06 / 0.08) * 100 - C.EJ_CALC[3].ok) < 1e-9);
// Glosario
t("Glosario: más de 60 términos sin repetir", C.GLOSARIO.length >= 60 && new Set(C.GLOSARIO.map(x => x[0])).size === C.GLOSARIO.length);
// Ejemplos: pasan el saneado sin perder nada importante
const E = C.EJEMPLOS, lec = E.lecturas.map(x => L.sanearLectura(JSON.parse(JSON.stringify(x)), gid, "2026-10-25"));
t("Ejemplos: todos se sanean", lec.length === 14 && lec.every(Boolean) && lec.every(l => /^ej-/.test(l.id)));
t("Ejemplos: ids únicos", new Set(lec.map(l => l.id)).size === lec.length);
t("Ejemplos: la sesión apunta a lecturas que existen", E.sesion.lecturas.every(id => lec.some(l => l.id === id)) && E.sesion.lecturas.length === 7);
t("Ejemplos: minicasos con su paso", E.minicasos.length === 7 && E.minicasos.every(m => lec.some(l => l.id === m.id) && m.paso >= 1 && m.paso <= 7));
t("Ejemplos: las respuestas se quedan en su plantilla", lec.every(l => !Object.keys(l.aparte).length));
t("Ejemplos: dicen que son ficticios", lec.every(l => /ficticio/i.test(l.titulo)));
const B = id => lec.find(l => l.id === id);
const ec = L.resultadoCalculo(B("ej-u-ec").calculos[0]);
t("Ensayo de Urgencias: NNT 20 (11 a 169), como dice el texto", Math.ceil(ec.nnt.v) === 20 && Math.round(ec.nnt.inf) === 11 && Math.round(ec.nnt.sup) === 169);
const dx = L.resultadoCalculo(B("ej-u-dx").calculos[0]);
t("Diagnóstico de Urgencias: del 15 % al 55 % y al 3 %", Math.round(dx.post.pos.v * 100) === 55 && Math.round(dx.post.neg.v * 100) === 3);
t("Diagnóstico de Urgencias: LR+ 7 y LR− 0,19", Math.abs(dx.lrp.v - 7) < 0.01 && Math.abs(dx.lrn.v - 0.19) < 0.01);
t("Revisión de Urgencias: esperar, con validez ámbar", L.decisionPropuesta(B("ej-u-rs")).decision === "esperar" && L.semaforo(B("ej-u-rs"), "validez").color === "ambar");
t("Tres descartados en el filtro", lec.filter(l => l.filtro.responde === "no" && L.cerradaPronto(l)).length === 3);
t("Minicaso AP: la eliminación falla", L.eliminacion(B("ej-m-ap")).estado === "falla");
t("Minicaso RRR: avisa de la trampa", CA.trampasTratamiento(L.resultadoCalculo(B("ej-m-rrr").calculos[0])).some(a => /Reducción relativa grande/.test(a.texto)));
t("Minicaso IC: incluye el 1", CA.incluye(L.resultadoCalculo(B("ej-m-ic").calculos[0]).rr, 1));
t("Minicaso VPP: aviso de prevalencia", CA.trampasDiagnostico(L.resultadoCalculo(B("ej-m-vpp").calculos[0])).some(a => /valor predictivo/.test(a.texto)));
t("Minicaso económico: dominada", L.resultadoCalculo(B("ej-m-ee").calculos[0]).cuadrante === "dominada");
t("Minicaso regla: la eliminación falla", L.eliminacion(B("ej-m-rp")).estado === "falla");
t("Ejemplos: sin datos de pacientes", lec.every(l => !L.avisos(l, 1).some(a => /datos de pacientes/.test(a.texto))));
t("Ejemplos: no entran en el paquete de intercambio", L.paqueteIntercambio(lec, "x", "y").lecturas.length === 0);

console.log(`${ok} pruebas correctas, ${fallos} fallidas`);
if (fallos) process.exit(1);
