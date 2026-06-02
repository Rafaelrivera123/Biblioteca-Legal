import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Document, Prisma } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import NoteCard from "./note-card";

interface Props {
  document: Document;
}

export type UserArticleMetaWithArticle = Prisma.UserArticleMetaGetPayload<{
  include: {
    article: true;
  };
}>;

export type UserArticleMetaResponse = {
  data: UserArticleMetaWithArticle[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

const NotesCard = ({ document }: Props) => {
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading, isError, error } = useQuery<UserArticleMetaResponse>({
    queryKey: ["notes", currentPage, document.id],
    queryFn: () =>
      fetch(`/api/account/notes/${document.id}?page=${currentPage}&limit=10`).then((res) => res.json()),
  });

  const docHref = `/collections/${document.slug || document.id}`;

  let content;
  if (isLoading) {
    content = <div><Loader2 className="animate-spin" /></div>;
  } else if (isError) {
    content = <div className="text-red-600">Error: {error?.message || "Algo salió mal."}</div>;
  } else if (data?.data?.length === 0) {
    content = <div className="text-gray-500">No se encontraron notas para este documento.</div>;
  } else {
    content = (
      <div className="space-y-4">
        {data?.data.map((meta, i) => (
          <NoteCard
            key={meta.id}
            index={i}
            meta={meta}
            documentSlug={document.slug}
            documentId={document.id}
          />
        ))}
      </div>
    );
  }

  return (
    <Card className="shadow-none">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-[24px]">{document.name}</CardTitle>
            <CardDescription className="max-w-[600px]">
              {document.short_description}
            </CardDescription>
          </div>
          <Link href={docHref} target="_blank">
            <ExternalLink size={16} className="text-primary mt-2 shrink-0" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>{content}</CardContent>
      <CardFooter className="flex justify-end">
        {data?.pagination && data.pagination.total > 10 && (
          <PaginationControls
            currentPage={currentPage}
            onPageChange={(page) => setCurrentPage(page)}
            totalPages={data.pagination.totalPages}
          />
        )}
      </CardFooter>
    </Card>
  );
};

export default NotesCard;
