"use server";

import { auth, unstable_update } from "@/auth";
import { prisma } from "@/lib/db";
import { triggerWelcomeAutomation } from "@/lib/welcome-automation";
import {
  completeAccountSchema,
  CompleteAccountSchemaType,
} from "@/schemas/auth";

export async function completeAccountAction(data: CompleteAccountSchemaType) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Debes iniciar sesión para continuar." };
  }

  const parsed = completeAccountSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.errors[0]?.message ?? "Datos inválidos.",
    };
  }

  const { first_name, last_name, email, promotion } = parsed.data;
  const userId = session.user.id;

  const current = await prisma.user.findUnique({ where: { id: userId } });
  if (!current) {
    return { success: false, message: "Usuario no encontrado." };
  }

  // Keep the OAuth-verified email — never overwrite it from the form.
  const resolvedEmail = current.email || email;

  if (!current.email) {
    const emailTaken = await prisma.user.findFirst({
      where: {
        email: resolvedEmail,
        NOT: { id: userId },
      },
      select: { id: true },
    });

    if (emailTaken) {
      return {
        success: false,
        message: "Este correo ya está registrado en otra cuenta.",
      };
    }
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        first_name,
        last_name,
        name: `${first_name} ${last_name}`.trim(),
        email: resolvedEmail,
        accountCompleted: true,
        emailVerified: current.emailVerified ?? new Date(),
      },
    });

    if (promotion) {
      await prisma.newsLetter.upsert({
        where: { email: resolvedEmail },
        create: { email: resolvedEmail },
        update: {},
      });
    }

    // Refresh the JWT so Edge middleware stops treating the user as incomplete.
    await unstable_update({
      user: { accountCompleted: true },
    });

    if (!current.accountCompleted) {
      try {
        await triggerWelcomeAutomation({
          userId,
          email: resolvedEmail,
          firstName: first_name,
        });
      } catch (emailErr) {
        console.error("Welcome automation trigger failed:", emailErr);
      }
    }

    return {
      success: true,
      message: "¡Cuenta creada exitosamente!",
    };
  } catch (error) {
    console.error("completeAccountAction:", error);
    return {
      success: false,
      message: "No se pudo completar el registro. Intenta de nuevo.",
    };
  }
}
