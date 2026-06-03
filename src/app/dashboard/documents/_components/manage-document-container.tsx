"use client";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "@/components/ui/pagination-controls";
import useDebounce from "@/hooks/useDebounce";
import { DocumentsApiResponse } from "@/schemas/document";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import ManageDocumentCard from "./manage-document-card";

interface Category {
  id: string;
  name: string;
}

const ManageDocumentContainer = () => {
  const [input, setInput] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const searchQuery = useDebounce(input, 500);

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => fetch("/api/categories").then((res) => res.json()),
  });

  const { data, isLoading, isError, error } = useQuery<DocumentsApiResponse>({
    queryKey: ["documents-admin", searchQuery, page, selectedCategory],
    queryFn: () =>
      fetch(
        `/api/documents?search=${searchQuery}&limit=10&page=${page}&admin=true&category=${selectedCategory}`
      ).then((res) => res.json()),
  });

  const handleCategoryClick = (id: string) => {
    setSelectedCategory((prev) => (prev === id ? "" : id));
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setPage(1);
  };

  let content;
  if (isLoading) {
    content = (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[30px] mt-10 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[200px] bg-gray-200 rounded-xl" />
        ))}
      </div>
    );
  } else if (isError) {
    content = (
      <div className="min-h-[300px] flex flex-col items-center justify-center text-red-600 text-center space-y-2">
        <AlertTriangle size={32} />
        <p className="text-lg font-medium">Failed to load documents</p>
        <p className="text-sm text-gray-500">
          {error?.message || "Something went wrong. Please try again later."}
        </p>
      </div>
    );
  } else if (data?.data?.length === 0) {
    content = (
      <div className="min-h-[300px] flex flex-col items-center justify-center text-center space-y-2 text-gray-600">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-16 w-16 text-gray-300"
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
        <p className="text-lg font-medium">No documents found</p>
        <p className="text-sm">Try adjusting your search or filters.</p>
      </div>
    );
  } else {
    content = (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[30px] mt-6">
        {data?.data?.map((item) => (
          <ManageDocumentCard key={item.id} document={item} />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Barra de búsqueda y conteo */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-gray-500 shrink-0">
          {data?.meta?.total !== undefined
            ? `${data.meta.total} documento${data.meta.total !== 1 ? "s" : ""}`
            : ""}
        </p>
        <div className="relative max-w-[400px] w-full ml-auto">
          <Input
            placeholder="Search documents..."
            className="pr-8"
            value={input}
            onChange={handleSearchChange}
          />
          {input && (
            <button
              onClick={() => { setInput(""); setPage(1); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Filtros de categoría */}
      {categories && categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors ${
                selectedCategory === cat.id
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-600 border-gray-300 hover:border-primary hover:text-primary"
              }`}
            >
              {cat.name}
            </button>
          ))}
          {selectedCategory && (
            <button
              onClick={() => { setSelectedCategory(""); setPage(1); }}
              className="px-3 py-1.5 rounded-full text-[13px] font-medium border border-red-200 text-red-500 hover:bg-red-50 flex items-center gap-1 transition-colors"
            >
              <X size={12} /> Clear filter
            </button>
          )}
        </div>
      )}

      {content}

      <div className="pt-[60px]">
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

export default ManageDocumentContainer;
