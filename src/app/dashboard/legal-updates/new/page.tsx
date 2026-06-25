import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { LegalUpdateForm } from "../_components/LegalUpdateForm";

export default async function NewLegalUpdatePage() {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/");

  const documents = await prisma.document.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="container max-w-[750px] mt-16 mb-20">
      <div className="mb-8">
        <a href="/dashboard/legal-updates" className="text-sm text-muted-foreground hover:text-primary transition-colors">
          ← Volver
        </a>
        <h1 className="font-bold text-2xl mt-4">Nueva actualización legal</h1>
      </div>
      <LegalUpdateForm documents={documents} />
    </div>
  );
}
