// ============================================================
//  plantillas.js — Solo datos · Lectura Crítica
//  Las 8 plantillas CASPe y la plantilla propia de estudios antes-después (preguntas y pistas PROPIAS, escritas por los
//  autores sobre los criterios aceptados de validez, resultados y
//  aplicabilidad; no reproducen el texto de CASPe, que se cita y se enlaza)
//  y el árbol «¿Qué tipo de estudio tengo?».
//  window.Plantillas en navegador y module.exports en Node (tests).
//
//  Pregunta: { id (fijo, no cambia al reescribir), texto, pistas: [],
//    elim (de eliminación), resp: "snd" (Sí/No/No se puede saber) | "sn" | "abierta",
//    calc: calculadora que se abrirá en la entrega 2 (o null),
//    lista: "desenlaces" | "confusores" | null, parada: tras ella, «¿merece la pena seguir?» }
//  Si se reescribe el texto de una plantilla, sube su «version».
// ============================================================
(function (raiz) {
  "use strict";

  const URL_CASPE = "https://redcaspe.org/materiales/";
  const BLOQUES = {
    validez: { titulo: "¿Es válido?", sub: "¿Te puedes fiar de los resultados?" },
    resultados: { titulo: "¿Qué dice?", sub: "¿Cuál es el efecto y con qué precisión?" },
    aplicabilidad: { titulo: "¿Me sirve?", sub: "¿Puedes aplicarlo a tus pacientes y en tu medio?" }
  };
  const P = (id, texto, pistas, o = {}) => Object.assign({ id, texto, pistas, elim: false, resp: "snd", calc: null, lista: null, parada: false }, o);

  const PLANTILLAS = [
    {
      id: "ensayo", nombre: "Ensayo clínico", corto: "Ensayo", version: 1,
      que: "Compara una intervención con otra (o con nada) repartiendo a los participantes al azar. Es el mejor diseño para saber si un tratamiento funciona.",
      cita: "CASPe. 11 preguntas para entender un ensayo clínico [Internet]. Red CASPe. Disponible en: https://redcaspe.org/wp-content/uploads/2023/05/Plantilla-Ensayo-Clinico.pdf",
      url: "https://redcaspe.org/wp-content/uploads/2023/05/Plantilla-Ensayo-Clinico.pdf",
      bloques: [
        { id: "validez", preguntas: [
          P("ec-1", "¿El ensayo responde a una pregunta bien definida, y es la tuya?", [
            "Busca las cuatro partes de la pregunta: a quién se estudia (pacientes), qué se hace (intervención), frente a qué (comparación) y qué se mide (desenlaces).",
            "Mira si se miden tanto los beneficios como los posibles daños.",
            "Si los pacientes, la intervención o los desenlaces no se parecen a los de tu pregunta, este no es tu artículo."], { elim: true, lista: "desenlaces" }),
          P("ec-2", "¿Se repartió a los participantes al azar, sin que nadie pudiera prever a qué grupo iba cada uno?", [
            "¿Explica cómo se generó la secuencia (tabla de números aleatorios, ordenador)? Alternar días o usar la fecha de nacimiento no es azar.",
            "¿Quien incluía a los pacientes podía saber qué les tocaría? Los sobres opacos o la asignación central evitan que se elija «a dedo».",
            "Mira la tabla 1: ¿los grupos se parecían al empezar (edad, gravedad, otras enfermedades)?"], { elim: true }),
          P("ec-3", "¿Los grupos siguieron siendo comparables durante todo el estudio?", [
            "¿Sabían los pacientes y los profesionales qué recibía cada uno (cegamiento)? Saberlo cambia cómo se trata y cómo se cuenta lo que pasa.",
            "¿Cumplieron el tratamiento de forma parecida en los dos grupos? ¿Recibió un grupo más atención u otros tratamientos?",
            "¿Se analizó a cada paciente en el grupo que le tocó (análisis por intención de tratar)?"], { elim: true }),
          P("ec-4", "¿Las pérdidas fueron pocas y se manejaron bien?", [
            "¿Cuántos participantes no llegaron al final? Más de un 20 % es preocupante.",
            "¿Se perdieron más en un grupo que en otro, o por motivos distintos?",
            "¿Comprueban los autores qué pasaría con los perdidos en el peor de los casos (análisis de sensibilidad)?"]),
          P("ec-5", "¿Los desenlaces se midieron bien y de la misma forma en los dos grupos?", [
            "¿Es un desenlace objetivo (muerte, ingreso) o depende de quién lo valora (dolor, mejoría)?",
            "¿Quien medía el desenlace sabía a qué grupo pertenecía el paciente?",
            "¿Se usó el mismo método, con la misma frecuencia, en los dos grupos?"]),
          P("ec-6", "¿Se cuentan todos los resultados que se habían previsto?", [
            "Compara los desenlaces del artículo con los del registro del ensayo (ClinicalTrials.gov, registro europeo) o con su protocolo.",
            "Desconfía si el desenlace principal cambió, si faltan desenlaces anunciados o si destacan solo subgrupos favorables."])
        ] },
        { id: "resultados", preguntas: [
          P("ec-7", "¿Cuál es el efecto de la intervención en cada desenlace?", [
            "Anota cada desenlace, sus beneficios y sus daños.",
            "Busca el efecto en números: riesgo en cada grupo, riesgo relativo, reducción absoluta del riesgo y NNT.",
            "Fíjate en si el análisis es por intención de tratar (todos en su grupo) o solo con quienes cumplieron el tratamiento."], { resp: "abierta", calc: "tratamiento" }),
          P("ec-8", "¿Con qué precisión se estima el efecto?", [
            "Busca el intervalo de confianza de cada resultado.",
            "Si el intervalo incluye el «sin efecto» (riesgo relativo 1, diferencia 0), el resultado es incierto.",
            "Un intervalo muy ancho dice poco: el estudio probablemente era pequeño."], { resp: "abierta", calc: "tratamiento" })
        ] },
        { id: "aplicabilidad", preguntas: [
          P("ec-9", "¿Puedes aplicar estos resultados a tus pacientes y en tu medio?", [
            "¿Se parecen tus pacientes a los del ensayo (edad, gravedad, otras enfermedades)? Mira los criterios de inclusión y de exclusión.",
            "¿Tienes los medios y la experiencia que tenía el equipo del estudio?",
            "¿Hay otros ensayos sobre lo mismo y dicen algo parecido?"]),
          P("ec-10", "¿Se han tenido en cuenta todos los desenlaces importantes?", [
            "¿Falta algún desenlace que a ti o a tus pacientes os importe (calidad de vida, efectos adversos, costes)?",
            "Desconfía de los desenlaces sustitutos (una cifra de laboratorio en lugar de un evento clínico) y de los compuestos que mezclan cosas de distinta gravedad."]),
          P("ec-11", "¿Los beneficios compensan los riesgos y los costes?", [
            "Es difícil saberlo con un solo ensayo, pero da tu opinión.",
            "Ten en cuenta las preferencias de los pacientes y lo que cuesta aplicarlo."], { resp: "sn" })
        ] }
      ]
    },
    {
      id: "revision", nombre: "Revisión sistemática", corto: "Revisión", version: 1,
      que: "Reúne y valora todos los estudios sobre una pregunta, buscados con un método explícito. Si además combina sus resultados en una cifra, es un metaanálisis.",
      cita: "Cabello JB por CASPe. Plantilla para ayudarte a entender una Revisión Sistemática. En: CASPe. Guías CASPe de Lectura Crítica de la Literatura Médica. Alicante: CASPe; 2005. Cuaderno I. p. 13-17.",
      url: URL_CASPE,
      bloques: [
        { id: "validez", preguntas: [
          P("rs-1", "¿La revisión trata un tema bien definido?", [
            "Busca a quién se refiere (pacientes), qué intervención o exposición estudia y qué resultados considera.",
            "Una pregunta vaga («el tratamiento de la diabetes») da revisiones difíciles de usar."], { elim: true }),
          P("rs-2", "¿Buscaron el tipo de estudio adecuado para esa pregunta?", [
            "Para saber si un tratamiento funciona, lo mejor son los ensayos clínicos; para un pronóstico, las cohortes.",
            "Los estudios incluidos deberían responder a la misma pregunta que la revisión."], { elim: true }),
          P("rs-3", "¿Es probable que estén todos los estudios importantes?", [
            "¿En cuántas bases de datos buscaron? Una sola no basta.",
            "¿Revisaron las referencias de los artículos, consultaron a expertos y buscaron estudios no publicados o en otros idiomas?",
            "Los estudios con resultados negativos se publican menos: si no se buscan, la revisión exagera el efecto."]),
          P("rs-4", "¿Valoraron la calidad (el riesgo de sesgo) de cada estudio incluido?", [
            "¿Explican con qué herramienta y quién lo hizo (mejor dos personas por separado)?",
            "¿Tienen en cuenta la calidad al sacar conclusiones? Juntar estudios malos da un resultado malo, aunque sea muy preciso."]),
          P("rs-5", "Si combinaron los resultados en una sola cifra, ¿era razonable hacerlo?", [
            "¿Se parecen los estudios entre sí (pacientes, intervención, desenlaces)?",
            "¿Van los resultados en la misma dirección? Mira el diagrama de bosque y la heterogeneidad (I²). Un I² por encima del 50 % indica que los estudios no dicen lo mismo.",
            "¿Explican por qué difieren los resultados?"])
        ] },
        { id: "resultados", preguntas: [
          P("rs-6", "¿Cuál es el resultado global de la revisión?", [
            "Anota el resultado principal y cómo se expresa (riesgo relativo, odds ratio, diferencia de medias, NNT).",
            "¿Lo tienes claro, en números?"], { resp: "abierta", calc: "metaanalisis" }),
          P("rs-7", "¿Con qué precisión se estima?", [
            "Busca el intervalo de confianza del resultado combinado.",
            "¿Incluye el «sin efecto»? ¿Es muy ancho?"], { resp: "abierta", calc: "metaanalisis" })
        ] },
        { id: "aplicabilidad", preguntas: [
          P("rs-8", "¿Puedes aplicar los resultados en tu medio?", [
            "¿Se parecen tus pacientes a los de los estudios incluidos?",
            "¿Es tu entorno (atención primaria, hospital, recursos) muy distinto?"]),
          P("rs-9", "¿Se han tenido en cuenta todos los resultados importantes para decidir?", [
            "¿Faltan efectos adversos, calidad de vida o costes?"]),
          P("rs-10", "¿Los beneficios compensan los perjuicios y los costes?", [
            "Aunque la revisión no lo diga, ¿qué opinas tú?"], { resp: "sn" })
        ] }
      ]
    },
    {
      id: "diagnostico", nombre: "Estudio de diagnóstico", corto: "Diagnóstico", version: 1,
      que: "Mide cómo de bien distingue una prueba a quien tiene una enfermedad de quien no la tiene, comparándola con una prueba de referencia.",
      cita: "Cabello JB por CASPe. Plantilla para ayudarte a entender un Estudio de Diagnóstico. En: CASPe. Guías CASPe de Lectura Crítica de la Literatura Médica. Alicante: CASPe; 2005. Cuaderno I. p. 22-25.",
      url: URL_CASPE,
      bloques: [
        { id: "validez", preguntas: [
          P("dx-1", "¿Se comparó la prueba con una prueba de referencia adecuada?", [
            "La prueba de referencia («patrón de oro») es la mejor forma disponible de saber quién tiene la enfermedad.",
            "¿Es de verdad la mejor? A veces no se puede aplicar la misma a todos los pacientes, y eso debe explicarse."], { elim: true }),
          P("dx-2", "¿Los pacientes cubren el abanico real de la enfermedad?", [
            "Casi cualquier prueba distingue a personas sanas de personas muy enfermas. Lo difícil son los casos dudosos, leves o con otras enfermedades.",
            "¿Se parecen a los pacientes en los que tú usarías la prueba? ¿Explican cómo se eligieron?"], { elim: true }),
          P("dx-3", "¿Está bien descrita la prueba?", [
            "¿Se dice con claridad qué es un resultado positivo y qué es negativo?",
            "¿Se sabe si dos personas que leen la prueba coinciden (reproducibilidad)? Importa mucho en las pruebas de imagen o que dependen de quien las interpreta."], { elim: true }),
          P("dx-4", "¿Quien interpretaba una prueba desconocía el resultado de la otra?", [
            "Si quien lee la prueba sabe ya el resultado de la prueba de referencia (o al revés), tiende a ver lo que espera."]),
          P("dx-5", "¿Se hizo la prueba de referencia a todos, sin depender del resultado de la prueba estudiada?", [
            "Si solo se confirma con la prueba de referencia a quien da positivo, los resultados salen mejores de lo que son (sesgo de verificación).",
            "¿Se usó la misma prueba de referencia en los positivos y en los negativos?"])
        ] },
        { id: "resultados", preguntas: [
          P("dx-6", "¿Se pueden calcular la sensibilidad, la especificidad y los cocientes de probabilidad?", [
            "Busca o reconstruye la tabla 2 × 2: verdaderos positivos, falsos positivos, falsos negativos y verdaderos negativos.",
            "¿Qué se hizo con los resultados dudosos o no concluyentes?",
            "Si la prueba tiene varios niveles (por ejemplo, una escala), lo ideal es un cociente para cada nivel."], { resp: "abierta", calc: "diagnostico" }),
          P("dx-7", "¿Con qué precisión se estiman?", [
            "Busca o calcula los intervalos de confianza de la sensibilidad, la especificidad y los cocientes de probabilidad."], { resp: "abierta", calc: "diagnostico" })
        ] },
        { id: "aplicabilidad", preguntas: [
          P("dx-8", "¿En tu medio se hará y se interpretará igual de bien?", [
            "¿Tienes el mismo aparato, la misma técnica y la misma experiencia que en el estudio?",
            "¿Es tu ámbito (urgencias, consulta, planta) muy distinto?"]),
          P("dx-9", "¿Es aceptable la prueba para tus pacientes?", [
            "Piensa en si está disponible, en sus riesgos y molestias y en lo que cuesta."]),
          P("dx-10", "¿Cambiará el resultado lo que vas a hacer?", [
            "Si hagas lo que hagas la prueba no cambia tu decisión, no sirve (al menos para ti).",
            "Piensa en la probabilidad de enfermedad antes de la prueba, en cuánto la mueve el resultado y en tu umbral para tratar o descartar."], { resp: "sn", calc: "fagan" })
        ] }
      ]
    },
    {
      id: "cohortes", nombre: "Estudio de cohortes", corto: "Cohortes", version: 1,
      que: "Sigue en el tiempo a personas expuestas y no expuestas a algo (un factor de riesgo, un tratamiento) y compara lo que les pasa. Sirve para estudiar causas y pronóstico.",
      cita: "Cabello JB por CASPe. Plantilla para ayudarte a entender Estudios de Cohortes. En: CASPe. Guías CASPe de Lectura Crítica de la Literatura Médica. Alicante: CASPe; 2005. Cuaderno II. p. 23-27.",
      url: URL_CASPE,
      bloques: [
        { id: "validez", preguntas: [
          P("co-1", "¿El estudio responde a una pregunta bien definida?", [
            "¿Está claro a quién se estudia, qué exposición o factor de riesgo y qué resultados se miden?",
            "¿Buscaba un efecto beneficioso o perjudicial?"], { elim: true }),
          P("co-2", "¿Se eligió bien a las personas de la cohorte?", [
            "¿Representan a una población definida, o tienen algo especial (voluntarios, un solo centro muy particular)?",
            "¿Se incluyó a todos los que debían estar?",
            "¿Se midió bien la exposición, y de la misma forma en todos?"], { elim: true }),
          P("co-3", "¿Se midió bien el resultado, y de la misma forma en expuestos y no expuestos?", [
            "¿Es un resultado objetivo, o depende de quién lo valora?",
            "¿Había un sistema fiable para detectar todos los casos?",
            "¿Sabía quien medía el resultado si la persona estaba expuesta? Si lo sabía, puede buscar más en un grupo que en otro."]),
          P("co-4", "¿Tuvieron en cuenta los factores de confusión?", [
            "Un factor de confusión es algo que va unido a la exposición y que, por sí solo, cambia el resultado (por ejemplo, la edad o el tabaco).",
            "Haz tu lista de factores importantes y comprueba si los autores los midieron y ajustaron (restricción, estratificación, regresión, análisis de sensibilidad)."], { lista: "confusores" }),
          P("co-5", "¿El seguimiento fue lo bastante largo y completo?", [
            "¿Dio tiempo a que aparecieran los efectos, buenos o malos?",
            "Quienes se pierden durante el seguimiento pueden haber tenido una evolución distinta. ¿Cuántos se perdieron, y en qué grupo?"])
        ] },
        { id: "resultados", preguntas: [
          P("co-6", "¿Cuáles son los resultados?", [
            "¿Dan el riesgo o la tasa en expuestos y en no expuestos?",
            "¿Cómo de fuerte es la asociación (riesgo relativo, hazard ratio)? ¿Y la diferencia absoluta?"], { resp: "abierta", calc: "tratamiento" }),
          P("co-7", "¿Con qué precisión se estiman?", [
            "Busca los intervalos de confianza. ¿Incluyen el «sin efecto»? ¿Son muy anchos?"], { resp: "abierta", calc: "tratamiento" })
        ] },
        { id: "aplicabilidad", preguntas: [
          P("co-8", "¿Te parecen creíbles los resultados?", [
            "¿Podrían explicarse por el azar, por un sesgo o por un factor de confusión?",
            "Un efecto muy grande es difícil de explicar solo por sesgos.",
            "Piensa en los criterios de causalidad: la exposición va antes del efecto, a más exposición más efecto, la asociación es fuerte y tiene sentido biológico."]),
          P("co-9", "¿Coinciden con lo que dicen otros estudios?", [
            "Compara con ensayos, revisiones y otros estudios observacionales sobre lo mismo."]),
          P("co-10", "¿Puedes aplicar los resultados en tu medio?", [
            "¿Se parecen tus pacientes a los del estudio? ¿Es tu medio muy distinto?",
            "¿Puedes estimar los beneficios y los perjuicios para tus pacientes?"]),
          P("co-11", "¿Va a cambiar esto tu decisión?", [
            "Un estudio observacional rara vez basta por sí solo para cambiar la práctica, pero puede reforzar o poner en duda lo que haces."])
        ] }
      ]
    },
    {
      id: "casos", nombre: "Estudio de casos y controles", corto: "Casos y controles", version: 1,
      que: "Parte de personas que ya tienen un desenlace (casos) y de otras que no lo tienen (controles), y mira hacia atrás qué exposiciones tuvieron. Útil para desenlaces raros.",
      cita: "Cabello JB por CASPe. Plantilla para ayudarte a entender un Estudio de Casos y Controles. En: CASPe. Guías CASPe de Lectura Crítica de la Literatura Médica. Alicante: CASPe; 2005. Cuaderno II. p. 13-19.",
      url: URL_CASPE,
      bloques: [
        { id: "validez", preguntas: [
          P("cc-1", "¿El estudio responde a una pregunta bien definida?", [
            "¿Está claro a quién se estudia y qué factores de riesgo o exposiciones?",
            "¿Buscaba un efecto beneficioso o perjudicial?"], { elim: true }),
          P("cc-2", "¿Es un diseño adecuado para esa pregunta?", [
            "Los casos y controles van bien cuando el desenlace es raro o tarda mucho en aparecer.",
            "¿El estudio está pensado de verdad para responder a esa pregunta?"], { elim: true }),
          P("cc-3", "¿Se eligió bien a los casos?", [
            "¿Está claro qué es un caso? ¿Representan a una población definida (un lugar, un periodo)?",
            "¿Son casos nuevos (incidentes) o ya existentes (prevalentes)? Los existentes pueden ser los que sobrevivieron.",
            "¿Hay suficientes casos para encontrar una diferencia?"]),
          P("cc-4", "¿Se eligió bien a los controles?", [
            "Los controles deberían venir de la misma población que los casos: personas que, si hubieran enfermado, habrían sido casos.",
            "¿Tienen algo especial? ¿Muchos se negaron a participar, y podrían ser distintos?",
            "¿Hay suficientes controles?"]),
          P("cc-5", "¿Se midió bien la exposición, y de la misma forma en casos y controles?", [
            "¿Está clara la exposición? ¿Se midió con datos objetivos o preguntando? Quien ha enfermado recuerda más (sesgo de memoria).",
            "¿Sabía quien preguntaba si la persona era caso o control?",
            "¿La exposición ocurrió antes del desenlace?"]),
          P("cc-6", "¿Tuvieron en cuenta los factores de confusión?", [
            "Haz tu lista de factores que podrían explicar la asociación (edad, sexo, nivel socioeconómico, otras exposiciones).",
            "¿Los autores los tuvieron en cuenta en el diseño (emparejamiento, restricción) o en el análisis (estratificación, regresión)?"], { lista: "confusores" })
        ] },
        { id: "resultados", preguntas: [
          P("cc-7", "¿Cuáles son los resultados?", [
            "¿Cómo de fuerte es la asociación? Mira la odds ratio (OR).",
            "¿Cambia mucho la OR al ajustar por los factores de confusión? ¿Podrían aún explicarla?"], { resp: "abierta", calc: "or" }),
          P("cc-8", "¿Con qué precisión se estiman?", [
            "Busca los intervalos de confianza. ¿Incluyen el 1? ¿Son muy anchos?",
            "¿Qué efecto pudieron tener quienes no quisieron participar?"], { resp: "abierta", calc: "or" }),
          P("cc-9", "¿Te crees los resultados?", [
            "¿Podrían deberse al azar, a un sesgo o a un factor de confusión?",
            "¿Tiene el diseño fallos tan importantes que hagan poco creíble el resultado?",
            "Piensa en los criterios de causalidad: secuencia temporal, relación dosis-respuesta, fuerza de la asociación, sentido biológico."], { parada: true })
        ] },
        { id: "aplicabilidad", preguntas: [
          P("cc-10", "¿Puedes aplicar los resultados en tu medio?", [
            "¿Se parecen tus pacientes a los del estudio? ¿Es tu medio muy distinto?",
            "¿Puedes estimar los beneficios y los perjuicios para tus pacientes?"]),
          P("cc-11", "¿Coinciden con lo que dicen otros estudios?", [
            "Compara con ensayos, revisiones, cohortes y otros casos y controles."])
        ] }
      ]
    },
    {
      id: "cualitativo", nombre: "Estudio cualitativo", corto: "Cualitativo", version: 1,
      que: "Explora vivencias, opiniones o significados con entrevistas, grupos de discusión u observación. Sus resultados son temas y explicaciones, no cifras.",
      cita: "Cano Arana A, González Gil T, Cabello López JB por CASPe. Plantilla para ayudarte a entender un estudio cualitativo. En: CASPe. Guías CASPe de Lectura Crítica de la Literatura Médica. Alicante: CASPe; 2010. Cuaderno III. p. 3-8.",
      url: URL_CASPE,
      bloques: [
        { id: "validez", preguntas: [
          P("cu-1", "¿Están claros los objetivos de la investigación?", [
            "¿Se entiende qué se quería conocer y por qué es importante?"], { elim: true }),
          P("cu-2", "¿Es la investigación cualitativa la adecuada para esos objetivos?", [
            "Lo es si se quiere comprender experiencias, conductas o significados desde el punto de vista de quien los vive."], { elim: true }),
          P("cu-3", "¿El método elegido es adecuado y está justificado?", [
            "¿Dicen qué enfoque siguen (fenomenología, teoría fundamentada, etnografía…) y por qué?"], { elim: true }),
          P("cu-4", "¿La forma de elegir a los participantes encaja con la pregunta y el método?", [
            "¿Explican quién participó, cómo y dónde se les invitó, y por qué eran las personas adecuadas para lo que se quería conocer?"]),
          P("cu-5", "¿La forma de recoger los datos encaja con la pregunta y el método?", [
            "¿Explican y justifican la técnica (entrevistas, grupos, observación) y el lugar?",
            "¿Cuentan cómo se registró (grabación, cuaderno de campo) y si la estrategia cambió por el camino?",
            "¿Siguieron recogiendo datos hasta que no aparecía nada nuevo (saturación)?"]),
          P("cu-6", "¿Reflexionan los investigadores sobre su propio papel?", [
            "Quien investiga influye en lo que encuentra. ¿Lo reconoce y explica cómo pudo influir en la pregunta, en la recogida de datos y en los cambios de rumbo?"]),
          P("cu-7", "¿Se tuvieron en cuenta los aspectos éticos?", [
            "¿Hablan del consentimiento informado, de la confidencialidad y del impacto emocional de participar?",
            "¿Lo aprobó un comité de ética?"])
        ] },
        { id: "resultados", preguntas: [
          P("cu-8", "¿Fue riguroso el análisis de los datos?", [
            "¿Describen cómo analizaron y cómo surgieron los temas a partir de los datos?",
            "¿Incluyen citas textuales de los participantes, con su procedencia?",
            "¿Tienen en cuenta los datos que contradicen sus conclusiones?"]),
          P("cu-9", "¿Se exponen los resultados con claridad?", [
            "¿Responden a la pregunta de investigación? ¿Se entienden?",
            "¿Los comparan con otros estudios? ¿Explican qué hicieron para que fueran creíbles (triangulación, devolver los resultados a los participantes)?",
            "¿Reconocen sus limitaciones?"])
        ] },
        { id: "aplicabilidad", preguntas: [
          P("cu-10", "¿Son aplicables los resultados a tu medio?", [
            "¿Explican qué aportan a lo que ya se sabe y a la práctica?",
            "¿Reflexionan sobre si los resultados pueden trasladarse a otros contextos, como el tuyo?"])
        ] }
      ]
    },
    {
      id: "economica", nombre: "Evaluación económica", corto: "Económica", version: 1,
      que: "Compara los costes y los resultados en salud de dos o más alternativas para saber cuál aporta más por lo que cuesta.",
      cita: "Cabello JB por CASPe. Plantilla para ayudarte a entender una Evaluación Económica. En: CASPe. Guías CASPe de Lectura Crítica de la Literatura Médica. Alicante: CASPe; 2005. Cuaderno I. p. 31-35.",
      url: URL_CASPE,
      bloques: [
        { id: "validez", preguntas: [
          P("ee-1", "¿Está bien definida la pregunta de la evaluación?", [
            "¿Desde qué punto de vista se mira (el sistema sanitario, la sociedad, el paciente)?",
            "¿Compara costes y efectos (evaluación completa) o solo una de las dos cosas?",
            "¿Compara varias alternativas? ¿En qué plazo de tiempo?"], { elim: true }),
          P("ee-2", "¿Están bien descritas las alternativas y lo que se sigue de cada una?", [
            "¿Se entiende qué se hace en cada alternativa, quién lo hace, a quién, dónde y con qué frecuencia?",
            "¿Hay un árbol de decisión (o algo parecido) con los caminos posibles?"], { elim: true }),
          P("ee-3", "¿Hay pruebas de que la intervención funciona?", [
            "La efectividad debería venir de buenos estudios: ensayos clínicos o revisiones sistemáticas.",
            "Una evaluación económica de algo que no funciona no sirve."]),
          P("ee-4", "¿Se identifican, miden y valoran bien los efectos?", [
            "¿En qué unidades: casos evitados, años de vida, años de vida ajustados por calidad (AVAC)?",
            "¿Se miden de forma adecuada?"]),
          P("ee-5", "¿Se identifican, miden y valoran bien los costes?", [
            "¿Se cuentan todos los recursos (medicamentos, personal, pruebas, desplazamientos)? ¿Con qué precios?",
            "¿Distinguen los costes directos, indirectos e intangibles?"]),
          P("ee-6", "¿Se aplica un descuento a los costes y efectos futuros?", [
            "Un euro o un año de vida dentro de diez años vale menos que hoy. Si el horizonte pasa de un año, debería aplicarse un descuento."])
        ] },
        { id: "resultados", preguntas: [
          P("ee-7", "¿Cuáles son los resultados de la evaluación?", [
            "¿En qué unidades (coste por año de vida, coste por AVAC, beneficio neto)?",
            "Lo correcto es el análisis incremental: cuánto más cuesta y cuánto más se gana al elegir una alternativa en lugar de la otra."], { resp: "abierta", calc: "cei" }),
          P("ee-8", "¿Se hizo un análisis de sensibilidad adecuado?", [
            "¿Cuánto cambia el resultado si se modifican los costes, la efectividad u otras circunstancias?",
            "¿Se probaron todas las variables con más incertidumbre?"])
        ] },
        { id: "aplicabilidad", preguntas: [
          P("ee-9", "¿Sería el programa igual de efectivo en tu medio?", [
            "¿Es el punto de vista del análisis aplicable a tu contexto?"]),
          P("ee-10", "¿Se pueden trasladar los costes a tu medio?", [
            "Los precios y la organización cambian mucho de un país o un servicio a otro."]),
          P("ee-11", "¿Merece la pena aplicarlo en tu medio?", [
            "Piensa en el resultado, en su incertidumbre y en los recursos que tienes."])
        ] }
      ]
    },
    {
      id: "prediccion", nombre: "Regla de predicción clínica", corto: "Predicción", version: 1,
      que: "Construye o comprueba una regla o escala que combina varios datos del paciente para estimar la probabilidad de un diagnóstico o de un desenlace.",
      cita: "Cabello JB por CASPe. Plantilla para ayudarte a entender Reglas de Predicción Clínica. En: CASPe. Guías CASPe de Lectura Crítica de la Literatura Médica. Alicante: CASPe; 2005. Cuaderno II. p. 5-9.",
      url: URL_CASPE,
      bloques: [
        { id: "validez", preguntas: [
          P("rp-1", "¿La regla responde a una pregunta bien definida?", [
            "¿Está claro a qué pacientes se aplica?",
            "¿Están bien descritas las variables que usa (los predictores)?",
            "¿Lo que predice tiene sentido clínico y es importante?"], { elim: true }),
          P("rp-2", "¿Los pacientes con los que se construyó la regla cubren el abanico adecuado?", [
            "¿Se eligieron bien? ¿Están representados los pacientes en los que tiene sentido usarla?"], { elim: true }),
          P("rp-3", "¿Se comprobó la regla en otro grupo de pacientes?", [
            "No basta con que funcione en los pacientes con los que se construyó: casi siempre funciona peor en otros.",
            "¿Se validó en pacientes parecidos o distintos? ¿En otro centro?"], { elim: true }),
          P("rp-4", "¿Se valoraron el desenlace y los predictores sin conocer el otro dato?", [
            "¿Sabía quien valoraba el desenlace los datos clínicos? ¿Y quien medía los predictores, el desenlace?"]),
          P("rp-5", "¿Se midieron los predictores y el desenlace en todos los pacientes?", [
            "¿Están bien explicadas las exclusiones?",
            "A veces el desenlace no se puede medir igual en todos: ¿lo explican?"]),
          P("rp-6", "¿Se describe cómo se construyó y se comprobó la regla?", [
            "¿Se incluyen las variables importantes y qué se considera positivo?",
            "¿Se sabe si las medidas son reproducibles?"])
        ] },
        { id: "resultados", preguntas: [
          P("rp-7", "¿Se puede calcular cómo funciona la regla?", [
            "Busca la sensibilidad, la especificidad, los cocientes de probabilidad, el área bajo la curva ROC o la calibración.",
            "Con una tabla 2 × 2 (regla positiva o negativa frente a desenlace sí o no) lo puedes calcular tú."], { resp: "abierta", calc: "diagnostico" }),
          P("rp-8", "¿Con qué precisión?", [
            "Piensa en el tamaño de la muestra frente al número de variables de la regla: con muchas variables y pocos pacientes, la regla se ajusta demasiado a esos pacientes.",
            "¿Intentaron afinarla o comprobar su robustez?"], { resp: "abierta", calc: "diagnostico" })
        ] },
        { id: "aplicabilidad", preguntas: [
          P("rp-9", "¿En tu medio se aplicará y se interpretará igual de bien?", [
            "¿Es el ámbito del estudio muy distinto del tuyo?"]),
          P("rp-10", "¿Es aceptable usar la regla en tu caso?", [
            "¿Es fácil de usar, está disponible, cuesta poco y tiene sentido clínico?"]),
          P("rp-11", "¿Cambiará la regla lo que haces, los resultados en salud o los costes?", [
            "Si la regla no cambia tu actitud, no sirve (al menos para ti).",
            "Puede haber estudios que midan su impacto real.",
            "Piensa en cuánto cambia tu estimación al aplicarla y si cruza tu umbral de acción."], { resp: "sn" })
        ] }
      ]
    }
  ];

  // Plantilla PROPIA (no hay plantilla CASPe para este diseño, el más frecuente en calidad).
  // Basada en SQUIRE 2.0 y en los criterios de riesgo de sesgo de las series temporales interrumpidas de Cochrane EPOC.
  PLANTILLAS.push({
    id: "antesdespues", nombre: "Estudio antes-después o de mejora", corto: "Antes-después", version: 1, propia: true,
    que: "Mide algo antes y después de introducir un cambio (un protocolo, una alerta, un programa de mejora), sin repartir al azar. Es el diseño más frecuente en calidad, pero otras cosas que cambian a la vez pueden explicar la mejora.",
    cita: "Plantilla propia de los autores, basada en SQUIRE 2.0 (Ogrinc G, Davies L, Goodman D, Batalden P, Davidoff F, Stevens D. BMJ Qual Saf. 2016;25(12):986-92) y en los criterios de riesgo de sesgo de las series temporales interrumpidas de Cochrane EPOC (Cochrane Effective Practice and Organisation of Care, 2017).",
    url: "https://www.squire-statement.org/",
    bloques: [
      { id: "validez", preguntas: [
        P("ad-1", "¿Están claros el problema, el contexto y qué se cambió exactamente?", [
          "¿Se entiende qué problema se quería mejorar, dónde (unidad, centro, tipo de pacientes) y por qué?",
          "¿Se describe la intervención con detalle suficiente para saber qué se hizo: quién, cuándo, cómo y con qué intensidad?",
          "Si no sabes qué se cambió, no podrás saber si te sirve."], { elim: true }),
        P("ad-2", "¿Se midió lo mismo, de la misma forma, antes y después?", [
          "¿Es el mismo indicador, con la misma definición, la misma fuente de datos y el mismo tipo de pacientes en los dos periodos?",
          "Si cambió la forma de registrar (por ejemplo, una historia clínica nueva), el «cambio» puede ser solo un cambio en la medida."], { elim: true }),
        P("ad-3", "¿Hay varias mediciones antes y después, y no solo dos fotos?", [
          "Con un solo dato antes y otro después no se sabe si el indicador ya venía mejorando solo.",
          "Lo ideal es una serie temporal: al menos tres puntos antes y tres después (mejor, ocho o más), con un gráfico de control o de serie temporal.",
          "¿Se ve un salto o un cambio de tendencia justo cuando empieza la intervención?"]),
        P("ad-4", "¿Se descartan otras explicaciones de la mejora?", [
          "¿Cambiaron otras cosas a la vez: plantilla, protocolos, otros programas, la época del año, el tipo de pacientes?",
          "¿Hay un grupo de comparación (otra unidad u otro centro sin la intervención) que no mejoró?",
          "Sin grupo de comparación, cualquier cambio general del sistema se confunde con el efecto de la intervención."]),
        P("ad-5", "¿Se evitó empezar justo en el peor momento?", [
          "Si se decidió intervenir porque los datos estaban peor que nunca, lo esperable es que mejoren solos (regresión a la media).",
          "¿Explican por qué se eligió ese momento? ¿Cómo estaba el indicador los meses anteriores?"]),
        P("ad-6", "¿Los datos están completos y se midieron sin sesgos?", [
          "¿Faltan datos de algún periodo, unidad o tipo de paciente?",
          "¿Quien medía sabía que se estaba evaluando una mejora? Saberse observado cambia la conducta (efecto Hawthorne).",
          "¿Cuentan también los resultados que no mejoraron o los efectos no deseados?"])
      ] },
      { id: "resultados", preguntas: [
        P("ad-7", "¿Cuánto cambió el resultado y con qué precisión?", [
          "Busca el valor antes y después, la diferencia absoluta y su intervalo de confianza, o el análisis de la serie temporal (cambio de nivel y de tendencia).",
          "En la calculadora, pon el periodo «antes» como grupo control y el «después» como grupo intervención."], { resp: "abierta", calc: "tratamiento" }),
        P("ad-8", "¿Se mantuvo la mejora en el tiempo?", [
          "¿Cuánto tiempo se siguió midiendo después del cambio?",
          "Muchas mejoras se desvanecen cuando se deja de vigilar: busca datos de varios meses después."])
      ] },
      { id: "aplicabilidad", preguntas: [
        P("ad-9", "¿Se parece su contexto al tuyo?", [
          "Tipo de centro, recursos, cultura de la unidad, liderazgo, sistemas de información.",
          "Lo que funciona en un sitio puede no funcionar en otro si depende de cosas que tú no tienes."]),
        P("ad-10", "¿Explican lo necesario para hacerlo tú: recursos, costes, barreras y cómo las superaron?", [
          "Busca qué hizo falta (tiempo, personas, formación, tecnología) y qué dificultades encontraron.",
          "Un buen artículo de mejora cuenta también lo que no funcionó."]),
        P("ad-11", "¿Los beneficios compensan el esfuerzo, los costes y los posibles efectos no deseados?", [
          "Piensa en lo que costaría en tu unidad y en lo que podría empeorar (más carga de trabajo, alertas que se ignoran)."], { resp: "sn" })
      ] }
    ]
  });

  // ---------- Árbol «¿Qué tipo de estudio tengo?» ----------
  // Cada nodo: si / no → id de otro nodo o { fin: idPlantilla | "antesdespues" | "sinplantilla" }.
  // «No lo sé» sigue por el camino del «no» y se recuerda para avisar al final.
  const ARBOL = [
    { id: "a1", pregunta: "¿Reúne varios estudios que se buscaron de forma sistemática?", pista: "Habla de una búsqueda en bases de datos, de criterios para incluir estudios y suele traer un diagrama de flujo de los artículos.", palabras: "systematic review, meta-analysis, revisión sistemática, metaanálisis, PRISMA, Cochrane", si: { fin: "revision" }, no: "a2" },
    { id: "a2", pregunta: "¿Compara lo que cuestan y lo que consiguen varias alternativas?", pista: "Sus resultados son euros por caso evitado, por año de vida o por AVAC.", palabras: "cost-effectiveness, cost-utility, QALY, ICER, coste-efectividad, AVAC", si: { fin: "economica" }, no: "a3" },
    { id: "a3", pregunta: "¿Estudia vivencias, opiniones o significados, y sus resultados son temas en lugar de cifras?", pista: "Usa entrevistas, grupos de discusión u observación, y cita frases de los participantes.", palabras: "qualitative, interviews, focus groups, thematic analysis, grounded theory, cualitativo", si: { fin: "cualitativo" }, no: "a4" },
    { id: "a4", pregunta: "¿Mide cómo de bien distingue una prueba a quien tiene la enfermedad de quien no, frente a una prueba de referencia?", pista: "Da sensibilidad, especificidad, valores predictivos, cocientes de probabilidad o una curva ROC de una sola prueba.", palabras: "sensitivity, specificity, diagnostic accuracy, likelihood ratio, gold standard, STARD", si: { fin: "diagnostico" }, no: "a5" },
    { id: "a5", pregunta: "¿Construye o comprueba una regla o escala que combina varios datos para predecir un riesgo o un diagnóstico?", pista: "Habla de puntuaciones, predictores, derivación y validación, calibración.", palabras: "clinical prediction rule, risk score, derivation, validation, TRIPOD, nomogram", si: { fin: "prediccion" }, no: "a6" },
    { id: "a6", pregunta: "¿Decidieron los investigadores qué recibía cada participante?", pista: "Si el equipo asignó la intervención, es un estudio experimental. Si solo observó lo que ya pasaba, es observacional.", palabras: "trial, intervention, assigned, ensayo, intervención", si: "a7", no: "a8" },
    { id: "a7", pregunta: "¿Se asignó al azar?", pista: "Busca cómo se hizo el reparto: aleatorización, secuencia generada por ordenador, asignación oculta.", palabras: "randomized, randomised, random allocation, aleatorizado, CONSORT", si: { fin: "ensayo" }, no: { fin: "antesdespues" } },
    { id: "a8", pregunta: "¿Partieron de la exposición (personas expuestas y no expuestas) y siguieron qué les pasaba?", pista: "Siguen a un grupo en el tiempo, hacia delante, aunque los datos se recojan de registros antiguos (cohorte retrospectiva).", palabras: "cohort, follow-up, incidence, hazard ratio, prospective, cohorte, seguimiento", si: { fin: "cohortes" }, no: "a9" },
    { id: "a9", pregunta: "¿Partieron de personas que ya tenían el desenlace (casos) y las compararon con otras que no lo tenían (controles)?", pista: "Miran hacia atrás qué exposiciones tuvieron unos y otros. Su resultado suele ser una odds ratio.", palabras: "case-control, cases, controls, odds ratio, casos y controles", si: { fin: "casos" }, no: { fin: "sinplantilla" } }
  ];
  // Finales del árbol que no son una plantilla
  const FINALES = {
    antesdespues: { titulo: "Estudio de intervención no aleatorio (antes y después, grupo control no aleatorio)", texto: "Es un diseño muy frecuente en calidad, pero no hay plantilla CASPe para él y sus resultados son menos fiables: otras cosas que cambian a la vez pueden explicar la mejora. Léelo con nuestra plantilla propia de estudios antes-después o de mejora.", plantilla: "antesdespues" },
    sinplantilla: { titulo: "Sin plantilla: estudio transversal, serie de casos u opinión", texto: "Una foto en un momento (estudio transversal), una serie de casos o una opinión de expertos aportan pruebas de nivel bajo y no tienen plantilla. Sirven para generar preguntas, rara vez para cambiar la práctica. Busca si hay un estudio mejor sobre lo mismo.", plantilla: "" }
  };
  // Qué plantilla corresponde a cada pregunta del árbol (para el aviso de las respuestas «No lo sé»)
  const ARBOL_DUDA = { a1: "revision", a2: "economica", a3: "cualitativo", a4: "diagnostico", a5: "prediccion", a7: "ensayo", a8: "cohortes", a9: "casos" };

  const API = { URL_CASPE, BLOQUES, PLANTILLAS, ARBOL, FINALES, ARBOL_DUDA };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else raiz.Plantillas = API;
})(typeof window !== "undefined" ? window : this);
