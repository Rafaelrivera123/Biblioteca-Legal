"use client";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "@/components/ui/pagination-controls";
import useDebounce from "@/hooks/useDebounce";
import { DocumentsApiResponse } from "@/schemas/document";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import ManageDocumentCard from "./manage-document-card";
const ManageDocumentContainer = () => {
  const [input, setInput] = useState("");
  const [page, setPage] = useState(1);
  const searchQuery = useDebounce(input, 500);
  const { data, isLoading, isError, error } = useQuery<DocumentsApiResponse>({
    queryKey: ["documents-admin", searchQuery, page],
    queryFn: () =>
      fetch(
        `/api/documents?search=${searchQuery}&limit=10&page=${page}&admin=true`
      ).then((res) => res.json()),
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
        <p className="text-lg font-medium">Failed to load documents</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {error?.message || "Something went wrong. Please try again later."}
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
        <p className="text-lg font-medium">No documents found</p>
        <p className="text-sm">Try adjusting your search or filters.</p>
      </div>
    );
  } else {
    content = (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[30px] mt-10">
        {data?.data?.map((item) => (
          <ManageDocumentCard key={item.id} document={item} />
        ))}
      </div>
    );
  }
  return (
    <div className="w-full space-y-6">
      <div className="flex justify-end">
        <Input
          placeholder="Search documents..."
          className="max-w-[400px] ml-auto"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>
      {content}
      <div className="pt-[100px]">
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
