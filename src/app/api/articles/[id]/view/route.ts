import { prisma } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return new Response(
      JSON.stringify({ success: false, message: "Missing article ID" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const article = await prisma.article.findUnique({
      where: {
        id: id,
      },
    });

    return Response.json(
      {
        success: true,
        data: article,
        message: "Article fetched successfully",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error fetching article:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Internal Server Error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
