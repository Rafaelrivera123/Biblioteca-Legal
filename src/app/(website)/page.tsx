import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import HomeContact from "@/components/HomeContact";
import OurServices from "@/components/OurServices";
import ResearchTools from "@/components/ResearchTools";
import CTA from "@/components/shared/sections/cta";
import LegalAIChatbot from "@/components/LegalAIChatbot";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Biblioteca Legal HN | Leyes y Códigos de Honduras",
  description:
    "La biblioteca jurídica virtual de Honduras. Consulta leyes, códigos, decretos y reglamentos actualizados. Accede al Código Penal, Código Civil, Constitución Política y más.",
  keywords: [
    "biblioteca legal Honduras",
    "leyes Honduras",
    "códigos legales Honduras",
    "legislación hondureña",
    "derecho hondureño",
    "biblioteca jurídica virtual Honduras",
    "leyes hondureñas actualizadas",
    "Código Penal Honduras",
    "Constitución Honduras",
  ],
  openGraph: {
    title: "Biblioteca Legal HN | Leyes y Códigos de Honduras",
    description:
      "La biblioteca jurídica virtual de Honduras. Consulta leyes, códigos, decretos y reglamentos actualizados.",
    url: "https://www.bibliotecalegalhn.com",
    siteName: "Biblioteca Legal HN",
    locale: "es_HN",
    type: "website",
  },
  alternates: {
    canonical: "https://www.bibliotecalegalhn.com",
  },
};

export default async function Home() {
  const cu = await auth();
  const isLoggedin = !!cu?.user?.id;
  const userId = cu?.user?.id ?? null;
  let hasSubscription = false;
  let isAdmin = false;
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        userSubscription: {
          select: { isActive: true, currentPeriodEnd: true },
        },
      },
    });
    isAdmin = user?.role === "admin";
    hasSubscription =
      isAdmin ||
      !!(
        user?.userSubscription?.isActive &&
        new Date(user.userSubscription.currentPeriodEnd) > new Date()
      );
  }
  return (
    <>
      <div className="h-screen md:h-[80vh] lg:h-screen w-full flex justify-start items-center relative overflow-hidden">
        <Image
          src="https://files.edgestore.dev/ln9m9j3kr2yibrue/staticFiled/_public/b878d4e8-03ef-4945-963b-b8f95ddbfb03.webp"
          alt="Biblioteca Jurídica Virtual Honduras"
          fill
          priority
          quality={75}
          className="object-cover md:object-right-top object-center"
        />
        <div className="container relative z-10">
          <h1 className="text-primary font-bold text-[35px] md:text-[40px] lg:text-[60px] leading-[120%]">
            Tu Biblioteca Jurídica Virtual
          </h1>
          <p className="text-white font-normal text-[14px] md:text-[18px] leading-[120%] mt-[25px] max-w-[600px]">
            Accede a documentos legales, leyes y decretos actualizados en una
            sola plataforma centralizada.
          </p>
          <div className="flex flex-wrap items-center gap-x-[40px] gap-y-4 mt-[40px] md:mt-[60px]">
            {isLoggedin ? (
              <Button size="lg" asChild>
                <Link href="/collections">Ver Colección</Link>
              </Button>
            ) : (
              <>
                <Button size="lg" asChild>
                  <Link href="/subscriptions">Registrarse</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/login">Iniciar sesión</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      <OurServices />
      <ResearchTools />
      {!isLoggedin && <CTA />}
      <HomeContact />
      <LegalAIChatbot
        isLoggedin={isLoggedin}
        hasSubscription={hasSubscription}
      />
    </>
  );
}
