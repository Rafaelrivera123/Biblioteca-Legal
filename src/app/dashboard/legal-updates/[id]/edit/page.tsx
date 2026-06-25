import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { LegalUpdateForm } from "../../_components/LegalUpdateForm";

export default async function EditLegalUpdatePage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/");

  const [post, documents] = await Promise.all([
    prisma.legalUpdatePost.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        summary: true,
        type: true,
        gacetaNumber: true,
        content: true,
        status: true,
        relatedDocumentId: true,
      },
    }),
    prisma.document.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!post) notFound();

  return (
    <div className="container max-w-[750px] mt-16 mb-20">
      <div className="mb-8">
        <a href="/dashboard/legal-updates" className="text-sm text-muted-foreground hover:text-primary transition-colors">
          ← Volver
        </a>
        <h1 className="font-bold text-2xl mt-4">Editar actualización legal</h1>
      </div>
      <LegalUpdateForm documents={documents} post={post} />
    </div>
  );
}
