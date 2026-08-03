import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function requireAdminSession() {
  const session = await auth();

  if (!session?.user) {
    return {
      session: null,
      error: NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  if (session.user.role !== "admin") {
    return {
      session: null,
      error: NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      ),
    };
  }

  return { session, error: null };
}

export function isAdminRequest(
  isAdminParam: boolean,
  role: string | undefined
) {
  return isAdminParam && role === "admin";
}
