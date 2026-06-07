import { auth } from "@/auth";
import CTA from "@/components/shared/sections/cta";
import HeaderSection from "@/components/shared/sections/header";
import { getCurrentUserSubscription } from "@/helper/subscription";
import { prisma } from "@/lib/db";
import PricingComparison from "./_components/pricing-plan";

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
  const paddleToken = process.env.NEXT_PUBLIC_PADDLE_TOKEN ?? "live_1c7d31d29e8a6cba0bb95bc7304";
  const priceId = process.env.NEXT_PUBLIC_PRICE_ID ?? "pri_01jxccwd2cg20vw1ne8c46f5vd";

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
