import HeaderSection from "@/components/shared/sections/header";
import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Sobre Nosotros | Biblioteca Legal HN",
  description:
    "Conoce la historia de Biblioteca Legal HN, la plataforma jurídica virtual de Honduras creada para acercar las leyes y códigos a estudiantes, abogados y ciudadanos.",
  openGraph: {
    title: "Sobre Nosotros | Biblioteca Legal HN",
    description:
      "Conoce la historia de Biblioteca Legal HN, la plataforma jurídica virtual de Honduras.",
    url: "https://www.bibliotecalegalhn.com/about-us",
    siteName: "Biblioteca Legal HN",
    locale: "es_HN",
    type: "website",
  },
  alternates: {
    canonical: "https://www.bibliotecalegalhn.com/about-us",
  },
};

const page = () => {
  return (
    <div>
      <HeaderSection
        imageUrl="https://files.edgestore.dev/ln9m9j3kr2yibrue/staticFiled/_public/about%20us.webp"
        title="Sobre Nosotros"
        description=""
      />
      <section className="w-full py-16 px-4 md:px-8 lg:px-16 ">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 lg:gap-16">
            <div className="w-full md:w-1/2">
              <h2 className="text-4xl md:text-[40px] font-bold text-[#1E2A38] mb-6">
                Acerca de Biblioteca Legal
              </h2>
              <p className="text-[14px] md:text-[16px]  mb-6">
                Biblioteca Legal nació como respuesta a la falta de acceso
                digital a información legal actualizada en Honduras. Surgió de
                la necesidad real de brindar una herramienta accesible,
                confiable y fácil de usar para quienes estudian o ejercen el
                Derecho.
              </p>
              <p className="text-[14px] md:text-[16px]">
                La plataforma fue creada por un estudiante de Derecho que,
                basado en su propia experiencia, identificó las deficiencias del
                sector y decidió convertirlas en una oportunidad para mejorar el
                acceso al conocimiento legal.
              </p>
            </div>
            <div className="w-full md:w-1/2 flex justify-center">
              <div className="relative w-full max-w-[684px] h-[542px]">
                <Image
                  src="/about1.png"
                  alt="Estatua de la Dama de la Justicia"
                  fill
                  className="object-cover rounded-[16px]"
                  sizes="(max-width: 768px) 100vw, 684px"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-24">
          <h3 className="text-lg md:text-[20px] font-semibold text-[#D4AF37] text-center mb-6">
            Nuestra Visión y Misión
          </h3>
          <h2 className="text-2xl md:text-[32px] font-semibold text-[#1E2A38] text-center mb-16">
            Lo que nos define
          </h2>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 lg:gap-16">
            <div className="w-full md:w-1/2 order-2 md:order-1">
              <div className="relative w-full max-w-[684px] h-[542px]">
                <Image
                  src="/about2.png"
                  alt="Balanza de la justicia y mazo"
                  fill
                  className="object-cover rounded-[16px]"
                  sizes="(max-width: 768px) 100vw, 684px"
                  priority
                />
              </div>
            </div>
            <div className="w-full md:w-1/2 order-1 md:order-2">
              <div className="mb-12">
                <h3 className="text-2xl md:text-[25px] font-bold text-[#1E2A38] mb-4">
                  Declaración de Visión
                </h3>
                <p className="text-[16px]">
                  Queremos que miles de personas en toda Centroamérica puedan
                  decir: &quot;Estudio y trabajo mejor gracias a Biblioteca Legal.&quot;
                  Nuestra meta es llegar a cada rincón de la región, ayudando a
                  formar profesionales mejor preparados y conectados con el
                  conocimiento legal que necesitan para crecer.
                </p>
              </div>
              <div>
                <h3 className="text-2xl md:text-[25px] font-bold text-[#1E2A38] mb-4">
                  Declaración de Misión
                </h3>
                <p className="text-[16px]">
                  En Biblioteca Legal creemos que todas las personas deberían
                  tener acceso fácil y asequible a las leyes y códigos que
                  necesitan. Por eso creamos una plataforma moderna y accesible
                  donde estudiantes, profesionales y entusiastas del Derecho
                  pueden encontrar información legal confiable y siempre
                  actualizada, sin complicaciones.
                </p>
              </div>
              <div className="mt-12">
                <h3 className="text-2xl md:text-[25px] font-bold text-[#1E2A38] mb-4">
                  Nuestros Valores
                </h3>
                <ul>
                  <li>
                    <span className="font-semibold">Accesibilidad:</span>{" "}
                    Acercamos el Derecho a todos.
                  </li>
                  <li>
                    <span className="font-semibold">Empatía:</span> Entendemos
                    tus desafíos y te apoyamos.
                  </li>
                  <li>
                    <span className="font-semibold">Calidad:</span> Contenido
                    confiable, actualizado y útil.
                  </li>
                  <li>
                    <span className="font-semibold">Confianza:</span> Siempre
                    puedes contar con nosotros.
                  </li>
                  <li>
                    <span className="font-semibold">Profesionalismo:</span>{" "}
                    Trabajamos con pasión y responsabilidad.
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <p className="mt-12 max-w-[900px]">
            Creemos en un equipo flexible que aprende todos los días y colabora
            con entusiasmo. Nos apoyamos, compartimos ideas y crecemos juntos,
            porque el conocimiento legal también puede ser dinámico, accesible y
            transformador.
          </p>
        </div>
      </section>
    </div>
  );
};

export default page;
