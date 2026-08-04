import type { Guide } from "./types";

export const guidesBatchA: Guide[] = [
  {
    slug: "como-consultar-leyes-actualizadas-honduras",
    title: "Cómo consultar leyes actualizadas en Honduras",
    description:
      "Aprende a ubicar el texto vigente de una ley o código hondureño, verificar si fue reformado y contrastarlo con La Gaceta oficial.",
    category: "Metodología",
    updatedAt: "2026-08-04",
    readingMinutes: 8,
    relatedCollections: [
      { name: "Constitución de la República de Honduras", slug: "constitucion-de-la-republica-de-honduras" },
      { name: "Código Penal", slug: "codigo-penal-honduras" },
    ],
    sections: [
      {
        heading: "Por qué el texto “impreso” no siempre está vigente",
        paragraphs: [
          "En Honduras las leyes y códigos se modifican con frecuencia mediante decretos publicados en La Gaceta. Un manual universitario, una fotocopia o un PDF antiguo pueden contener artículos que ya fueron reformados o derogados. Consultar el texto vigente no es un detalle académico: cambia plazos, penas, requisitos y derechos.",
          "El método correcto combina tres piezas: (1) el texto consolidado del cuerpo legal, (2) la fecha o el decreto de la última reforma relevante, y (3) el respaldo oficial en La Gaceta cuando necesites verificar un cambio concreto.",
        ],
      },
      {
        heading: "Paso a paso para una consulta confiable",
        paragraphs: [
          "Empieza por identificar el nombre oficial del instrumento (por ejemplo, Código del Trabajo o Ley de Tránsito) y el artículo o tema que te interesa. Luego abre el documento en una biblioteca actualizada y lee el artículo completo en su contexto: título, capítulo y artículos vecinos suelen aclarar el sentido de la norma.",
          "Si el tema es reciente o polémico, busca también si existe una actualización legal que explique qué cambió. Una reforma puede tocar un solo inciso o reescribir todo un capítulo; el resumen en lenguaje claro te orienta, pero la decisión jurídica siempre debe anclarse al texto oficial.",
        ],
        bullets: [
          "Identifica el cuerpo legal y el número de artículo.",
          "Lee el texto vigente completo, no solo un extracto suelto.",
          "Revisa si hay reformas recientes en Actualizaciones Legales.",
          "Cuando dudes, abre el PDF de La Gaceta correspondiente.",
        ],
      },
      {
        heading: "Errores frecuentes al “buscar la ley”",
        paragraphs: [
          "El error más común es mezclar versiones: citar un artículo con la numeración antigua o con un texto ya sustituido. Otro error es tomar como vigente un proyecto de ley, un comunicado de prensa o un resumen de redes sociales. Esos materiales pueden ayudar a entender el debate, pero no sustituyen el decreto publicado.",
          "También conviene distinguir entre vigencia formal (la norma ya fue publicada y entró en vigor) y aplicación práctica (reglamentos, jurisprudencia o actos administrativos que la desarrollan). Para estudiar o argumentar, parte siempre del texto vigente y luego suma las capas que correspondan.",
        ],
      },
      {
        heading: "Cómo hacerlo en Biblioteca Legal HN",
        paragraphs: [
          "En la Colección encuentras el texto consolidado de leyes y códigos. En Actualizaciones Legales publicamos reformas, nuevas leyes y derogaciones con explicación del cambio. En Gacetas Oficiales puedes localizar el PDF original que respalda cada actualización. Esa cadena —texto vigente, explicación y fuente oficial— es la forma más segura de consultar legislación hondureña sin depender de fotocopias desactualizadas.",
        ],
      },
    ],
  },
  {
    slug: "como-leer-el-codigo-penal-vigente",
    title: "Cómo leer el Código Penal vigente de Honduras",
    description:
      "Guía práctica para orientarte en el Código Penal hondureño: estructura, tipos penales, penas y cómo verificar reformas recientes.",
    category: "Códigos",
    updatedAt: "2026-08-04",
    readingMinutes: 9,
    relatedCollections: [
      { name: "Código Penal", slug: "codigo-penal-honduras" },
      { name: "Código Procesal Penal", slug: "codigo-procesal-penal-honduras" },
    ],
    sections: [
      {
        heading: "Qué es (y qué no es) el Código Penal",
        paragraphs: [
          "El Código Penal define delitos y establece penas. No explica solo “cómo se investiga un caso”: eso corresponde principalmente al Código Procesal Penal. Confundir ambas normas es uno de los tropiezos más habituales de estudiantes de primer año y de ciudadanos que buscan entender una noticia policial.",
          "El código vigente en Honduras modernizó el sistema penal respecto de textos anteriores. Al consultarlo, asegúrate de estar en la versión consolidada y no en un extracto previo a las reformas posteriores a su entrada en vigor.",
        ],
      },
      {
        heading: "Cómo está organizado",
        paragraphs: [
          "Como la mayoría de códigos penales, suele distinguirse una parte general (principios, autoría, tentativa, penas, circunstancias) y una parte especial (delitos concretos: contra la vida, el patrimonio, la administración pública, etc.). Antes de saltar al delito que te interesa, revisa si la parte general cambia el resultado: una circunstancia atenuante o una regla de concurso puede ser decisiva.",
          "Lee también las definiciones y los verbos típicos del tipo penal (“el que…”, “quien…”) y presta atención a elementos como dolo, culpa, resultado o sujetos especiales (funcionario, comerciante, etc.).",
        ],
      },
      {
        heading: "Método de lectura para un artículo penal",
        paragraphs: [
          "Un método simple y efectivo: (1) identifica la conducta prohibida, (2) identifica el bien jurídico o el contexto del título, (3) mira la pena y si hay modalidades agravadas o atenuadas, (4) revisa artículos cercanos que completen el tipo, y (5) confirma si el artículo fue reformado recientemente.",
          "Si estás estudiando para un examen, no memorices solo la pena: entiende la estructura del tipo. Si eres ciudadano intentando comprender una noticia, evita concluir culpabilidad solo con el nombre del delito; el proceso penal tiene sus propias reglas de prueba y garantías.",
        ],
        bullets: [
          "Parte general + parte especial: léelas en ese orden mental.",
          "Compara el artículo con sus agravantes y tipos relacionados.",
          "Contrasta siempre con el Código Procesal Penal cuando preguntes “qué sigue después”.",
        ],
      },
      {
        heading: "Reformas y vigencia",
        paragraphs: [
          "El Derecho penal cambia. Una reforma puede ampliar un tipo, reducir una pena o crear un delito nuevo. Por eso, después de leer el artículo en el código, revisa Actualizaciones Legales y, si el asunto es crítico, el decreto en La Gaceta. En Biblioteca Legal HN el Código Penal está disponible como texto consultable artículo por artículo para facilitar esa verificación.",
        ],
      },
    ],
  },
  {
    slug: "guia-codigo-del-trabajo-empleados",
    title: "Guía del Código del Trabajo para empleados en Honduras",
    description:
      "Explicación clara de derechos laborales básicos en Honduras: jornada, salario, descanso, estabilidad y cómo leer el Código del Trabajo.",
    category: "Laboral",
    updatedAt: "2026-08-04",
    readingMinutes: 10,
    relatedCollections: [
      { name: "Código del Trabajo", slug: "codigo-del-trabajo-honduras" },
    ],
    sections: [
      {
        heading: "Para quién es esta guía",
        paragraphs: [
          "Esta guía está pensada para empleados, estudiantes y cualquier persona que necesite entender el marco general del trabajo subordinado en Honduras. No sustituye asesoría de un abogado laboral ni la revisión de un contrato concreto, pero sí te ayuda a saber qué buscar en el Código del Trabajo y qué preguntas hacer.",
          "El Código del Trabajo regula relaciones laborales individuales y colectivas. Muchas discusiones cotidianas —horas extras, vacaciones, despido, salario mínimo, fuero sindical— tienen respuesta (o al menos punto de partida) en sus artículos.",
        ],
      },
      {
        heading: "Conceptos que debes dominar primero",
        paragraphs: [
          "Antes de saltar a un artículo aislado, aclara si existe una relación de trabajo (prestación personal, subordinación y remuneración). No todo servicio pagado es automáticamente laboral; tampoco todo “contrato de servicios profesionales” escapa al análisis si en la práctica hay subordinación.",
          "Luego ubica el tema: contratación, jornada, descansos, salario, terminación, riesgos profesionales o derecho colectivo. El código se entiende mejor por instituciones, no por búsqueda de una sola palabra en un PDF.",
        ],
        bullets: [
          "Relación de trabajo vs. prestación civil o mercantil.",
          "Jornada ordinaria, extraordinaria y descansos.",
          "Salario, prestaciones y formas de pago.",
          "Terminación del contrato y posibles indemnizaciones.",
        ],
      },
      {
        heading: "Cómo leer un problema laboral real",
        paragraphs: [
          "Traduce el problema a hechos: fecha de ingreso, tipo de contrato, salario, horario, qué ocurrió y qué documentos tienes (contratos, boletas, mensajes, actas). Con esos hechos, busca en el código la institución aplicable. Un despido no se analiza igual que una reducción de jornada o un reclamo de horas extras.",
          "Revisa también si existen leyes especiales, reglamentos internos o convenios colectivos que complementen el código. La norma general no siempre es la única pieza del tablero.",
        ],
      },
      {
        heading: "Buenas prácticas al consultar el código",
        paragraphs: [
          "Lee el artículo completo y los que lo rodean. Anota el número exacto. Verifica si hubo reformas recientes. Y recuerda: conocer tu derecho te permite negociar y documentar mejor, pero los plazos y procedimientos ante inspecciones o juzgados laborales tienen reglas propias. Usa el texto vigente del Código del Trabajo en la Colección como base y complementa con Actualizaciones Legales cuando el tema haya cambiado.",
        ],
      },
    ],
  },
  {
    slug: "como-verificar-decreto-en-la-gaceta",
    title: "Cómo verificar un decreto en La Gaceta de Honduras",
    description:
      "Paso a paso para confirmar si un decreto, reforma o acuerdo realmente fue publicado en La Gaceta y qué efectos tiene.",
    category: "Metodología",
    updatedAt: "2026-08-04",
    readingMinutes: 7,
    sections: [
      {
        heading: "La Gaceta como fuente de verdad formal",
        paragraphs: [
          "La Gaceta es el diario oficial de la República de Honduras. Ahí se publican decretos legislativos, decretos ejecutivos, acuerdos, reglamentos y otros actos que requieren publicidad oficial. Si alguien afirma “ya salió la reforma”, la pregunta correcta es: ¿en qué número de La Gaceta y en qué fecha?",
          "Sin ese dato, es fácil confundir un anteproyecto, una iniciativa, una noticia o un rumor con una norma vigente.",
        ],
      },
      {
        heading: "Datos mínimos que debes pedir",
        paragraphs: [
          "Para verificar un acto oficial conviene reunir: número de La Gaceta, fecha de publicación, tipo de norma (decreto legislativo, ejecutivo, acuerdo, etc.), número del decreto y el cuerpo legal que reforma o crea. Con esos elementos puedes localizar el PDF y leer el texto dispositivo —no solo el titular mediático—.",
        ],
        bullets: [
          "Número de Gaceta y fecha.",
          "Número y tipo de decreto o acuerdo.",
          "Artículos reformados, derogados o creados.",
          "Vigencia: desde cuándo aplica.",
        ],
      },
      {
        heading: "Qué mirar dentro del PDF",
        paragraphs: [
          "No te quedes en la carátula. Busca el artículo que modifica, el texto que se sustituye y las disposiciones transitorias. Muchas reformas “entran en vigor” en una fecha distinta a la de publicación, o aplican solo a ciertos sujetos. También revisa si el decreto ordena a una secretaría emitir un reglamento: a veces la norma madre existe, pero su operatividad práctica depende de normas secundarias.",
        ],
      },
      {
        heading: "Verificación rápida con Biblioteca Legal HN",
        paragraphs: [
          "En Gacetas Oficiales puedes buscar por número y, cuando el archivo sigue disponible, descargar el PDF. En Actualizaciones Legales resumimos el cambio en lenguaje claro y enlazamos el contexto. Si la reforma afecta un código o ley de la Colección, el texto vigente del documento se actualiza artículo por artículo para que no tengas que reconstruir la norma a mano.",
        ],
      },
    ],
  },
  {
    slug: "diferencia-ley-decreto-reglamento-acuerdo",
    title: "Diferencia entre ley, decreto, reglamento y acuerdo en Honduras",
    description:
      "Guía clara para distinguir los principales tipos de normas en el ordenamiento hondureño y saber cuál prevalece.",
    category: "Teoría práctica",
    updatedAt: "2026-08-04",
    readingMinutes: 8,
    relatedCollections: [
      { name: "Constitución de la República de Honduras", slug: "constitucion-de-la-republica-de-honduras" },
    ],
    sections: [
      {
        heading: "Por qué importa el nombre de la norma",
        paragraphs: [
          "En conversaciones cotidianas mucha gente llama “ley” a cualquier regla del Estado. En sentido estricto, no es lo mismo una ley aprobada por el Congreso, un decreto ejecutivo, un reglamento o un acuerdo ministerial. El tipo de norma indica quién la emitió, qué puede regular y cómo se controla su validez.",
        ],
      },
      {
        heading: "Mapa rápido de instrumentos",
        paragraphs: [
          "La Constitución es la norma superior. Las leyes (y códigos, que son leyes sistemáticas) desarrollan el marco general. Los decretos pueden tener distinta naturaleza según su origen: hay decretos legislativos y decretos del Poder Ejecutivo. Los reglamentos suelen desarrollar o ejecutar leyes. Los acuerdos y resoluciones suelen ser actos administrativos más puntuales, aunque su impacto práctico puede ser enorme (tarifas, nombramientos, procedimientos).",
        ],
        bullets: [
          "Constitución: marco supremo.",
          "Ley / código: reglas generales con rango legal.",
          "Decreto: acto formal cuyo alcance depende de su tipo y fundamento.",
          "Reglamento: normalmente desarrolla la ley.",
          "Acuerdo / resolución: a menudo gestión o ejecución administrativa.",
        ],
      },
      {
        heading: "Jerarquía y conflictos",
        paragraphs: [
          "Cuando dos normas parecen chocarse, no gana “la más reciente” de forma automática sin mirar el rango. Una norma inferior no puede contradecir una superior. Tampoco conviene aplicar un acuerdo como si reformara un código. En la práctica, primero se identifica el rango, luego la especialidad del tema y después la vigencia temporal.",
          "Para estudiantes, un ejercicio útil es tomar una noticia (“el gobierno emitió un acuerdo…”) y preguntar: ¿qué ley habilita ese acuerdo? ¿puede modificar derechos creados por ley? ¿requiere publicación en La Gaceta?",
        ],
      },
      {
        heading: "Cómo usar esta distinción al investigar",
        paragraphs: [
          "Si buscas derechos y obligaciones generales, empieza por Constitución, códigos y leyes. Si buscas el procedimiento concreto de una institución, mira reglamentos y acuerdos. Si necesitas confirmar un cambio reciente, ve a La Gaceta. Biblioteca Legal HN organiza precisamente esas capas: cuerpos legales en la Colección, cambios recientes en Actualizaciones y PDFs oficiales en Gacetas.",
        ],
      },
    ],
  },
  {
    slug: "como-leer-el-codigo-civil",
    title: "Cómo leer el Código Civil de Honduras",
    description:
      "Orientación para estudiar personas, bienes, obligaciones y contratos en el Código Civil hondureño sin perderte en la estructura.",
    category: "Códigos",
    updatedAt: "2026-08-04",
    readingMinutes: 9,
    relatedCollections: [
      { name: "Código Civil", slug: "codigo-civil-honduras" },
      { name: "Código de Familia", slug: "codigo-de-familia-honduras" },
    ],
    sections: [
      {
        heading: "El Código Civil como “sistema”",
        paragraphs: [
          "El Código Civil no es una lista de frases sueltas: es un sistema. Las reglas sobre capacidad, bienes, obligaciones y contratos se remiten entre sí. Por eso, leer un artículo de compraventa sin revisar obligaciones o vicios del consentimiento suele producir conclusiones incompletas.",
          "Además, parte de la materia familiar u otras áreas puede estar en leyes o códigos especiales. Antes de afirmar “el Civil dice X”, confirma que esa materia no fue desplazada por una norma posterior o especial.",
        ],
      },
      {
        heading: "Bloques mentales útiles",
        paragraphs: [
          "Una forma práctica de estudiar es agrupar: personas y capacidad; bienes y propiedad; sucesiones; obligaciones; contratos en general; contratos en particular. Cuando te den un caso, clasifícalo primero en uno de esos bloques. Eso reduce la tentación de buscar una palabra mágica en el índice y citar el primer artículo que aparezca.",
        ],
        bullets: [
          "¿Hay capacidad y legitimación de las partes?",
          "¿De qué bien o derecho se trata?",
          "¿Existe obligación y de qué fuente nace?",
          "¿Hay un contrato típico regulado?",
        ],
      },
      {
        heading: "Lectura de un artículo civil",
        paragraphs: [
          "Identifica si la norma es imperativa o dispositiva (si las partes pueden pactar en contrario). Mira definiciones previas. Revisa plazos de prescripción o caducidad cuando el caso lo pida. Y conecta con la prueba y el proceso: el derecho sustancial civil se hace efectivo, en muchos casos, a través del proceso civil.",
        ],
      },
      {
        heading: "Actualización y consulta",
        paragraphs: [
          "El Código Civil también se reforma. Usa la versión consolidada de la Colección, revisa Actualizaciones Legales si el tema tocó personas, bienes u obligaciones recientemente, y no mezcles doctrina extranjera con el texto hondureño sin advertir las diferencias. La doctrina ayuda a interpretar; no reemplaza el artículo vigente.",
        ],
      },
    ],
  },
  {
    slug: "guia-constitucion-politica-honduras",
    title: "Guía práctica de la Constitución de Honduras",
    description:
      "Cómo leer la Constitución Política de Honduras: derechos, organización del Estado y control de constitucionalidad a nivel introductorio.",
    category: "Constitucional",
    updatedAt: "2026-08-04",
    readingMinutes: 9,
    relatedCollections: [
      { name: "Constitución de la República de Honduras", slug: "constitucion-de-la-republica-de-honduras" },
    ],
    sections: [
      {
        heading: "Empezar por la Constitución no es “teoría abstracta”",
        paragraphs: [
          "Toda ley, decreto o actuación pública en Honduras se mide, en última instancia, contra la Constitución. Por eso, incluso cuando tu caso parece “solo laboral” o “solo penal”, conviene saber qué derechos y principios constitucionales están en juego: debido proceso, igualdad, propiedad, libertad de expresión, tipicidad penal, etc.",
        ],
      },
      {
        heading: "Estructura que sí ayuda a estudiar",
        paragraphs: [
          "Una lectura útil separa: principios y derechos fundamentales; garantías; organización de los poderes; instituciones de control; y reformas constitucionales. No intentes memorizar la Constitución de corrido. Aprende a ubicar el título correcto y a leer el artículo junto con sus límites y desarrollos legales.",
          "Cuando un derecho constitucional remite a la ley (“en la forma que señale la ley”), eso no vacía el derecho: significa que debes seguir el hilo hacia la legislación de desarrollo, sin olvidar que esa ley también tiene techo constitucional.",
        ],
      },
      {
        heading: "Conflictos entre normas",
        paragraphs: [
          "Si una ley parece chocar con la Constitución, el análisis ya no es solo de legalidad ordinaria. Aparecen preguntas sobre control constitucional, interpretación conforme y, según el caso, vías procesales específicas. Esta guía no sustituye ese análisis especializado, pero sí te entrena a detectar el conflicto en lugar de ignorarlo.",
        ],
        bullets: [
          "Identifica el derecho o principio constitucional.",
          "Identifica la norma inferior que parece restringirlo.",
          "Pregunta si la restricción tiene habilitación y proporcionalidad básicas.",
          "Busca el desarrollo legal y, si aplica, la jurisprudencia relevante.",
        ],
      },
      {
        heading: "Consulta recomendada",
        paragraphs: [
          "Lee la Constitución en la Colección como texto de cabecera. Úsala para enmarcar cualquier investigación posterior en códigos y leyes. Y cuando una reforma constitucional o una ley de desarrollo cambie el panorama, sigue el rastro en Actualizaciones y Gacetas.",
        ],
      },
    ],
  },
];
