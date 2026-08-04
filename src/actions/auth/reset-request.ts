"use server";

import { auth } from "@/auth";
import OtpEmail from "@/email-templates/otp-share-template";
import { prisma } from "@/lib/db";
import { supersendtx } from "@/lib/supersendtx";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

// Función auxiliar para generar un OTP de 6 dígitos
function generarOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Enviar código OTP al correo
export async function sendOtp(email: string) {
  const usuarioExistente = await prisma.user.findUnique({
    where: { email },
  });

  if (!usuarioExistente) {
    return {
      success: false,
      message: "No se encontró una cuenta con este correo electrónico.",
    };
  }

  try {
    // Verificar si ya existe una solicitud de restablecimiento
    const existente = await prisma.resetReq.findFirst({
      where: {
        email,
      },
    });

    if (existente) {
      // Eliminar solicitud anterior para evitar duplicados
      await prisma.resetReq.delete({
        where: {
          id: existente.id,
        },
      });
    }

    // Generar OTP
    const otp = generarOtp();

    // Crear nueva solicitud de restablecimiento
    const nuevaSolicitud = await prisma.resetReq.create({
      data: {
        email,
        otp: Number(otp),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // OTP válido por 10 minutos
      },
    });

    // Enviar OTP por correo electrónico
    await supersendtx.emails.send({
      from: "Biblioteca Legal <support@bibliotecalegalhn.com>",
      to: [nuevaSolicitud.email as string],
      subject: "Código para restablecer tu contraseña",
      react: OtpEmail({
        otpCode: nuevaSolicitud.otp.toString(),
      }),
    });

    return {
      success: true,
      message: "Código OTP enviado exitosamente.",
      otpId: nuevaSolicitud.id,
    };
  } catch (error) {
    console.error("Error al enviar el OTP:", error);
    return {
      success: false,
      message: "Ocurrió un error. Por favor, intenta de nuevo más tarde.",
    };
  }
}

// Verificar el código OTP ingresado por el usuario
export async function verifyOTP(id: string, otp: number) {
  const solicitud = await prisma.resetReq.findFirst({
    where: {
      id,
      otp,
    },
  });

  if (!solicitud) {
    return {
      success: false,
      message: "OTP o ID inválido.",
    };
  }

  // Verificar si el OTP ha expirado
  if (solicitud.expiresAt && new Date() > solicitud.expiresAt) {
    // Opcional: eliminar OTP expirado
    await prisma.resetReq.delete({
      where: { id: solicitud.id },
    });

    return {
      success: false,
      message: "El código OTP ha expirado.",
    };
  }

  await prisma.resetReq.update({
    where: {
      id,
    },
    data: {
      isOtpVerified: true,
    },
  });

  return {
    success: true,
    message: "Código OTP verificado correctamente.",
    data: solicitud,
  };
}

// Restablecer la contraseña luego de verificación del OTP
export async function resetNow(id: string, password: string) {
  const solicitud = await prisma.resetReq.findFirst({
    where: {
      id,
    },
  });

  if (!solicitud) {
    return {
      success: false,
      message: "Solicitud inválida o ID no encontrado.",
    };
  }

  if (!solicitud.isOtpVerified) {
    return {
      success: false,
      message: "El código OTP aún no ha sido verificado.",
    };
  }

  // Hashear la nueva contraseña
  const hashedPassword = await bcrypt.hash(password, 10);

  // Actualizar contraseña del usuario
  await prisma.user.update({
    where: {
      email: solicitud.email,
    },
    data: {
      password: hashedPassword,
    },
  });

  // Eliminar la solicitud de restablecimiento tras éxito
  await prisma.resetReq.delete({
    where: {
      id: solicitud.id,
    },
  });

  return {
    success: true,
    message: "Contraseña restablecida correctamente.",
  };
}

// Cambio de contraseña por parte del administrador autenticado
export async function adminPasswordChangeAction(password: string) {
  const usuarioActual = await auth();

  if (!usuarioActual || !usuarioActual.user.id) {
    redirect("/login");
  }

  if (usuarioActual.user.role !== "admin") {
    return {
      success: false,
      message: "Acceso no autorizado.",
    };
  }

  // Validar longitud mínima
  if (password.length < 6) {
    return {
      success: false,
      message: "La contraseña debe tener al menos 6 caracteres.",
    };
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: {
        id: usuarioActual.user.id,
      },
      data: {
        password: hashedPassword,
      },
    });

    return {
      success: true,
      message: "Contraseña actualizada correctamente.",
    };

    // redirect("/admin/settings"); // Opcional
  } catch {
    return {
      success: false,
      message: "Ocurrió un error. Por favor intenta nuevamente.",
    };
  }
}
