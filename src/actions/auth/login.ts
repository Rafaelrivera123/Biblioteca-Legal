"use server";
import { signIn } from "@/auth";
import { prisma } from "@/lib/db";
import { loginFormSchema, LoginFormValues } from "@/schemas/auth";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { cookies } from "next/headers";
import { isRedirectError } from "next/dist/client/components/redirect";

// Admin emails exempt from device limits (comma-separated in env)
function getUnlimitedEmails(): string[] {
  const fromEnv = process.env.ADMIN_UNLIMITED_EMAILS ?? process.env.ADMIN_EMAIL ?? "";
  return fromEnv
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}
const MAX_DEVICES = 2;

interface Props {
  data: LoginFormValues;
  userAgent: string;
  ipAddress: string;
}

export async function loginAction({ data, userAgent, ipAddress }: Props) {
  const { success, data: parsedData, error } = loginFormSchema.safeParse(data);
  const deviceId = cookies().get("device_id")?.value || crypto.randomUUID();

  if (!success) {
    return { success: false, message: error.message };
  }

  // 1. Check if the user exists
  const user = await prisma.user.findFirst({
    where: { email: parsedData.email },
  });

  if (!user) {
    return { success: false, message: "User not found." };
  }

  // 2. Check if email is verified
  if (!user.emailVerified) {
    return {
      success: false,
      message: "Your email is not verified. Please check your inbox to verify your email before logging in.",
    };
  }

  // 3. Validate password (OAuth-only users have no password)
  if (!user.password) {
    return {
      success: false,
      message:
        "Esta cuenta usa Google o Facebook. Inicia sesión con ese método.",
    };
  }

  const isPasswordValid = await bcrypt.compare(
    parsedData.password,
    user.password
  );
  if (!isPasswordValid) {
    return { success: false, message: "Incorrect password." };
  }

  // 4. Handle device management
  const isUnlimited = getUnlimitedEmails().includes(parsedData.email.toLowerCase());

  const userDevices = await prisma.device.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" }, // oldest first
  });

  const isKnownDevice = userDevices.some((d) => d.deviceId === deviceId);

  if (!isKnownDevice) {
    if (!isUnlimited && userDevices.length >= MAX_DEVICES) {
      // Remove the oldest device to make room for the new one
      const oldestDevice = userDevices[0];
      await prisma.device.delete({
        where: { id: oldestDevice.id },
      });
    }

    // Register new device
    try {
      await prisma.device.create({
        data: {
          userId: user.id,
          deviceId,
          userAgent: userAgent ?? "unknown",
          ipAddress: ipAddress ?? "unknown",
        },
      });

      cookies().set("device_id", deviceId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: "/",
      });
    } catch (err) {
      console.error("Failed to save device info:", err);
    }
  }

  // 5. Sign in with next-auth
  try {
    await signIn("credentials", {
      email: parsedData.email,
      password: parsedData.password,
      redirect: false,
    });

    await manejarCookiesRecordarme(
      !!data.rememberMe,
      data.rememberMe ? data.email : undefined
    );

    return {
      success: true,
      message: "Login successful.",
      role: user.role,
    };
  } catch (error: unknown) {
    // Auth.js may throw a Next.js redirect on success — never swallow it.
    if (isRedirectError(error)) throw error;

    console.error("Sign-in error:", error);
    if (error instanceof AuthError) {
      return {
        success: false,
        message: "No se pudo iniciar sesión. Verifica tus credenciales.",
      };
    }
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Something went wrong.",
    };
  }
}

export async function manejarCookiesRecordarme(
  recordarme: boolean,
  email?: string
) {
  const opcionesCookie = {
    sameSite: "strict" as const,
    maxAge: 2592000, // 30 días
  };

  // Never store passwords in cookies — only prefill email.
  cookies().delete("rememberMePassword");

  if (recordarme && email) {
    cookies().set({ name: "rememberMeEmail", value: email, ...opcionesCookie });
  } else {
    cookies().delete("rememberMeEmail");
  }
}
