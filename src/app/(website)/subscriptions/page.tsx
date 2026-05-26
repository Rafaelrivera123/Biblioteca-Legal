import { auth } from "@/auth";
import CTA from "@/components/shared/sections/cta";
import HeaderSection from "@/components/shared/sections/header";
import { getCurrentUserSubscription } from "@/helper/subscription";
import { paddle } from "@/lib/paddle";
import PricingComparison from "./_components/pricing-plan";

async function getHNLPrice(usdAmount: number): Promise<string> {
  try {
    const res = await fetch(
      "https://api.exchangerate-api.com/v4/latest/USD",
      { next: { revalidate: 86400 } } // Cache 24 hours
    );
    const data = await res.json();
    const rate = data.rates?.HNL ?? 24.7;
    const hnl = (usdAmount * rate).toFixed(2);
    return `L${hnl}`;
  } catch {
    return `L${(usdAmount * 24.7).toFixed(2)}`;
  }
}

const Page = async () => {
  const cu = await auth();
  const isLoggedin = !!cu;
  const currentSubscription = await getCurrentUserSubscription();

  let usdAmount = 5.99;
  try {
    const response = await paddle.prices.get(process.env.NEXT_PUBLIC_PRICE_ID!);
    const priceData = response.unitPrice;
    usdAmount = Number(priceData.amount) / 100;
  } catch {
    usdAmount = 5.99;
  }

  const formattedAmount = await getHNLPrice(usdAmount);

  return (
    <div>
      <HeaderSection
        imageUrl="https://files.edgestore.dev/ln9m9j3kr2yibrue/staticFiled/_public/subscription%20page.webp"
        title="Nuestros Planes"
        description="Únete a nuestra plataforma para acceder a recursos legales actualizados"
      />
      <PricingComparison
        subscription={currentSubscription?.subscription}
        sub_type={currentSubscription?.type as "user" | "company"}
        price={formattedAmount}
      />
      {!isLoggedin && <CTA />}
    </div>
  );
};

export default Page;
