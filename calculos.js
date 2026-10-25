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
    if (tipo === "diagnostico") {
      const fp = !incluye(r.lrp, 1) ? lrFuerza(r.lrp.v) : "casi nulo", fn = !incluye(r.lrn, 1) ? lrFuerza(r.lrn.v) : "casi nulo";
      if ([fp, fn].some(f => f === "grande" || f === "moderado")) return { color: "verde", motivo: `Cocientes de probabilidad útiles: LR+ ${fmt(r.lrp.v)}, LR− ${fmt(r.lrn.v)}.` };
      if ([fp, fn].includes("pequeño")) return { color: "ambar", motivo: `Cocientes de probabilidad modestos: LR+ ${fmt(r.lrp.v)}, LR− ${fmt(r.lrn.v)}.` };
      return { color: "rojo", motivo: "Los cocientes de probabilidad no se distinguen de 1: la prueba apenas informa." };
    }
    return null;
  }

  // ---------- Qué calcula cada calculadora ----------
  function calcular(tipo, e) {
    if (tipo === "tratamiento") return tratamiento(e);
    if (tipo === "or") return oddsRatio(e);
    if (tipo === "diagnostico") return diagnostico(e);
    if (tipo === "niveles") return niveles(e.niveles, e.pre);
    if (tipo === "bayes") return desdeSE(e);
    if (tipo === "cei") return cei(e);
    return { ok: false, errores: [] };
  }
  const CALCS = {
    tratamiento: { nom: "Tratamiento", titulo: "Riesgos, RR, RAR y NNT", que: "Ensayos clínicos y cohortes: cuánto reduce (o aumenta) el riesgo una intervención y a cuántos hay que tratar.", campos: ["nc", "pc", "ec", "ne", "pe", "ee", "peer", "f"] },
    diagnostico: { nom: "Diagnóstico", titulo: "Sensibilidad, especificidad, LR y probabilidad tras la prueba", que: "Estudios de diagnóstico y reglas de predicción: la tabla 2 × 2, los cocientes de probabilidad y el nomograma de Fagan.", campos: ["a", "b", "c", "d", "pre", "umbral"] },
    niveles: { nom: "Varios niveles", titulo: "Pruebas con varios niveles", que: "Cuando la prueba no da solo positivo o negativo (una escala, varios puntos de corte): un cociente de probabilidad para cada nivel.", campos: ["pre"] },
    bayes: { nom: "Desde S y E", titulo: "Probabilidad tras la prueba desde la sensibilidad y la especificidad", que: "Cuando el artículo solo da la sensibilidad y la especificidad, con tu probabilidad previa y el nomograma de Fagan.", campos: ["s", "e", "pre", "umbral"] },
    or: { nom: "Odds ratio", titulo: "Odds ratio de casos y controles", que: "Estudios de casos y controles: la fuerza de la asociación entre la exposición y el desenlace.", campos: ["a", "b", "c", "d"] },
    cei: { nom: "Coste-efectividad", titulo: "Razón de coste-efectividad incremental", que: "Evaluaciones económicas: cuánto cuesta cada unidad de efecto que se gana con la alternativa nueva.", campos: ["cn", "ch", "en", "eh", "unidad"] }
  };
  // Calculadora que corresponde a la «calc» de una pregunta de plantilla («fagan» usa la de diagnóstico; el metaanálisis es de la fase 2)
  const CALC_DE_PREGUNTA = { tratamiento: "tratamiento", diagnostico: "diagnostico", fagan: "diagnostico", or: "or", cei: "cei" };

  function lleno(v) { return v != null && String(v).trim() !== ""; }

  const API = {
    Z, num, prob, entero, fmt, pct, icTxt, redondearExcel, wilson, wald, icLog, incluye,
    tratamiento, nntDe, nntTxt, nntIcTxt, sensibilidadPerdidas, SUPUESTOS, supuesto, nntPaciente, nntConF,
    oddsRatio, bayes, diagnostico, posterior, desdeSE, niveles, lrFuerza, LR_FUERZA_TXT,
    logit, P_TICKS, LR_TICKS, faganGeo, cei, CUADRANTES,
    textoTratamiento, textoDiagnostico, textoOR, textoCEI,
    trampasTratamiento, trampasDiagnostico, trampasOR, semaforoCalculo,
    calcular, CALCS, CALC_DE_PREGUNTA
  };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else raiz.Calculos = API;
})(typeof window !== "undefined" ? window : this);
