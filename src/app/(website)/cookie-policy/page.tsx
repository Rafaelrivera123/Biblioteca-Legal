import HeaderSection from "@/components/shared/sections/header";
import { siteAssets } from "@/helper/assets";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Cookies",
  description:
    "Información sobre las cookies propias y de terceros que utiliza Biblioteca Legal HN, incluyendo Google Analytics y Google AdSense.",
  openGraph: {
    title: "Política de Cookies | Biblioteca Legal HN",
    description:
      "Cómo usamos cookies propias y de terceros en Biblioteca Legal HN.",
    url: "https://www.bibliotecalegalhn.com/cookie-policy",
    siteName: "Biblioteca Legal HN",
    locale: "es_HN",
    type: "website",
  },
  alternates: {
    canonical: "https://www.bibliotecalegalhn.com/cookie-policy",
  },
};

const Page = () => {
  return (
    <div>
      <HeaderSection
        imageUrl={siteAssets.termsAndCondition}
        title="Política de Cookies"
        description=""
      />

      <div className="container mx-auto py-10 lg:py-20 max-w-[850px] px-4 space-y-8 text-[15px] leading-relaxed text-gray-700">
        <p className="text-sm text-muted-foreground">
          Última actualización: 4 de agosto de 2026
        </p>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-primary">1. Qué son las cookies</h2>
          <p>
            Las cookies son pequeños archivos de texto que un sitio web guarda
            en su dispositivo cuando lo visita. Permiten recordar preferencias,
            mantener la sesión activa, medir el uso del sitio y, en el plan
            gratuito, mostrar publicidad relevante.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-primary">
            2. Cookies que utilizamos
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Esenciales:</strong> autenticación, seguridad, límite de
              dispositivos y preferencias básicas del servicio. Sin ellas la
              plataforma no funciona correctamente.
            </li>
            <li>
              <strong>Analíticas:</strong> Google Analytics, para entender de
              forma agregada cómo se usa Biblioteca Legal HN.
            </li>
            <li>
              <strong>Publicitarias:</strong> Google AdSense, solo en el Plan
              Gratuito, para mostrar anuncios. Google y sus socios pueden usar
              cookies para personalizar publicidad según visitas anteriores a
              este u otros sitios.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-primary">
            3. Cómo gestionar sus preferencias
          </h2>
          <p>
            Al visitar el sitio puede aceptar todas las cookies o quedarse solo
            con las esenciales mediante el aviso de cookies. También puede
            configurar su navegador para bloquear o eliminar cookies.
          </p>
          <p>
            Para optar por no recibir anuncios personalizados de Google visite{" "}
            <a
              href="https://adssettings.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              adssettings.google.com
            </a>
            . Más información sobre cómo Google usa datos de socios:{" "}
            <a
              href="https://policies.google.com/technologies/partner-sites"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              policies.google.com/technologies/partner-sites
            </a>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-primary">4. Más información</h2>
          <p>
            El tratamiento de datos personales se describe en nuestra{" "}
            <Link href="/privacy-policy" className="text-primary underline">
              Política de Privacidad
            </Link>
            . Consultas:{" "}
            <a
              href="mailto:soporte@bibliotecalegalhn.com"
              className="text-primary underline"
            >
              soporte@bibliotecalegalhn.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
};

export default Page;
