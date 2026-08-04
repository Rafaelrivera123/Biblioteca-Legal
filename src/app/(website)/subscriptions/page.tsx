import { auth } from "@/auth";
import CTA from "@/components/shared/sections/cta";
import HeaderSection from "@/components/shared/sections/header";
import { getCurrentUserSubscription } from "@/helper/subscription";
import { siteAssets } from "@/helper/assets";
import { prisma } from "@/lib/db";
import { Metadata } from "next";
import PricingComparison from "./_components/pricing-plan";

export const metadata: Metadata = {
  title: "Suscripciones",
  description:
    "Elige el plan de Biblioteca Legal HN y accede a leyes, códigos, resúmenes con IA y el asistente legal. Recursos jurídicos actualizados de Honduras.",
  openGraph: {
    title: "Suscripciones | Biblioteca Legal HN",
    description:
      "Accede a leyes, códigos, resúmenes con IA y el asistente legal de Honduras con un plan de Biblioteca Legal HN.",
    url: "https://www.bibliotecalegalhn.com/subscriptions",
    siteName: "Biblioteca Legal HN",
    locale: "es_HN",
    type: "website",
  },
  alternates: {
    canonical: "https://www.bibliotecalegalhn.com/subscriptions",
  },
};

const USD_PRICE = 5.99;
const HNL_RATE = 26.5;
const FORMATTED_PRICE = `L${(USD_PRICE * HNL_RATE).toFixed(2)}`;

const Page = async () => {
  const cu = await auth();
  const isLoggedin = !!cu;

  const [currentSubscription, userData] = await Promise.all([
    getCurrentUserSubscription(),
    cu?.user?.id
      ? prisma.user.findUnique({
          where: { id: cu.user.id },
          select: { paddleCustomerId: true, id: true },
        })
      : Promise.resolve(null),
  ]);

  const paddleCustomerId = userData?.paddleCustomerId ?? "";
  const userId = userData?.id ?? "";
  const paddleToken = process.env.NEXT_PUBLIC_PADDLE_TOKEN;
  const priceId = process.env.NEXT_PUBLIC_PRICE_ID;

  if (!paddleToken || !priceId) {
    throw new Error(
      "Missing NEXT_PUBLIC_PADDLE_TOKEN or NEXT_PUBLIC_PRICE_ID environment variables."
    );
  }

  return (
    <div>
      <HeaderSection
        imageUrl={siteAssets.subscriptionPage}
        title="Nuestros Planes"
        description="Únete a nuestra plataforma para acceder a recursos legales actualizados"
      />
      <PricingComparison
        subscription={currentSubscription?.subscription}
        sub_type={currentSubscription?.type as "user" | "company"}
        price={FORMATTED_PRICE}
        isLoggedin={isLoggedin}
        paddleCustomerId={paddleCustomerId}
        paddleToken={paddleToken}
        priceId={priceId}
        userId={userId}
      />
      {!isLoggedin && <CTA />}
    </div>
  );
};

export default Page;
