// lib/subscription.ts
"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { paddle } from "@/lib/paddle";

interface Sub {
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  sub_id?: string;
  isActive: boolean;
  userId: string;
}

export async function getCurrentUserSubscription(): Promise<{
  type: "user" | "company";
  subscription: Sub;
} | null> {
  const cu = await auth();

  if (!cu?.user?.id) {
    return null; // Not logged in
  }

  // 1. Try fetching the user's personal active subscription
  const userSubscription = await prisma.userSubscription.findFirst({
    where: {
      userId: cu.user.id,
      isActive: true,
    },
  });

  if (userSubscription) {
    return {
      type: "user",
      subscription: {
        currentPeriodStart: userSubscription.currentPeriodStart,
        currentPeriodEnd: userSubscription.currentPeriodEnd,
        sub_id: userSubscription.sub_id,
        isActive: userSubscription.isActive,
        userId: userSubscription.userId,
      },
    };
  }

  // 2. Check if the user belongs to a company
  const user = await prisma.user.findUnique({
    where: { id: cu.user.id },
    select: {
      companyId: true,
    },
  });

  if (!user?.companyId) {
    return null; // Not part of a company, and no personal sub
  }

  // 3. Try fetching the company’s active subscription
  const companySubscription = await prisma.companySubscription.findFirst({
    where: {
      companyId: user.companyId,
      isActive: true,
    },
  });

  if (companySubscription) {
    return {
      type: "company",
      subscription: {
        currentPeriodStart: companySubscription.currentPeriodStart,
        currentPeriodEnd: companySubscription.currentPeriodEnd,
        isActive: companySubscription.isActive,
        sub_id: undefined,
        userId: cu.user.id,
      },
    };
  }

  return null; // No valid subscription found
}

interface PaddleCustomerCreateProps {
  email: string;
  first_name: string;
  last_name: string;
}

export const paddleCustomerCreate = async ({
  email,
  first_name,
  last_name,
}: PaddleCustomerCreateProps) => {
  const existingCustomerInQue = await prisma.userQue.findFirst({
    where: {
      email,
    },
  });

  if (existingCustomerInQue) {
    return existingCustomerInQue.customerId;
  }
  const customer = await paddle.customers.create({
    email,
    name: `${first_name} ${last_name}`,
  });

  const newCustomer = await prisma.userQue.create({
    data: {
      email,
      first_name,
      last_name,
      customerId: customer.id,
    },
  });

  return newCustomer.customerId;
};

export const getPaddleCustomerId = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    return null;
  }

  let paddleCustomerId;

  if (!user.paddleCustomerId) {
    paddleCustomerId = await paddleCustomerCreate({
      email: user.email as string,
      first_name: user.first_name as string,
      last_name: user.last_name as string,
    });

    return paddleCustomerId;
  }

  paddleCustomerId = user.paddleCustomerId;

  return paddleCustomerId;
};

export const isSubscribed = async () => {
  const cu = await auth();

  const cs = await getCurrentUserSubscription();

  const now = new Date();

  const isActive = cs?.subscription.isActive ?? false;
  const currentPeriodEnd = cs?.subscription.currentPeriodEnd;

  const hasFullAccess =
    isActive && !!currentPeriodEnd && currentPeriodEnd > now && !!cu;

  return !!hasFullAccess;
};
