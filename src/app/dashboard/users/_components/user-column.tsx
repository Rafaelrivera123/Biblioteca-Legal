"use client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { User, UserSubscription } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import moment from "moment";

export type UserWithSubscription = User & {
  userSubscription: Pick<UserSubscription, "isActive"> | null;
};

export const manageUsersColumn: ColumnDef<UserWithSubscription>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    header: "Name",
    cell: ({ row }) => (
      <p>{`${row.original.first_name} ${row.original.last_name}`}</p>
    ),
  },
  {
    header: "Email",
    cell: ({ row }) => <p>{row.original.email}</p>,
  },
  {
    header: "Joined",
    cell: ({ row }) => (
      <p>{moment(row.original.createdAt).format("MMM D, YYYY")}</p>
    ),
  },
  {
    header: "Sub_Type",
    cell: ({ row }) => {
      const isCompany = !!row.original.companyId;
      const isIndividualActive = row.original.userSubscription?.isActive === true;
      const isPaying = isCompany || isIndividualActive;
      return (
        <Badge className={cn(isPaying ? "bg-green-500" : "bg-red-500")}>
          {isPaying ? "Pagando" : "No Pagando"}
        </Badge>
      );
    },
  },
  {
    header: "Account_Type",
    cell: ({ row }) => (
      <Badge
        className={cn(
          row.original.companyId ? "bg-blue-500" : "bg-orange-500"
        )}
      >
        {row.original.companyId ? "Empresarial" : "Individual"}
      </Badge>
    ),
  },
];
