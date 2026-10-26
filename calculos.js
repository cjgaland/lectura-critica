// ============================================================
//  calculos.js — Calculadoras PURAS (sin DOM) · Lectura Crítica
//  Tratamiento (riesgos, RR, RRR, RAR, NNT con el método de Altman, OR,
//  análisis de sensibilidad de las pérdidas, NNT para tu paciente),
//  odds ratio de casos y controles, diagnóstico (S, E, valores predictivos,
//  LR, ORD, Bayes), pruebas con varios niveles, nomograma de Fagan
//  (coordenadas), coste-efectividad incremental, avisos didácticos («trampas»),
//  frases en lenguaje llano y semáforo de resultados.
//  Las fórmulas son estándar; las de las calculadoras Excel de J. Primo
//  (CASPe) son el oráculo de los tests (tests/oraculo.json). Diferencias
//  documentadas en Diseño, 7.5.
//  window.Calculos en navegador y module.exports en Node (tests).
// ============================================================
(function (raiz) {
  "use strict";

  const Z = 1.96;   // 95 %, como los Excel

  // ---------- Números ----------
  // Acepta «12,5», «12.5» y « 12 »; «12 %» (o con o.pct) se divide entre 100
  function num(v, o = {}) {
    if (typeof v === "number") return isFinite(v) ? v : NaN;
    let s = String(v == null ? "" : v).trim().replace(/\s/g, "");
    const pct = /%$/.test(s); s = s.replace(/%$/, "").replace(",", ".");
    if (s === "" || isNaN(s)) return NaN;
    const n = Number(s);
    return pct || o.pct ? n / 100 : n;
  }
  // Una probabilidad o proporción: «30», «30 %» y «0,3» valen lo mismo (más de 1 se entiende como porcentaje)
  const prob = v => { const n = num(v); return n > 1 ? n / 100 : n; };
  // Lo que la app pide «en %» se lee siempre como porcentaje («1» = 1 %, no 100 %)
  const porc = v => { const n = num(String(v == null ? "" : v).replace("%", "")); return ok(n) ? n / 100 : NaN; };
  const CAMPOS_PORC = ["pre", "umbral", "s", "e", "peer", "dano", "rprueba", "beneficio"];
  const entero = v => { const n = num(v); return Number.isInteger(n) && n >= 0 ? n : NaN; };
  const ok = x => typeof x === "number" && isFinite(x);
  // Redondeo como ROUND de Excel (la mitad, lejos del cero)
  const redondearExcel = (x, d) => { const k = Math.pow(10, d); return Math.sign(x) * Math.round(Math.abs(x) * k + 1e-9) / k; };
  // Formato español: coma decimal, sin ceros de más
  // Si al redondear un valor que no es 1 sale 1 (un límite de 0,998), se añaden decimales para no confundirlo con el «sin efecto»
  function fmt(x, d = 2) {
    if (!ok(x)) return x === Infinity ? "∞" : "—";
    while (d < 4 && x !== 1 && Math.abs(x) > 0.5 && Math.abs(x) < 1.5 && Number(x.toFixed(d)) === 1) d++;
    let s = x.toFixed(d);
    if (d > 0) s = s.replace(/0+$/, "").replace(/\.$/, "");
    return (s === "-0" ? "0" : s).replace(".", ",");
  }
  const pct = (x, d = 1) => ok(x) ? fmt(x * 100, d) + " %" : "—";
  const icTxt = (iv, f = fmt) => iv && ok(iv.inf) && ok(iv.sup) ? `${f(iv.inf)} a ${f(iv.sup)}` : "—";

  // ---------- Intervalos ----------
  // Wilson (sin corrección por continuidad), como la hoja «Tabla 2x2» del Excel de diagnóstico
  function wilson(r, n) {
    if (!(n > 0)) return { v: NaN, inf: NaN, sup: NaN };
    const p = r / n, a = 2 * r + Z * Z, b = Z * Math.sqrt(Z * Z + 4 * r * (1 - p)), c = 2 * (n + Z * Z);
    return { v: p, inf: (a - b) / c, sup: (a + b) / c };
  }
  // Wald, como el Excel de tratamiento (solo para comprobarlo en los tests: puede salirse de 0-1)
  function wald(r, n) {
    const p = r / n, se = Math.sqrt(p * (1 - p) / n);
    return { v: p, inf: p - Z * se, sup: p + Z * se };
  }
  const icLog = (v, se) => ({ v, inf: Math.exp(Math.log(v) - Z * se), sup: Math.exp(Math.log(v) + Z * se) });
  const incluye = (iv, x) => ok(iv.inf) && ok(iv.sup) && iv.inf <= x && x <= iv.sup;

  // ---------- Tratamiento (ensayo clínico, cohortes) ----------
  // e: { nc, pc, ec, ne, pe, ee } = incluidos, perdidos y con evento en el grupo control (c) y en el experimental (e).
  // o.redondeoExcel: redondea el IC de la RAR a 3 decimales antes del NNT (solo para demostrar en los tests que damos lo mismo que el Excel)
  function tratamiento(e, o = {}) {
    const nc = entero(e.nc), ne = entero(e.ne), pc = lleno(e.pc) ? entero(e.pc) : 0, pe = lleno(e.pe) ? entero(e.pe) : 0, ec = entero(e.ec), ee = entero(e.ee);
    const r = { ok: false, errores: [] };
    if (![nc, ne, pc, pe, ec, ee].every(ok)) { r.errores.push("Escribe números enteros (sin decimales) en todas las casillas."); return r; }
    const Nc = nc - pc, Ne = ne - pe;
    if (Nc <= 0 || Ne <= 0) r.errores.push("En cada grupo, los perdidos deben ser menos que los incluidos.");
    if (ec > Nc || ee > Ne) r.errores.push("Los pacientes con evento no pueden ser más que los evaluados.");
    if (r.errores.length) return r;
    Object.assign(r, { ok: true, Nc, Ne, ec, ee, perdidas: { c: nc ? pc / nc : 0, e: ne ? pe / ne : 0 } });
    r.rc = wilson(ec, Nc); r.re = wilson(ee, Ne);
    // RR y OR: si alguna celda es 0, corrección de 0,5 en las cuatro (Haldane)
    r.cero = [ec, ee, Nc - ec, Ne - ee].includes(0);
    const k = r.cero ? 0.5 : 0, a = ee + k, b = Ne - ee + k, c = ec + k, d = Nc - ec + k;
    if (a > 0 && c > 0 && b > 0 && d > 0) {
      r.rr = icLog((a / (a + b)) / (c / (c + d)), Math.sqrt(1 / a - 1 / (a + b) + 1 / c - 1 / (c + d)));
      r.rrr = { v: 1 - r.rr.v, inf: 1 - r.rr.sup, sup: 1 - r.rr.inf };
      r.or = icLog((a * d) / (b * c), Math.sqrt(1 / a + 1 / b + 1 / c + 1 / d));
    } else { r.rr = r.rrr = r.or = { v: NaN, inf: NaN, sup: NaN }; }
    // RAR = riesgo control − riesgo experimental (positiva = el tratamiento reduce el riesgo)
    const rc = ec / Nc, re = ee / Ne, se = Math.sqrt(re * (1 - re) / Ne + rc * (1 - rc) / Nc);
    let inf = rc - re - Z * se, sup = rc - re + Z * se;
    if (o.redondeoExcel) { inf = -redondearExcel((re - rc) + Z * se, 3); sup = -redondearExcel((re - rc) - Z * se, 3); }
    r.rar = { v: rc - re, inf, sup };
    r.nnt = nntDe(r.rar);
    return r;
  }
  // NNT (Altman, BMJ 1998): NNTB si el tratamiento beneficia, NNTD si daña; si el IC de la RAR incluye 0, el del NNT pasa por el infinito
  function nntDe(rar) {
    const v = rar.v === 0 ? Infinity : 1 / Math.abs(rar.v), tipo = rar.v > 0 ? "NNTB" : rar.v < 0 ? "NNTD" : "";
    const L = rar.inf, U = rar.sup;
    if (L > 0) return { v, tipo, cruza: false, inf: 1 / U, sup: 1 / L };
    if (U < 0) return { v, tipo, cruza: false, inf: 1 / Math.abs(U), sup: 1 / Math.abs(L) };
    return { v, tipo, cruza: true, nntb: U > 0 ? 1 / U : Infinity, nntd: L < 0 ? 1 / Math.abs(L) : Infinity };
  }
  const nntIcTxt = n => n.cruza ? `NNTB ${fmt(n.nntb, 1)} a ∞ a NNTD ${fmt(n.nntd, 1)}` : `${fmt(n.inf, 1)} a ${fmt(n.sup, 1)}`;
  const nntTxt = n => !n ? "—" : n.v === Infinity ? "∞ (sin diferencia)" : `${n.tipo} ${fmt(n.v, 1)} (IC 95 %: ${nntIcTxt(n)})`;

  // Análisis de sensibilidad de las pérdidas: qué proporción de los perdidos de cada grupo tuvo el evento
  // (como el Excel: eventos + redondeo(perdidos × proporción); se analiza a todos los incluidos)
  function sensibilidadPerdidas(e, propC, propE) {
    const nc = entero(e.nc), ne = entero(e.ne), pc = lleno(e.pc) ? entero(e.pc) : 0, pe = lleno(e.pe) ? entero(e.pe) : 0, ec = entero(e.ec), ee = entero(e.ee);
    if (![nc, ne, pc, pe, ec, ee, propC, propE].every(ok)) return null;
    return tratamiento({ nc, ne, pc: 0, pe: 0, ec: ec + redondearExcel(pc * propC, 0), ee: ee + redondearExcel(pe * propE, 0) });
  }
  const SUPUESTOS = {
    peor: { nom: "Peor caso para el tratamiento", txt: "Todos los perdidos del grupo experimental tuvieron el evento y ninguno del control." },
    mejor: { nom: "Mejor caso para el tratamiento", txt: "Ninguno de los perdidos del grupo experimental tuvo el evento y todos los del control sí." },
    igual: { nom: "Igual que los evaluados", txt: "Los perdidos de cada grupo tuvieron el evento en la misma proporción que los evaluados de su grupo." }
  };
  function supuesto(e, k, r) {
    if (k === "peor") return sensibilidadPerdidas(e, 0, 1);
    if (k === "mejor") return sensibilidadPerdidas(e, 1, 0);
    if (k === "igual" && r && r.ok) return sensibilidadPerdidas(e, r.rc.v, r.re.v);
    return null;
  }
  // NNT para tu paciente: con su riesgo basal esperado (PEER) y la RRR, o con un factor F frente al control del estudio
  const nntPaciente = (peer, rrr) => ok(peer) && ok(rrr) && peer > 0 && rrr !== 0 ? Math.abs(1 / (peer * rrr)) : NaN;
  const nntConF = (nnt, f) => ok(nnt) && ok(f) && f > 0 ? nnt / f : NaN;

  // ---------- Odds ratio (casos y controles) ----------
  // a = casos expuestos, b = controles expuestos, c = casos no expuestos, d = controles no expuestos
  function oddsRatio(e) {
    const v = ["a", "b", "c", "d"].map(k => entero(e[k])), r = { ok: false, errores: [] };
    if (!v.every(ok)) { r.errores.push("Escribe números enteros (sin decimales) en las cuatro casillas."); return r; }
    let [a, b, c, d] = v;
    if (a + c === 0 || b + d === 0) { r.errores.push("Hacen falta casos y controles."); return r; }
    r.cero = [a, b, c, d].includes(0); if (r.cero) { a += 0.5; b += 0.5; c += 0.5; d += 0.5; }
    Object.assign(r, { ok: true, expCasos: v[0] / (v[0] + v[2]), expControles: v[1] / (v[1] + v[3]) });
    r.or = icLog((a * d) / (b * c), Math.sqrt(1 / a + 1 / b + 1 / c + 1 / d));
    return r;
  }

  // ---------- Diagnóstico ----------
  // Probabilidad tras la prueba (Bayes con odds)
  function bayes(pre, lr) {
    if (!(pre > 0 && pre < 1) || !(lr >= 0) || !isFinite(lr)) return NaN;
    const o = pre / (1 - pre) * lr; return o / (1 + o);
  }
  // a = verdaderos positivos, b = falsos positivos, c = falsos negativos, d = verdaderos negativos. pre: probabilidad previa (por defecto, la prevalencia)
  function diagnostico(e) {
    const v = ["a", "b", "c", "d"].map(k => entero(e[k])), r = { ok: false, errores: [] };
    if (!v.every(ok)) { r.errores.push("Escribe números enteros (sin decimales) en las cuatro casillas."); return r; }
    const [a, b, c, d] = v;
    if (a + c === 0 || b + d === 0) { r.errores.push("Hacen falta personas con y sin la enfermedad."); return r; }
    Object.assign(r, { ok: true, a, b, c, d, n: a + b + c + d });
    r.s = wilson(a, a + c); r.e = wilson(d, b + d);
    r.vpp = wilson(a, a + b); r.vpn = wilson(d, c + d);
    r.pfp = wilson(b, b + d); r.pfn = wilson(c, a + c);
    r.exactitud = wilson(a + d, r.n); r.prevalencia = wilson(a + c, r.n);
    r.youden = r.s.v + r.e.v - 1;
    // LR y ORD: si alguna celda es 0, corrección de 0,5 en las cuatro
    r.cero = [a, b, c, d].includes(0);
    const k = r.cero ? 0.5 : 0, A = a + k, B = b + k, C = c + k, D = d + k, S = A / (A + C), E = D / (B + D);
    r.lrp = icLog(S / (1 - E), Math.sqrt((1 - S) / A + E / B));
    r.lrn = icLog((1 - S) / E, Math.sqrt(S / C + (1 - E) / D));     // el Excel usa (1 − VPP)/d en lugar de (1 − E)/d: error de casilla (Diseño, 7.5)
    r.ord = icLog((A * D) / (B * C), Math.sqrt(1 / A + 1 / B + 1 / C + 1 / D));
    const pre = prob(e.pre);
    r.pre = pre > 0 && pre < 1 ? pre : r.prevalencia.v;
    r.prePropia = pre > 0 && pre < 1;
    r.post = posterior(r.pre, r);
    return r;
  }
  // Probabilidad tras un resultado positivo y negativo; su IC lleva los límites del LR por la misma fórmula
  function posterior(pre, r) {
    const p = lr => ({ v: bayes(pre, lr.v), inf: bayes(pre, lr.inf), sup: bayes(pre, lr.sup) });
    return { pos: p(r.lrp), neg: p(r.lrn) };
  }
  // Desde la sensibilidad y la especificidad publicadas (sin tabla 2 × 2)
  function desdeSE(e) {
    const s = prob(e.s), es = prob(e.e), r = { ok: false, errores: [] };
    if (!(s > 0 && s < 1) || !(es > 0 && es < 1)) { r.errores.push("Escribe la sensibilidad y la especificidad (entre 0 y 100 %, sin llegar a los extremos)."); return r; }
    const pre = prob(e.pre);
    if (!(pre > 0 && pre < 1)) { r.errores.push("Escribe la probabilidad antes de la prueba (entre 0 y 100 %)."); return r; }
    const lrp = s / (1 - es), lrn = (1 - s) / es;
    return { ok: true, s, e: es, pre, lrp: { v: lrp }, lrn: { v: lrn }, post: { pos: { v: bayes(pre, lrp) }, neg: { v: bayes(pre, lrn) } } };
  }
  // Pruebas con varios niveles: filas [{ a (con la enfermedad), b (sin ella) }]
  function niveles(filas, preV) {
    const f = (filas || []).map(x => ({ nombre: x.nombre || "", a: entero(x.a), b: entero(x.b) })).filter(x => ok(x.a) && ok(x.b));
    const r = { ok: false, errores: [] };
    if (f.length < 2) { r.errores.push("Escribe al menos dos niveles, con números enteros."); return r; }
    const SA = f.reduce((s, x) => s + x.a, 0), SB = f.reduce((s, x) => s + x.b, 0);
    if (!SA || !SB) { r.errores.push("Hacen falta personas con y sin la enfermedad."); return r; }
    const pre = prob(preV);
    r.pre = pre > 0 && pre < 1 ? pre : SA / (SA + SB); r.prePropia = pre > 0 && pre < 1;
    r.filas = f.map(x => {
      const cero = x.a === 0 || x.b === 0, k = cero ? 0.5 : 0, a = x.a + k, b = x.b + k;
      const lr = icLog((a / SA) / (b / SB), Math.sqrt(1 / a - 1 / SA + 1 / b - 1 / SB));
      return { nombre: x.nombre, a: x.a, b: x.b, s: x.a / SA, e: (SB - x.b) / SB, cero, lr, post: { v: bayes(r.pre, lr.v), inf: bayes(r.pre, lr.inf), sup: bayes(r.pre, lr.sup) } };
    });
    Object.assign(r, { ok: true, SA, SB });
    return r;
  }
  // Cómo de útil es un cociente de probabilidad
  function lrFuerza(lr) {
    if (!ok(lr)) return "";
    if (lr >= 10 || lr <= 0.1) return "grande";
    if (lr >= 5 || lr <= 0.2) return "moderado";
    if (lr >= 2 || lr <= 0.5) return "pequeño";
    return "casi nulo";
  }
  const LR_FUERZA_TXT = { grande: "cambia mucho la probabilidad: a menudo decide", moderado: "cambia la probabilidad de forma moderada", "pequeño": "cambia poco la probabilidad", "casi nulo": "apenas cambia la probabilidad" };

  // ---------- Nomograma de Fagan (coordenadas) ----------
  // logit(post) = logit(pre) + ln LR: con ejes en escala logit (probabilidades) y ln LR / 2 (centro), una recta une los tres puntos
  const logit = p => Math.log(p / (1 - p));
  const P_TICKS = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 0.98, 0.99, 0.995, 0.999];
  const LR_TICKS = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
  // Devuelve una función de geometría para un alto dado: probabilidad previa arriba en 0,1 % (eje izquierdo), posterior arriba en 99,9 % (derecho)
  function faganGeo(alto, margen) {
    const c = alto / 2, k = (alto / 2 - margen) / logit(0.999), lim = p => Math.min(0.999, Math.max(0.001, p));
    return {
      yPre: p => c + k * logit(lim(p)),
      yPost: p => c - k * logit(lim(p)),
      yLR: lr => c - k * Math.log(Math.min(1000, Math.max(0.001, lr))) / 2
    };
  }

  // ---------- Coste-efectividad incremental ----------
  function cei(e) {
    const cn = num(e.cn), ch = num(e.ch), en = num(e.en), eh = num(e.eh), r = { ok: false, errores: [] };
    if (![cn, ch, en, eh].every(ok)) { r.errores.push("Escribe los costes y los efectos de las dos alternativas."); return r; }
    const dC = cn - ch, dE = en - eh;
    let cuadrante, rcei = NaN;
    if (dE === 0 && dC === 0) cuadrante = "igual";
    else if (dC <= 0 && dE >= 0) cuadrante = "domina";
    else if (dC >= 0 && dE <= 0) cuadrante = "dominada";
    else { cuadrante = dC > 0 ? "caraMejor" : "barataPeor"; rcei = dC / dE; }
    return { ok: true, dC, dE, rcei, cuadrante };
  }
  const CUADRANTES = {
    igual: "Las dos alternativas cuestan y consiguen lo mismo.",
    domina: "La nueva domina: cuesta lo mismo o menos y consigue lo mismo o más. Se elige sin dudar.",
    dominada: "La nueva está dominada: cuesta lo mismo o más y consigue lo mismo o menos. Se descarta.",
    caraMejor: "La nueva consigue más pero cuesta más: hay que decidir si el coste por unidad de efecto ganada (RCEI) merece la pena.",
    barataPeor: "La nueva cuesta menos pero consigue menos: la RCEI es lo que se ahorra por cada unidad de efecto que se pierde."
  };

  // ---------- Frases en lenguaje llano ----------
  const de100 = p => fmt(p * 100, p * 100 < 10 ? 1 : 0);
  function textoTratamiento(r, desenlace) {
    if (!r || !r.ok) return "";
    const ev = desenlace ? `«${desenlace}»` : "el evento";
    const rar = r.rar.v, dir = rar > 0 ? "menos" : "más";
    let t = `Sin la intervención, ${de100(r.rc.v)} de cada 100 tienen ${ev}; con ella, ${de100(r.re.v)} de cada 100.`;
    if (rar === 0) return t + " No hay diferencia.";
    t += ` Es decir, ${de100(Math.abs(rar))} ${dir} de cada 100 (RAR ${pct(rar)}; IC 95 %: ${pct(r.rar.inf)} a ${pct(r.rar.sup)}).`;
    t += ` Riesgo relativo ${fmt(r.rr.v)} (IC 95 %: ${icTxt(r.rr)}).`;
    const nn = `${r.nnt.tipo} ${fmt(r.nnt.v, 1)}; IC 95 %: ${nntIcTxt(r.nnt)}`;
    t += r.nnt.tipo === "NNTB" ? ` Hay que tratar a ${fmt(Math.ceil(r.nnt.v), 0)} personas para evitar ${ev} en una (${nn}).` : ` Por cada ${fmt(Math.ceil(r.nnt.v), 0)} personas tratadas, una más tiene ${ev} (${nn}).`;
    return t;
  }
  function textoDiagnostico(r) {
    if (!r || !r.ok) return "";
    return `Sensibilidad ${pct(r.s.v)} (IC 95 %: ${icTxt(r.s, pct)}) y especificidad ${pct(r.e.v)} (${icTxt(r.e, pct)}). LR+ ${fmt(r.lrp.v)} (${icTxt(r.lrp)}) y LR− ${fmt(r.lrn.v)} (${icTxt(r.lrn)}). `
      + `Con una probabilidad previa del ${pct(r.pre)}, un positivo la sube al ${pct(r.post.pos.v)} y un negativo la baja al ${pct(r.post.neg.v)}.`;
  }
  const textoOR = r => r && r.ok ? `Odds ratio ${fmt(r.or.v)} (IC 95 %: ${icTxt(r.or)}). Expuestos: ${pct(r.expCasos)} de los casos frente a ${pct(r.expControles)} de los controles.` : "";
  const textoCEI = (r, unidad) => !r || !r.ok ? "" : r.cuadrante === "caraMejor" || r.cuadrante === "barataPeor"
    ? `La nueva cuesta ${fmt(r.dC, 0)} € ${r.dC >= 0 ? "más" : "menos"} y consigue ${fmt(Math.abs(r.dE), 3)} ${unidad || "unidades de efecto"} ${r.dE >= 0 ? "más" : "menos"}: RCEI ${fmt(r.rcei, 0)} € por ${unidad || "unidad"}.`
    : CUADRANTES[r.cuadrante];

  // ---------- Avisos didácticos («trampas») ----------
  function trampasTratamiento(r) {
    const a = []; if (!r || !r.ok) return a;
    if (r.cero) a.push({ nivel: "nota", texto: "Hay una casilla con 0: el riesgo relativo y la odds ratio se calculan sumando 0,5 a las cuatro casillas." });
    if (Math.abs(r.rrr.v) >= 0.25 && Math.abs(r.rar.v) < 0.02) a.push({ nivel: "aviso", texto: `Reducción relativa grande (${pct(Math.abs(r.rrr.v), 0)}) con reducción absoluta pequeña (${pct(Math.abs(r.rar.v))}): mira el NNT antes de entusiasmarte.` });
    if (incluye(r.rr, 1)) a.push({ nivel: "aviso", texto: "El intervalo del riesgo relativo incluye el 1: el resultado es compatible con que no haya efecto." });
    else if (r.rr.sup / r.rr.inf > 4) a.push({ nivel: "aviso", texto: "El intervalo es muy ancho: el estudio dice poco, probablemente porque es pequeño." });
    const pmax = Math.max(r.perdidas.c, r.perdidas.e);
    if (pmax > 0.2) a.push({ nivel: "aviso", texto: `Más del 20 % de pérdidas en algún grupo (${pct(pmax, 0)}): haz el análisis de sensibilidad de las pérdidas.` });
    else if (Math.abs(r.perdidas.c - r.perdidas.e) > 0.1) a.push({ nivel: "aviso", texto: "Las pérdidas son muy distintas entre los grupos: haz el análisis de sensibilidad." });
    if (Math.max(r.rc.v, r.re.v) > 0.1 && Math.abs(Math.log(r.or.v) - Math.log(r.rr.v)) > 0.1) a.push({ nivel: "nota", texto: `El evento es frecuente (más del 10 %): la odds ratio (${fmt(r.or.v)}) exagera el efecto respecto al riesgo relativo (${fmt(r.rr.v)}). No las confundas.` });
    return a;
  }
  function trampasDiagnostico(r) {
    const a = []; if (!r || !r.ok) return a;
    if (r.cero) a.push({ nivel: "nota", texto: "Hay una casilla con 0: los cocientes de probabilidad y la ORD se calculan sumando 0,5 a las cuatro casillas." });
    if (r.e.v >= 0.9 && r.prevalencia.v < 0.1 && r.vpp.v < 0.5) a.push({ nivel: "aviso", texto: `Con buena especificidad (${pct(r.e.v)}), el valor predictivo positivo es solo del ${pct(r.vpp.v)} porque la enfermedad es poco frecuente (${pct(r.prevalencia.v)}). Los valores predictivos dependen de a quién se haga la prueba: usa los cocientes de probabilidad.` });
    if (lrFuerza(r.lrp.v) === "casi nulo" && lrFuerza(r.lrn.v) === "casi nulo") a.push({ nivel: "aviso", texto: "Los dos cocientes de probabilidad están entre 0,5 y 2: la prueba apenas cambia la probabilidad de enfermedad." });
    if (r.a + r.c < 30 || r.b + r.d < 30) a.push({ nivel: "nota", texto: "Pocas personas con o sin la enfermedad: los intervalos son anchos." });
    return a;
  }
  function trampasOR(r) {
    const a = []; if (!r || !r.ok) return a;
    if (r.cero) a.push({ nivel: "nota", texto: "Hay una casilla con 0: la odds ratio se calcula sumando 0,5 a las cuatro casillas." });
    if (incluye(r.or, 1)) a.push({ nivel: "aviso", texto: "El intervalo de la odds ratio incluye el 1: la asociación podría no existir." });
    else if (r.or.sup / r.or.inf > 6) a.push({ nivel: "aviso", texto: "El intervalo es muy ancho: el estudio dice poco." });
    return a;
  }

  // ---------- Semáforo de resultados a partir de una calculadora ----------
  // Propuesta; la persona puede cambiarla. Devuelve { color, motivo } o null si la calculadora no da color.
  function semaforoCalculo(tipo, r) {
    if (!r || !r.ok) return null;
    if (tipo === "tratamiento") {
      const N = r.Nc + r.Ne;
      if (incluye(r.rr, 1)) return N >= 400 ? { color: "rojo", motivo: `Con ${N} pacientes, el intervalo del riesgo relativo sigue incluyendo el 1: no se ve efecto.` } : { color: "ambar", motivo: `El intervalo incluye el 1 y el estudio es pequeño (${N} pacientes): resultado incierto.` };
      if (r.rr.sup / r.rr.inf > 4) return { color: "ambar", motivo: "Hay efecto, pero el intervalo es muy ancho (impreciso)." };
      if (r.nnt.sup / r.nnt.inf > 10) return { color: "ambar", motivo: `Hay efecto, pero impreciso: el NNT puede ir de ${fmt(r.nnt.inf, 0)} a ${fmt(r.nnt.sup, 0)}.` };
      if (Math.abs(r.rar.v) < 0.01) return { color: "ambar", motivo: `Efecto preciso pero pequeño en términos absolutos (RAR ${pct(r.rar.v)}).` };
      return { color: "verde", motivo: `Efecto claro y preciso: ${nntTxt(r.nnt)}.` };
    }
    if (tipo === "or") {
      if (incluye(r.or, 1)) return { color: "ambar", motivo: "El intervalo de la odds ratio incluye el 1." };
      if (r.or.sup / r.or.inf > 6) return { color: "ambar", motivo: "Asociación con un intervalo muy ancho (imprecisa)." };
      return { color: "verde", motivo: `Asociación clara: OR ${fmt(r.or.v)} (${icTxt(r.or)}).` };
    }
    if (tipo === "supervivencia") {
      if (incluye(r.hr, 1)) return { color: "ambar", motivo: "El intervalo del hazard ratio incluye el 1." };
      if (r.hr.sup / r.hr.inf > 4) return { color: "ambar", motivo: "Hay efecto, pero el intervalo del hazard ratio es muy ancho." };
      return { color: "verde", motivo: `Efecto claro: HR ${fmt(r.hr.v)} (${icTxt(r.hr)}).` };
    }
    if (tipo === "metaanalisis") {
      const A = r.aleatorio;
      if (A.inf <= r.nula && r.nula <= A.sup) return { color: r.k >= 10 && r.i2 < 0.25 ? "rojo" : "ambar", motivo: "El intervalo del efecto combinado (efectos aleatorios) incluye el «sin efecto»." };
      if (r.i2 > 0.5) return { color: "ambar", motivo: `Hay efecto, pero los estudios discrepan mucho (I² ${pct(r.i2, 0)}).` };
      return { color: "verde", motivo: `Efecto combinado claro y estudios coherentes (I² ${pct(r.i2, 0)}).` };
    }
    if (tipo === "diagnostico") {
      const fp = !incluye(r.lrp, 1) ? lrFuerza(r.lrp.v) : "casi nulo", fn = !incluye(r.lrn, 1) ? lrFuerza(r.lrn.v) : "casi nulo";
      if ([fp, fn].some(f => f === "grande" || f === "moderado")) return { color: "verde", motivo: `Cocientes de probabilidad útiles: LR+ ${fmt(r.lrp.v)}, LR− ${fmt(r.lrn.v)}.` };
      if ([fp, fn].includes("pequeño")) return { color: "ambar", motivo: `Cocientes de probabilidad modestos: LR+ ${fmt(r.lrp.v)}, LR− ${fmt(r.lrn.v)}.` };
      return { color: "rojo", motivo: "Los cocientes de probabilidad no se distinguen de 1: la prueba apenas informa." };
    }
    return null;
  }

  // ============================================================
  //  Fase 2: distribuciones, supervivencia, metaanálisis, umbrales y kappa
  // ============================================================

  // ---------- Distribuciones (p de Q, de Egger y del log-rank) ----------
  function lnGamma(x) {
    const g = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lnGamma(1 - x);
    x -= 1; let a = 0.99999999999980993; const t = x + 7.5;
    g.forEach((c, i) => { a += c / (x + i + 1); });
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }
  // Gamma incompleta regularizada superior Q(a, x) (series y fracción continua)
  function gammaQ(a, x) {
    if (x <= 0) return 1;
    if (x < a + 1) { let s = 1 / a, d = s, ap = a; for (let n = 0; n < 500; n++) { ap++; d *= x / ap; s += d; if (Math.abs(d) < Math.abs(s) * 1e-16) break; } return 1 - s * Math.exp(-x + a * Math.log(x) - lnGamma(a)); }
    let b = x + 1 - a, c = 1e300, d = 1 / b, h = d;
    for (let i = 1; i < 500; i++) { const an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300; c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 1e-16) break; }
    return Math.exp(-x + a * Math.log(x) - lnGamma(a)) * h;
  }
  const pNormal2 = z => gammaQ(0.5, z * z / 2);               // p bilateral de una z
  const chi2Sup = (x, gl) => gammaQ(gl / 2, x / 2);           // p de una ji cuadrado
  // Inversa de la normal (Acklam, con un paso de Newton)
  function normInv(p) {
    if (!(p > 0 && p < 1)) return NaN;
    const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239], b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572], c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783], d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
    let q, x;
    if (p < 0.02425) { q = Math.sqrt(-2 * Math.log(p)); x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    else if (p > 1 - 0.02425) { q = Math.sqrt(-2 * Math.log(1 - p)); x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    else { q = p - 0.5; const r = q * q; x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
    const e = (x < 0 ? pNormal2(x) / 2 : 1 - pNormal2(x) / 2) - p;
    return x - e * Math.sqrt(2 * Math.PI) * Math.exp(x * x / 2);
  }
  // Beta incompleta regularizada (fracción continua) y t de Student
  function betaInc(a, b, x) {
    if (x <= 0) return 0; if (x >= 1) return 1;
    const lbt = lnGamma(a + b) - lnGamma(a) - lnGamma(b) + a * Math.log(x) + b * Math.log(1 - x);
    const cf = (a, b, x) => { let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap; if (Math.abs(d) < 1e-300) d = 1e-300; d = 1 / d; let h = d;
      for (let m = 1; m < 500; m++) { const m2 = 2 * m; let aa = m * (b - m) * x / ((qam + m2) * (a + m2)); d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300; c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; h *= d * c;
        aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2)); d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300; c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 1e-16) break; }
      return h; };
    return x < (a + 1) / (a + b + 2) ? Math.exp(lbt) * cf(a, b, x) / a : 1 - Math.exp(lbt) * cf(b, a, 1 - x) / b;
  }
  const tSup2 = (t, gl) => betaInc(gl / 2, 0.5, gl / (gl + t * t));   // p bilateral de una t
  function tInv2(p, gl) { let lo = 0, hi = 1e4; for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (tSup2(m, gl) > p) lo = m; else hi = m; } return (lo + hi) / 2; }

  // ---------- Supervivencia de un estudio: el HR y su varianza (Parmar 1998, como MetaSurv) ----------
  // modo: ic (HR e IC) · oev (O − E y varianza log-rank) · obsesp (observados y esperados) · logrank (p del log-rank y eventos) · medianas · riesgo (eventos y sin evento en un instante t)
  const MODOS_SUPERV = {
    ic: "El HR y su intervalo de confianza", oev: "O − E y la varianza del log-rank", obsesp: "Eventos observados y esperados en cada grupo",
    logrank: "La p del log-rank y los eventos", medianas: "Las medianas de supervivencia", riesgo: "Eventos y sujetos sin evento en un momento t"
  };
  function supervivencia(e) {
    const n = k => num(e[k]), r = { ok: false, errores: [] }, modo = e.modo || "ic";
    let ln = NaN, v = NaN;
    if (modo === "ic") { const hr = n("hr"), li = n("li"), ls = n("ls"); if (hr > 0 && li > 0 && ls > li) { ln = Math.log(hr); v = Math.pow((Math.log(ls) - Math.log(li)) / (2 * Z), 2); } }
    else if (modo === "oev") { const oe = n("oe"), V = n("v"); if (ok(oe) && V > 0) { ln = oe / V; v = 1 / V; } }
    else if (modo === "obsesp") { const Oe = n("oe1"), Ee = n("ee1"), Oc = n("oc1"), Ec = n("ec1"); if ([Oe, Ee, Oc, Ec].every(x => x > 0)) { ln = Math.log((Oe / Ee) / (Oc / Ec)); v = 1 / Ee + 1 / Ec; } }
    else if (modo === "logrank") {
      const ev1 = n("ev1"), ev2 = n("ev2"), evt = n("evt"), n1 = n("n1"), n2 = n("n2"), p = n("p"), sg = e.sentido === "contra" ? 1 : -1;
      if (p > 0 && p < 1) {
        const z = Math.abs(normInv(p / 2));
        let V = NaN, oe = NaN;
        if (ev1 > 0 && ev2 > 0) { V = ev1 * ev2 / (ev1 + ev2); oe = Math.sqrt(V) * z; }
        else if (evt > 0 && n1 > 0 && n2 > 0) { V = evt * n1 * n2 / Math.pow(n1 + n2, 2); oe = Math.sqrt(evt * n1 * n2) / (n1 + n2) * z; }
        else if (evt > 0) { V = evt / 4; oe = Math.sqrt(evt) * z / 2; }
        if (V > 0) { ln = sg * oe / V; v = 1 / V; r.oe = sg * oe; }
      }
    }
    else if (modo === "medianas") { const m1 = n("m1"), m2 = n("m2"), ev1 = n("ev1"), ev2 = n("ev2"); if ([m1, m2, ev1, ev2].every(x => x > 0)) { ln = Math.log(m2 / m1); v = 1 / ev1 + 1 / ev2; } }
    else if (modo === "riesgo") {
      const a = n("e1"), b = n("s1"), c = n("e2"), d = n("s2"), N = a + b + c + d;
      if ([a, b, c, d].every(x => x >= 0) && N > 1 && a + c > 0) { const V = (a + b) * (c + d) * (a + c) * (b + d) / (N * N * (N - 1)); if (V > 0) { ln = (a - (a + b) * (a + c) / N) / V; v = 1 / V; } }
    }
    if (!ok(ln) || !(v > 0)) { r.errores.push("Completa los datos del método elegido (números positivos)."); return r; }
    const se = Math.sqrt(v);
    return { ok: true, modo, lnhr: ln, var: v, hr: { v: Math.exp(ln), inf: Math.exp(ln - Z * se), sup: Math.exp(ln + Z * se) }, z: Math.abs(ln / se), p: pNormal2(ln / se), oe: r.oe };
  }
  const textoSupervivencia = r => !r || !r.ok ? "" : `Hazard ratio ${fmt(r.hr.v)} (IC 95 %: ${icTxt(r.hr)}): en cada momento, el riesgo de tener el evento es ${r.hr.v < 1 ? `un ${pct(1 - r.hr.v, 0)} menor` : `un ${pct(r.hr.v - 1, 0)} mayor`} con la intervención${incluye(r.hr, 1) ? ", pero el intervalo incluye el 1: podría no haber diferencia" : ""}.`;

  // ---------- Metaanálisis ----------
  // datos: dic (eventos y totales) · hr (HR e IC de cada estudio) · cont (n, media y DE de cada grupo)
  // medida: dic → or | rr | dr ; cont → dm | hedges | cohen | glass ; hr → hr.  metodo (dic): mh | iv | peto
  const MEDIDAS_META = {
    or: { nom: "Odds ratio", log: true, datos: "dic" }, rr: { nom: "Riesgo relativo", log: true, datos: "dic" }, dr: { nom: "Diferencia de riesgos", log: false, datos: "dic" },
    hr: { nom: "Hazard ratio", log: true, datos: "hr" },
    dm: { nom: "Diferencia de medias", log: false, datos: "cont" }, hedges: { nom: "Diferencia estandarizada (g de Hedges)", log: false, datos: "cont" },
    cohen: { nom: "Diferencia estandarizada (d de Cohen)", log: false, datos: "cont" }, glass: { nom: "Diferencia estandarizada (Δ de Glass)", log: false, datos: "cont" }
  };
  const METODOS_META = { mh: "Mantel-Haenszel", iv: "Inverso de la varianza", peto: "Peto" };
  // Intervalo de I² (Higgins y Thompson 2002, como los Excel, pero con la condición Q > k bien puesta)
  function i2Intervalo(Q, k) {
    const gl = k - 1; if (gl < 1 || !(Q > 0)) return { i2: 0, inf: 0, sup: 0, H: NaN };
    const H = Math.sqrt(Q / gl);
    const se = Q > k ? 0.5 * (Math.log(Q) - Math.log(gl)) / (Math.sqrt(2 * Q) - Math.sqrt(2 * k - 3)) : (k > 2 ? Math.sqrt((1 / (2 * (k - 2))) * (1 - 1 / (3 * Math.pow(k - 2, 2)))) : NaN);
    const i2 = h => Math.max(0, (h * h - 1) / (h * h));
    return { i2: Math.max(0, (Q - gl) / Q), inf: ok(se) ? i2(Math.exp(Math.log(H) - Z * se)) : NaN, sup: ok(se) ? i2(Math.exp(Math.log(H) + Z * se)) : NaN, H, seLnH: se };
  }
  // Egger: regresión de z = θ/ee sobre la precisión 1/ee; el intercepto mide la asimetría del embudo
  function egger(th, se) {
    const k = th.length; if (k < 3) return null;
    const x = se.map(s => 1 / s), y = th.map((t, i) => t / se[i]);
    const mx = x.reduce((a, b) => a + b, 0) / k, my = y.reduce((a, b) => a + b, 0) / k;
    const sxx = x.reduce((a, xi) => a + (xi - mx) * (xi - mx), 0), sxy = x.reduce((a, xi, i) => a + (xi - mx) * (y[i] - my), 0);
    const b1 = sxy / sxx, b0 = my - b1 * mx, ssr = y.reduce((a, yi, i) => a + Math.pow(yi - b0 - b1 * x[i], 2), 0);
    const s2 = ssr / (k - 2), eeB0 = Math.sqrt(s2 * (1 / k + mx * mx / sxx)), t = b0 / eeB0, gl = k - 2, tc = tInv2(0.1, gl);
    return { b0, b1, eeB0, t, p: tSup2(Math.abs(t), gl), inf90: b0 - tc * eeB0, sup90: b0 + tc * eeB0, gl };
  }
  function metaanalisis(e) {
    const r = { ok: false, errores: [] }, medida = MEDIDAS_META[e.medida] ? e.medida : "or", M = MEDIDAS_META[medida], datos = M.datos;
    const metodo = datos === "dic" ? (medida === "or" ? (METODOS_META[e.metodo] ? e.metodo : "mh") : (e.metodo === "iv" ? "iv" : "mh")) : "iv";
    const E = [];
    (e.estudios || []).forEach((s, i) => {
      const n = k => num(s[k]), nombre = s.nombre || `Estudio ${i + 1}`;
      if (datos === "dic") {
        let a = entero(s.ee), n1 = entero(s.ne), c = entero(s.ec), n2 = entero(s.nc);
        if (![a, n1, c, n2].every(ok) || !n1 || !n2 || a > n1 || c > n2) return;
        let b = n1 - a, d = n2 - c, cero = false;
        const N = n1 + n2, o = { nombre, a, b, c, d, n1, n2, N };
        // Corrección de 0,5 en ese estudio si una celda es 0 (no para la diferencia de riesgos ni para Peto)
        if (medida !== "dr" && metodo !== "peto" && [a, b, c, d].includes(0)) { cero = true; a += 0.5; b += 0.5; c += 0.5; d += 0.5; }
        const m1 = a + b, m2 = c + d;
        if (metodo === "peto") { const Ex = n1 * (o.a + o.c) / N, V = n1 * n2 * (o.a + o.c) * (o.b + o.d) / (N * N * (N - 1)); if (!(V > 0)) return; Object.assign(o, { th: (o.a - Ex) / V, v: 1 / V, peto: { oe: o.a - Ex, V } }); }
        else if (medida === "or") { if (!(a > 0 && b > 0 && c > 0 && d > 0)) return; Object.assign(o, { th: Math.log(a * d / (b * c)), v: 1 / a + 1 / b + 1 / c + 1 / d }); }
        else if (medida === "rr") { if (!(a > 0 && c > 0)) return; Object.assign(o, { th: Math.log((a / m1) / (c / m2)), v: 1 / a - 1 / m1 + 1 / c - 1 / m2 }); }
        else { const v = a * b / Math.pow(n1, 3) + c * d / Math.pow(n2, 3); if (!(v > 0)) return; Object.assign(o, { th: a / n1 - c / n2, v }); }
        o.cero = cero; E.push(o);
      } else if (datos === "hr") {
        // Con el HR y su IC, o con el HR y la varianza de su logaritmo (como MetaSurv)
        const hr = n("hr"), li = n("li"), ls = n("ls"), v0 = n("v");
        if (hr > 0 && v0 > 0) E.push({ nombre, th: Math.log(hr), v: v0 });
        else if (hr > 0 && li > 0 && ls > li) E.push({ nombre, th: Math.log(hr), v: Math.pow((Math.log(ls) - Math.log(li)) / (2 * Z), 2) });
      } else {
        const n1 = n("n1"), m1 = n("m1"), s1 = n("d1"), n2 = n("n2"), m2 = n("m2"), s2 = n("d2");
        if (![n1, m1, s1, n2, m2, s2].every(ok) || !(n1 > 1 && n2 > 1 && s1 > 0 && s2 > 0)) return;
        const sp = Math.sqrt(((n1 - 1) * s1 * s1 + (n2 - 1) * s2 * s2) / (n1 + n2 - 2)), base = (n1 + n2) / (n1 * n2);
        let th, v;
        if (medida === "dm") { th = m1 - m2; v = s1 * s1 / n1 + s2 * s2 / n2; }
        else if (medida === "hedges") { th = (m1 - m2) / sp * (1 - 3 / (4 * (n1 + n2) - 9)); v = base + th * th / (2 * (n1 + n2 - 3.94)); }
        else if (medida === "cohen") { th = (m1 - m2) / sp; v = base + th * th / (2 * (n1 + n2 - 2)); }
        else { th = (m1 - m2) / s2; v = base + th * th / (2 * (n2 - 1)); }
        E.push({ nombre, th, v });
      }
    });
    if (E.length < 2) { r.errores.push("Hacen falta al menos dos estudios completos."); return r; }
    const k = E.length, sum = f => E.reduce((s, x) => s + f(x), 0), w = x => 1 / x.v;
    // Efectos fijos según el método
    let fTh, fSe;
    if (metodo === "peto") { const SV = sum(x => x.peto.V); fTh = sum(x => x.peto.oe) / SV; fSe = 1 / Math.sqrt(SV); }
    else if (metodo === "mh" && medida === "or") {
      const R = x => x.a * x.d / x.N, S = x => x.b * x.c / x.N, P = x => (x.a + x.d) / x.N, Qq = x => (x.b + x.c) / x.N, SR = sum(R), SS = sum(S);
      fTh = Math.log(SR / SS); fSe = Math.sqrt((sum(x => P(x) * R(x)) / (SR * SR) + sum(x => P(x) * S(x) + Qq(x) * R(x)) / (SR * SS) + sum(x => Qq(x) * S(x)) / (SS * SS)) / 2);
    } else if (metodo === "mh" && medida === "rr") {
      const R = x => x.a * x.n2 / x.N, S = x => x.c * x.n1 / x.N, P = x => (x.n1 * x.n2 * (x.a + x.c) - x.a * x.c * x.N) / (x.N * x.N);
      fTh = Math.log(sum(R) / sum(S)); fSe = Math.sqrt(sum(P) / (sum(R) * sum(S)));
    } else if (metodo === "mh" && medida === "dr") {
      const W = x => x.n1 * x.n2 / x.N, P = x => (x.a * x.b * Math.pow(x.n2, 3) + x.c * x.d * Math.pow(x.n1, 3)) / (x.n1 * x.n2 * x.N * x.N), SW = sum(W);
      fTh = sum(x => x.th * W(x)) / SW; fSe = Math.sqrt(sum(P) / (SW * SW));
    } else { fTh = sum(x => w(x) * x.th) / sum(w); fSe = 1 / Math.sqrt(sum(w)); }
    // Heterogeneidad (Peto: con sus pesos V; el resto, inverso de la varianza alrededor del efecto fijo)
    const Q = metodo === "peto" ? sum(x => x.peto.V * (x.th * x.th - fTh * fTh)) : sum(x => w(x) * Math.pow(x.th - fTh, 2)), gl = k - 1;
    const SW = sum(w), SW2 = sum(x => w(x) * w(x)), tau2 = Math.max(0, (Q - gl) / (SW - SW2 / SW));
    const wr = x => 1 / (x.v + tau2), rTh = sum(x => wr(x) * x.th) / sum(wr), rSe = 1 / Math.sqrt(sum(wr));
    const nat = M.log ? Math.exp : (x => x), iv = (t, s) => ({ v: nat(t), inf: nat(t - Z * s), sup: nat(t + Z * s), z: Math.abs(t / s), p: pNormal2(t / s), th: t, se: s });
    const pesoF = metodo === "peto" ? (x => x.peto.V / sum(y => y.peto.V)) : metodo === "mh" && medida === "or" ? (x => (x.b * x.c / x.N) / sum(y => y.b * y.c / y.N)) : metodo === "mh" && medida === "rr" ? (x => (x.c * x.n1 / x.N) / sum(y => y.c * y.n1 / y.N)) : metodo === "mh" && medida === "dr" ? (x => (x.n1 * x.n2 / x.N) / sum(y => y.n1 * y.n2 / y.N)) : (x => w(x) / SW);
    const ic2 = i2Intervalo(Q, k);
    Object.assign(r, {
      ok: true, k, medida, metodo, datos, log: M.log, nula: M.log ? 1 : 0,
      estudios: E.map(x => Object.assign({ nombre: x.nombre, cero: !!x.cero, peso: pesoF(x), pesoAl: wr(x) / sum(wr) }, iv(x.th, Math.sqrt(x.v)))),
      fijo: iv(fTh, fSe), aleatorio: iv(rTh, rSe), q: Q, gl, pQ: chi2Sup(Q, gl), tau2, i2: ic2.i2, i2Inf: ic2.inf, i2Sup: ic2.sup,
      egger: egger(E.map(x => x.th), E.map(x => Math.sqrt(x.v)))
    });
    return r;
  }
  function textoMeta(r) {
    if (!r || !r.ok) return "";
    const M = MEDIDAS_META[r.medida], A = r.aleatorio, F = r.fijo, f = M.log || r.medida === "dr" ? (x => fmt(x)) : (x => fmt(x, 2));
    let t = `${r.k} estudios. Efecto combinado (${M.nom.charAt(0).toLowerCase() + M.nom.slice(1)}): ${f(A.v)} (IC 95 %: ${f(A.inf)} a ${f(A.sup)}) con efectos aleatorios; ${f(F.v)} (${f(F.inf)} a ${f(F.sup)}) con efectos fijos. `;
    t += `Heterogeneidad: I² ${pct(r.i2, 0)}${ok(r.i2Inf) ? ` (IC 95 %: ${pct(r.i2Inf, 0)} a ${pct(r.i2Sup, 0)})` : ""}, Q ${fmt(r.q, 1)} con ${r.gl} gl (p ${r.pQ < 0.001 ? "< 0,001" : "= " + fmt(r.pQ, 3)}).`;
    if (r.egger) t += ` Egger: p = ${fmt(r.egger.p, 2)}.`;
    return t;
  }
  function trampasMeta(r) {
    const a = []; if (!r || !r.ok) return a;
    const A = r.aleatorio, nula = r.nula;
    if (A.inf <= nula && nula <= A.sup) a.push({ nivel: "aviso", texto: "El intervalo del efecto combinado incluye el «sin efecto»: el resultado es compatible con que no haya efecto." });
    if (r.i2 > 0.5) a.push({ nivel: "aviso", texto: `Heterogeneidad alta (I² ${pct(r.i2, 0)}): los estudios no dicen lo mismo. ¿Tenía sentido combinarlos? Busca por qué difieren (pacientes, dosis, calidad).` });
    if (r.k < 5) a.push({ nivel: "nota", texto: "Con menos de 5 estudios, la heterogeneidad y el sesgo de publicación se estiman muy mal." });
    else if (r.egger && r.egger.p < 0.1) a.push({ nivel: "aviso", texto: `La prueba de Egger sugiere asimetría en el embudo (p = ${fmt(r.egger.p, 2)}): puede haber sesgo de publicación (faltan estudios pequeños sin efecto).` });
    if (r.estudios.some(x => x.cero)) a.push({ nivel: "nota", texto: "Algún estudio tiene una casilla con 0: se le suma 0,5 a sus cuatro casillas." });
    return a;
  }

  // ---------- Umbrales de decisión (Pauker y Kassirer; como la hoja «Tabla 2x2» del Excel) ----------
  // dano: riesgo de tratar a quien no tiene la enfermedad · rprueba: riesgo de la prueba · beneficio: beneficio de tratar a quien la tiene
  function umbrales(e) {
    const S = prob(e.s), Es = prob(e.e), R = prob(e.dano), Rt = prob(e.rprueba), B = prob(e.beneficio), pre = prob(e.pre), r = { ok: false, errores: [] };
    if (![S, Es, R, Rt, B].every(x => ok(x) && x >= 0) || !(S > 0 && S <= 1 && Es > 0 && Es <= 1) || !(B > 0)) { r.errores.push("Escribe la sensibilidad, la especificidad y los tres riesgos y beneficios, en %."); return r; }
    const dx = ((1 - Es) * R + Rt) / ((1 - Es) * R + S * B), tx = (Es * R - Rt) / (Es * R + (1 - S) * B);
    const decision = !(pre >= 0 && pre <= 1) ? "" : pre < dx ? "noprueba" : pre > tx ? "tratar" : "prueba";
    return { ok: true, dx, tx, pre, decision, util: dx < tx };
  }
  const DECISION_UMBRAL = { noprueba: "No hacer la prueba y no tratar: la probabilidad está por debajo del umbral diagnóstico.", prueba: "Hacer la prueba y tratar o no según su resultado.", tratar: "Tratar sin hacer la prueba: la probabilidad ya supera el umbral terapéutico." };

  // ---------- Concordancia: índice kappa (como la hoja «Kappa» del Excel) ----------
  // m: tabla k × k (observador 1 en filas, observador 2 en columnas). Ponderación lineal 1 − |i − j| / (k − 1)
  function kappa(m) {
    const r = { ok: false, errores: [] }, T = (m || []).map(f => (f || []).map(x => entero(x)));
    const k = T.length;
    if (k < 2 || T.some(f => f.length !== k || f.some(x => !ok(x)))) { r.errores.push("Completa la tabla con números enteros."); return r; }
    const N = T.reduce((s, f) => s + f.reduce((a, b) => a + b, 0), 0); if (!N) { r.errores.push("La tabla está vacía."); return r; }
    const fi = T.map(f => f.reduce((a, b) => a + b, 0)), co = T[0].map((_, j) => T.reduce((s, f) => s + f[j], 0));
    const po = T.reduce((s, f, i) => s + f[i], 0) / N, pe = fi.reduce((s, x, i) => s + x * co[i], 0) / (N * N), kp = (po - pe) / (1 - pe);
    const se = Math.sqrt(po * (1 - po) / (N * Math.pow(1 - pe, 2)));
    const W = (i, j) => 1 - Math.abs(i - j) / (k - 1);
    let poW = 0, peW = 0; T.forEach((f, i) => f.forEach((x, j) => { poW += W(i, j) * x / N; peW += W(i, j) * fi[i] * co[j] / (N * N); }));
    return { ok: true, k, n: N, po, pe, kappa: { v: kp, inf: kp - Z * se, sup: kp + Z * se }, poW, peW, kappaW: (poW - peW) / (1 - peW) };
  }
  // Landis y Koch
  const kappaFuerza = v => !ok(v) ? "" : v < 0 ? "peor que el azar" : v <= 0.2 ? "insignificante" : v <= 0.4 ? "débil" : v <= 0.6 ? "moderada" : v <= 0.8 ? "buena" : "muy buena";

  // ---------- Qué calcula cada calculadora ----------
  // Desde la app: los campos «en %» se convierten antes (las funciones aceptan también proporciones, para los tests)
  function calcular(tipo, e0) {
    const e = Object.assign({}, e0);
    CAMPOS_PORC.forEach(k => { if (e[k] != null && String(e[k]).trim() !== "") e[k] = porc(e[k]); });
    if (tipo === "tratamiento") return tratamiento(e);
    if (tipo === "or") return oddsRatio(e);
    if (tipo === "diagnostico") return diagnostico(e);
    if (tipo === "niveles") return niveles(e.niveles, e.pre);
    if (tipo === "bayes") return desdeSE(e);
    if (tipo === "cei") return cei(e);
    if (tipo === "supervivencia") return supervivencia(e);
    if (tipo === "metaanalisis") return metaanalisis(e);
    if (tipo === "umbrales") return umbrales(e);
    if (tipo === "kappa") return kappa(e.matriz);
    return { ok: false, errores: [] };
  }
  const CALCS = {
    tratamiento: { nom: "Tratamiento", titulo: "Riesgos, RR, RAR y NNT", que: "Ensayos clínicos y cohortes: cuánto reduce (o aumenta) el riesgo una intervención y a cuántos hay que tratar.", campos: ["nc", "pc", "ec", "ne", "pe", "ee", "peer", "f"] },
    diagnostico: { nom: "Diagnóstico", titulo: "Sensibilidad, especificidad, LR y probabilidad tras la prueba", que: "Estudios de diagnóstico y reglas de predicción: la tabla 2 × 2, los cocientes de probabilidad y el nomograma de Fagan.", campos: ["a", "b", "c", "d", "pre", "umbral"] },
    niveles: { nom: "Varios niveles", titulo: "Pruebas con varios niveles", que: "Cuando la prueba no da solo positivo o negativo (una escala, varios puntos de corte): un cociente de probabilidad para cada nivel.", campos: ["pre"] },
    bayes: { nom: "Desde S y E", titulo: "Probabilidad tras la prueba desde la sensibilidad y la especificidad", que: "Cuando el artículo solo da la sensibilidad y la especificidad, con tu probabilidad previa y el nomograma de Fagan.", campos: ["s", "e", "pre", "umbral"] },
    or: { nom: "Odds ratio", titulo: "Odds ratio de casos y controles", que: "Estudios de casos y controles: la fuerza de la asociación entre la exposición y el desenlace.", campos: ["a", "b", "c", "d"] },
    supervivencia: { nom: "Supervivencia", titulo: "Hazard ratio de un estudio", que: "Curvas de supervivencia: el hazard ratio y su intervalo, también cuando el artículo solo da la p del log-rank, las medianas o los eventos.", campos: [] },
    metaanalisis: { nom: "Metaanálisis", titulo: "Metaanálisis y diagrama de bosque", que: "Revisiones sistemáticas: combina los estudios (efectos fijos y aleatorios), mide la heterogeneidad (I²) y busca sesgo de publicación (embudo y Egger).", campos: [] },
    umbrales: { nom: "Umbrales", titulo: "Umbrales de decisión: ¿hacer la prueba, tratar o nada?", que: "Con los riesgos y beneficios del tratamiento y de la prueba, la probabilidad por debajo de la cual no merece la pena la prueba y por encima de la cual se trata sin hacerla.", campos: [] },
    kappa: { nom: "Kappa", titulo: "Concordancia entre observadores (kappa)", que: "¿Coinciden dos personas (o dos pruebas) más de lo esperable por azar? Índice kappa, simple y ponderado.", campos: [] },
    cei: { nom: "Coste-efectividad", titulo: "Razón de coste-efectividad incremental", que: "Evaluaciones económicas: cuánto cuesta cada unidad de efecto que se gana con la alternativa nueva.", campos: ["cn", "ch", "en", "eh", "unidad"] }
  };
  // Calculadora que corresponde a la «calc» de una pregunta de plantilla («fagan» usa la de diagnóstico; el metaanálisis es de la fase 2)
  // Calculadora principal que corresponde a la «calc» de una pregunta de plantilla («fagan» usa la de diagnóstico) y las que se pueden añadir
  const CALC_DE_PREGUNTA = { tratamiento: "tratamiento", diagnostico: "diagnostico", fagan: "diagnostico", or: "or", cei: "cei", metaanalisis: "metaanalisis" };
  const CALCS_DE_PREGUNTA = { tratamiento: ["tratamiento", "supervivencia"], diagnostico: ["diagnostico", "niveles"], fagan: ["diagnostico"], or: ["or"], cei: ["cei"], metaanalisis: ["metaanalisis"] };

  function lleno(v) { return v != null && String(v).trim() !== ""; }

  const API = {
    Z, num, prob, porc, entero, fmt, pct, icTxt, redondearExcel, wilson, wald, icLog, incluye,
    tratamiento, nntDe, nntTxt, nntIcTxt, sensibilidadPerdidas, SUPUESTOS, supuesto, nntPaciente, nntConF,
    oddsRatio, bayes, diagnostico, posterior, desdeSE, niveles, lrFuerza, LR_FUERZA_TXT,
    logit, P_TICKS, LR_TICKS, faganGeo, cei, CUADRANTES,
    textoTratamiento, textoDiagnostico, textoOR, textoCEI,
    trampasTratamiento, trampasDiagnostico, trampasOR, semaforoCalculo,
    lnGamma, gammaQ, pNormal2, chi2Sup, normInv, betaInc, tSup2, tInv2,
    MODOS_SUPERV, supervivencia, textoSupervivencia, MEDIDAS_META, METODOS_META, i2Intervalo, egger, metaanalisis, textoMeta, trampasMeta,
    umbrales, DECISION_UMBRAL, kappa, kappaFuerza,
    calcular, CALCS, CALC_DE_PREGUNTA, CALCS_DE_PREGUNTA
  };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else raiz.Calculos = API;
})(typeof window !== "undefined" ? window : this);
