import { auth } from "@/auth";
import DocumentCard from "@/components/shared/cards/document-card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";

const Page = async () => {
  const cu = await auth();
  if (!cu?.user?.id) {
    redirect("/login?redirectTo=/mi-biblioteca/documentos");
  }

  const watchLists = await prisma.watchLists.findMany({
    where: { userId: cu.user.id },
    include: { document: true },
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[#1E2A38]">
          Documentos guardados
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Leyes y códigos en tu lista de seguimiento
        </p>
      </div>

      {watchLists.length === 0 ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center text-center space-y-2 text-gray-600">
          <p className="text-lg font-medium">
            Aún no tienes documentos en tu lista de seguimiento
          </p>
          <p className="text-sm">
            Abre cualquier ley y usa Guardar para agregarla aquí.
          </p>
          <Button asChild>
            <Link href="/collections">Ver colección</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[30px]">
          {watchLists.map((item) => (
            <DocumentCard key={item.id} document={item.document} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Page;
