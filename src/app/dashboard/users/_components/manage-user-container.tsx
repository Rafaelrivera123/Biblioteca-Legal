"use client";
import { DataTable } from "@/components/ui/data-table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import useDebounce from "@/hooks/useDebounce";
import { useManageUserSearchStore } from "@/store/dashboard/users";
import { ColumnDef, getCoreRowModel, getPaginationRowModel, useReactTable } from "@tanstack/react-table";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { manageUsersColumn, UserWithSubscription } from "./user-column";

export interface UserPaginationResponse {
  success: boolean;
  message: string;
  data: {
    users: UserWithSubscription[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  } | null;
}

const ManageUserContainer = () => {
  const { query, page } = useManageUserSearchStore();
  const searchQuery = useDebounce(query, 500);
  const { data, isLoading, isError, error } = useQuery<UserPaginationResponse>({
    queryKey: ["users", searchQuery, page],
    queryFn: () =>
      fetch(`/api/users?query=${searchQuery}&page=${page}&limit=10`).then(
        (res) => res.json()
      ),
  });

  let content;
  if (isLoading) {
    content = (
      <div className="h-[400px] flex justify-center items-center flex-col">
        <Loader2 className="animate-spin opacity-80" />
        <p>Please wait...</p>
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
  } else if (data?.data) {
    content = (
      <TableContainer
        data={data.data.users}
        columns={manageUsersColumn}
        totalPages={data.data.pagination.totalPages}
      />
    );
  }

  return <div>{content}</div>;
};

export default ManageUserContainer;

interface TableProps {
  data: UserWithSubscription[];
  columns: ColumnDef<UserWithSubscription>[];
  totalPages: number;
}

const TableContainer = ({ data, columns, totalPages }: TableProps) => {
  const { page, setPage } = useManageUserSearchStore();
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <>
      <div className="bg-white">
        <DataTable table={table} columns={columns} />
      </div>
      {totalPages > 1 && (
        <div className="mt-4 w-full flex justify-end">
          <div>
            <PaginationControls
              currentPage={page}
              onPageChange={(page) => setPage(page)}
              totalPages={totalPages}
            />
          </div>
        </div>
      )}
    </>
  );
};
