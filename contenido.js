// ============================================================
//  contenido.js — Solo datos · Lectura Crítica
//  Aprende (temas), Ponte a prueba (test propio y ejercicios), glosario y
//  ejemplos: la sesión de Urgencias del capítulo 26 de la Guía y los minicasos.
//  Todo es contenido propio de los autores; los artículos de los ejemplos son
//  FICTICIOS (la escala «EAT» no existe) y así se dice en pantalla.
//  window.Contenido en navegador y module.exports en Node (tests).
// ============================================================
(function (raiz) {
  "use strict";

  // ---------- Aprende ----------
  // c = color del tema (P azul, H verde, V naranja, A violeta: solo como color)
  const TEMAS = [
    { n: 1, c: "P", titulo: "Leer un artículo en diez minutos", sub: "Pregunta, filtro, tres preguntas y decisión",
      minuto: ["Antes de buscar, escribe tu pregunta en formato <b>PICO</b>: pacientes, intervención, comparación y resultado.", "Filtra en dos minutos con el título y el resumen: si no responde a tu pregunta, déjalo.", "Lee con método: <b>¿es válido?, ¿qué dice?, ¿me sirve?</b> Si la primera falla, no sigas.", "Termina con una decisión: <b>aplicar, esperar o descartar</b>, y anótala con la referencia."],
      secciones: [
        { t: "Por qué hace falta un método", h: "<p>Cada día se publican decenas de ensayos clínicos y de revisiones sistemáticas. Nadie puede leerlo todo, pero sí se puede aprender a <b>elegir</b> qué leer y a <b>leer con método</b>, para no dejarse convencer por un buen titular ni descartar un buen estudio por no entenderlo.</p>" },
        { t: "La pregunta PICO", h: "<ul><li><b>P</b>acientes: ¿a quién se refiere? (pacientes que esperan en Urgencias).</li><li><b>I</b>ntervención: ¿qué se hace? (reevaluar a los 90 minutos con un aviso).</li><li><b>C</b>omparación: ¿frente a qué? (la reevaluación a demanda). A veces no hay.</li><li>Resultado, <b>O</b> de <i>outcome</i>: ¿qué se mide? (los empeoramientos no detectados).</li></ul><p>Con la pregunta escrita, decidir si un artículo te sirve es mucho más rápido.</p>" },
        { t: "Las tres preguntas, en orden", h: "<ol><li><b>¿Son válidos los resultados?</b> ¿Se pueden creer? Las primeras preguntas de cada plantilla son <b>de eliminación</b>: si alguna falla, no merece la pena seguir.</li><li><b>¿Cuáles son los resultados?</b> ¿Cuánto efecto y con qué precisión?</li><li><b>¿Me sirven?</b> ¿Se parecen mis pacientes? ¿Están todos los resultados importantes? ¿Compensa?</li></ol>" },
        { t: "Decidir", h: "<ul><li><b>Aplicar</b>: es válido, el efecto importa y tus pacientes se parecen a los del estudio.</li><li><b>Esperar</b>: es prometedor pero tiene dudas importantes; busca más estudios o una revisión sistemática.</li><li><b>Descartar</b>: no es válido o no se aplica a tu contexto.</li></ul>" }
      ],
      minicaso: "<p>Una enfermera de Atención Primaria lee un ensayo sobre llamadas de seguimiento tras el alta. La primera pregunta la frena: los pacientes del ensayo eran menores de 65 años y con una sola enfermedad; los suyos, mayores y pluripatológicos. Decide <b>esperar</b> y buscar una revisión sistemática.</p>",
      practica: { href: "#/lecturas/nueva", texto: "Leer un artículo" } },
    { n: 2, c: "P", titulo: "Tipos de estudio", sub: "Qué pregunta responde cada diseño",
      minuto: ["Si los investigadores <b>asignan</b> la intervención, el estudio es experimental; si solo <b>observan</b>, es observacional.", "Para saber si un tratamiento funciona, lo mejor es el <b>ensayo clínico aleatorizado</b>, y mejor aún una <b>revisión sistemática</b> de varios.", "Para causas y pronóstico, las <b>cohortes</b>; para desenlaces raros, los <b>casos y controles</b>.", "Para entender vivencias y por qué algo funciona o no, los estudios <b>cualitativos</b>."],
      secciones: [
        { t: "Cada pregunta, su diseño", h: "<ul><li>¿Funciona un tratamiento? → ensayo clínico (y revisión sistemática de ensayos).</li><li>¿Qué causa una enfermedad o un evento adverso? → cohortes o casos y controles.</li><li>¿Qué pronóstico tiene? → cohortes.</li><li>¿Cómo de buena es una prueba? → estudio de diagnóstico.</li><li>¿Qué riesgo tiene este paciente? → regla de predicción clínica.</li><li>¿Por qué no se usa algo, qué viven los pacientes? → cualitativo.</li><li>¿Merece la pena lo que cuesta? → evaluación económica.</li><li>¿Mejoró algo tras un cambio en mi unidad? → estudio antes-después o serie temporal.</li></ul>" },
        { t: "La pirámide y sus límites", h: "<p>Suele dibujarse una pirámide con las revisiones sistemáticas arriba y las opiniones de expertos abajo. Es útil para preguntas de tratamiento, pero <b>un diseño alto mal hecho vale menos que uno más bajo bien hecho</b>, y para otras preguntas (vivencias, causas raras) el mejor diseño es otro.</p>" },
        { t: "Cómo reconocerlo", h: "<p>Fíjate en cómo se hizo, no en cómo se llama: «prospectivo» o «comparativo» no dicen el diseño. Pregúntate: ¿quién decidió qué recibía cada participante?, ¿se repartió al azar?, ¿se parte de la exposición o del desenlace? El árbol «¿Qué tipo de estudio tengo?» te lleva paso a paso.</p>" }
      ],
      minicaso: "<p>Un artículo compara la tasa de caídas de una planta antes y después de un programa de rondas horarias. No hay reparto al azar ni grupo control: es un <b>estudio antes-después</b>. Puede ser útil, pero otras cosas que cambiaron a la vez podrían explicar la mejora.</p>",
      practica: { href: "#/tipo", texto: "¿Qué tipo de estudio tengo?" } },
    { n: 3, c: "H", titulo: "Sesgos: por qué un estudio engaña", sub: "Selección, realización, detección, pérdidas, comunicación y confusión",
      minuto: ["Un <b>sesgo</b> es un error sistemático: empuja los resultados siempre hacia el mismo lado, y más pacientes no lo arreglan.", "El reparto al azar <b>y oculto</b> evita que los grupos sean distintos desde el principio.", "El <b>cegamiento</b> evita que saber qué recibe cada uno cambie cómo se trata y cómo se mide.", "Las <b>pérdidas</b> y los resultados que no se cuentan pueden darle la vuelta a la conclusión.", "En los estudios observacionales, el gran enemigo es la <b>confusión</b>."],
      secciones: [
        { t: "Los sesgos más habituales", h: "<ul><li><b>De selección</b>: los grupos no son comparables desde el principio (por ejemplo, se elige a quién tratar).</li><li><b>De realización</b>: un grupo recibe más atención u otros tratamientos.</li><li><b>De detección</b>: se mide distinto en un grupo que en otro, a menudo porque quien mide sabe a qué grupo pertenece cada uno.</li><li><b>De desgaste</b>: se pierden más pacientes, o pacientes distintos, en un grupo.</li><li><b>De comunicación</b>: se publican solo los resultados favorables (compara con el registro del ensayo).</li></ul>" },
        { t: "Confusión", h: "<p>Un <b>factor de confusión</b> va unido a la exposición y, por sí solo, cambia el resultado. Ejemplo clásico: el café parecía causar infartos porque los que tomaban más café fumaban más. Los estudios observacionales lo intentan corregir midiendo los confusores y ajustando, pero solo pueden ajustar lo que miden.</p>" },
        { t: "«No se puede saber» también informa", h: "<p>Si el artículo no explica cómo repartió, si cegó o cuántos perdió, contesta «No se puede saber». Muchos «no se sabe» son una mala señal: un buen estudio cuenta lo que hizo.</p>" }
      ],
      minicaso: "<p>En un ensayo de un nuevo apósito, la enfermera que valora la herida sabe qué apósito lleva cada paciente. La valoración de la cicatrización es subjetiva: riesgo de <b>sesgo de detección</b>. Habría sido mejor fotografiar las heridas y que las valorara alguien que no supiera el grupo.</p>",
      practica: { href: "#/plantillas/ensayo", texto: "Ver la plantilla del ensayo" } },
    { n: 4, c: "V", titulo: "Medidas de efecto", sub: "RR, RRR, RAR, NNT, OR y HR",
      minuto: ["<b>Riesgo relativo (RR)</b>: el riesgo con la intervención dividido entre el riesgo sin ella.", "<b>Reducción relativa (RRR)</b> = 1 − RR: suena muy bien aunque el riesgo de partida sea pequeño.", "<b>Reducción absoluta (RAR)</b>: la resta de los riesgos; es lo que ganan de verdad tus pacientes.", "<b>NNT</b> = 1 / RAR: a cuántos hay que tratar para evitar un evento.", "La <b>OR</b> se parece al RR solo si el evento es raro; el <b>HR</b> compara riesgos a lo largo del tiempo."],
      secciones: [
        { t: "Un ejemplo con números", h: "<p>Sin tratamiento enferman 20 de cada 100; con tratamiento, 10 de cada 100.</p><ul><li>RR = 10 % / 20 % = 0,5.</li><li>RRR = 1 − 0,5 = 50 %.</li><li>RAR = 20 % − 10 % = 10 %.</li><li>NNT = 1 / 0,10 = 10: hay que tratar a 10 para evitar un caso.</li></ul><p>Si el riesgo de partida fuera 2 de cada 100 y bajara a 1, la RRR seguiría siendo del 50 %, pero la RAR sería del 1 % y el NNT, 100.</p>" },
        { t: "NNT para beneficiar y para dañar", h: "<p>Si la intervención aumenta el riesgo, se habla de <b>NNT para dañar</b> (NNTD): por cada NNTD pacientes tratados, uno más sufre el evento. Si el intervalo de la RAR incluye el 0, el del NNT pasa por el infinito: «NNTB 12 a ∞ a NNTD 40».</p>" },
        { t: "Odds ratio y hazard ratio", h: "<p>La <b>odds ratio</b> compara odds (casos frente a no casos) y es la medida de los estudios de casos y controles y de la regresión logística. Cuando el evento es frecuente, exagera el efecto respecto al RR. El <b>hazard ratio</b> compara la velocidad a la que ocurren los eventos a lo largo del seguimiento (curvas de supervivencia).</p>" }
      ],
      minicaso: "<p>Un titular: «El fármaco X reduce los ictus a la mitad». En el ensayo, los ictus pasaron del 2 % al 1 % en cinco años: RRR 50 %, RAR 1 %, NNT 100. Para decidir, el NNT dice mucho más que el titular.</p>",
      practica: { href: "#/calc/tratamiento", texto: "Abrir la calculadora de tratamiento" } },
    { n: 5, c: "V", titulo: "Precisión: intervalo de confianza y p", sub: "Significativo no es lo mismo que importante",
      minuto: ["El <b>intervalo de confianza del 95 %</b> da los valores del efecto compatibles con los datos.", "Si incluye el «sin efecto» (RR u OR igual a 1, diferencia igual a 0), el resultado es <b>incierto</b>.", "Un intervalo <b>muy ancho</b> dice poco: el estudio suele ser pequeño.", "La <b>p</b> solo dice si el resultado podría deberse al azar; no dice cuánto importa."],
      secciones: [
        { t: "Leer un intervalo", h: "<p>RR 0,70 (IC 95 %: 0,55 a 0,90): el efecto más probable es una reducción del 30 %, y los datos son compatibles con reducciones de entre el 10 % y el 45 %. Si el intervalo fuera de 0,40 a 1,20, el estudio no permitiría descartar que no haya efecto, ni siquiera que perjudique.</p>" },
        { t: "Significativo no es importante", h: "<p>Con miles de pacientes, una diferencia mínima sale «significativa» (p &lt; 0,05). Pregúntate si el efecto, incluido su límite menos favorable, sería suficiente para cambiar lo que haces. Y al revés: un estudio pequeño «no significativo» puede no tener muestra suficiente para ver un efecto que sí existe.</p>" },
        { t: "¿Tenía muestra suficiente?", h: "<p>Si el intervalo es muy ancho o el resultado no es significativo, mira si el estudio calculó el tamaño de la muestra. Con la app hermana <b>Tamaño Muestral</b> puedes ver cuántos pacientes harían falta para detectar la diferencia que te importa.</p>" }
      ],
      minicaso: "<p>Un ensayo de 60 pacientes no encuentra diferencias (p = 0,30), con un RR de 0,60 (IC 95 %: 0,25 a 1,45). No demuestra que la intervención no funcione: es <b>demasiado pequeño</b> para saberlo.</p>",
      practica: { href: "#/calc/tratamiento", texto: "Probarlo en la calculadora" } },
    { n: 6, c: "A", titulo: "Pruebas diagnósticas", sub: "Sensibilidad, especificidad, cocientes de probabilidad y Fagan",
      minuto: ["<b>Sensibilidad</b>: de los enfermos, cuántos dan positivo. <b>Especificidad</b>: de los sanos, cuántos dan negativo.", "Los <b>valores predictivos</b> dependen de la prevalencia: no se trasladan a otro medio.", "Los <b>cocientes de probabilidad (LR)</b> dicen cuánto cambia la probabilidad un resultado.", "Con la probabilidad previa y el LR, el <b>nomograma de Fagan</b> da la probabilidad tras la prueba."],
      secciones: [
        { t: "La tabla 2 × 2", h: "<p>Filas: prueba positiva o negativa. Columnas: con o sin la enfermedad según la prueba de referencia. a = verdaderos positivos, b = falsos positivos, c = falsos negativos, d = verdaderos negativos.</p><div class=\"formula\">S = a/(a+c) · E = d/(b+d) · LR+ = S/(1−E) · LR− = (1−S)/E</div>" },
        { t: "Cómo de útil es un LR", h: "<ul><li>LR+ mayor de 10 o LR− menor de 0,1: cambio grande, a menudo decide.</li><li>5 a 10 o 0,1 a 0,2: cambio moderado.</li><li>2 a 5 o 0,2 a 0,5: cambio pequeño.</li><li>Entre 0,5 y 2: la prueba apenas cambia nada.</li></ul>" },
        { t: "El umbral de acción", h: "<p>Una prueba solo sirve si su resultado puede hacerte cruzar un <b>umbral</b>: por encima tratas, por debajo descartas. Si ya estás muy seguro (o muy poco), una prueba con LR modestos no cambiará lo que haces.</p>" },
        { t: "Trampas", h: "<ul><li><b>Espectro</b>: casi cualquier prueba distingue sanos de muy enfermos; lo difícil son los casos dudosos.</li><li><b>Verificación</b>: si solo se confirma con la prueba de referencia a quien da positivo, la prueba parece mejor de lo que es.</li><li><b>Prevalencia</b>: con buena especificidad, si la enfermedad es rara, la mayoría de los positivos serán falsos.</li></ul>" }
      ],
      minicaso: "<p>Una escala de alerta con sensibilidad del 83 % y especificidad del 88 % (LR+ 7, LR− 0,19). En la sala de espera, con un 15 % de riesgo previo de empeorar, un positivo lo sube al 55 % y un negativo lo baja al 3 %.</p>",
      practica: { href: "#/calc/diagnostico", texto: "Abrir la calculadora de diagnóstico" } },
    { n: 7, c: "A", titulo: "Revisiones sistemáticas y metaanálisis", sub: "Búsqueda, calidad, heterogeneidad y diagrama de bosque",
      minuto: ["Una <b>revisión sistemática</b> busca todos los estudios sobre una pregunta con un método explícito y reproducible.", "El <b>metaanálisis</b> combina sus resultados en una cifra; solo tiene sentido si los estudios se parecen.", "El <b>diagrama de bosque</b> enseña cada estudio y el resultado combinado (el rombo).", "La <b>heterogeneidad</b> (I²) mide cuánto discrepan: por encima del 50 %, mucho."],
      secciones: [
        { t: "Qué mirar", h: "<ul><li>¿La pregunta es clara y los estudios incluidos responden a ella?</li><li>¿La búsqueda fue amplia (varias bases, no publicados, otros idiomas)?</li><li>¿Se valoró la calidad de cada estudio, y se tuvo en cuenta al concluir?</li><li>¿Era razonable combinar? ¿Explican por qué discrepan los estudios?</li></ul>" },
        { t: "El diagrama de bosque", h: "<p>Cada línea es un estudio: el cuadrado es su resultado (más grande cuanto más peso) y la raya, su intervalo. La línea vertical es el «sin efecto». El rombo de abajo es el resultado combinado: su anchura es su intervalo de confianza.</p>" },
        { t: "Basura dentro, basura fuera", h: "<p>Combinar estudios malos da un resultado malo, aunque sea muy preciso. Y si los estudios negativos no se publicaron, el metaanálisis exagerará el efecto (<b>sesgo de publicación</b>).</p>" }
      ],
      minicaso: "<p>Una revisión de escalas de alerta temprana reúne siete estudios, casi todos antes-después, con resultados muy distintos (I² = 68 %). El efecto combinado existe, pero con mucha incertidumbre: lo prudente es <b>esperar</b> o aplicarlo midiendo su efecto en tu unidad.</p>",
      practica: { href: "#/plantillas/revision", texto: "Ver la plantilla de revisión" } },
    { n: 8, c: "H", titulo: "De la evidencia a la decisión", sub: "Aplicabilidad, valores del paciente y GRADE en breve",
      minuto: ["Un estudio válido y con buen efecto puede no servirte: <b>¿se parecen tus pacientes?</b>", "Cuenta todos los resultados que importan, también los <b>daños y los costes</b>.", "<b>GRADE</b> califica la certeza de la evidencia (alta, moderada, baja, muy baja) y la importancia de cada desenlace (1 a 9).", "Las preferencias del paciente y tus recursos también deciden."],
      secciones: [
        { t: "¿Se parecen mis pacientes?", h: "<p>Mira los criterios de inclusión y exclusión, la edad, la gravedad y las otras enfermedades. No hace falta que sean idénticos: pregúntate si hay una razón biológica o de contexto para que el efecto sea muy distinto en los tuyos.</p>" },
        { t: "GRADE en breve", h: "<p>Los desenlaces se puntúan del 1 al 9: 7-9 críticos para decidir, 4-6 importantes, 1-3 poco importantes. La certeza de la evidencia empieza alta en los ensayos y baja en los observacionales, y se rebaja por riesgo de sesgo, inconsistencia, evidencia indirecta, imprecisión y sesgo de publicación.</p>" },
        { t: "Aplicar con cabeza", h: "<p>Si decides aplicar algo, <b>mide su efecto en tu unidad</b>: un ciclo de mejora (planificar, hacer, verificar, actuar) con un indicador te dirá si funciona aquí. Si decides esperar, anota qué vas a buscar.</p>" }
      ],
      minicaso: "<p>El equipo de Urgencias decide aplicar una escala de alerta, pero solo con un responsable por turno (lo que señalaba el estudio cualitativo) y midiendo los empeoramientos no detectados cada mes.</p>",
      practica: { href: "#/ejemplos", texto: "Ver el ejemplo de Urgencias" } },
    { n: 9, c: "P", titulo: "Estudios cualitativos", sub: "Leer lo que no se mide con números",
      minuto: ["Exploran <b>vivencias, opiniones y significados</b>: por qué la gente hace lo que hace.", "Se juzgan por su <b>coherencia</b>: pregunta, método, participantes y recogida de datos deben encajar.", "Busca <b>saturación</b>, citas textuales y reflexión del investigador sobre su papel.", "No buscan generalizar con números, sino ser <b>transferibles</b> a contextos parecidos."],
      secciones: [
        { t: "Qué mirar", h: "<ul><li>¿La metodología cualitativa es la adecuada para la pregunta?</li><li>¿Se explica a quién se eligió y por qué eran las personas indicadas?</li><li>¿Cómo se recogieron los datos y si se llegó a la saturación?</li><li>¿Cómo surgieron los temas del análisis? ¿Hay citas que los apoyen?</li><li>¿Reflexiona el investigador sobre cómo pudo influir?</li></ul>" },
        { t: "Para qué sirven en calidad", h: "<p>Explican por qué una intervención que funciona en un ensayo fracasa en la práctica: barreras, cargas de trabajo, cultura. Son el complemento ideal de los estudios cuantitativos.</p>" }
      ],
      minicaso: "<p>Entrevistas a enfermeras de triaje muestran que las alertas de la escala se ignoran cuando nadie tiene asignado actuar. Ese hallazgo cambia cómo se implanta la escala, aunque no dé ninguna cifra.</p>",
      practica: { href: "#/plantillas/cualitativo", texto: "Ver la plantilla cualitativa" } },
    { n: 10, c: "V", titulo: "Evaluaciones económicas", sub: "Costes, efectos y la razón incremental",
      minuto: ["Comparan <b>costes y resultados</b> de dos o más alternativas.", "La medida clave es la <b>razón de coste-efectividad incremental (RCEI)</b>: lo que cuesta de más cada unidad de efecto que se gana.", "Si la nueva cuesta menos y consigue más, <b>domina</b>.", "Mira siempre el <b>análisis de sensibilidad</b>: ¿cambia la conclusión si cambian los supuestos?"],
      secciones: [
        { t: "Tipos", h: "<ul><li><b>Minimización de costes</b>: los efectos son iguales; gana la más barata.</li><li><b>Coste-efectividad</b>: efectos en unidades naturales (casos evitados, años de vida).</li><li><b>Coste-utilidad</b>: efectos en años de vida ajustados por calidad (AVAC).</li><li><b>Coste-beneficio</b>: todo en euros.</li></ul>" },
        { t: "Qué mirar", h: "<p>¿Desde qué perspectiva (sistema sanitario, sociedad)? ¿La efectividad viene de buenos estudios? ¿Se cuentan todos los costes? ¿Se aplica descuento a lo futuro? ¿Los costes se trasladan a tu medio?</p>" }
      ],
      minicaso: "<p>Un programa nuevo cuesta 500 € más por paciente y consigue 0,1 AVAC más: RCEI de 5.000 € por AVAC. Si el umbral habitual es de unos 25.000 € por AVAC, parece eficiente, siempre que el análisis de sensibilidad no le dé la vuelta.</p>",
      practica: { href: "#/calc/cei", texto: "Abrir la calculadora de coste-efectividad" } }
  ];

  // ---------- Ponte a prueba (preguntas propias) ----------
  // t = bloque (TEMAS_TEST); ok = índice de la correcta
  const TEMAS_TEST = {
    1: { nom: "Método", aprende: 1 }, 2: { nom: "Tipos de estudio", aprende: 2 }, 3: { nom: "Sesgos", aprende: 3 },
    4: { nom: "Medidas de efecto", aprende: 4 }, 5: { nom: "Precisión", aprende: 5 }, 6: { nom: "Diagnóstico", aprende: 6 },
    7: { nom: "Revisiones", aprende: 7 }, 8: { nom: "Decidir", aprende: 8 }
  };
  const TEST = [
    { t: 1, q: "¿Cuáles son las tres preguntas de la lectura crítica, en orden?", o: ["¿Son válidos los resultados?, ¿cuáles son?, ¿me sirven?", "¿Quién lo firma?, ¿dónde se publica?, ¿cuántas citas tiene?", "¿Es significativo?, ¿es aleatorio?, ¿es caro?", "¿Es reciente?, ¿es largo?, ¿es gratuito?"], ok: 0, e: "Validez, resultados y aplicabilidad, en ese orden: si la validez falla, no merece la pena seguir." },
    { t: 1, q: "La primera pregunta de la plantilla muestra que el estudio no responde a tu pregunta. ¿Qué haces?", o: ["Dejo de leerlo", "Sigo con la plantilla", "Lo aplico igual", "Leo solo las conclusiones"], ok: 0, e: "Es una pregunta de eliminación: si el estudio no responde a tu pregunta, no merece la pena seguir." },
    { t: 1, q: "¿Qué significa la «C» de PICO?", o: ["Comparación", "Coste", "Calidad", "Conclusión"], ok: 0, e: "Frente a qué se compara la intervención. A veces no hay comparación." },
    { t: 1, q: "¿Qué decisión ahorra más tiempo al buscar evidencia?", o: ["Descartar en dos minutos lo que no responde a tu pregunta", "Leer todos los artículos completos", "Leer solo las conclusiones", "Fiarse del título"], ok: 0, e: "El filtro de dos minutos con el título y el resumen es la decisión que más tiempo ahorra." },
    { t: 2, q: "Quieres saber si un tratamiento reduce la mortalidad. ¿Qué diseño responde mejor?", o: ["Una revisión sistemática de ensayos clínicos aleatorizados", "Una serie de casos", "Un estudio cualitativo", "Un estudio transversal"], ok: 0, e: "Para tratamientos, los ensayos aleatorizados, y mejor aún una revisión sistemática de varios." },
    { t: 2, q: "Un estudio parte de pacientes con una reacción adversa rara y los compara con otros sin ella para ver qué tomaron antes. ¿Qué diseño es?", o: ["Casos y controles", "Cohortes", "Ensayo clínico", "Antes-después"], ok: 0, e: "Parte del desenlace (casos) y mira hacia atrás la exposición: casos y controles, ideal para desenlaces raros." },
    { t: 2, q: "Una unidad mide la tasa de úlceras antes y después de un protocolo nuevo, sin grupo control. ¿Cuál es su principal limitación?", o: ["Otras cosas que cambiaron a la vez pueden explicar la mejora", "No se puede calcular ningún porcentaje", "Es imposible publicarlo", "Siempre exagera los daños"], ok: 0, e: "Sin grupo de comparación ni varias mediciones, cualquier cambio general se confunde con el efecto del protocolo." },
    { t: 3, q: "¿Para qué sirve ocultar la secuencia de aleatorización?", o: ["Para que quien incluye a los pacientes no pueda elegir a quién va a cada grupo", "Para que los pacientes no sepan qué toman", "Para que el estadístico no conozca los resultados", "Para publicar antes"], ok: 0, e: "La ocultación evita el sesgo de selección: nadie puede «colocar» a un paciente en el grupo que prefiere." },
    { t: 3, q: "En un ensayo, quien valora el dolor sabe qué tratamiento recibe cada paciente. ¿Qué sesgo puede aparecer?", o: ["De detección", "De publicación", "De memoria", "De espectro"], ok: 0, e: "Saber el grupo cambia cómo se mide, sobre todo con desenlaces subjetivos: sesgo de detección." },
    { t: 3, q: "En un estudio observacional, los que beben más café tienen más infartos, pero también fuman más. El tabaco es…", o: ["Un factor de confusión", "Un sesgo de publicación", "Un desenlace", "Un efecto adverso"], ok: 0, e: "Va unido a la exposición (café) y, por sí solo, aumenta el riesgo de infarto." },
    { t: 3, q: "Un ensayo pierde el 30 % de los pacientes de un grupo y el 5 % del otro. ¿Qué haces?", o: ["Desconfío y busco un análisis de sensibilidad de las pérdidas", "Nada: las pérdidas no importan", "Lo descarto porque no es aleatorio", "Sumo las pérdidas al grupo control"], ok: 0, e: "Pérdidas grandes y desiguales pueden cambiar la conclusión: hay que ver qué pasaría en el peor de los casos." },
    { t: 4, q: "El riesgo baja del 20 % al 15 %. ¿Cuál es el NNT?", o: ["20", "5", "25", "4"], ok: 0, e: "RAR = 20 % − 15 % = 5 % = 0,05; NNT = 1 / 0,05 = 20." },
    { t: 4, q: "El riesgo baja del 2 % al 1 %. ¿Qué afirmación es correcta?", o: ["La reducción relativa es del 50 % y el NNT es 100", "La reducción absoluta es del 50 %", "El NNT es 2", "El riesgo relativo es 2"], ok: 0, e: "RR = 0,5 (RRR 50 %), pero RAR = 1 % y NNT = 100. La reducción relativa impresiona más que la absoluta." },
    { t: 4, q: "¿Cuándo se parece la odds ratio al riesgo relativo?", o: ["Cuando el evento es raro", "Cuando el evento es muy frecuente", "Siempre son iguales", "Nunca se parecen"], ok: 0, e: "Con eventos raros, odds y riesgo casi coinciden. Con eventos frecuentes, la OR exagera el efecto." },
    { t: 5, q: "RR 0,80 (IC 95 %: 0,60 a 1,10). ¿Qué concluyes?", o: ["El resultado es compatible con que no haya efecto", "La intervención reduce el riesgo un 20 % con seguridad", "La intervención es perjudicial", "El estudio es falso"], ok: 0, e: "El intervalo incluye el 1 (sin efecto): el resultado es incierto." },
    { t: 5, q: "Un ensayo con 40.000 pacientes encuentra una diferencia minúscula con p = 0,001. ¿Qué es lo correcto?", o: ["Es significativo, pero puede no ser importante: mira el tamaño del efecto", "Es importante porque la p es muy baja", "No vale porque tiene demasiados pacientes", "Hay que repetirlo con menos pacientes"], ok: 0, e: "Con muestras enormes, efectos pequeños salen significativos. Lo que decide es cuánto cambia el resultado." },
    { t: 5, q: "Un estudio pequeño no encuentra diferencias y su intervalo es muy ancho. ¿Qué significa?", o: ["Puede que no tuviera muestra suficiente para ver un efecto", "Demuestra que la intervención no funciona", "Demuestra que funciona", "Que el intervalo está mal calculado"], ok: 0, e: "Ausencia de evidencia no es evidencia de ausencia: un estudio pequeño puede no ver un efecto real." },
    { t: 6, q: "¿Qué medida de una prueba depende de la prevalencia de la enfermedad?", o: ["El valor predictivo positivo", "La sensibilidad", "La especificidad", "El cociente de probabilidad positivo"], ok: 0, e: "Los valores predictivos cambian con la prevalencia; sensibilidad, especificidad y LR, mucho menos." },
    { t: 6, q: "Una prueba tiene LR+ de 1,5 y LR− de 0,8. ¿Qué te dice?", o: ["Apenas cambia la probabilidad de enfermedad", "Confirma y descarta con seguridad", "Es una prueba excelente", "Solo sirve para descartar"], ok: 0, e: "LR entre 0,5 y 2: la prueba casi no mueve la probabilidad." },
    { t: 6, q: "Con una probabilidad previa del 20 % y un LR+ de 6, ¿cuál es la probabilidad tras un positivo?", o: ["Alrededor del 60 %", "Alrededor del 26 %", "Alrededor del 90 %", "El 120 %"], ok: 0, e: "Odds previa 0,25 × 6 = 1,5; probabilidad = 1,5 / 2,5 = 60 %." },
    { t: 6, q: "Solo se hizo la prueba de referencia a quienes dieron positivo en la prueba estudiada. ¿Qué sesgo es?", o: ["De verificación", "De memoria", "De confusión", "De desgaste"], ok: 0, e: "Si la confirmación depende del resultado de la prueba, ésta parece mejor de lo que es." },
    { t: 7, q: "En un metaanálisis, I² = 75 %. ¿Qué significa?", o: ["Los estudios discrepan mucho entre sí", "El efecto combinado es del 75 %", "El 75 % de los estudios son buenos", "Hay un 75 % de probabilidad de efecto"], ok: 0, e: "I² mide la heterogeneidad: por encima del 50 %, los estudios no dicen lo mismo y hay que preguntarse por qué." },
    { t: 7, q: "¿Qué representa el rombo de un diagrama de bosque?", o: ["El resultado combinado y su intervalo", "El estudio más grande", "El estudio con peor calidad", "La línea del sin efecto"], ok: 0, e: "El centro del rombo es el efecto combinado y su anchura, el intervalo de confianza." },
    { t: 8, q: "El estudio es válido y el efecto importante, pero tus pacientes son muy distintos. ¿Qué decides probablemente?", o: ["Esperar y buscar estudios más parecidos a mi contexto", "Aplicar sin más", "Descartar todos los estudios del tema", "Publicarlo"], ok: 0, e: "La aplicabilidad también cuenta: si tus pacientes son muy distintos, lo prudente es esperar." },
    { t: 8, q: "En GRADE, un desenlace con importancia 8 es…", o: ["Crítico para decidir", "Poco importante", "Importante, pero no crítico", "Un desenlace sustituto"], ok: 0, e: "1-3 poco importante, 4-6 importante, 7-9 crítico." },
    { t: 8, q: "Decides aplicar en tu unidad una intervención que funcionó en un ensayo. ¿Qué es lo más recomendable?", o: ["Medir su efecto aquí con un indicador y un ciclo de mejora", "No medir nada: el ensayo ya lo demostró", "Esperar a otro ensayo", "Aplicarla solo los fines de semana"], ok: 0, e: "Lo que funciona en un ensayo no siempre funciona igual en tu contexto: mídelo." }
  ];

  // ---------- Ejercicios ----------
  // «¿Qué tipo de estudio es?»: resúmenes cortos inventados
  const EJ_TIPO = [
    { texto: "Se repartió al azar a 600 pacientes con neumonía entre alta precoz con seguimiento telefónico y alta habitual, y se comparó el reingreso a 30 días.", ok: "ensayo", e: "Los investigadores asignaron la intervención al azar: ensayo clínico." },
    { texto: "Se buscaron en cinco bases de datos todos los ensayos sobre clorhexidina para el baño de pacientes críticos y se combinaron sus resultados.", ok: "revision", e: "Búsqueda sistemática de varios estudios y combinación de resultados: revisión sistemática con metaanálisis." },
    { texto: "Se siguió durante cinco años a 3.000 personas mayores, con y sin polifarmacia al inicio, para comparar cuántas sufrían caídas.", ok: "cohortes", e: "Parte de la exposición (polifarmacia) y sigue hacia delante: cohortes." },
    { texto: "Se compararon 120 pacientes con infección por un hongo poco frecuente con 360 pacientes sin ella para ver qué antibióticos habían recibido antes.", ok: "casos", e: "Parte del desenlace (infección) y mira hacia atrás: casos y controles." },
    { texto: "En 250 pacientes con dolor torácico se hizo una troponina rápida y la prueba de referencia, y se calcularon la sensibilidad y la especificidad.", ok: "diagnostico", e: "Compara una prueba con la de referencia: estudio de diagnóstico." },
    { texto: "Se entrevistó a 18 cuidadoras de personas con demencia hasta que no surgían temas nuevos, y se analizaron sus vivencias.", ok: "cualitativo", e: "Entrevistas, temas, saturación: estudio cualitativo." },
    { texto: "Se comparó lo que cuesta y los años de vida ajustados por calidad que consigue el cribado de cáncer de colon con dos pruebas distintas.", ok: "economica", e: "Costes y AVAC de dos alternativas: evaluación económica." },
    { texto: "Se construyó una puntuación con cinco datos clínicos para predecir la mortalidad a 30 días y se comprobó en otro hospital.", ok: "prediccion", e: "Combina varios datos para predecir un riesgo y se valida: regla de predicción clínica." },
    { texto: "Una planta de Medicina Interna midió durante 12 meses las caídas, implantó rondas horarias y siguió midiendo otros 12 meses.", ok: "antesdespues", e: "Mide antes y después de un cambio, sin reparto al azar: estudio antes-después (mejor si es una serie temporal, como aquí)." }
  ];
  // «Calcula»: con los datos, la respuesta (se acepta un margen)
  const EJ_CALC = [
    { texto: "Sin tratamiento, 30 de cada 150 tienen el evento; con tratamiento, 15 de cada 150. ¿Cuál es el NNT?", ok: 10, tol: 0.5, e: "Riesgos 20 % y 10 %; RAR = 10 % = 0,10; NNT = 1 / 0,10 = 10." },
    { texto: "Una prueba tiene sensibilidad del 90 % y especificidad del 80 %. ¿Cuál es su LR+?", ok: 4.5, tol: 0.05, e: "LR+ = S / (1 − E) = 0,90 / 0,20 = 4,5." },
    { texto: "Con una probabilidad previa del 10 % y un LR+ de 9, ¿cuál es la probabilidad tras un positivo, en %?", ok: 50, tol: 1, e: "Odds previa = 0,1 / 0,9 = 0,111; × 9 = 1; probabilidad = 1 / 2 = 50 %." },
    { texto: "El riesgo con la intervención es del 6 % y sin ella del 8 %. ¿Cuál es la reducción relativa del riesgo, en %?", ok: 25, tol: 0.5, e: "RR = 6 / 8 = 0,75; RRR = 1 − 0,75 = 25 %." }
  ];

  // ---------- Glosario ----------
  const GLOSARIO = [
    ["Aleatorización", "Reparto de los participantes entre los grupos al azar, para que sean comparables en todo salvo en la intervención."],
    ["Ocultación de la secuencia", "Que quien incluye a los pacientes no pueda saber a qué grupo irá el siguiente. Evita elegir «a dedo»."],
    ["Cegamiento (enmascaramiento)", "Que pacientes, profesionales o evaluadores no sepan qué recibe cada uno, para que no cambie cómo se trata ni cómo se mide."],
    ["Análisis por intención de tratar", "Analizar a cada paciente en el grupo que le tocó, lo cumpliera o no. Conserva lo que consiguió la aleatorización."],
    ["Análisis por protocolo", "Analizar solo a quienes cumplieron el tratamiento. Puede exagerar el efecto."],
    ["Pérdidas", "Participantes de los que no se tiene el resultado final. Si son muchas o distintas entre grupos, pueden sesgar el estudio."],
    ["Sesgo", "Error sistemático que empuja los resultados siempre hacia el mismo lado. Aumentar la muestra no lo corrige."],
    ["Sesgo de selección", "Los grupos son distintos desde el principio por cómo se eligió a los participantes."],
    ["Sesgo de detección", "Se mide distinto en un grupo que en otro, a menudo porque quien mide sabe a qué grupo pertenece cada uno."],
    ["Sesgo de desgaste", "Distorsión por las pérdidas durante el estudio."],
    ["Sesgo de publicación", "Los estudios con resultados favorables se publican más; las revisiones que solo encuentran esos exageran el efecto."],
    ["Sesgo de verificación", "En un estudio de diagnóstico, confirmar con la prueba de referencia solo a algunos según el resultado de la prueba estudiada."],
    ["Sesgo de espectro", "Probar una prueba solo en sanos y en muy enfermos, donde casi cualquier prueba funciona."],
    ["Sesgo de memoria", "Quien ha sufrido un desenlace recuerda mejor sus exposiciones que quien no. Típico de los casos y controles."],
    ["Factor de confusión", "Algo que va unido a la exposición y, por sí solo, cambia el resultado. Puede crear asociaciones que no son causales."],
    ["Desenlace", "Resultado que se mide (muerte, ingreso, dolor). Puede ser crítico, importante o poco importante para decidir."],
    ["Desenlace sustituto", "Una medida intermedia (una cifra de laboratorio) en lugar del evento clínico que importa. Puede engañar."],
    ["Desenlace compuesto", "Varios desenlaces sumados en uno. Cuidado si mezcla cosas de gravedad muy distinta."],
    ["Riesgo absoluto", "Proporción de personas de un grupo que tiene el evento."],
    ["Riesgo relativo (RR)", "Riesgo con la intervención dividido entre el riesgo sin ella. RR 1 = sin efecto."],
    ["Reducción relativa del riesgo (RRR)", "1 − RR. Cuánto baja el riesgo en proporción al de partida."],
    ["Reducción absoluta del riesgo (RAR)", "Diferencia entre los riesgos de los dos grupos. Lo que ganan de verdad los pacientes."],
    ["NNT", "Número necesario a tratar: 1 / RAR. A cuántos hay que tratar para evitar un evento (NNTB) o para que uno más sufra un daño (NNTD)."],
    ["Odds ratio (OR)", "Cociente de odds entre dos grupos. Medida de los casos y controles. Se parece al RR solo si el evento es raro."],
    ["Hazard ratio (HR)", "Compara la velocidad a la que ocurren los eventos a lo largo del tiempo entre dos grupos."],
    ["Intervalo de confianza", "Rango de valores del efecto compatibles con los datos (al 95 %). Si incluye el «sin efecto», el resultado es incierto."],
    ["Valor p", "Probabilidad de ver un resultado así (o más extremo) si en realidad no hubiera efecto. No mide la importancia del efecto."],
    ["Significación estadística", "Resultado con p menor que un umbral (habitualmente 0,05). No es lo mismo que relevancia clínica."],
    ["Relevancia clínica", "Que el efecto sea lo bastante grande para importar a los pacientes o cambiar lo que haces."],
    ["Potencia", "Probabilidad de que un estudio detecte un efecto si existe. Depende sobre todo del tamaño de la muestra."],
    ["Sensibilidad", "De las personas con la enfermedad, proporción que da positivo en la prueba."],
    ["Especificidad", "De las personas sin la enfermedad, proporción que da negativo en la prueba."],
    ["Valor predictivo positivo (VPP)", "De quienes dan positivo, proporción que tiene de verdad la enfermedad. Depende de la prevalencia."],
    ["Valor predictivo negativo (VPN)", "De quienes dan negativo, proporción que de verdad no tiene la enfermedad. Depende de la prevalencia."],
    ["Cociente de probabilidad (LR)", "Cuántas veces es más (o menos) probable un resultado de la prueba en enfermos que en sanos. Multiplica la odds previa."],
    ["Probabilidad previa (pre-prueba)", "Probabilidad de enfermedad antes de hacer la prueba, según la prevalencia y los datos del paciente."],
    ["Probabilidad posterior (post-prueba)", "Probabilidad de enfermedad después de conocer el resultado de la prueba."],
    ["Nomograma de Fagan", "Gráfico que une con una recta la probabilidad previa y el LR para leer la probabilidad posterior."],
    ["Umbral de acción", "Probabilidad a partir de la cual tratarías (o por debajo de la cual descartarías). Una prueba solo sirve si puede hacerte cruzarlo."],
    ["Prueba de referencia (patrón de oro)", "La mejor forma disponible de saber quién tiene la enfermedad, con la que se compara la prueba estudiada."],
    ["Regla de predicción clínica", "Combinación de varios datos del paciente para estimar la probabilidad de un diagnóstico o de un desenlace."],
    ["Validación", "Comprobar que una regla o una prueba funciona en pacientes distintos de aquellos con los que se construyó."],
    ["Revisión sistemática", "Revisión de todos los estudios sobre una pregunta, buscados y valorados con un método explícito."],
    ["Metaanálisis", "Combinación estadística de los resultados de varios estudios en una sola estimación."],
    ["Efectos fijos y aleatorios", "Modelos de metaanálisis: el de efectos fijos supone un único efecto verdadero; el de efectos aleatorios admite que varíe entre estudios."],
    ["Heterogeneidad", "Diferencias entre los resultados de los estudios mayores de lo esperable por azar."],
    ["I²", "Porcentaje de la variabilidad entre estudios que se debe a heterogeneidad real. Más del 50 %: mucha."],
    ["Diagrama de bosque", "Gráfico de un metaanálisis con el resultado de cada estudio y el combinado (el rombo)."],
    ["Gráfico en embudo", "Gráfico para buscar sesgo de publicación: si falta un lado del embudo, pueden faltar estudios negativos."],
    ["Saturación", "En investigación cualitativa, el momento en que nuevos datos ya no aportan temas nuevos."],
    ["Reflexividad", "Que el investigador cualitativo examine cómo su papel y sus ideas influyen en lo que encuentra."],
    ["Triangulación", "Usar varias fuentes, métodos o investigadores para comprobar los hallazgos cualitativos."],
    ["Transferibilidad", "Hasta qué punto los hallazgos cualitativos pueden aplicarse a otros contextos parecidos."],
    ["AVAC", "Año de vida ajustado por calidad: un año en perfecta salud vale 1; con peor calidad de vida, menos."],
    ["RCEI", "Razón de coste-efectividad incremental: diferencia de costes dividida entre diferencia de efectos de dos alternativas."],
    ["Dominancia", "Cuando una alternativa cuesta menos y consigue más que otra: la domina."],
    ["Análisis de sensibilidad", "Repetir un análisis cambiando los supuestos (pérdidas, costes, efectividad) para ver si cambia la conclusión."],
    ["Descuento", "Dar menos valor a los costes y efectos futuros que a los de hoy, en las evaluaciones económicas."],
    ["Serie temporal interrumpida", "Muchas mediciones antes y después de un cambio, para ver si cambian el nivel o la tendencia."],
    ["Regresión a la media", "Tendencia de los valores extremos a acercarse a la media en la siguiente medición. Engaña si se interviene en el peor momento."],
    ["Efecto Hawthorne", "Cambio de conducta de las personas por saberse observadas."],
    ["PICO", "Formato de la pregunta: pacientes, intervención, comparación y resultado (outcome)."],
    ["GRADE", "Sistema para calificar la certeza de la evidencia y la fuerza de las recomendaciones, y la importancia de los desenlaces (1-9)."],
    ["CASPe", "Programa de Habilidades en Lectura Crítica España. Ofrece plantillas gratuitas de lectura crítica para cada tipo de estudio."],
    ["Preguntas de eliminación", "Las primeras preguntas de cada plantilla: si alguna es «No», no merece la pena seguir leyendo."]
  ];

  // ---------- Ejemplos (FICTICIOS) ----------
  // Lecturas con la forma del modelo (logic.js); se sanean al cargar. Ids «ej-…».
  const R = (valor, nota) => ({ valor: valor || "", nota: nota || "" });
  const base = (id, o) => Object.assign({ id, referencia: {}, pico: { p: "pacientes que esperan en la sala de Urgencias tras el triaje", i: "una escala de alerta temprana con reevaluación a los 90 minutos", c: "la reevaluación a demanda", o: "los empeoramientos no detectados" }, filtro: { responde: "si" }, veredicto: {}, creado: "2026-10-25", modificado: "2026-10-25", fecha: "2026-10-20" }, o);
  const PREG_URG = "En pacientes que esperan en la sala de Urgencias tras el triaje, ¿una escala de alerta temprana con reevaluación a los 90 minutos, frente a la reevaluación a demanda, reduce los empeoramientos no detectados?";
  const lecturasUrg = [
    base("ej-u-rs", {
      titulo: "Escalas de alerta temprana en salas de espera de urgencias: revisión sistemática y metaanálisis (ficticio)", pregunta: PREG_URG,
      referencia: { texto: "Autores ficticios. Escalas de alerta temprana en salas de espera de urgencias: revisión sistemática. Revista ficticia de Urgencias. 2025;12:101-12.", anio: "2025" },
      resumen: "Caso ficticio. Revisión de 7 estudios (1 ensayo por conglomerados y 6 antes-después) en salas de espera de urgencias. Escalas de alerta temprana frente a reevaluación habitual. Empeoramiento no detectado: RR combinado 0,78 (IC 95 %: 0,58 a 1,05), I² = 68 %.",
      filtro: { responde: "si", tipoResumen: "Revisión sistemática con metaanálisis", reciente: "si" }, plantilla: "revision", plantillaVersion: 1,
      respuestas: { "rs-1": R("si", "Pacientes en sala de espera, escalas de alerta, empeoramiento."), "rs-2": R("si", "Buscaron ensayos y, como apenas los hay, también estudios antes-después. Lo dicen y lo justifican."), "rs-3": R("si", "Cinco bases de datos, literatura gris y sin límite de idioma."), "rs-4": R("si", "Valoran el riesgo de sesgo con herramientas de Cochrane."), "rs-5": R("no", "Los estudios son muy distintos (I² 68 %) y casi todos antes-después; combinarlos en una cifra no es razonable."), "rs-6": R("", "Empeoramiento no detectado: RR 0,78 (IC 95 %: 0,58 a 1,05)."), "rs-7": R("", "El intervalo incluye el 1: resultado incierto."), "rs-8": R("si", "Salas de espera parecidas a la nuestra."), "rs-9": R("no", "No hay datos de carga de trabajo ni de alertas ignoradas."), "rs-10": R("si", "Coste bajo si se integra en el triaje.") },
      veredicto: { semaforo: { resultados: "ambar" }, motivoSemaforo: { resultados: "El intervalo incluye el 1 y hay mucha heterogeneidad." }, decision: "esperar", motivo: "Búsqueda buena, pero estudios débiles y muy distintos: sirve como orientación, no basta para decidir.", mensaje: "La revisión sugiere un beneficio, pero con mucha incertidumbre y estudios de diseño débil." }
    }),
    base("ej-u-ec", {
      titulo: "Escala de alerta temprana con reevaluación programada en la sala de espera: ensayo aleatorizado por conglomerados (ficticio)", pregunta: PREG_URG,
      referencia: { texto: "Autores ficticios. Escala de alerta temprana con reevaluación programada en salas de espera: ensayo por conglomerados. Revista ficticia de Medicina de Urgencias. 2024;8:55-64.", anio: "2024" },
      resumen: "Caso ficticio. Ocho servicios de urgencias repartidos al azar (4 y 4). Intervención: escala EAT a la llegada y reevaluación automática a los 90 minutos. Control: reevaluación a demanda. Grupo control: 420 pacientes, 20 perdidos, 56 empeoramientos no detectados. Grupo intervención: 415 pacientes, 15 perdidos, 36 empeoramientos no detectados.",
      filtro: { responde: "si", tipoResumen: "Ensayo aleatorizado por conglomerados", reciente: "si" }, plantilla: "ensayo", plantillaVersion: 1,
      desenlaces: [{ id: "ej-d1", nombre: "Empeoramiento no detectado", importancia: "8", sentido: "beneficio" }, { id: "ej-d2", nombre: "Ingreso en UCI", importancia: "8", sentido: "beneficio" }, { id: "ej-d3", nombre: "Tiempo de espera", importancia: "5", sentido: "dano" }],
      respuestas: { "ec-1": R("si", "Misma población, intervención y desenlace que nuestra pregunta."), "ec-2": R("si", "Aleatorización por centros con secuencia generada por ordenador y asignación central."), "ec-3": R("nose", "No se pudo cegar a los profesionales; no cuentan si cambió otra cosa en los centros."), "ec-4": R("si", "Menos del 5 % de pérdidas, parecidas en los dos grupos."), "ec-5": R("si", "Empeoramiento definido por criterios objetivos y revisado por personas que no sabían el grupo."), "ec-6": R("si", "Coincide con el registro del ensayo.") },
      calculos: [{ id: "ej-c1", tipo: "tratamiento", nombre: "empeoramiento no detectado", entrada: { nc: "420", pc: "20", ec: "56", ne: "415", pe: "15", ee: "36" }, niveles: [], nota: "" }],
      veredicto: { decision: "aplicar", motivo: "El efecto es real aunque impreciso (NNT 20, de 11 a 169) y el estudio cualitativo explica cómo implantarlo: aplicar con un responsable por turno y medir.", mensaje: "De cada 100 pacientes en la sala de espera, la escala evita unos 5 empeoramientos no detectados (NNT 20).", acciones: [{ id: "ej-a1", que: "Implantar la escala con un responsable de reevaluación por turno", quien: "Supervisión de enfermería de Urgencias", cuando: "Enero" }, { id: "ej-a2", que: "Medir cada mes los empeoramientos no detectados (ciclo de mejora)", quien: "Referente de calidad", cuando: "Cada mes, 6 meses" }] }
    }),
    base("ej-u-dx", {
      titulo: "Rendimiento de la escala EAT para predecir el empeoramiento en las 24 horas en la sala de espera (ficticio)", pregunta: "En pacientes que esperan en Urgencias, ¿una puntuación EAT de 5 o más identifica a quienes empeorarán en las 24 horas?",
      referencia: { texto: "Autores ficticios. Validez de la escala EAT en la sala de espera. Revista ficticia de Urgencias. 2023;10:200-8.", anio: "2023" },
      pico: { p: "pacientes que esperan en Urgencias", i: "escala EAT con punto de corte de 5", c: "evolución a las 24 horas revisada por dos médicos", o: "empeoramiento" },
      resumen: "Caso ficticio. 300 pacientes consecutivos. EAT ≥ 5 frente a empeoramiento a las 24 horas (revisión ciega por dos médicos). Con empeoramiento: 40 positivos y 8 negativos. Sin empeoramiento: 30 positivos y 222 negativos.",
      filtro: { responde: "si", tipoResumen: "Estudio de diagnóstico (validación de una escala)", reciente: "si" }, plantilla: "diagnostico", plantillaVersion: 1,
      respuestas: { "dx-1": R("si", "Evolución a 24 horas revisada por dos médicos."), "dx-2": R("si", "Pacientes consecutivos de la sala de espera."), "dx-3": R("si", "Punto de corte definido de antemano; concordancia entre enfermeras kappa 0,8."), "dx-4": R("si", "Los revisores no conocían la puntuación."), "dx-5": R("si", "Se revisó la evolución de todos."), "dx-8": R("si"), "dx-9": R("si", "Se calcula en un minuto con las constantes del triaje."), "dx-10": R("si", "Con nuestro umbral del 40 %, un positivo lo cruza.") },
      calculos: [{ id: "ej-c2", tipo: "diagnostico", nombre: "", entrada: { a: "40", b: "30", c: "8", d: "222", pre: "15", umbral: "40" }, niveles: [], nota: "" }],
      veredicto: { decision: "aplicar", motivo: "Escala válida con cocientes de probabilidad útiles en nuestra sala de espera.", mensaje: "Un EAT ≥ 5 sube el riesgo de empeorar del 15 % al 55 %; un EAT < 5 lo baja al 3 %." }
    }),
    base("ej-u-cu", {
      titulo: "«Nadie sabía quién tenía que actuar»: experiencias de las enfermeras de triaje con las escalas de alerta (ficticio)", pregunta: "¿Por qué fracasan las escalas de alerta en la sala de espera, según quienes las usan?",
      referencia: { texto: "Autores ficticios. Experiencias de enfermeras de triaje con escalas de alerta temprana: estudio cualitativo. Revista ficticia de Enfermería de Urgencias. 2024;5:33-41.", anio: "2024" },
      pico: { p: "enfermeras de triaje de urgencias", i: "uso de escalas de alerta temprana", c: "", o: "barreras y facilitadores" },
      resumen: "Caso ficticio. 22 entrevistas en profundidad y 3 grupos de discusión en 4 hospitales, hasta la saturación. Tema principal: las alertas se ignoran cuando nadie tiene asignado actuar; con un responsable por turno, la escala se usa y se confía en ella.",
      filtro: { responde: "si", tipoResumen: "Estudio cualitativo", reciente: "si" }, plantilla: "cualitativo", plantillaVersion: 1,
      respuestas: { "cu-1": R("si"), "cu-2": R("si"), "cu-3": R("si", "Análisis temático, justificado."), "cu-4": R("si", "Enfermeras de triaje de cuatro hospitales, con y sin experiencia."), "cu-5": R("si", "Entrevistas y grupos hasta la saturación."), "cu-6": R("nose", "Apenas reflexionan sobre su papel (eran del mismo servicio)."), "cu-7": R("si", "Comité de ética y consentimiento."), "cu-8": R("si", "Temas con citas textuales."), "cu-9": R("si"), "cu-10": R("si", "Nuestra sala de espera tiene el mismo problema.") },
      veredicto: { decision: "aplicar", motivo: "Explica por qué fracasan las escalas: lo usamos para decidir cómo implantarla.", mensaje: "La escala solo funciona si alguien tiene asignado actuar ante la alerta." }
    }),
    base("ej-u-f1", { titulo: "Escala de alerta en plantas de hospitalización médica: ensayo por conglomerados (ficticio)", referencia: { texto: "Autores ficticios. Revista ficticia de Medicina Interna. 2022." }, filtro: { responde: "no", tipoResumen: "Ensayo por conglomerados", nota: "Pacientes ingresados en planta, no en Urgencias." }, veredicto: { decision: "descartar", motivo: "No responde a tu pregunta (filtro de dos minutos): pacientes de planta." } }),
    base("ej-u-f2", { titulo: "Respuesta rápida al deterioro en pacientes quirúrgicos: cohorte (ficticio)", referencia: { texto: "Autores ficticios. Revista ficticia de Cirugía. 2021." }, filtro: { responde: "no", tipoResumen: "Cohortes", nota: "Pacientes quirúrgicos ingresados." }, veredicto: { decision: "descartar", motivo: "No responde a tu pregunta (filtro de dos minutos): pacientes de planta." } }),
    base("ej-u-f3", { titulo: "Monitorización continua en planta y eventos adversos: antes-después (ficticio)", referencia: { texto: "Autores ficticios. Revista ficticia de Enfermería Hospitalaria. 2023." }, filtro: { responde: "no", tipoResumen: "Antes-después", nota: "Pacientes de planta, otra intervención." }, veredicto: { decision: "descartar", motivo: "No responde a tu pregunta (filtro de dos minutos): pacientes de planta." } })
  ];
  const sesionUrg = { id: "ej-s-urg", titulo: "Escalas de alerta temprana en la sala de espera", pregunta: PREG_URG, unidad: "Servicio de Urgencias (caso ficticio)", fecha: "2026-10-20", lecturas: lecturasUrg.map(l => l.id), decision: "aplicar", conclusion: "Aplicar la escala EAT en la sala de espera, pero solo con un responsable de reevaluación por turno (lo que señala el estudio cualitativo), y medir cada mes los empeoramientos no detectados con un ciclo de mejora. La revisión sistemática es poco concluyente; el ensayo muestra un efecto real aunque impreciso.", creado: "2026-10-25", modificado: "2026-10-25" };

  // Minicasos: cada uno para practicar una cosa
  const mini = (id, o) => Object.assign({ id, referencia: {}, filtro: { responde: "si" }, veredicto: {}, creado: "2026-10-25", modificado: "2026-10-25", fecha: "2026-10-20" }, o);
  const minicasos = [
    mini("ej-m-ap", { titulo: "Llamadas telefónicas de seguimiento tras el alta hospitalaria (ficticio)", que: "Una pregunta de eliminación que frena", paso: 4,
      pico: { p: "pacientes mayores pluripatológicos que viven solos, tras el alta", i: "llamada de enfermería a las 48 horas", c: "seguimiento habitual", o: "reingresos a 30 días" },
      resumen: "Caso ficticio. Ensayo en 400 pacientes de 40 a 64 años con una sola enfermedad crónica. Llamada de enfermería a las 48 horas frente a seguimiento habitual. Reingresos a 30 días: 12 % frente a 16 %.",
      plantilla: "ensayo", plantillaVersion: 1, respuestas: { "ec-1": R("no", "Los pacientes del ensayo (menores de 65, una sola enfermedad) no son los míos (mayores, pluripatológicos, viven solos).") },
      veredicto: { decision: "esperar", motivo: "No responde a mi pregunta: mis pacientes son muy distintos. Busco una revisión sistemática con pacientes mayores." } }),
    mini("ej-m-rrr", { titulo: "Un fármaco que «reduce los ictus a la mitad» (ficticio)", que: "Reducción relativa grande, absoluta pequeña", paso: 5,
      pico: { p: "adultos sin enfermedad cardiovascular", i: "fármaco X", c: "placebo", o: "ictus a 5 años" },
      resumen: "Caso ficticio. 2.000 pacientes por grupo. Ictus a 5 años: 20 con placebo y 10 con el fármaco.",
      plantilla: "ensayo", plantillaVersion: 1, calculos: [{ id: "ej-c3", tipo: "tratamiento", nombre: "ictus a 5 años", entrada: { nc: "2000", ec: "20", ne: "2000", ee: "10" }, niveles: [], nota: "" }] }),
    mini("ej-m-ic", { titulo: "Un ensayo pequeño sin diferencias (ficticio)", que: "Un intervalo que incluye el 1", paso: 5,
      pico: { p: "pacientes con úlcera venosa", i: "apósito de plata", c: "apósito habitual", o: "úlcera no cicatrizada a 12 semanas" },
      resumen: "Caso ficticio. 100 pacientes por grupo. Úlcera sin cicatrizar a las 12 semanas: 12 con el apósito habitual y 9 con el de plata.",
      plantilla: "ensayo", plantillaVersion: 1, calculos: [{ id: "ej-c4", tipo: "tratamiento", nombre: "úlcera sin cicatrizar", entrada: { nc: "100", ec: "12", ne: "100", ee: "9" }, niveles: [], nota: "" }] }),
    mini("ej-m-vpp", { titulo: "Una prueba buena para una enfermedad rara (ficticio)", que: "Valor predictivo y prevalencia", paso: 5,
      pico: { p: "población general que acude a consulta", i: "prueba rápida de cribado", c: "prueba de referencia", o: "enfermedad" },
      resumen: "Caso ficticio. 1.000 personas. Con la enfermedad: 8 positivos y 2 negativos. Sin ella: 40 positivos y 950 negativos.",
      plantilla: "diagnostico", plantillaVersion: 1, calculos: [{ id: "ej-c5", tipo: "diagnostico", nombre: "", entrada: { a: "8", b: "40", c: "2", d: "950" }, niveles: [], nota: "" }] }),
    mini("ej-m-cc", { titulo: "Café e infarto: un confusor olvidado (ficticio)", que: "Factores de confusión", paso: 4,
      pico: { p: "adultos de 40 a 70 años", i: "consumo de más de 4 cafés al día", c: "consumo menor", o: "infarto" },
      resumen: "Caso ficticio. 300 casos de infarto y 600 controles. Toman más de 4 cafés al día: 120 casos y 150 controles. No se recoge el tabaco.",
      plantilla: "casos", plantillaVersion: 1, confusores: [{ id: "ej-f1", texto: "Tabaco", tenido: "no" }, { id: "ej-f2", texto: "Edad", tenido: "si" }],
      respuestas: { "cc-1": R("si"), "cc-2": R("si", "El infarto en este grupo de edad es poco frecuente: diseño adecuado."), "cc-6": R("no", "No midieron el tabaco, que va unido al café y causa infartos.") },
      calculos: [{ id: "ej-c6", tipo: "or", nombre: "", entrada: { a: "120", b: "150", c: "180", d: "450" }, niveles: [], nota: "" }] }),
    mini("ej-m-ee", { titulo: "Un programa más caro y que consigue menos (ficticio)", que: "Una alternativa dominada", paso: 5,
      pico: { p: "pacientes con insuficiencia cardiaca", i: "telemonitorización", c: "seguimiento en consulta", o: "AVAC y costes" },
      resumen: "Caso ficticio. Coste por paciente: 1.200 € con telemonitorización y 1.000 € con el seguimiento habitual. AVAC: 0,90 y 1,00.",
      plantilla: "economica", plantillaVersion: 1, calculos: [{ id: "ej-c7", tipo: "cei", nombre: "", entrada: { cn: "1200", ch: "1000", en: "0,9", eh: "1", unidad: "AVAC" }, niveles: [], nota: "" }] }),
    mini("ej-m-rp", { titulo: "Una regla de predicción sin validar (ficticio)", que: "La validación en otro grupo", paso: 4,
      pico: { p: "pacientes con síncope en Urgencias", i: "regla de 4 variables", c: "", o: "evento grave a 7 días" },
      resumen: "Caso ficticio. Regla construida con 250 pacientes de un solo hospital. Sensibilidad del 98 % en esos mismos pacientes. No se probó en otro grupo.",
      plantilla: "prediccion", plantillaVersion: 1, respuestas: { "rp-1": R("si"), "rp-2": R("si"), "rp-3": R("no", "Solo se probó en los mismos pacientes con los que se construyó.") } })
  ];
  const EJEMPLOS = {
    sesion: sesionUrg, lecturas: lecturasUrg.concat(minicasos),
    // Para la página de ejemplos: qué se practica en cada minicaso y en qué paso se abre
    minicasos: minicasos.map(m => ({ id: m.id, titulo: m.titulo, que: m.que, paso: m.paso }))
  };
  minicasos.forEach(m => { delete m.que; delete m.paso; });

  const API = { TEMAS, TEMAS_TEST, TEST, EJ_TIPO, EJ_CALC, GLOSARIO, EJEMPLOS };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else raiz.Contenido = API;
})(typeof window !== "undefined" ? window : this);
