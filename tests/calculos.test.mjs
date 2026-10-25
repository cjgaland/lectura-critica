// Pruebas de las calculadoras · node tests/calculos.test.mjs
// Oráculo: los números que dan las calculadoras Excel de Apoyo/ (tests/oraculo.json, generado por Diseño/oraculo/oraculo.py).
// Las diferencias que se corrigen a propósito (Diseño, 7.5) se comprueban aparte, contra la fórmula correcta.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const C = require("../calculos.js");
const O = require("./oraculo.json");

let ok = 0, fallos = 0;
const t = (nombre, cond) => { if (cond) ok++; else { fallos++; console.error("✗ " + nombre); } };
const casi = (nombre, a, b, tol = 1e-9) => t(`${nombre} (esperado ${b}, obtenido ${a})`, typeof a === "number" && typeof b === "number" && Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)));
const ivCasi = (nombre, iv, v, inf, sup, tol) => { casi(nombre, iv.v, v, tol); casi(nombre + " · inf", iv.inf, inf, tol); casi(nombre + " · sup", iv.sup, sup, tol); };

// ---------- Tratamiento ----------
const entT = e => ({ nc: e.C10, ne: e.D10, pc: e.C11, pe: e.D11, ec: e.C12, ee: e.D12 });
O.tratamiento.forEach(({ caso, entrada: e, salida: x }) => {
  const r = C.tratamiento(entT(e)), rx = C.tratamiento(entT(e), { redondeoExcel: true });
  t(`${caso}: calcula`, r.ok);
  // Riesgos: el Excel usa Wald; la app enseña Wilson (Diseño, 7.5). Se comprueba nuestro Wald contra el Excel.
  const wc = C.wald(r.ec, r.Nc), we = C.wald(r.ee, r.Ne);
  ivCasi(`${caso}: riesgo control (Wald)`, wc, x.rc, x.rcInf, x.rcSup);
  ivCasi(`${caso}: riesgo experimental (Wald)`, we, x.re, x.reInf, x.reSup);
  casi(`${caso}: riesgo control (punto, Wilson)`, r.rc.v, x.rc);
  // RAR: el Excel la da con el signo contrario (experimental − control) y redondea su IC a 3 decimales
  casi(`${caso}: RAR`, -r.rar.v, x.rar);
  casi(`${caso}: RAR inf (redondeo Excel)`, -rx.rar.sup, x.rarInf);
  casi(`${caso}: RAR sup (redondeo Excel)`, -rx.rar.inf, x.rarSup);
  // NNT: el Excel no distingue beneficio de daño; se compara el valor absoluto y los dos límites
  casi(`${caso}: NNT`, rx.nnt.v, Math.abs(x.nnt));
  const lim = rx.nnt.cruza ? [rx.nnt.nntb, rx.nnt.nntd] : [rx.nnt.inf, rx.nnt.sup];
  const limX = [Math.abs(x.nntInf), Math.abs(x.nntSup)];
  t(`${caso}: límites del NNT (${lim} frente a ${limX})`, lim.slice().sort((a, b) => a - b).every((v, i) => Math.abs(v - limX.slice().sort((a, b) => a - b)[i]) < 1e-9 * v));
  if (!r.cero) {
    ivCasi(`${caso}: RR`, r.rr, x.rr, x.rrInf, x.rrSup);
    casi(`${caso}: RRR (signo contrario)`, -r.rrr.v, x.rrr); casi(`${caso}: RRR inf`, -r.rrr.sup, x.rrrInf); casi(`${caso}: RRR sup`, -r.rrr.inf, x.rrrSup);
    ivCasi(`${caso}: OR`, r.or, x.or, x.orInf, x.orSup);
  }
  // Análisis de sensibilidad de las pérdidas (H19 e I19; vacías = ningún perdido con evento)
  const s = C.sensibilidadPerdidas(entT(e), e.H19 || 0, e.I19 || 0);
  casi(`${caso}: sensibilidad · riesgo control`, s.rc.v, x.sens_rc); casi(`${caso}: sensibilidad · riesgo experimental`, s.re.v, x.sens_re);
  if (!s.cero) ivCasi(`${caso}: sensibilidad · RR`, s.rr, x.sens_rr, x.sens_rrInf, x.sens_rrSup);
  casi(`${caso}: sensibilidad · NNT`, s.nnt.v, Math.abs(x.sens_nnt));
  // NNT para tu paciente
  if (e.D35) casi(`${caso}: NNT con PEER`, C.nntPaciente(e.D35, r.rrr.v), x.nntPeer);
  if (e.D36) casi(`${caso}: NNT con F`, C.nntConF(r.nnt.v, e.D36), x.nntF);
});
// T5: con una celda a 0 el Excel da error en el IC del RR; la app aplica la corrección de 0,5 (comprobada a mano)
{
  const r = C.tratamiento({ nc: 50, ne: 50, ec: 6, ee: 0 });
  t("Cero: se avisa", r.cero && C.trampasTratamiento(r).some(a => /0,5/.test(a.texto)));
  casi("Cero: RR con 0,5", r.rr.v, (0.5 / 51) / (6.5 / 51));
  casi("Cero: OR con 0,5", r.or.v, (0.5 * 44.5) / (50.5 * 6.5));
  t("Cero: IC del RR finito", isFinite(r.rr.inf) && isFinite(r.rr.sup) && r.rr.inf > 0);
}
// T7: el redondeo del Excel mueve el IC del NNT; sin redondear, el límite es otro
{
  const e = { nc: 2000, ne: 2000, ec: 100, ee: 79 }, r = C.tratamiento(e), rx = C.tratamiento(e, { redondeoExcel: true });
  t("Redondeo del Excel: cambia el límite del NNT", Math.abs(r.nnt.nntd - rx.nnt.nntd) / rx.nnt.nntd > 0.05);
}
// Signos y NNT (Altman)
{
  const b = C.tratamiento({ nc: 150, ne: 150, ec: 30, ee: 15 });
  t("Beneficio: NNTB y RAR positiva", b.nnt.tipo === "NNTB" && b.rar.v > 0 && !b.nnt.cruza);
  casi("NNTB 10", b.nnt.v, 10);
  const d = C.tratamiento({ nc: 200, ne: 200, pc: 10, pe: 12, ec: 20, ee: 34 });
  t("Daño: NNTD", d.nnt.tipo === "NNTD" && d.rar.v < 0);
  const x = C.tratamiento({ nc: 100, ne: 100, ec: 12, ee: 9 });
  t("Cruza: NNTB … ∞ … NNTD", x.nnt.cruza && /NNTB .* a ∞ a NNTD/.test(C.nntTxt(x.nnt)));
  t("Texto llano", /12 de cada 100/.test(C.textoTratamiento(x, "")) && /9 de cada 100/.test(C.textoTratamiento(x, "")));
  t("Errores: eventos de más", !C.tratamiento({ nc: 10, ne: 10, ec: 11, ee: 1 }).ok);
  t("Errores: decimales", !C.tratamiento({ nc: 10.5, ne: 10, ec: 1, ee: 1 }).ok);
  t("Admite comas y espacios", C.tratamiento({ nc: " 150 ", ne: "150", ec: "30", ee: "15" }).ok);
  // Supuestos de pérdidas
  const p = { nc: 120, ne: 118, pc: 20, pe: 18, ec: 30, ee: 18 };
  casi("Peor caso: eventos experimentales", C.supuesto(p, "peor").re.v, 36 / 118);
  casi("Mejor caso: eventos control", C.supuesto(p, "mejor").rc.v, 50 / 120);
  const r0 = C.tratamiento(p);
  casi("Igual que los evaluados", C.supuesto(p, "igual", r0).rc.v, (30 + Math.round(20 * 0.3)) / 120);
}
// Trampas y semáforo
{
  const g = C.tratamiento({ nc: 2000, ne: 2000, ec: 20, ee: 10 });
  t("Trampa: RRR grande con RAR pequeña", C.trampasTratamiento(g).some(a => /Reducción relativa grande/.test(a.texto)));
  t("Semáforo: efecto preciso pero pequeño → ámbar", C.semaforoCalculo("tratamiento", C.tratamiento({ nc: 20000, ne: 20000, ec: 200, ee: 120 })).color === "ambar");
  t("Semáforo: beneficio claro → verde", C.semaforoCalculo("tratamiento", C.tratamiento({ nc: 400, ne: 400, ec: 80, ee: 40 })).color === "verde");
  t("Semáforo: NNT muy impreciso → ámbar", C.semaforoCalculo("tratamiento", C.tratamiento({ nc: 400, ne: 400, ec: 56, ee: 36 })).color === "ambar");
  t("Semáforo: incluye el 1, estudio pequeño → ámbar", C.semaforoCalculo("tratamiento", C.tratamiento({ nc: 100, ne: 100, ec: 12, ee: 9 })).color === "ambar");
  t("Semáforo: incluye el 1, estudio grande → rojo", C.semaforoCalculo("tratamiento", C.tratamiento({ nc: 1000, ne: 1000, ec: 100, ee: 98 })).color === "rojo");
  t("Trampa: OR frente a RR con evento frecuente", C.trampasTratamiento(C.tratamiento({ nc: 100, ne: 100, ec: 50, ee: 30 })).some(a => /exagera/.test(a.texto)));
  t("Trampa: pérdidas > 20 %", C.trampasTratamiento(C.tratamiento({ nc: 100, ne: 100, pc: 25, pe: 5, ec: 10, ee: 5 })).some(a => /20 %/.test(a.texto)));
}

