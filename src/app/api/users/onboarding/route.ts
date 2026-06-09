import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const cu = await auth();
  if (!cu?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  await prisma.user.update({
    where: { id: cu.user.id },
    data: { onboardingCompleted: true },
  });
  return NextResponse.json({ success: true });
}
