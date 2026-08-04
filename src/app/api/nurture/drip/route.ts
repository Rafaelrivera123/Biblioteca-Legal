import { processNurtureDrip } from "@/lib/nurture";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";
  const ok =
    isVercelCron ||
    (!!cronSecret && authHeader === `Bearer ${cronSecret}`);

  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await processNurtureDrip(50);
  return NextResponse.json({ success: true, ...result });
}
