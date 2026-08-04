"use client";

import { deleteCategory } from "@/actions/category/delete";
import AlertModal from "@/components/ui/alert-modal";
import { Button } from "@/components/ui/button";
import { Category } from "@prisma/client";
import { Pencil, Trash } from "lucide-react";
import dynamic from "next/dynamic";
import { useState, useTransition } from "react";
import { toast } from "sonner";
const AddCategoryDialog = dynamic(
  () => import("@/components/shared/modals/add-category-modal"),
  {
    ssr: false,
  }
);

interface Props {
  data: Category;
}
const CategoryCard = ({ data }: Props) => {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const onDelete = () => {
    startTransition(() => {
      deleteCategory(data.id).then((res) => {
        if (!res.success) {
          toast.error(res.message);
          return;
        }

        // handle success
        toast.success(res.message);
      });
    });
  };
  return (
    <>
      <div className="border-[1px] border-[#1E2A3866]/40 py-[15px] px-[20px] rounded-[8px] bg-white flex items-center justify-between gap-x-4 w-full sm:w-auto min-w-0 sm:min-w-[220px]">
        <span className="truncate">{data.name}</span>
        <div className="flex items-center shrink-0">
          <AddCategoryDialog
            initialData={data}
            trigger={
              <Button size="icon" variant="link" title="Edit">
                <Pencil />
              </Button>
            }
          />
          <Button
            size="icon"
            variant="link"
            title="delete"
            onClick={() => setOpen(true)}
          >
            <Trash className="text-rose-500" />
          </Button>
        </div>
      </div>

      <AlertModal
        isOpen={open}
        loading={pending}
        onClose={() => setOpen(false)}
        onConfirm={onDelete}
      />
    </>
  );
};

export default CategoryCard;
