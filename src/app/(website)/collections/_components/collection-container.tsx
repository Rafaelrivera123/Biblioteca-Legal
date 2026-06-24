"use client";
import DocumentCard from "@/components/shared/cards/document-card";
import { PaginationControls } from "@/components/ui/pagination-controls";
import useDebounce from "@/hooks/useDebounce";
import { DocumentsApiResponse } from "@/schemas/document";
import useCollectionSearchStore from "@/store/collections";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";

interface Props {
  initialData?: DocumentsApiResponse;
}

const CollectionContainer = ({ initialData }: Props) => {
  const { query, page, setPage, category } = useCollectionSearchStore();
  const searchQuery = useDebounce(query, 500);

  const isDefaultView =
    page === 1 && !searchQuery && (category === "all" || !category);

  const { data, isLoading, isError, error } = useQuery<DocumentsApiResponse>({
    queryKey: ["documents", searchQuery, page, category],
    queryFn: () =>
      fetch(
        `/api/documents?search=${searchQuery}&category=${category}&limit=12&page=${page}`
      ).then((res) => res.json()),
    initialData: isDefaultView ? initialData : undefined,
    staleTime: 60_000,
  });

  let content;
  if (isLoading) {
    content = (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[30px] mt-10 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[200px] bg-gray-200 rounded-xl dark:bg-gray-800"
          />
        ))}
      </div>
    );
  } else if (isError) {
    content = (
      <div className="min-h-[300px] flex flex-col items-center justify-center text-red-600 dark:text-red-400 text-center space-y-2">
        <AlertTriangle size={32} />
        <p className="text-lg font-medium">Error al cargar los documentos</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {error?.message ||
            "Algo salió mal. Por favor, inténtalo de nuevo más tarde."}
        </p>
      </div>
    );
  } else if (data?.data?.length === 0) {
    content = (
      <div className="min-h-[300px] flex flex-col items-center justify-center text-center space-y-2 text-gray-600 dark:text-gray-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-16 w-16 text-gray-300 dark:text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 17v-2a4 4 0 014-4h5m-7 6h.01M4 6h16M4 10h16M4 14h10"
          />
        </svg>
        <p className="text-lg font-medium">No se encontraron documentos</p>
        <p className="text-sm">Intenta ajustar tu búsqueda o los filtros.</p>
      </div>
    );
  } else {
    content = (
      <div
        id="tour-collections-grid"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[30px] mt-10"
      >
        {data?.data?.map((item) => (
          <DocumentCard key={item.id} document={item} />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 container">
      {content}
      <div className="py-[100px]">
        {data?.meta?.totalPages !== undefined && data.meta.totalPages > 0 && (
          <PaginationControls
            currentPage={page}
            totalPages={data.meta.totalPages}
            onPageChange={(newPage) => setPage(newPage)}
          />
        )}
      </div>
    </div>
  );
};

export default CollectionContainer;
