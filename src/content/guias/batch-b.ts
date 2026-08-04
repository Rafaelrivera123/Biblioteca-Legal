import type { Guide } from "./types";

export const guidesBatchB: Guide[] = [
  {
    slug: "como-entender-una-reforma-legal",
    title: "Cómo entender una reforma legal (antes y después)",
    description:
      "Método sencillo para leer reformas: qué artículo cambió, qué decía antes, qué dice ahora y desde cuándo aplica.",
    category: "Metodología",
    updatedAt: "2026-08-04",
    readingMinutes: 8,
    sections: [
      {
        heading: "Una reforma no es un titular",
        paragraphs: [
          "Los medios suelen resumir una reforma en una frase (“suben penas”, “facilitan trámites”, “crean un registro”). Eso orienta, pero el trabajo jurídico empieza cuando comparas el texto anterior con el nuevo. Sin el “antes”, es fácil malinterpretar el alcance del “después”.",
        ],
      },
      {
        heading: "Plantilla de análisis en cinco preguntas",
        paragraphs: [
          "Usa siempre las mismas preguntas para no perderte:",
        ],
        bullets: [
          "¿Qué norma se reforma y qué artículos toca?",
          "¿Qué decía el texto anterior?",
          "¿Qué dice el texto nuevo?",
          "¿Hay disposiciones transitorias o vacatio legis?",
          "¿Quién queda obligado o beneficiado en la práctica?",
        ],
      },
      {
        heading: "Transitorios: donde se esconden las sorpresas",
        paragraphs: [
          "Muchas reformas “grandes” en el artículo principal se matizan en los transitorios: plazos de adecuación, excepciones, procedimientos pendientes o reglas para casos iniciados antes de la vigencia. Si solo lees el artículo reformado y omites los transitorios, tu conclusión puede estar incompleta.",
        ],
      },
      {
        heading: "Cómo lo presentamos en Biblioteca Legal HN",
        paragraphs: [
          "En Actualizaciones Legales priorizamos reformas con comparación antes/después y explicación en lenguaje claro. Luego actualizamos el texto vigente en la Colección. Si necesitas el respaldo escaneado o el PDF oficial, vas a Gacetas. Ese flujo convierte una reforma mediática en una consulta verificable.",
        ],
      },
    ],
  },
  {
    slug: "jerarquia-normativa-honduras",
    title: "Jerarquía normativa en Honduras: guía rápida",
    description:
      "Orden básico de supremacía de las normas en Honduras y cómo usarlo para resolver aparentes contradicciones.",
    category: "Teoría práctica",
    updatedAt: "2026-08-04",
    readingMinutes: 7,
    relatedCollections: [
      { name: "Constitución de la República de Honduras", slug: "constitucion-de-la-republica-de-honduras" },
    ],
    sections: [
      {
        heading: "La idea central",
        paragraphs: [
          "No todas las normas valen igual. La jerarquía normativa evita que un acto administrativo desplace a una ley, o que una ley ignore la Constitución. Cuando dos textos parecen decir cosas distintas, el primer filtro no es “cuál me gusta más”, sino “cuál tiene rango superior y sigue vigente”.",
        ],
      },
      {
        heading: "Escalera básica de trabajo",
        paragraphs: [
          "En la práctica de consulta cotidiana puedes usar esta escalera: Constitución; tratados con el rango que les corresponda según el marco constitucional; leyes y códigos; normas reglamentarias; actos administrativos particulares. Hay matices y debates académicos, pero esta escalera evita el 80% de errores de principiante.",
        ],
      },
      {
        heading: "Especialidad y tiempo",
        paragraphs: [
          "Además del rango, existen criterios de especialidad (la norma especial sobre la general) y de temporalidad (la posterior sobre la anterior) cuando las normas son del mismo rango y compatibles con la superior. No uses “la más nueva gana” como regla única: primero confirma que sean comparables.",
        ],
        bullets: [
          "Mismo tema + distinto rango → prevalece el superior.",
          "Mismo rango + una es especial → analiza especialidad.",
          "Mismo rango y misma generalidad → mira vigencia temporal.",
        ],
      },
      {
        heading: "Ejercicio recomendado",
        paragraphs: [
          "Toma un reglamento o acuerdo que hayas visto en noticias y ubícalo en la escalera. Pregunta qué ley lo habilita y qué dice la Constitución sobre esa materia. Ese hábito convierte la jerarquía de concepto de examen en herramienta real de investigación.",
        ],
      },
    ],
  },
  {
    slug: "que-es-la-gaceta-oficial",
    title: "Qué es La Gaceta oficial y por qué importa",
    description:
      "Explicación clara del rol de La Gaceta en Honduras, qué se publica ahí y cómo usarla para confirmar vigencia.",
    category: "Metodología",
    updatedAt: "2026-08-04",
    readingMinutes: 6,
    sections: [
      {
        heading: "Publicidad oficial, no “noticia opcional”",
        paragraphs: [
          "La Gaceta da publicidad formal a actos del Estado. Esa publicidad importa para la seguridad jurídica: ciudadanos, empresas y operadores de justicia necesitan un punto de referencia común sobre qué se decretó y cuándo. Por eso, en investigación legal seria, “lo vi en redes” no alcanza.",
        ],
      },
      {
        heading: "Qué tipo de contenidos suelen aparecer",
        paragraphs: [
          "Además de decretos que reforman códigos y leyes, La Gaceta puede incluir acuerdos, avisos, licitaciones, registros y otros actos. No todo lo publicado tiene el mismo valor normativo ni el mismo interés para tu caso. Aprende a filtrar: ¿esto crea, reforma o deroga derechos y obligaciones generales, o es un aviso puntual?",
        ],
      },
      {
        heading: "Cómo usarla sin ahogarte",
        paragraphs: [
          "No leas La Gaceta de principio a fin cada día salvo que ese sea tu trabajo. Usa un flujo: tema → posible decreto → número de Gaceta → PDF → artículos modificados → actualización del texto consolidado. Biblioteca Legal HN hace precisamente ese curado: revisamos ediciones, explicamos lo relevante y mantenemos la Colección al día.",
        ],
        bullets: [
          "Busca por número de Gaceta cuando lo tengas.",
          "Lee el texto dispositivo, no solo el índice.",
          "Conecta el decreto con el código o ley afectado.",
        ],
      },
    ],
  },
  {
    slug: "guia-codigo-de-familia",
    title: "Guía para leer el Código de Familia de Honduras",
    description:
      "Cómo abordar matrimonio, filiación, alimentos y otras instituciones del Código de Familia sin perder el contexto legal.",
    category: "Familia",
    updatedAt: "2026-08-04",
    readingMinutes: 8,
    relatedCollections: [
      { name: "Código de Familia", slug: "codigo-de-familia-honduras" },
      { name: "Código de la Niñez y la Adolescencia", slug: "codigo-de-la-ninez-y-la-adolescencia-honduras" },
    ],
    sections: [
      {
        heading: "Una materia sensible requiere método",
        paragraphs: [
          "El Derecho de familia toca relaciones personales profundas. Por eso esta guía insiste en método y no en “recetas”. Antes de sacar conclusiones de un artículo, confirma hechos, competencia, procedimiento y si existen medidas de protección aplicables. Un extracto suelto puede ser engañoso.",
        ],
      },
      {
        heading: "Instituciones frecuentes",
        paragraphs: [
          "Al estudiar o consultar, agrupa por instituciones: matrimonio y su disolución; filiación; patria potestad; alimentos; adopción; y otras figuras que el código regule. Cada institución tiene requisitos, efectos y a veces procedimientos distintos. No mezcles el estándar de una con el de otra.",
        ],
        bullets: [
          "Identifica la institución exacta del conflicto.",
          "Revisa requisitos y efectos en el código.",
          "Mira si hay normas especiales de niñez o violencia que se crucen.",
        ],
      },
      {
        heading: "Cruce con otras normas",
        paragraphs: [
          "El Código de Familia no vive solo. Puede interactuar con el Código de la Niñez y la Adolescencia, normas penales, procesales y constitucionales. Si el caso involucra menores, prioriza el enfoque de protección reforzada y busca las normas específicas antes de aplicar analogías adultas.",
        ],
      },
      {
        heading: "Consulta responsable",
        paragraphs: [
          "Usa el texto vigente en la Colección para estudiar. Si hay una reforma reciente, léela en Actualizaciones. Y si el asunto es un caso real —alimentos, custodia, violencia—, busca asistencia profesional: esta guía es educativa y no reemplaza representación legal.",
        ],
      },
    ],
  },
  {
    slug: "como-citar-leyes-hondurenas",
    title: "Cómo citar leyes y códigos hondureños en trabajos universitarios",
    description:
      "Buenas prácticas para citar artículos, decretos y La Gaceta en ensayos, tesis y parciales de Derecho en Honduras.",
    category: "Estudiantes",
    updatedAt: "2026-08-04",
    readingMinutes: 7,
    sections: [
      {
        heading: "Citar bien es parte del razonamiento",
        paragraphs: [
          "Una cita legal útil permite que otra persona encuentre exactamente el mismo texto. Decir “según el Código Penal” sin artículo, o inventar un número, destruye la credibilidad del argumento. En la universidad y en la práctica, la precisión no es pedantería: es verificabilidad.",
        ],
      },
      {
        heading: "Elementos mínimos de una cita normativa",
        paragraphs: [
          "Incluye, cuando sea posible: nombre de la norma, artículo (y si aplica, párrafo o inciso), y dato de vigencia o reforma si es relevante. Si citas un decreto reformatorio, agrega número de decreto y, idealmente, número y fecha de La Gaceta.",
        ],
        bullets: [
          "Código/Ley + artículo concreto.",
          "Inciso o numeral si cambia el sentido.",
          "Decreto reformatorio + Gaceta cuando discutas un cambio.",
        ],
      },
      {
        heading: "Errores que bajan nota (y credibilidad)",
        paragraphs: [
          "Citar doctrina como si fuera ley. Mezclar versiones. Copiar un artículo de un blog sin contrastarlo. Usar mayúsculas y comillas de forma inconsistente. Y, sobre todo, construir un párrafo entero sin una sola ancla normativa cuando el enunciado es claramente jurídico.",
        ],
      },
      {
        heading: "Flujo recomendado con Biblioteca Legal HN",
        paragraphs: [
          "Abre el artículo en la Colección, copia el número exacto, verifica que el texto esté vigente y, si tu tesis depende de una reforma, cita también la Actualización o la Gaceta. Así tu bibliografía normativa queda auditables en minutos.",
        ],
      },
    ],
  },
  {
    slug: "derechos-basicos-proteccion-al-consumidor",
    title: "Protección al consumidor en Honduras: guía básica",
    description:
      "Introducción a la Ley de Protección al Consumidor: derechos esenciales, reclamos y cómo leer la norma con criterio práctico.",
    category: "Consumidor",
    updatedAt: "2026-08-04",
    readingMinutes: 8,
    relatedCollections: [
      {
        name: "Ley de Protección al Consumidor",
        slug: "ley-de-proteccion-al-consumidor-honduras",
      },
    ],
    sections: [
      {
        heading: "Por qué esta ley aparece en la vida diaria",
        paragraphs: [
          "Compras, garantías, publicidad engañosa, contratos de adhesión y servicios esenciales están en el centro de la protección al consumidor. No necesitas ser abogado para beneficiarte de entender el marco: necesitas saber qué mirar en el contrato, qué evidencia guardar y qué dice la ley sobre prácticas abusivas.",
        ],
      },
      {
        heading: "Cómo abordar la norma",
        paragraphs: [
          "Empieza por los derechos básicos del consumidor y las obligaciones del proveedor. Luego ubica el capítulo de procedimientos o reclamos. Un error común es leer solo el derecho sustantivo (“tengo derecho a…”) y no el camino para ejercerlo.",
        ],
        bullets: [
          "Guarda factura, contrato y publicidad que te indujo a contratar.",
          "Describe el problema con fechas y montos.",
          "Busca en la ley la práctica o garantía aplicable.",
          "Sigue la vía de reclamo que corresponda antes de escalar.",
        ],
      },
      {
        heading: "Contratos de adhesión y letra pequeña",
        paragraphs: [
          "Muchas relaciones de consumo se firman con cláusulas prediseñadas. La ley suele poner límites a cláusulas abusivas o a la falta de información clara. Al estudiar el tema, no te quedes en el eslogan “el consumidor siempre gana”: analiza requisitos, excepciones y carga de prueba.",
        ],
      },
      {
        heading: "Consulta del texto vigente",
        paragraphs: [
          "Revisa la Ley de Protección al Consumidor en la Colección y confirma reformas en Actualizaciones. Esta guía es educativa; un reclamo concreto puede exigir asesoría y revisión del contrato específico.",
        ],
      },
    ],
  },
  {
    slug: "guia-ley-de-transito",
    title: "Guía básica de la Ley de Tránsito de Honduras",
    description:
      "Cómo leer la Ley de Tránsito: circulación, infracciones, responsabilidades y verificación de reformas relevantes.",
    category: "Tránsito",
    updatedAt: "2026-08-04",
    readingMinutes: 8,
    relatedCollections: [
      { name: "Ley de Tránsito", slug: "ley-de-transito-honduras" },
    ],
    sections: [
      {
        heading: "Más que multas: un sistema de reglas",
        paragraphs: [
          "La Ley de Tránsito organiza la circulación, requisitos para conducir, infracciones y consecuencias. Entenderla ayuda tanto a conductores como a estudiantes que enfrentan casos prácticos de responsabilidad o procedimiento administrativo.",
        ],
      },
      {
        heading: "Lee por escenarios, no por miedo a la multa",
        paragraphs: [
          "En lugar de memorizar un catálogo entero, estudia por escenarios: requisitos de licencia; reglas de circulación; accidentes; infracciones y recursos. Cuando ocurra un hecho real, clasifícalo y recién ahí baja al artículo puntual.",
        ],
        bullets: [
          "¿El tema es preventivo (requisitos) o sancionador (infracción)?",
          "¿Hay daño a personas o solo incumplimiento formal?",
          "¿Qué autoridad actúa y qué recurso cabe?",
        ],
      },
      {
        heading: "Reformas y amnistías",
        paragraphs: [
          "En tránsito es frecuente ver reformas, reglamentos y medidas temporales (por ejemplo, amnistías de pago). Esas medidas pueden cambiar el panorama práctico sin “reescribir” toda la ley. Por eso conviene contrastar el texto base con Actualizaciones y Gacetas antes de concluir qué aplica hoy.",
        ],
      },
      {
        heading: "Uso responsable",
        paragraphs: [
          "Consulta el texto vigente en la Colección. Esta guía no decide un caso particular de accidente o sanción: te entrena a encontrar la norma correcta y a verificar su vigencia.",
        ],
      },
    ],
  },
];
