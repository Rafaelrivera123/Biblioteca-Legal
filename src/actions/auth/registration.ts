"use server";
import bcrypt from "bcryptjs";

import { createAndSendVerificationEmail } from "@/actions/auth/verify-email";
import { prisma } from "@/lib/db";
import { registrationSchema, RegistrationSchemaType } from "@/schemas/auth";

export async function registeruser(
  data: RegistrationSchemaType,
  paddleCustomerId: string
) {
  const {
    success,
    data: parsedData,
    error,
  } = registrationSchema.safeParse(data);

  if (!success) {
    return {
      success: false,
      message: error.message, // Puedes traducir el mensaje del schema si lo necesitas
    };
  }

  // Verificar si el usuario ya existe
  const exist = await prisma.user.findFirst({
    where: {
      email: parsedData.email,
    },
  });

  if (exist) {
    return {
      success: false,
      message: "Este usuario ya existe.",
    };
  }

  // Encriptar la contraseña antes de guardarla
  const hashedPassword = await bcrypt.hash(parsedData.password, 10);

  try {
    // Crear el usuario en la base de datos
    const newUser = await prisma.user.create({
      data: {
        email: parsedData.email,
        password: hashedPassword,
        first_name: parsedData.first_name,
        last_name: parsedData.last_name,
        paddleCustomerId,
        emailVerified: null,
      },
    });

    await createAndSendVerificationEmail(
      parsedData.email,
      parsedData.first_name || parsedData.email
    );

    // Suscribir al boletín si eligió recibir promociones
    if (parsedData.promotion) {
      await prisma.newsLetter.create({
        data: {
          email: parsedData.email,
        },
      });
    }

    return {
      success: true,
      message: "¡Registro exitoso!",
      data: newUser,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return {
      success: false,
      message: error.message ?? "¡Ocurrió un error inesperado!",
    };
  }
}
