"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { paddle } from "@/lib/paddle";
import { revalidatePath } from "next/cache";

export async function cancelSubscriptionAction() {
  const cu = await auth();

  if (!cu?.user.id) {
    return {
      success: false,
      message: "Debes iniciar sesión para cancelar tu suscripción.",
    };
  }

  const sub = await prisma.userSubscription.findFirst({
    where: {
      userId: cu.user.id,
    },
  });

  if (!sub) {
    return {
      success: false,
      message: "No se encontró ninguna suscripción.",
    };
  }

  const subId = sub.sub_id;

  const paddleRes = await paddle.subscriptions.cancel(subId);

  if (paddleRes) {
    // Keep access until the paid period ends. Paddle webhook will
    // deactivate the subscription when the period actually ends.
    revalidatePath("/account");

    return {
      success: true,
      message:
        "Tu suscripción ha sido cancelada. Conservarás el acceso hasta el final del período actual.",
    };
  }

  return {
    success: false,
    message:
      "No se pudo cancelar la suscripción. Por favor, intenta más tarde.",
  };
}
