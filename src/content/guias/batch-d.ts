import type { Guide } from "./types";

export const guidesBatchD: Guide[] = [
  {
    slug: "preparar-parcial-de-derecho",
    title: "Cómo preparar un parcial de Derecho con la biblioteca",
    description:
      "Método de estudio para parciales: mapear instituciones, citar artículos vigentes y practicar casos con el texto oficial.",
    category: "Estudiantes",
    updatedAt: "2026-08-04",
    readingMinutes: 7,
    sections: [
      {
        heading: "Dejar de subrayar en automático",
        paragraphs: [
          "Subrayar un código entero no es estudiar. Un parcial de Derecho suele premiar la capacidad de clasificar el problema, elegir la institución correcta y citar el artículo vigente con precisión. Eso se entrena con método, no con fluorescente.",
        ],
      },
      {
        heading: "Plan de 4 pasos",
        paragraphs: [
          "Usa este ciclo en cada tema del sílabo:",
        ],
        bullets: [
          "Define la institución en una frase.",
          "Elige 3–7 artículos estructurales (no 40 sueltos).",
          "Resuelve un caso corto aplicando esos artículos.",
          "Verifica que el texto no haya sido reformado.",
        ],
      },
      {
        heading: "Plantilla de respuesta en examen",
        paragraphs: [
          "Hechos relevantes → problema jurídico → norma aplicable (artículo) → aplicación al caso → conclusión. Si el tiempo apremia, esa plantilla evita ensayos bonitos pero sin ancla legal. En materias reformadas recientemente, menciona la vigencia si cambia el resultado.",
        ],
      },
      {
        heading: "Cómo apoyarte en la plataforma",
        paragraphs: [
          "Abre el código o ley en la Colección, marca solo los artículos estructurales, lee Actualizaciones del tema y practica explicar el “antes/después” de una reforma. Si tienes Plan Personal, los marcadores y notas te ayudan a reconstruir tu mapa días antes del parcial.",
        ],
      },
    ],
  },
  {
    slug: "impuestos-basicos-isr-isv-ciudadanos",
    title: "Impuestos básicos en Honduras: ISR e ISV para ciudadanos",
    description:
      "Introducción educativa al Impuesto sobre la Renta y al Impuesto sobre Ventas: qué son, dónde leerlos y qué no confundir.",
    category: "Tributario",
    updatedAt: "2026-08-04",
    readingMinutes: 8,
    relatedCollections: [
      {
        name: "Ley del Impuesto sobre la Renta",
        slug: "ley-de-impuesto-sobre-la-renta-honduras",
      },
      {
        name: "Ley del Impuesto sobre Ventas",
        slug: "ley-del-impuesto-sobre-ventas-honduras",
      },
      { name: "Código Tributario", slug: "codigo-tributario-honduras" },
    ],
    sections: [
      {
        heading: "Dos impuestos, lógicas distintas",
        paragraphs: [
          "El Impuesto sobre la Renta (ISR) gravita sobre rentas o ingresos según la configuración legal. El Impuesto sobre Ventas (ISV) se asocia al consumo/ventas en los términos de su ley. Confundirlos produce errores básicos: no todo lo que “pagas en una factura” se analiza igual que una declaración de renta.",
        ],
      },
      {
        heading: "Cómo leer normas tributarias",
        paragraphs: [
          "Identifica hecho generador, sujeto pasivo, base, tasa y exenciones. Luego mira obligaciones formales (declarar, retener, emitir documentos) porque en tributario lo formal suele ser tan litigioso como lo sustantivo. El Código Tributario aporta reglas generales que interactúan con leyes específicas.",
        ],
        bullets: [
          "¿Cuál es el hecho generador?",
          "¿Quién está obligado?",
          "¿Hay exención o tasa especial?",
          "¿Qué deber formal acompaña al pago?",
        ],
      },
      {
        heading: "Reformas y medidas temporales",
        paragraphs: [
          "El Derecho tributario cambia con decretos de equidad, amnistías, ajustes y reglamentos. Antes de repetir una tasa o un beneficio “de memoria”, confirma vigencia en el texto consolidado y en Actualizaciones.",
        ],
      },
      {
        heading: "Límite de esta guía",
        paragraphs: [
          "Esta es una brújula de lectura, no una asesoría fiscal. Decisiones de declaración, planificación o controversias con la administración tributaria requieren profesionales y revisión del caso concreto.",
        ],
      },
    ],
  },
  {
    slug: "violencia-domestica-marco-legal",
    title: "Violencia doméstica en Honduras: marco legal básico",
    description:
      "Orientación educativa sobre el marco legal de la violencia doméstica en Honduras y cómo ubicar las normas relevantes.",
    category: "Protección",
    updatedAt: "2026-08-04",
    readingMinutes: 8,
    relatedCollections: [
      {
        name: "Ley Contra la Violencia Doméstica",
        slug: "ley-contra-la-violencia-domestica-honduras",
      },
      { name: "Código Penal", slug: "codigo-penal-honduras" },
    ],
    sections: [
      {
        heading: "Primero la seguridad, después el estudio",
        paragraphs: [
          "Si tú o alguien está en peligro, prioriza ayuda inmediata a través de las autoridades y servicios de protección competentes. Esta guía es material educativo para entender el marco normativo; no es un canal de emergencia ni sustituye acompañamiento institucional o legal.",
        ],
      },
      {
        heading: "Por qué hay varias normas en juego",
        paragraphs: [
          "La violencia doméstica puede involucrar una ley especial, tipificaciones penales, medidas de protección y normas de familia o niñez según el caso. El error metodológico es buscar “un solo artículo mágico”. El enfoque correcto es mapear protección, responsabilidad y procedimiento.",
        ],
        bullets: [
          "Medidas de protección y vías urgentes.",
          "Tipos penales que puedan concurrir.",
          "Normas especiales frente a reglas generales.",
        ],
      },
      {
        heading: "Cómo leer el marco con respeto y rigor",
        paragraphs: [
          "Al estudiar, distingue hechos, pruebas y consecuencias jurídicas. Evita revictimizar en ejemplos académicos. Cita el texto vigente y ten presente que la aplicación real depende de autoridades y de las circunstancias del caso.",
        ],
      },
      {
        heading: "Consulta en la biblioteca",
        paragraphs: [
          "Revisa la Ley Contra la Violencia Doméstica y las normas conexas en la Colección. Si hubo reformas, contrástalas en Actualizaciones. Para un caso real, busca asistencia profesional e institucional especializada.",
        ],
      },
    ],
  },
  {
    slug: "contratos-civiles-y-mercantiles-intro",
    title: "Contratos civiles y mercantiles: guía introductoria",
    description:
      "Cómo distinguir y estudiar contratos en clave civil o mercantil en Honduras, con método de lectura del Código Civil y de Comercio.",
    category: "Contratos",
    updatedAt: "2026-08-04",
    readingMinutes: 9,
    relatedCollections: [
      { name: "Código Civil", slug: "codigo-civil-honduras" },
      { name: "Código de Comercio", slug: "codigo-de-comercio-honduras" },
    ],
    sections: [
      {
        heading: "Primero clasifica, luego cites",
        paragraphs: [
          "Antes de abrir el artículo de compraventa o préstamo, pregunta: ¿la relación es civil o mercantil? Esa clasificación influye en reglas aplicables, interpretación y a veces en jurisdicción o consecuencias prácticas. Empezar por el contrato típico sin clasificar el acto es poner la carreta delante del caballo.",
        ],
      },
      {
        heading: "Elementos que siempre debes chequear",
        paragraphs: [
          "Consentimiento, objeto y causa (o los elementos que el sistema exija), capacidad, forma cuando sea relevante, y obligaciones de cada parte. Luego mira incumplimientos, excepciones y remedios. Un contrato se entiende por su estructura de prestaciones, no por el título informal que las partes le pusieron en un WhatsApp.",
        ],
        bullets: [
          "¿Qué se prometió exactamente?",
          "¿Hay forma exigida por ley?",
          "¿Qué ocurre si una parte no cumple?",
          "¿Hay cláusulas abusivas o límites legales?",
        ],
      },
      {
        heading: "Código Civil vs. Código de Comercio",
        paragraphs: [
          "Usa el Civil para la teoría general y contratos típicos civiles. Usa el de Comercio cuando el acto o sujeto encaje en la lógica mercantil. Si existe ley especial (consumo, sociedad específica, etc.), incorpórala. La Colección permite abrir ambos textos y comparar.",
        ],
      },
      {
        heading: "Vigencia y reforma",
        paragraphs: [
          "Las reglas de contratos también se ven afectadas por reformas legales y por normas de protección. Verifica el texto vigente y no asumas que una cláusula “de costumbre” prevalece sobre una prohibición legal.",
        ],
      },
    ],
  },
  {
    slug: "propiedad-y-registro-conceptos-basicos",
    title: "Propiedad y registro en Honduras: conceptos básicos",
    description:
      "Introducción educativa a propiedad, transmisión y la importancia del registro según el marco legal hondureño.",
    category: "Propiedad",
    updatedAt: "2026-08-04",
    readingMinutes: 8,
    relatedCollections: [
      { name: "Ley de Propiedad", slug: "ley-de-propiedad-honduras" },
      { name: "Código Civil", slug: "codigo-civil-honduras" },
    ],
    sections: [
      {
        heading: "Poseer, ser dueño y poder oponer a terceros",
        paragraphs: [
          "En propiedad hay distinciones que el lenguaje cotidiano aplasta. Una persona puede poseer sin ser propietaria, o creer que compró bien y enfrentarse a problemas de tradición, título o registro. Por eso el estudio serio empieza por conceptos, no por anécdotas de “me lo vendieron”.",
        ],
      },
      {
        heading: "Método para un caso de inmuebles",
        paragraphs: [
          "Orden recomendado:",
        ],
        bullets: [
          "Identifica el bien y su naturaleza.",
          "Revisa título y cadena de transmisiones.",
          "Verifica requisitos formales de la transferencia.",
          "Contrasta con el régimen registral aplicable.",
        ],
      },
      {
        heading: "Ley especial + código",
        paragraphs: [
          "Además del Código Civil, Honduras cuenta con normativa especial en materia de propiedad y registro. Lee la ley especial para el régimen registral y usa el Civil para instituciones generales. Si hay condominio u otras figuras, incorpora esa regulación específica.",
        ],
      },
      {
        heading: "Advertencia práctica",
        paragraphs: [
          "Esta guía no reemplaza un estudio de títulos ni asesoría notarial/registral. Sirve para hacer mejores preguntas y leer las normas correctas en la Colección antes de tomar decisiones patrimoniales.",
        ],
      },
    ],
  },
  {
    slug: "derechos-laborales-basicos-honduras",
    title: "Derechos laborales básicos en Honduras",
    description:
      "Panorama claro de derechos laborales frecuentes: salario, jornada, descansos y terminación, con método para ubicarlos en el Código del Trabajo.",
    category: "Laboral",
    updatedAt: "2026-08-04",
    readingMinutes: 8,
    relatedCollections: [
      { name: "Código del Trabajo", slug: "codigo-del-trabajo-honduras" },
    ],
    sections: [
      {
        heading: "Un mapa, no una lista infinita",
        paragraphs: [
          "En lugar de intentar memorizar “todos los derechos”, construye un mapa: dignidad y condiciones mínimas; tiempo de trabajo; remuneración; descanso; estabilidad y terminación; y derechos colectivos. Con ese mapa puedes ubicar casi cualquier consulta cotidiana.",
        ],
      },
      {
        heading: "Del hecho a la norma",
        paragraphs: [
          "Ejemplo de método: “me cambiaron el horario” → institución de jornada y ius variandi → artículos del Código del Trabajo → posibles límites → evidencia (contratos, mensajes). El salto directo a redes sociales suele saltarse precisamente esa cadena.",
        ],
        bullets: [
          "Describe el hecho con fechas.",
          "Clasifica la institución laboral.",
          "Busca el artículo vigente.",
          "Evalúa prueba y vía de reclamo.",
        ],
      },
      {
        heading: "Leyes especiales y contextos extraordinarios",
        paragraphs: [
          "A veces hay decretos o leyes temporales (emergencias, amnistías, incentivos) que modifican la práctica. Contrástalos con el código base. La Colección + Actualizaciones existen para esa verificación.",
        ],
      },
      {
        heading: "Límite educativo",
        paragraphs: [
          "Conocer el marco te empodera, pero un reclamo laboral concreto puede exigir cálculo, plazos y representación. Usa esta guía como brújula de lectura del Código del Trabajo vigente.",
        ],
      },
    ],
  },
  {
    slug: "como-buscar-articulo-por-numero",
    title: "Cómo buscar un artículo por número (y no equivocarte de ley)",
    description:
      "Consejos prácticos para localizar el artículo correcto cuando solo tienes un número, una cita incompleta o una referencia de clase.",
    category: "Metodología",
    updatedAt: "2026-08-04",
    readingMinutes: 6,
    sections: [
      {
        heading: "El número solo no basta",
        paragraphs: [
          "“Artículo 15” no significa nada sin el cuerpo legal. El artículo 15 del Código Penal no es el 15 del Código del Trabajo. Si tu apunte de clase omite el nombre de la norma, recupéralo por contexto: materia del curso, capítulo mencionado o palabras clave del tipo penal/institución.",
        ],
      },
      {
        heading: "Estrategia de búsqueda",
        paragraphs: [
          "Orden sugerido:",
        ],
        bullets: [
          "Confirma el nombre de la ley o código.",
          "Busca el número de artículo dentro de ese documento.",
          "Lee el artículo completo y los vecinos.",
          "Verifica que la numeración no haya cambiado por reforma.",
        ],
      },
      {
        heading: "Cuando la numeración “no calza”",
        paragraphs: [
          "A veces un manual antiguo cita una numeración previa a una reforma integral. Si el texto no coincide, no fuerces la cita: busca por institución o por el decreto reformatorio. En Actualizaciones puedes encontrar el puente entre el texto anterior y el vigente.",
        ],
      },
      {
        heading: "En Biblioteca Legal HN",
        paragraphs: [
          "Entra al documento de la Colección y usa la búsqueda por número de artículo. Si llegaste desde una Actualización, sigue el enlace al documento relacionado. Esa ruta reduce citas fantasma en parciales y escritos.",
        ],
      },
    ],
  },
];
