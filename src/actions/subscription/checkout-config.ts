"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getCurrentUserSubscription } from "@/helper/subscription";

export type CheckoutConfig = {
  success: boolean;
  message?: string;
  isLoggedin: boolean;
  isSubscribed: boolean;
  paddleToken: string;
  monthlyPriceId: string;
  annualPriceId: string;
  paddleCustomerId: string;
  userId: string;
};

export async function getCheckoutConfig(): Promise<CheckoutConfig> {
  const paddleToken = process.env.NEXT_PUBLIC_PADDLE_TOKEN ?? "";
  const monthlyPriceId = process.env.NEXT_PUBLIC_PRICE_ID ?? "";
  const annualPriceId = process.env.NEXT_PUBLIC_ANNUAL_PRICE_ID ?? "";

  const cu = await auth();
  if (!cu?.user?.id) {
    return {
      success: true,
      isLoggedin: false,
      isSubscribed: false,
      paddleToken,
      monthlyPriceId,
      annualPriceId,
      paddleCustomerId: "",
      userId: "",
    };
  }

  const [userData, subscription] = await Promise.all([
    prisma.user.findUnique({
      where: { id: cu.user.id },
      select: { paddleCustomerId: true, id: true },
    }),
    getCurrentUserSubscription(),
  ]);

  const now = new Date();
  const isSubscribed = !!(
    subscription?.subscription?.isActive &&
    new Date(subscription.subscription.currentPeriodEnd) > now
  );

  return {
    success: true,
    isLoggedin: true,
    isSubscribed,
    paddleToken,
    monthlyPriceId,
    annualPriceId,
    paddleCustomerId: userData?.paddleCustomerId ?? "",
    userId: userData?.id ?? "",
  };
}
