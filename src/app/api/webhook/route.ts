import { registeruser } from "@/actions/auth/registration";
import { prisma } from "@/lib/db";
import { paddle } from "@/lib/paddle";
import { EventName } from "@paddle/paddle-node-sdk";
import { NextRequest, NextResponse } from "next/server";

const secretKey = process.env.PADDLE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const rawRequestBody = await req.text();
  const paddleSignature = req.headers.get("paddle-signature");

  if (!paddleSignature) {
    console.error("Paddle-Signature not present in request headers");
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  if (!secretKey) {
    console.error("Secret key not defined");
    return NextResponse.json({ message: "Server misconfigured" }, { status: 500 });
  }

  try {
    const eventData = await paddle.webhooks.unmarshal(
      rawRequestBody,
      secretKey,
      paddleSignature
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = eventData.data;
    const startsAt = data.currentBillingPeriod?.startsAt;
    const endsAt = data.currentBillingPeriod?.endsAt;
    const txnId = data.transactionId;
    const subscriptionId = data.id;
    const customerId = data.customerId;
    const customData = data.customData;

    switch (eventData.eventType) {
      case EventName.SubscriptionCreated: {
        console.log("webhook called for subscription created");

        let userId: string | undefined;

        if (customData?.userId) {
          // Existing user flow: user already registered, find by userId
          const existingUser = await prisma.user.findUnique({
            where: { id: customData.userId },
          });

          if (existingUser) {
            userId = existingUser.id;
            // Save paddleCustomerId if not set yet
            if (!existingUser.paddleCustomerId) {
              await prisma.user.update({
                where: { id: userId },
                data: { paddleCustomerId: customerId },
              });
            }
          }
        } else if (customData?.user) {
          // New user flow: register user from customData
          const user = await registeruser(customData.user, customerId);
          userId = user.data?.id;
          if (user.data?.email) {
            await prisma.userQue
              .delete({ where: { email: user.data.email } })
              .catch(() => {});
          }
        }

        if (!userId) {
          console.error("Could not resolve userId for subscription:", subscriptionId);
          break;
        }

        await prisma.userSubscription.upsert({
          where: { userId },
          create: {
            userId,
            currentPeriodStart: startsAt,
            currentPeriodEnd: endsAt,
            txn_id: txnId,
            sub_id: subscriptionId,
            isActive: true,
          },
          update: {
            currentPeriodStart: startsAt,
            currentPeriodEnd: endsAt,
            txn_id: txnId,
            sub_id: subscriptionId,
            isActive: true,
          },
        });

        break;
      }

      case EventName.SubscriptionActivated:
        console.log("webhook called for subscription activated");
        break;

      case EventName.SubscriptionCanceled: {
        console.log("webhook called for subscription canceled");
        const subscription = await prisma.userSubscription.findUnique({
          where: { sub_id: subscriptionId },
        });
        if (!subscription) break;
        await prisma.userSubscription.update({
          where: { userId: subscription.userId },
          data: { isActive: false },
        });
        break;
      }

      case EventName.SubscriptionPaused: {
        console.log("webhook called for subscription paused");
        const subscription = await prisma.userSubscription.findUnique({
          where: { sub_id: subscriptionId },
        });
        if (!subscription) break;
        await prisma.userSubscription.update({
          where: { userId: subscription.userId },
          data: { isActive: false },
        });
        break;
      }

      case EventName.SubscriptionResumed: {
        console.log("webhook called for subscription resumed");
        const subscription = await prisma.userSubscription.findUnique({
          where: { sub_id: subscriptionId },
        });
        if (!subscription) break;
        await prisma.userSubscription.update({
          where: { userId: subscription.userId },
          data: { isActive: true },
        });
        break;
      }

      case EventName.SubscriptionUpdated:
        console.log("webhook called for subscription updated");
        await prisma.userSubscription.update({
          where: { sub_id: subscriptionId },
          data: {
            isActive: true,
            currentPeriodEnd: endsAt,
            currentPeriodStart: startsAt,
            txn_id: txnId,
          },
        });
        break;

      case EventName.SubscriptionPastDue:
        await prisma.userSubscription.update({
          where: { sub_id: subscriptionId },
          data: { isActive: false },
        });
        break;

      default:
        console.log("Unhandled event:", eventData.eventType);
    }
  } catch (error) {
    console.error("Webhook error:", error);
  }

  return NextResponse.json({ success: true });
}
