import { auth } from "@/auth";
import CTA from "@/components/shared/sections/cta";
import HeaderSection from "@/components/shared/sections/header";
import { getCurrentUserSubscription } from "@/helper/subscription";
import { siteAssets } from "@/helper/assets";
import { Metadata } from "next";
import PricingComparison from "./_components/pricing-plan";

export const metadata: Metadata = {
  title: "Suscripciones",
  description:
    "Elige el plan de Biblioteca Legal HN: resúmenes con IA, asistente legal, notas y lectura sin anuncios. Mensual o anual con 30% de descuento.",
  openGraph: {
    title: "Suscripciones | Biblioteca Legal HN",
    description:
      "Accede a resúmenes con IA, asistente legal y herramientas de estudio. Plan anual con 30% de descuento vs 12 meses.",
    url: "https://www.bibliotecalegalhn.com/subscriptions",
    siteName: "Biblioteca Legal HN",
    locale: "es_HN",
    type: "website",
  },
  alternates: {
    canonical: "https://www.bibliotecalegalhn.com/subscriptions",
  },
};

const Page = async ({
  searchParams,
}: {
  searchParams?: { checkout?: string };
}) => {
  const cu = await auth();
  const isLoggedin = !!cu;
  const currentSubscription = await getCurrentUserSubscription();

  const checkoutParam = searchParams?.checkout;
  const autoCheckout =
    checkoutParam === "annual"
      ? "annual"
      : checkoutParam === "monthly" || checkoutParam === "1"
        ? "monthly"
        : null;

  return (
    <div id="tour-subscriptions-page">
      <HeaderSection
        imageUrl={siteAssets.subscriptionPage}
        title="Nuestros Planes"
        description="Leyes gratis. Paga solo por IA, notas y velocidad de estudio."
      />
      <PricingComparison
        subscription={currentSubscription?.subscription}
        sub_type={currentSubscription?.type as "user" | "company"}
        isLoggedin={isLoggedin}
        autoCheckout={autoCheckout}
      />
      {!isLoggedin && <CTA />}
    </div>
  );
};

export default Page;
