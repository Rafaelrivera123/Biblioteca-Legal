"use client";

import { PaginationControls } from "@/components/ui/pagination-controls";
import { Prisma } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";
import NotesCard from "./notes-card";

export type UserArticleMetaWithArticle = Prisma.UserArticleMetaGetPayload<{
  include: {
    article: true;
    document: true;
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

const NotesContainer = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading, isError, error } = useQuery<UserArticleMetaResponse>(
    {
      queryKey: ["notesWithDoc", currentPage],
      queryFn: () =>
        fetch(`/api/account/notes?page=${currentPage}&limit=10`).then((res) =>
          res.json()
        ),
    }
  );

  let content;

  if (isLoading) {
    content = (
      <div className="min-h-[40vh] flex items-center justify-center py-16">
        <Loader2 className="animate-spin" />
      </div>
    );
  } else if (isError) {
    content = (
      <div className="min-h-[300px] flex flex-col items-center justify-center text-red-600 dark:text-red-400 text-center space-y-2">
        <AlertTriangle size={32} />
        <p className="text-lg font-medium">Error al cargar las notas</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {error?.message ||
            "Algo salió mal. Por favor, inténtalo de nuevo más tarde."}
        </p>
      </div>
    );
  } else if (data?.data?.length === 0) {
    content = (
      <div className="min-h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
        No se encontraron notas.
      </div>
    );
  } else if (data?.data && data.data.length > 0) {
    content = (
      <div className="pb-20 space-y-10">
        <div className="grid grid-cols-1 space-y-10">
          {data.data.map((d: UserArticleMetaWithArticle) => (
            <NotesCard key={d.id} document={d.document} />
          ))}
        </div>
        {data.pagination.total > 10 && (
          <div>
            <PaginationControls
              currentPage={currentPage}
              onPageChange={(page) => setCurrentPage(page)}
              totalPages={data.pagination.totalPages}
            />
          </div>
        )}
      </div>
    );
  }

  return <div>{content}</div>;
};

export default NotesContainer;
