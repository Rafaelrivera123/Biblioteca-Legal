import type { Guide } from "./types";

export const guidesBatchC: Guide[] = [
  {
    slug: "acceso-informacion-publica-honduras",
    title: "Acceso a la información pública en Honduras",
    description:
      "Introducción a la Ley de Transparencia y Acceso a la Información Pública: para qué sirve y cómo leerla con sentido práctico.",
    category: "Transparencia",
    updatedAt: "2026-08-04",
    readingMinutes: 8,
    relatedCollections: [
      {
        name: "Ley de Transparencia y Acceso a la Información Pública",
        slug: "ley-transparencia-acceso-informacion-publica-honduras",
      },
    ],
    sections: [
      {
        heading: "El acceso a la información como herramienta ciudadana",
        paragraphs: [
          "La transparencia no es solo un eslogan institucional. La posibilidad de solicitar información pública permite fiscalizar, investigar y tomar decisiones informadas. Para usarla bien, hay que distinguir qué información es pública, qué puede reservarse y qué procedimiento sigue una solicitud.",
        ],
      },
      {
        heading: "Cómo estudiar la ley",
        paragraphs: [
          "Organiza la lectura en bloques: principios; sujetos obligados; información pública vs. reservada o confidencial; procedimiento de solicitud; y recursos o reclamos. Ese mapa evita perderte en definiciones aisladas.",
        ],
        bullets: [
          "Identifica si el obligado es un sujeto alcanzado por la ley.",
          "Formula el pedido de forma clara y concreta.",
          "Revisa causales de reserva antes de asumir una negativa ilegal.",
          "Conserva constancia de la solicitud y de la respuesta.",
        ],
      },
      {
        heading: "Límites y expectativas realistas",
        paragraphs: [
          "No toda información en poder del Estado se entrega automáticamente. Existen límites legítimos. El punto es que la reserva debe fundarse en la norma, no en la comodidad administrativa. Al analizar un caso, mira tanto el derecho de acceso como las excepciones expresamente reguladas.",
        ],
      },
      {
        heading: "Consulta del texto",
        paragraphs: [
          "Lee la ley en la Colección y vigila reformas en Actualizaciones. Esta guía es educativa y no garantiza el resultado de una solicitud concreta.",
        ],
      },
    ],
  },
  {
    slug: "como-usar-biblioteca-legal-hn",
    title: "Cómo usar Biblioteca Legal HN paso a paso",
    description:
      "Recorrido práctico por Colección, Actualizaciones, Gacetas y herramientas de estudio para aprovechar la plataforma.",
    category: "Plataforma",
    updatedAt: "2026-08-04",
    readingMinutes: 6,
    sections: [
      {
        heading: "Qué problema resuelve la plataforma",
        paragraphs: [
          "Biblioteca Legal HN concentra el texto vigente de leyes y códigos hondureños, explica reformas recientes y permite volver a la fuente oficial en La Gaceta. El objetivo es reducir la dependencia de fotocopias desactualizadas y de resúmenes no verificados.",
        ],
      },
      {
        heading: "Flujo recomendado de estudio",
        paragraphs: [
          "Un flujo eficiente es:",
        ],
        bullets: [
          "Busca el documento en Colección y lee el artículo completo.",
          "Si el tema es reciente, revisa Actualizaciones Legales.",
          "Abre la Gaceta relacionada cuando necesites el PDF oficial.",
          "Usa resúmenes en lenguaje claro, marcadores y notas si tienes Plan Personal.",
        ],
      },
      {
        heading: "Qué es gratis y qué es opcional",
        paragraphs: [
          "El texto legal completo de la Colección puede consultarse sin pagar. Las herramientas de productividad —resúmenes en lenguaje claro fuera del rango gratuito, marcadores, notas y mayor uso del asistente legal— pertenecen al plan de suscripción. Esa separación importa: la norma permanece accesible; lo premium potencia el estudio.",
        ],
      },
      {
        heading: "Buenas prácticas",
        paragraphs: [
          "Cita artículos con número exacto, verifica vigencia y no trates un resumen como si fuera el texto legal. Si encuentras una diferencia entre un material externo y la Colección, prioriza el contraste con La Gaceta.",
        ],
      },
    ],
  },
  {
    slug: "diferencia-codigo-y-ley-especial",
    title: "Diferencia entre un código y una ley especial",
    description:
      "Cuándo aplicar un código general y cuándo una ley especial prevalece en el análisis jurídico hondureño.",
    category: "Teoría práctica",
    updatedAt: "2026-08-04",
    readingMinutes: 7,
    relatedCollections: [
      { name: "Código de Comercio", slug: "codigo-de-comercio-honduras" },
      { name: "Código Civil", slug: "codigo-civil-honduras" },
    ],
    sections: [
      {
        heading: "Códigos: visión sistemática",
        paragraphs: [
          "Un código organiza de forma sistemática un sector del Derecho (civil, penal, comercio, trabajo). Suele ser el “mapa general”. Una ley especial regula un problema más concreto —por ejemplo, una actividad regulada, un procedimiento particular o un sujeto específico— y puede desplazar al código en lo que específicamente norma.",
        ],
      },
      {
        heading: "La regla práctica de especialidad",
        paragraphs: [
          "Si el caso cae claramente en el supuesto de una ley especial, empieza por esa ley. Usa el código para llenar lagunas o interpretar instituciones generales. Si haces lo inverso, puedes aplicar una regla general que el legislador ya exceptuó.",
        ],
        bullets: [
          "¿Existe ley especial sobre el mismo supuesto?",
          "¿La ley especial regula el punto exacto en disputa?",
          "Si hay silencio, ¿el código ofrece regla residual?",
        ],
      },
      {
        heading: "Ejemplo de mentalidad de trabajo",
        paragraphs: [
          "En materia mercantil, no todo se resuelve solo con el Código de Comercio: pueden existir leyes de mercados, sociedades, consumidores o regulación financiera. El buen hábito es mapear el entramado antes de citar el primer artículo cómodo.",
        ],
      },
      {
        heading: "Cómo ayudarte con la Colección",
        paragraphs: [
          "Usa la Colección para abrir código y ley especial lado a lado. Si una reforma cambió la frontera entre ambas, revísala en Actualizaciones. Esa comparación es más valiosa que memorizar definiciones abstractas.",
        ],
      },
    ],
  },
  {
    slug: "introduccion-codigo-de-comercio",
    title: "Introducción al Código de Comercio de Honduras",
    description:
      "Guía de entrada al Código de Comercio: comerciantes, sociedades, títulos y contratos mercantiles en perspectiva estudiantil.",
    category: "Mercantil",
    updatedAt: "2026-08-04",
    readingMinutes: 9,
    relatedCollections: [
      { name: "Código de Comercio", slug: "codigo-de-comercio-honduras" },
    ],
    sections: [
      {
        heading: "Para qué sirve este código",
        paragraphs: [
          "El Código de Comercio regula actos de comercio, estatuto del comerciante, sociedades mercantiles y varias instituciones del tráfico económico. Si vienes del Civil, no asumas que las mismas reglas de contratos o personas se trasladan sin matices: el Derecho mercantil tiene lógica propia de celeridad, formalidades y tipicidad societaria.",
        ],
      },
      {
        heading: "Ruta de lectura para no perderte",
        paragraphs: [
          "Una ruta razonable es: actos de comercio y comerciantes; contabilidad y obligaciones profesionales básicas; sociedades; títulos valores; y contratos mercantiles relevantes. Según tu curso o caso, profundiza un bloque y usa los demás como contexto.",
        ],
        bullets: [
          "Clasifica si el acto es mercantil.",
          "Identifica el tipo societario antes de hablar de “la empresa”.",
          "Separa obligaciones internas (socios) de externas (terceros).",
        ],
      },
      {
        heading: "Reformas recientes y por qué importan",
        paragraphs: [
          "El Derecho societario y mercantil evoluciona con transparencia, beneficiario final, títulos y obligaciones de registro. Antes de citar un artículo “clásico” de sociedades, confirma que no fue reformado. En Actualizaciones Legales priorizamos precisamente esos cambios de alto impacto.",
        ],
      },
      {
        heading: "Consulta recomendada",
        paragraphs: [
          "Abre el Código de Comercio en la Colección, estudia por instituciones y verifica vigencia. Esta introducción no reemplaza un manual mercantil, pero te da brújula para entrar al texto oficial sin navegar a ciegas.",
        ],
      },
    ],
  },
  {
    slug: "codigo-de-la-ninez-y-adolescencia-guia",
    title: "Guía del Código de la Niñez y la Adolescencia",
    description:
      "Cómo acercarse al Código de la Niñez y la Adolescencia en Honduras con enfoque de protección y lectura sistemática.",
    category: "Niñez",
    updatedAt: "2026-08-04",
    readingMinutes: 8,
    relatedCollections: [
      {
        name: "Código de la Niñez y la Adolescencia",
        slug: "codigo-de-la-ninez-y-la-adolescencia-honduras",
      },
      { name: "Código de Familia", slug: "codigo-de-familia-honduras" },
    ],
    sections: [
      {
        heading: "Un enfoque distinto al Derecho “adulto”",
        paragraphs: [
          "Esta normativa parte de la protección integral de niñas, niños y adolescentes. Eso cambia la forma de interpretar plazos, participación, interés superior y medidas de protección. Leerla como si fuera un código civil más es un error de método.",
        ],
      },
      {
        heading: "Cómo organizar el estudio",
        paragraphs: [
          "Separa derechos y garantías; deberes de familia, sociedad y Estado; medidas de protección; e infracciones o responsabilidades según el diseño del código. Cuando un caso cruce con familia, penal o educativo, identifica primero la norma especial de niñez.",
        ],
        bullets: [
          "Interés superior como criterio de interpretación.",
          "Identificación de autoridad competente.",
          "Medidas de protección vs. respuestas punitivas adultas.",
        ],
      },
      {
        heading: "Cruce con tratados y Constitución",
        paragraphs: [
          "El marco de niñez se interpreta también a la luz de la Constitución y de instrumentos internacionales relevantes. En trabajos universitarios, menciona ese bloque cuando el problema involucre estándares de protección, no solo un artículo aislado del código.",
        ],
      },
      {
        heading: "Uso responsable del texto",
        paragraphs: [
          "Consulta el código vigente en la Colección. Si enfrentas un caso real de riesgo o violencia, contacta autoridades y profesionales competentes: esta guía es únicamente educativa.",
        ],
      },
    ],
  },
  {
    slug: "que-pasa-cuando-se-deroga-una-ley",
    title: "Qué pasa cuando se deroga una ley en Honduras",
    description:
      "Efectos básicos de una derogación, vigencia residual y cómo verificar qué norma queda aplicable.",
    category: "Metodología",
    updatedAt: "2026-08-04",
    readingMinutes: 7,
    sections: [
      {
        heading: "Derogar no es “borrar la historia”",
        paragraphs: [
          "Cuando una norma se deroga, deja de regir hacia el futuro en los términos del decreto derogatorio. Eso no significa que desaparezcan automáticamente todos los efectos de situaciones ocurridas bajo la ley anterior. Por eso importan las disposiciones transitorias y las reglas de derecho intertemporal.",
        ],
      },
      {
        heading: "Preguntas que debes hacer",
        paragraphs: [
          "Ante una derogación, pregunta:",
        ],
        bullets: [
          "¿Se deroga toda la ley o solo artículos?",
          "¿Hay una norma nueva que la sustituye?",
          "¿Qué ocurre con procedimientos ya iniciados?",
          "¿El decreto fija una fecha especial de vigencia?",
        ],
      },
      {
        heading: "Derogación expresa vs. tácita",
        paragraphs: [
          "La derogación expresa nombra la norma o artículos que caen. La tácita aparece cuando una norma posterior incompatible regula el mismo objeto. En la práctica profesional se prefiere la claridad de la derogación expresa, pero el intérprete debe estar atento a incompatibilidades reales.",
        ],
      },
      {
        heading: "Cómo verificarlo aquí",
        paragraphs: [
          "En Actualizaciones Legales etiquetamos derogaciones y explicamos el impacto. En la Colección el texto vigente deja de presentar como actual lo que ya no rige. Y en Gacetas queda el decreto oficial para auditoría. Ese triple registro evita citar normas muertas como si estuvieran vivas.",
        ],
      },
    ],
  },
  {
    slug: "guia-codigo-procesal-penal",
    title: "Cómo leer el Código Procesal Penal de Honduras",
    description:
      "Guía de orientación sobre el proceso penal acusatorio en Honduras: etapas, roles y relación con el Código Penal.",
    category: "Procesal",
    updatedAt: "2026-08-04",
    readingMinutes: 9,
    relatedCollections: [
      { name: "Código Procesal Penal", slug: "codigo-procesal-penal-honduras" },
      { name: "Código Penal", slug: "codigo-penal-honduras" },
    ],
    sections: [
      {
        heading: "Sustantivo vs. procesal",
        paragraphs: [
          "El Código Penal dice qué conductas son delito y qué penas corresponden. El Código Procesal Penal organiza cómo se investiga, se acusa y se juzga. Estudiar uno sin el otro produce respuestas incompletas del tipo “es delito, entonces automáticamente hay condena”, lo cual ignora garantías y estándar probatorio.",
        ],
      },
      {
        heading: "Lee el proceso por etapas",
        paragraphs: [
          "Una forma eficaz de estudiar es seguir el caso a lo largo del tiempo: actos iniciales, investigación, etapas intermedias, juicio y recursos. En cada etapa pregunta quién actúa (fiscalía, defensa, juez) y qué decisión se espera.",
        ],
        bullets: [
          "¿Qué garantía está en juego?",
          "¿Qué acto procesal se discute?",
          "¿Qué recurso o control cabe?",
        ],
      },
      {
        heading: "Principios que no debes saltarte",
        paragraphs: [
          "Presunción de inocencia, debido proceso, legalidad de la prueba y roles separados entre investigar y juzgar son brújulas de lectura. Si un artículo parece “atajo”, contrástalo con esos principios antes de concluir.",
        ],
      },
      {
        heading: "Consulta actualizada",
        paragraphs: [
          "Usa el texto vigente del Código Procesal Penal en la Colección y revisa Actualizaciones cuando haya reformas procesales. Esta guía es un mapa de estudio, no un manual de litigación.",
        ],
      },
    ],
  },
];
