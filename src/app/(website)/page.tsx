import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { siteAssets } from "@/helper/assets";
import FeaturedGuides from "@/components/FeaturedGuides";
import FeaturedLegalUpdates from "@/components/FeaturedLegalUpdates";
import HomeContact from "@/components/HomeContact";
import OurServices from "@/components/OurServices";
import PlatformStats from "@/components/PlatformStats";
import ResearchTools from "@/components/ResearchTools";
import CTA from "@/components/shared/sections/cta";
import LegalAIChatbot from "@/components/LegalAIChatbot";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  // absolute evita el template del layout (ya incluye la marca)
  title: {
    absolute: "Biblioteca Legal HN | Leyes y Códigos de Honduras",
  },
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
      <div className="min-h-[100dvh] md:min-h-[80vh] lg:min-h-screen w-full flex justify-start items-center relative overflow-hidden pt-[60px]">
        <Image
          src={siteAssets.homeHero}
          alt="Biblioteca Jurídica Virtual Honduras"
          fill
          priority
          quality={75}
          className="object-cover md:object-right-top object-center"
        />
        <div className="container relative z-10 py-8">
          <h1 className="text-primary font-bold text-[32px] sm:text-[35px] md:text-[40px] lg:text-[60px] leading-[120%]">
            Tu Biblioteca Jurídica Virtual
          </h1>
          <p className="text-white font-normal text-[14px] md:text-[18px] leading-[120%] mt-[25px] max-w-[600px]">
            Consulta el texto completo de leyes y códigos de Honduras, gratis, y
            sigue las reformas publicadas en La Gaceta explicadas en lenguaje
            claro.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 sm:gap-x-[40px] gap-y-4 mt-[40px] md:mt-[60px]">
            <Button size="lg" asChild>
              <Link href="/actualizaciones">Ver Actualizaciones</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/collections">Explorar Colección</Link>
            </Button>
            {!isLoggedin && (
              <Button
                variant="ghost"
                size="lg"
                asChild
                className="text-white hover:text-white hover:bg-white/10"
              >
                <Link href="/login">Iniciar sesión</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
      <FeaturedLegalUpdates />
      <FeaturedGuides />
      <OurServices />
      <PlatformStats />
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
