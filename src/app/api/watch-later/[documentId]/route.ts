import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { documentId: string } }
) {
  const cu = await auth();

  if (!cu || !cu.user || !cu.user.id) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Authentication required.",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const watchLaterItem = await prisma.watchLists.findFirst({
      where: {
        userId: cu.user.id,
        documentId: params.documentId,
      },
    });

if (!watchLaterItem) {
  return new Response(
    JSON.stringify({
      success: false,
      message: "Item not found in Watch Later list.",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

    return new Response(
      JSON.stringify({
        success: true,
        data: watchLaterItem,
        message: "retrived successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error retrieving Watch Later item:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal server error.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
