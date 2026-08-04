"use server";

import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

export async function logoutAction() {
  const session = await auth();

  if (!session?.user.id) {
    return { success: false, message: "No user session found." };
  }
  const deviceId = cookies().get("device_id")?.value;

  if (session?.user && deviceId) {
    try {
      // Clear IP address from the device record
      await prisma.device.delete({
        where: {
          userId_deviceId: {
            userId: session.user.id,
            deviceId: deviceId,
          },
        },
      });
    } catch (error) {
      console.error("Error deleting IP on logout:", error);
    }
  }

  // Remove device_id cookie (optional)
  cookies().delete("device_id");

  // Invalidate session without forcing a server redirect from the action
  await signOut({ redirect: false });

  return { success: true, message: "Logged out successfully." };
}
