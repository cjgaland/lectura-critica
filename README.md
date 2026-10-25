# Lectura Crítica

PWA estática (HTML/CSS/JS puro, sin dependencias ni CDN, funciona sin conexión) para **leer críticamente un artículo** paso a paso y aprendiendo mientras se hace.

Siete pasos:

1. Tu pregunta (PICO) y el artículo.
2. Filtro de dos minutos: ¿responde a tu pregunta?
3. Tipo de estudio, o averiguarlo con unas preguntas sencillas.
4. ¿Es válido? Primero las preguntas de eliminación.
5. ¿Qué dice? El efecto y su precisión.
6. ¿Me sirve? En tus pacientes y en tu medio.
7. Veredicto: semáforo por bloque y decisión (aplicar, esperar o descartar).

- Nueve plantillas: las ocho de CASPe, con preguntas propias (ensayo clínico, revisión sistemática, diagnóstico, cohortes, casos y controles, cualitativo, evaluación económica y reglas de predicción clínica), que siguen sus criterios y las citan y enlazan (https://redcaspe.org/materiales/), y una propia para estudios antes-después o de mejora.
- Si el estudio falla en las preguntas de eliminación, la app avisa de que no merece la pena seguir.
- Calculadoras de resultados, en la pregunta donde se necesitan y sueltas: tratamiento (RR, RRR, RAR, NNT, OR, análisis de sensibilidad de las pérdidas), diagnóstico (sensibilidad, especificidad, cocientes de probabilidad, probabilidad tras la prueba y nomograma de Fagan), pruebas con varios niveles, odds ratio y coste-efectividad incremental. Comprobadas con las calculadoras Excel de CASPe.
- Ficha de la lectura y de la sesión en Word y PDF, plantillas en blanco y Excel. Sesiones con varias lecturas y club de lectura con votos y modo proyector. Búsqueda en PubMed desde la pregunta.
- **Aprende**, **Ponte a prueba**, **glosario**, un **ejemplo completo** (Urgencias, ficticio) y siete **minicasos**.

Los datos se guardan solo en el dispositivo; para trabajar en equipo se comparte la copia de seguridad.

Forma parte del ecosistema de apps de calidad y seguridad del paciente: https://cjgaland.github.io/

## Uso
Servir la carpeta y abrir `index.html`:

    python3 -m http.server 8775

Tests de la lógica y de las calculadoras:

    node tests/logic.test.mjs
    node tests/calculos.test.mjs
    node tests/contenido.test.mjs

Documentación técnica y decisiones: ver `CLAUDE.md`.

Aplicación desarrollada por:

- **Carlos J. Galán Doval** · Médico de Familia · Técnico en Calidad y Seguridad del Paciente
- **Rafael J. Romero de Castilla Gil** · Médico de Familia · Responsable del Área de Calidad y Seguridad del Paciente

Área de Gestión Sanitaria Sur de Córdoba · Andalucía. De libre uso con fines docentes y divulgativos. No sustituye el criterio profesional.
