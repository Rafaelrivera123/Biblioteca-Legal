import { auth } from "@/auth";
import CTA from "@/components/shared/sections/cta";
import HeaderSection from "@/components/shared/sections/header";
import { siteAssets } from "@/helper/assets";
import { Metadata } from "next";
import ContactForm from "./_components/contact-form.";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Ponte en contacto con Biblioteca Legal HN. Resuelve dudas sobre leyes, códigos, suscripciones o el uso de la plataforma jurídica de Honduras.",
  openGraph: {
    title: "Contacto | Biblioteca Legal HN",
    description:
      "Ponte en contacto con Biblioteca Legal HN para dudas sobre leyes, códigos o suscripciones.",
    url: "https://www.bibliotecalegalhn.com/contact",
    siteName: "Biblioteca Legal HN",
    locale: "es_HN",
    type: "website",
  },
  alternates: {
    canonical: "https://www.bibliotecalegalhn.com/contact",
  },
};

const Page = async () => {
  const cu = await auth();
  const isLoggedin = !!cu;

  return (
    <div>
      <HeaderSection
        imageUrl={siteAssets.contactHero}
        title="Ponte en Contacto"
        description="Estamos aquí para ayudarte con cualquier pregunta sobre nuestros recursos legales"
      />

      <div className="py-[100px]">
        <div className="text-center mb-8">
          <h2 className="text-[32px] font-semibold text-black mb-[30px]">
            ¿TIENES PREGUNTAS? <br /> ENVÍANOS UN MENSAJE
          </h2>
        </div>
        <ContactForm />
      </div>

      {!isLoggedin && <CTA />}
    </div>
  );
};

export default Page;
