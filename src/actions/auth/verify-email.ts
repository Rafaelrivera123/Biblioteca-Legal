"use server";

import EmailVerification from "@/email-templates/email-verification";
import { prisma } from "@/lib/db";
import { getAppBaseUrl, sendTransactionalEmail } from "@/lib/supersendtx";
import { randomBytes } from "crypto";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export async function createAndSendVerificationEmail(
  email: string,
  username: string
) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  const verificationUrl = `${getAppBaseUrl()}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

  await sendTransactionalEmail({
    to: email,
    subject: "Verifica tu correo electrónico — Biblioteca Legal",
    react: EmailVerification({ username, verificationUrl }),
    reply_to: email,
  });
}

export async function verifyEmailToken(email: string, token: string) {
  const record = await prisma.verificationToken.findFirst({
    where: {
      identifier: email,
      token,
    },
  });

  if (!record) {
    return {
      success: false,
      message: "El enlace de verificación no es válido.",
    };
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });
    return {
      success: false,
      message: "El enlace de verificación ha expirado. Regístrate de nuevo.",
    };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return {
      success: false,
      message: "No se encontró una cuenta con este correo.",
    };
  }

  await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  });

  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  return {
    success: true,
    message: "Correo verificado correctamente.",
    userId: user.id,
  };
}
