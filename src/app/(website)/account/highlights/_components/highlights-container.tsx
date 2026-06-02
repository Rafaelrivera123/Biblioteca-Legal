"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Prisma, UserArticleMeta } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import HighlightCard from "./highlight-card";

type GroupedByDocument = {
  documentId: string;
  document: UserArticleMetaWithRelations["document"];
  items: Omit<UserArticleMetaWithRelations, "document">[];
};

export type UserArticleMetaWithRelations = Prisma.UserArticleMetaGetPayload<{
  include: {
    article: true;
    document: {
      select: {
        name: true;
        short_description: true;
        slug: true;
        id: true;
      };
    };
  };
}>;

export type UserArticleMetaResponse = {
  data: UserArticleMetaWithRelations[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export function groupByDocumentId(data: UserArticleMetaWithRelations[]): GroupedByDocument[] {
  return Object.values(
    data.reduce<Record<string, GroupedByDocument>>((acc, item) => {
      const docId = item.documentId;
      if (!acc[docId]) {
        acc[docId] = { documentId: docId, document: item.document, items: [] };
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { document, ...rest } = item;
      acc[docId].items.push(rest);
      return acc;
    }, {})
  );
}

const HighlightContainer = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading, isError, error } = useQuery<UserArticleMetaResponse>({
    queryKey: ["markers", currentPage],
    queryFn: () =>
      fetch(`/api/account/highlights?page=${currentPage}&limit=10`).then((res) => res.json()),
  });

  const grouped = groupByDocumentId(data?.data ?? []);

  let content;
  if (isLoading) {
    content = (
      <div className="min-h-[600px] flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  } else if (isError) {
    content = (
      <div className="min-h-[300px] flex flex-col items-center justify-center text-red-600 text-center space-y-2">
        <AlertTriangle size={32} />
        <p className="text-lg font-medium">Error al cargar los resaltados</p>
        <p className="text-sm text-gray-500">{error?.message || "Algo salió mal."}</p>
      </div>
    );
  } else if (data?.data?.length === 0) {
    content = (
      <div className="min-h-[300px] flex items-center justify-center text-gray-500">
        No se encontraron resaltados.
      </div>
    );
  } else if (data?.data && data.data.length > 0) {
    content = (
      <div className="pb-20">
        <div className="grid grid-cols-1 space-y-10">
          {grouped.map((doc: GroupedByDocument) => {
            const docHref = `/collections/${(doc.document as any).slug || doc.documentId}`;
            return (
              <Card className="shadow-none" key={doc.documentId}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-[14px] md:text-[16px]">
                        {doc.document.name}
                      </CardTitle>
                      <CardDescription className="text-[12px] md:text-[14px]">
                        {doc.document.short_description}
                      </CardDescription>
                    </div>
                    <Link href={docHref} target="_blank">
                      <ExternalLink size={16} className="text-primary mt-1 shrink-0" />
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {doc.items.map((item: UserArticleMeta) => (
                    <HighlightCard
                      key={item.id}
                      articleId={item.articleId}
                      index={0}
                      metaId={item.id}
                      isBookmarked={item.isBookmarked}
                      selectedColor={item.selectedColor ?? "#f0f0f0"}
                      documentSlug={(doc.document as any).slug}
                      documentId={doc.documentId}
                    />
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
        {data.pagination.total > 10 && (
          <PaginationControls
            currentPage={currentPage}
            onPageChange={(page) => setCurrentPage(page)}
            totalPages={data.pagination.totalPages}
          />
        )}
      </div>
    );
  }

  return <div>{content}</div>;
};

export default HighlightContainer;
