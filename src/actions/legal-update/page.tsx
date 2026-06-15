import { prisma } from "@/lib/db";
import LegalUpdateCard from "@/components/shared/cards/legal-update-card";
const Page = async () => {
  const allUpdates = await prisma.legalUpdatePost.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      relatedDocument: {
        select: { name: true },
      },
    },
  });
  const drafts = allUpdates.filter((u) => u.status === "draft");
  const published = allUpdates.filter((u) => u.status === "published");
  return (
    <div>
      <div className="w-full flex justify-between mb-5">
        <h1 className="text-primary font-semibold text-[32px] leading-[120%]">
          Actualizaciones Legales
        </h1>
      </div>
      <div className="mb-10">
        <h2 className="text-[20px] font-semibold mb-4">
          Borradores ({drafts.length})
        </h2>
        {drafts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay borradores pendientes de revisión.
          </p>
        ) : (
          <div className="flex flex-col gap-y-[15px]">
            {drafts.map((item) => (
              <LegalUpdateCard key={item.id} data={item} />
            ))}
          </div>
        )}
      </div>
      <div>
        <h2 className="text-[20px] font-semibold mb-4">
          Publicadas ({published.length})
        </h2>
        {published.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no has publicado ninguna actualización.
          </p>
        ) : (
          <div className="flex flex-col gap-y-[15px]">
            {published.map((item) => (
              <LegalUpdateCard key={item.id} data={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default Page;
