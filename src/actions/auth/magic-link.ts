"use server";

import { signIn } from "@/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { isRedirectError } from "next/dist/client/components/redirect";

const emailSchema = z.string().email();

export async function sendMagicLink(email: string) {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) {
    return { success: false, message: "Correo electrónico inválido." };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data },
  });

  if (!user) {
    return {
      success: false,
      message: "No se encontró una cuenta con este correo electrónico.",
    };
  }

  if (!user.emailVerified) {
    return {
      success: false,
      message:
        "Tu correo no está verificado. Revisa tu bandeja de entrada o regístrate de nuevo.",
    };
  }

  try {
    await signIn("supersendtx", {
      email: parsed.data,
      redirect: false,
    });

    return {
      success: true,
      message:
        "Te enviamos un enlace para iniciar sesión. Revisa tu bandeja de entrada.",
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;

    console.error("Magic link error:", error);
    return {
      success: false,
      message: "No se pudo enviar el enlace. Intenta de nuevo más tarde.",
    };
  }
}
