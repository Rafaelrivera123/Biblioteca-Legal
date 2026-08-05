import NurtureOfferEmail from "@/email-templates/nurture-offer";
import NurtureTipEmail from "@/email-templates/nurture-tip";
import { prisma } from "@/lib/db";
import { supersendtx } from "@/lib/supersendtx";

const SITE_URL =
  process.env.AUTH_URL?.replace(/\/$/, "") ||
  "https://www.bibliotecalegalhn.com";
const FROM = "Biblioteca Legal HN <contacto@bibliotecalegalhn.com>";

/** SuperSend TX automation trigger for the Welcome email flow. */
const WELCOME_EVENT = "user.created";

/**
 * Fire the SuperSend TX event that starts the Welcome email automation.
 * Does not send mail directly — the dashboard automation owns the template.
 */
export async function triggerWelcomeAutomation(params: {
  userId: string;
  email: string;
  firstName: string;
}) {
  await supersendtx.events.trigger({
    name: WELCOME_EVENT,
    userId: params.userId,
    email: params.email,
    data: {
      name: params.firstName || "amigo/a",
    },
    idempotencyKey: `${WELCOME_EVENT}:${params.userId}`,
  });
}

/**
 * Drip for free (non-subscribed) users:
 * - step 0 → after 2 days: tip email → step 1
 * - step 1 → after 7 days from signup: offer email → step 2
 */
export async function processNurtureDrip(limit = 50) {
  const now = Date.now();
  const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const candidates = await prisma.user.findMany({
    where: {
      nurtureEmailStep: { lt: 2 },
      accountCompleted: true,
      OR: [
        { userSubscription: null },
        { userSubscription: { isActive: false } },
      ],
    },
    select: {
      id: true,
      email: true,
      first_name: true,
      nurtureEmailStep: true,
      createdAt: true,
    },
    take: limit * 2,
    orderBy: { createdAt: "asc" },
  });

  let sent = 0;

  for (const user of candidates) {
    if (sent >= limit) break;

    try {
      if (user.nurtureEmailStep === 0 && user.createdAt <= twoDaysAgo) {
        await supersendtx.emails.send({
          from: FROM,
          to: [user.email],
          subject: "3 formas de estudiar derecho más rápido",
          react: NurtureTipEmail({
            firstName: user.first_name || "amigo/a",
            siteUrl: SITE_URL,
          }),
        });
        await prisma.user.update({
          where: { id: user.id },
          data: { nurtureEmailStep: 1 },
        });
        sent += 1;
        continue;
      }

      if (user.nurtureEmailStep === 1 && user.createdAt <= sevenDaysAgo) {
        await supersendtx.emails.send({
          from: FROM,
          to: [user.email],
          subject: "Plan Personal: mensual o anual con 30% de descuento",
          react: NurtureOfferEmail({
            firstName: user.first_name || "amigo/a",
            siteUrl: SITE_URL,
          }),
        });
        await prisma.user.update({
          where: { id: user.id },
          data: { nurtureEmailStep: 2 },
        });
        sent += 1;
      }
    } catch (err) {
      console.error("[nurture] failed for", user.email, err);
    }
  }

  return { sent, scanned: candidates.length };
}