// ---------- Diagnóstico ----------
O.diagnostico.forEach(({ caso, entrada: e, salida: x }) => {
  const r = C.diagnostico({ a: e.C5, b: e.D5, c: e.C6, d: e.D6, pre: e.D26 });
  t(`${caso}: calcula`, r.ok);
  ["s", "e", "vpp", "vpn", "pfp", "pfn", "exactitud", "ord", "lrp"].forEach(k => ivCasi(`${caso}: ${k}`, r[k], x[k], x[k + "Inf"], x[k + "Sup"]));
  casi(`${caso}: Youden`, r.youden, x.youden);
  casi(`${caso}: prevalencia`, r.prevalencia.v, x.prevalencia);
  casi(`${caso}: LR−`, r.lrn.v, x.lrn);
  // IC del LR−: el Excel usa (1 − VPP)/d; comprobamos que el Excel hace eso y que nosotros usamos (1 − E)/d
  const S = e.C5 / (e.C5 + e.C6), E = e.D6 / (e.D5 + e.D6), VPP = e.C5 / (e.C5 + e.D5);
  casi(`${caso}: el Excel usa VPP en el IC del LR−`, Math.exp(Math.log(x.lrn) - 1.96 * Math.sqrt((1 - VPP) / e.D6 + S / e.C6)), x.lrnInf);
  casi(`${caso}: IC del LR− correcto`, r.lrn.inf, Math.exp(Math.log(r.lrn.v) - 1.96 * Math.sqrt(S / e.C6 + (1 - E) / e.D6)));
  // Probabilidad tras la prueba: el punto coincide; el IC se calcula con los límites del LR (Diseño, 7.5)
  casi(`${caso}: probabilidad tras un positivo`, r.post.pos.v, x.postPos);
  casi(`${caso}: probabilidad tras un negativo`, r.post.neg.v, x.postNeg);
  t(`${caso}: IC de la probabilidad tras un positivo contiene el punto`, r.post.pos.inf < r.post.pos.v && r.post.pos.v < r.post.pos.sup);
});
O.niveles.forEach(({ caso, entrada: e, salida: x }) => {
  const filas = [["C3", "D3"], ["C4", "D4"], ["C5", "D5"], ["C6", "D6"], ["C7", "D7"]].slice(0, e.G3).map(([a, b]) => ({ a: e[a], b: e[b] }));
  const r = C.niveles(filas, e.G5);
  t(`${caso}: calcula`, r.ok);
  r.filas.forEach((f, i) => {
    const k = i + 1;
    casi(`${caso}: nivel ${k} · sensibilidad`, f.s, x["s" + k]); casi(`${caso}: nivel ${k} · especificidad`, f.e, x["e" + k]);
    ivCasi(`${caso}: nivel ${k} · LR`, f.lr, x["lr" + k], x["lr" + k + "Inf"], x["lr" + k + "Sup"]);
    casi(`${caso}: nivel ${k} · probabilidad tras la prueba`, f.post.v, x["post" + k]);
  });
});
O.bayes.forEach(({ caso, entrada: e, salida: x }) => {
  const r = C.desdeSE({ s: e.D8, e: e.D9, pre: e.D7 });
  casi(`${caso}: positivo desde S y E`, r.post.pos.v, x.postPos);
  casi(`${caso}: negativo desde S y E`, r.post.neg.v, x.postNeg);
  casi(`${caso}: desde un LR`, C.bayes(e.D22, e.D23), x.postLR);
});
// Diagnóstico: comprobaciones de libro
{
  const w = C.wilson(81, 263);   // Newcombe, Stat Med 1998: 0,2553 a 0,3662
  casi("Wilson de Newcombe · inf", w.inf, 0.2553, 1e-3); casi("Wilson de Newcombe · sup", w.sup, 0.3662, 1e-3);
  const r = C.diagnostico({ a: 8, b: 40, c: 2, d: 950 });
  t("Trampa: VPP bajo por baja prevalencia", C.trampasDiagnostico(r).some(a => /valor predictivo positivo/.test(a.texto)));
  t("Pre por defecto = prevalencia", !r.prePropia && Math.abs(r.pre - 0.01) < 1e-12);
  t("Pre como porcentaje", Math.abs(C.diagnostico({ a: 8, b: 40, c: 2, d: 950, pre: "30" }).pre - 0.3) < 1e-12);
  t("Semáforo: LR útil → verde", C.semaforoCalculo("diagnostico", C.diagnostico({ a: 90, b: 20, c: 10, d: 180 })).color === "verde");
  t("Semáforo: prueba inútil → rojo", C.semaforoCalculo("diagnostico", C.diagnostico({ a: 11, b: 10, c: 9, d: 10 })).color === "rojo");
  t("Fuerza del LR", [C.lrFuerza(12), C.lrFuerza(6), C.lrFuerza(3), C.lrFuerza(1.2), C.lrFuerza(0.3), C.lrFuerza(0.15), C.lrFuerza(0.05)].join() === "grande,moderado,pequeño,casi nulo,pequeño,moderado,grande");
  const z = C.diagnostico({ a: 10, b: 0, c: 0, d: 10 });
  t("Diagnóstico con ceros: LR finitos", z.cero && isFinite(z.lrp.v) && isFinite(z.lrn.v));
}
// Fagan: la recta une pre, LR y post
{
  const g = C.faganGeo(400, 20), pre = 0.2, lr = 6, post = C.bayes(pre, lr);
  casi("Fagan: el punto del LR está en medio de la recta", g.yLR(lr), (g.yPre(pre) + g.yPost(post)) / 2, 1e-9);
  t("Fagan: el 50 % está en el centro", Math.abs(g.yPre(0.5) - 200) < 1e-9 && Math.abs(g.yLR(1) - 200) < 1e-9);
}
// Odds ratio y coste-efectividad
{
  const r = C.oddsRatio({ a: 30, b: 20, c: 70, d: 180 });
  casi("OR", r.or.v, (30 * 180) / (20 * 70));
  casi("OR · inf (Woolf)", r.or.inf, Math.exp(Math.log(r.or.v) - 1.96 * Math.sqrt(1 / 30 + 1 / 20 + 1 / 70 + 1 / 180)));
  t("OR incluye 1 → aviso", C.trampasOR(C.oddsRatio({ a: 10, b: 10, c: 50, d: 52 })).some(a => /incluye el 1/.test(a.texto)));
  const c = C.cei({ cn: 1500, ch: 1000, en: 1.2, eh: 1.1 });
  casi("RCEI", c.rcei, 5000, 1e-9); t("Cuadrante: más cara y mejor", c.cuadrante === "caraMejor");
  t("Cuadrante: domina", C.cei({ cn: 900, ch: 1000, en: 1.2, eh: 1.1 }).cuadrante === "domina");
  t("Cuadrante: dominada", C.cei({ cn: 1100, ch: 1000, en: 1.0, eh: 1.1 }).cuadrante === "dominada");
}
// Formato español
t("Formato", C.fmt(40, 0) === "40" && C.pct(0.4, 0) === "40 %" && C.fmt(0.9989) === "0,999" && C.fmt(1234.5, 1) === "1234,5" && C.fmt(0.1 + 0.2, 2) === "0,3" && C.pct(0.125) === "12,5 %" && C.fmt(Infinity) === "∞");

console.log(`${ok} pruebas correctas, ${fallos} fallidas`);
if (fallos) process.exit(1);
