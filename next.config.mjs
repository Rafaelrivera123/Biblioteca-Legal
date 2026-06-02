/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: "files.edgestore.dev",
        protocol: "https",
      },
      {
        hostname: "res.cloudinary.com",
        protocol: "https",
      },
      {
        hostname: "github.com",
        protocol: "https",
      },
    ],
  },
  async redirects() {
    return [
      // Slugs truncados corregidos
      {
        source: "/collections/ley-del-fondo-de-reserva-laboral-de-capitalizacion-individual-administrado-por-el-regimen-de-aportac",
        destination: "/collections/ley-fondo-reserva-laboral-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-especial-de-organizacion-y-funcionamiento-de-la-junta-nominadora-para-la-proposicion-de-candidat",
        destination: "/collections/ley-junta-nominadora-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-para-la-regulacion-de-las-aportaciones-y-cotizaciones-del-instituto-hondureno-de-seguridad-socia",
        destination: "/collections/ley-aportaciones-cotizaciones-ihss-honduras",
        permanent: true,
      },
      // Codigos
      {
        source: "/collections/codigo-civil",
        destination: "/collections/codigo-civil-honduras",
        permanent: true,
      },
      {
        source: "/collections/codigo-de-comercio",
        destination: "/collections/codigo-de-comercio-honduras",
        permanent: true,
      },
      {
        source: "/collections/codigo-del-trabajo",
        destination: "/collections/codigo-del-trabajo-honduras",
        permanent: true,
      },
      {
        source: "/collections/codigo-penal",
        destination: "/collections/codigo-penal-honduras",
        permanent: true,
      },
      {
        source: "/collections/codigo-procesal-civil",
        destination: "/collections/codigo-procesal-civil-honduras",
        permanent: true,
      },
      {
        source: "/collections/codigo-procesal-penal",
        destination: "/collections/codigo-procesal-penal-honduras",
        permanent: true,
      },
      {
        source: "/collections/codigo-tributario",
        destination: "/collections/codigo-tributario-honduras",
        permanent: true,
      },
      {
        source: "/collections/codigo-de-familia",
        destination: "/collections/codigo-de-familia-honduras",
        permanent: true,
      },
      {
        source: "/collections/codigo-de-salud",
        destination: "/collections/codigo-de-salud-honduras",
        permanent: true,
      },
      {
        source: "/collections/codigo-de-la-ninez-y-la-adolescencia",
        destination: "/collections/codigo-de-la-ninez-y-la-adolescencia-honduras",
        permanent: true,
      },
      {
        source: "/collections/codigo-del-notariado",
        destination: "/collections/codigo-del-notariado-honduras",
        permanent: true,
      },
      {
        source: "/collections/codigo-aduanero-uniforme-centroamericano-cauca",
        destination: "/collections/codigo-aduanero-uniforme-centroamericano-cauca-honduras",
        permanent: true,
      },
      {
        source: "/collections/codigo-de-conducta-etica-del-servidor-publico",
        destination: "/collections/codigo-de-conducta-etica-del-servidor-publico-honduras",
        permanent: true,
      },
      {
        source: "/collections/codigo-de-conducta-y-etica-de-los-funcionarios-y-servidores-de-la-administracion-aduanera-de-honduras",
        destination: "/collections/codigo-conducta-etica-administracion-aduanera-honduras",
        permanent: true,
      },
      {
        source: "/collections/codigo-de-etica-de-los-servidores-del-ministerio-publico",
        destination: "/collections/codigo-de-etica-servidores-ministerio-publico-honduras",
        permanent: true,
      },
      {
        source: "/collections/codigo-de-etica-del-profesional-hondureno-del-derecho",
        destination: "/collections/codigo-de-etica-del-profesional-del-derecho-honduras",
        permanent: true,
      },
      {
        source: "/collections/codigo-de-etica-notarial",
        destination: "/collections/codigo-de-etica-notarial-honduras",
        permanent: true,
      },
      {
        source: "/collections/codigo-de-etica-para-funcionarios-y-empleados-judiciales",
        destination: "/collections/codigo-de-etica-funcionarios-judiciales-honduras",
        permanent: true,
      },
      // Leyes
      {
        source: "/collections/ley-constitutiva-de-las-fuerzas-armadas",
        destination: "/collections/ley-constitutiva-de-las-fuerzas-armadas-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-contra-el-financiamiento-del-terrorismo",
        destination: "/collections/ley-contra-el-financiamiento-del-terrorismo-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-contra-la-trata-de-personas",
        destination: "/collections/ley-contra-la-trata-de-personas-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-contra-la-violencia-domestica",
        destination: "/collections/ley-contra-la-violencia-domestica-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-de-alivio-de-deuda-para-los-trabajadores",
        destination: "/collections/ley-de-alivio-de-deuda-para-los-trabajadores-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-de-conciliacion-y-arbitraje",
        destination: "/collections/ley-de-conciliacion-y-arbitraje-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-de-control-de-armas-de-fuego-municiones-explosivos-y-materiales-relacionados",
        destination: "/collections/ley-de-control-de-armas-de-fuego-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-de-equidad-tributaria",
        destination: "/collections/ley-de-equidad-tributaria-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-de-financiamiento-transparencia-y-fiscalizacion-a-los-partidos-politicos-y-candidatos",
        destination: "/collections/ley-financiamiento-partidos-politicos-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-de-fortalecimiento-de-los-ingresos-equidad-social-y-racionalizacion-del-gasto-publico",
        destination: "/collections/ley-fortalecimiento-ingresos-equidad-social-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-de-impuesto-sobre-la-renta",
        destination: "/collections/ley-de-impuesto-sobre-la-renta-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-de-la-comision-nacional-de-bancos-y-seguros",
        destination: "/collections/ley-comision-nacional-de-bancos-y-seguros-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-de-la-jurisdiccion-de-lo-contencioso-administrativo",
        destination: "/collections/ley-jurisdiccion-contencioso-administrativo-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-de-la-policia-militar-del-orden-publico",
        destination: "/collections/ley-de-la-policia-militar-del-orden-publico-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-de-mecanismos-de-participacion-ciudadana",
        destination: "/collections/ley-de-mecanismos-de-participacion-ciudadana-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-de-migracion-y-extranjeria",
        destination: "/collections/ley-de-migracion-y-extranjeria-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-de-municipalidades",
        destination: "/collections/ley-de-municipalidades-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-de-ordenamiento-territorial",
        destination: "/collections/ley-de-ordenamiento-territorial-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-de-organizacion-y-atribuciones-de-los-tribunales",
        destination: "/collections/ley-organizacion-atribuciones-tribunales-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-de-policia-y-de-convivencia-social",
        destination: "/collections/ley-de-policia-y-de-convivencia-social-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-de-procedimiento-administrativo-5-22-2026",
        destination: "/collections/ley-de-procedimiento-administrativo-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-de-propiedad",
        destination: "/collections/ley-de-propiedad-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-de-propiedad-en-condominio",
        destination: "/collections/ley-de-propiedad-en-condominio-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-de-propiedad-industrial",
        destination: "/collections/ley-de-propiedad-industrial-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-de-proteccion-al-consumidor",
        destination: "/collections/ley-de-proteccion-al-consumidor-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-de-proteccion-de-los-hondurenos-migrantes-y-sus-familiares",
        destination: "/collections/ley-proteccion-hondurenos-migrantes-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-de-proteccion-y-bienestar-animal",
        destination: "/collections/ley-de-proteccion-y-bienestar-animal-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-de-reforma-agraria",
        destination: "/collections/ley-de-reforma-agraria-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-de-seguros-de-deposito-en-instituciones-del-sistema-financiero",
        destination: "/collections/ley-seguros-de-deposito-sistema-financiero-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-de-servicio-civil",
        destination: "/collections/ley-de-servicio-civil-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-de-simplificacion-administrativa",
        destination: "/collections/ley-de-simplificacion-administrativa-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-de-sistemas-de-pago-y-liquidacion-de-valores",
        destination: "/collections/ley-sistemas-de-pago-y-liquidacion-de-valores-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-de-tarjetas-de-credito",
        destination: "/collections/ley-de-tarjetas-de-credito-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-de-transito",
        destination: "/collections/ley-de-transito-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-de-transparencia-y-acceso-a-la-informacion-publica",
        destination: "/collections/ley-transparencia-acceso-informacion-publica-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-del-banco-central-de-honduras",
        destination: "/collections/ley-del-banco-central-de-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-del-cambio-climatico",
        destination: "/collections/ley-del-cambio-climatico-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-del-consejo-nacional-anticorrupcion-cna",
        destination: "/collections/ley-consejo-nacional-anticorrupcion-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-del-equilibrio-financiero-y-la-proteccion-social",
        destination: "/collections/ley-equilibrio-financiero-proteccion-social-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-del-impuesto-sobre-ventas",
        destination: "/collections/ley-del-impuesto-sobre-ventas-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-del-instituto-de-jubilaciones-de-los-empleados-y-funcionarios-del-poder-ejecutivo-injupemp",
        destination: "/collections/ley-injupemp-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-del-instituto-hondureno-de-seguridad-social-ihss",
        destination: "/collections/ley-ihss-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-del-instituto-nacional-de-formacion-profesional-infop",
        destination: "/collections/ley-infop-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-del-instituto-nacional-de-prevision-del-magisterio-inprema",
        destination: "/collections/ley-inprema-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-del-ministerio-publico",
        destination: "/collections/ley-del-ministerio-publico-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-del-regimen-opcional-complementario-para-la-administracion-de-fondos-privados-de-pensiones",
        destination: "/collections/ley-regimen-fondos-privados-pensiones-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-del-registro-nacional-de-las-personas-rnp",
        destination: "/collections/ley-registro-nacional-personas-rnp-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-del-septimo-dia-y-decimotercer-mes-en-concepto-de-aguinaldo",
        destination: "/collections/ley-septimo-dia-aguinaldo-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-del-sistema-financiero",
        destination: "/collections/ley-del-sistema-financiero-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-especial-contra-el-lavado-de-activos",
        destination: "/collections/ley-especial-contra-el-lavado-de-activos-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-especial-para-la-gestion-asignacion-ejecucion-liquidacion",
        destination: "/collections/ley-especial-gestion-asignacion-ejecucion-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-forestal-areas-protegidas-y-vida-silvestre",
        destination: "/collections/ley-forestal-areas-protegidas-vida-silvestre-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-fundamental-de-educacion",
        destination: "/collections/ley-fundamental-de-educacion-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-general-de-la-administracion-publica",
        destination: "/collections/ley-general-de-la-administracion-publica-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-general-del-ambiente",
        destination: "/collections/ley-general-del-ambiente-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-monetaria",
        destination: "/collections/ley-monetaria-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-organica-de-la-marina-mercante-nacional",
        destination: "/collections/ley-organica-marina-mercante-nacional-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-organica-de-la-procuraduria-general-de-la-republica",
        destination: "/collections/ley-organica-procuraduria-general-republica-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-organica-del-presupuesto",
        destination: "/collections/ley-organica-del-presupuesto-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-organica-del-tribunal-superior-de-cuentas",
        destination: "/collections/ley-organica-tribunal-superior-de-cuentas-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-organica-y-procesal-electoral",
        destination: "/collections/ley-organica-y-procesal-electoral-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-para-la-generacion-de-empleo",
        destination: "/collections/ley-para-la-generacion-de-empleo-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-para-la-modernizacion-y-el-desarrollo-del-sector-agricola",
        destination: "/collections/ley-modernizacion-sector-agricola-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-sobre-el-uso-indebido-y-trafico-ilicito-de-drogas-y-sustancias-psicotropicas",
        destination: "/collections/ley-trafico-ilicito-drogas-sustancias-psicotropicas-honduras",
        permanent: true,
      },
      {
        source: "/collections/ley-sobre-justicia-constitucional",
        destination: "/collections/ley-sobre-justicia-constitucional-honduras",
        permanent: true,
      },
      // Reglamentos
      {
        source: "/collections/reglamento-de-la-ley-de-transparencia-y-acceso-a-la-informacion-publica",
        destination: "/collections/reglamento-ley-transparencia-informacion-publica-honduras",
        permanent: true,
      },
      {
        source: "/collections/reglamento-de-la-ley-del-impuesto-sobre-la-renta",
        destination: "/collections/reglamento-ley-impuesto-sobre-la-renta-honduras",
        permanent: true,
      },
      {
        source: "/collections/reglamento-de-la-ley-del-registro-nacional-de-las-personas",
        destination: "/collections/reglamento-ley-registro-nacional-personas-honduras",
        permanent: true,
      },
      {
        source: "/collections/reglamento-de-organizacion-funcionamiento-y-competencias-del-poder-ejecutivo",
        destination: "/collections/reglamento-organizacion-poder-ejecutivo-honduras",
        permanent: true,
      },
      {
        source: "/collections/reglamento-de-organizacion-y-funcionamiento-de-la-junta-de-la-direccion-universitaria",
        destination: "/collections/reglamento-junta-direccion-universitaria-honduras",
        permanent: true,
      },
      {
        source: "/collections/reglamento-general-de-la-ley-de-municipalidades",
        destination: "/collections/reglamento-general-ley-municipalidades-honduras",
        permanent: true,
      },
      // Aranceles
      {
        source: "/collections/arancel-del-profesional-del-derecho",
        destination: "/collections/arancel-del-profesional-del-derecho-honduras",
        permanent: true,
      },
      {
        source: "/collections/arancel-notarial",
        destination: "/collections/arancel-notarial-honduras",
        permanent: true,
      },
      // Tratados
      {
        source: "/collections/tratado-general-de-integracion-economica-centroamericana",
        destination: "/collections/tratado-integracion-economica-centroamericana-honduras",
        permanent: true,
      },
      {
        source: "/collections/tratado-marco-de-seguridad-democratica-en-centroamerica",
        destination: "/collections/tratado-seguridad-democratica-centroamerica-honduras",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
