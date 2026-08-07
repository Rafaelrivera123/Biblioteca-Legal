import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { HEAD_CODES, HEAD_CODE_SLUGS } from "@/lib/head-codes";
import { FREE_AI_CHAT_LIMIT } from "@/lib/pricing";
import { siteAssets } from "@/helper/assets";
import FeaturedGuides from "@/components/FeaturedGuides";
import FeaturedLegalUpdates from "@/components/FeaturedLegalUpdates";
import HomeContact from "@/components/HomeContact";
import OurServices from "@/components/OurServices";
import PlatformStats from "@/components/PlatformStats";
import ResearchTools from "@/components/ResearchTools";
import CTA from "@/components/shared/sections/cta";
import LegalAIChatbot from "@/components/LegalAIChatbot";
import StartTourButton from "@/components/tour/StartTourButton";
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
  let freeChatRemaining = FREE_AI_CHAT_LIMIT;
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        freeChatUsed: true,
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
    freeChatRemaining = Math.max(
      0,
      FREE_AI_CHAT_LIMIT - (user?.freeChatUsed ?? 0)
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
            Lee leyes y códigos de Honduras completos, gratis. Usa IA para
            entender cada artículo en segundos y sigue las reformas de La Gaceta
            en lenguaje claro.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-5 gap-y-4 mt-[40px] md:mt-[60px]">
            <Button size="lg" asChild>
              <Link href="/collections">Explorar Colección</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="border-primary bg-transparent text-primary hover:bg-primary/10 hover:text-primary"
            >
              <Link href={isLoggedin ? "/subscriptions" : "/sign-up"}>
                {isLoggedin ? "Ver Plan Personal" : "Crear cuenta gratis"}
              </Link>
            </Button>
            {!isLoggedin && <StartTourButton />}
          </div>
          <nav
            aria-label="Códigos más consultados"
            className="mt-8 flex flex-wrap gap-2"
          >
            {HEAD_CODE_SLUGS.map((slug) => (
              <Link
                key={slug}
                href={`/collections/${slug}`}
                className="text-sm font-medium text-primary bg-white/90 hover:bg-white px-3 py-1.5 rounded-md transition-colors"
              >
                {HEAD_CODES[slug].shortLabel}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      <ResearchTools />
      <OurServices />
      <PlatformStats />
      <FeaturedLegalUpdates />
      <FeaturedGuides />
      {!isLoggedin && <CTA />}
      <HomeContact />
      <LegalAIChatbot
        isLoggedin={isLoggedin}
        hasSubscription={hasSubscription}
        freeChatRemaining={freeChatRemaining}
      />
    </>
  );
}
