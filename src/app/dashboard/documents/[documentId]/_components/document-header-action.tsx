"use client";
import { deleteDocument } from "@/actions/document/delete";
import { updateDocumentStatus } from "@/actions/document/update";
import AlertModal from "@/components/ui/alert-modal";
import { Button } from "@/components/ui/button";
import { Document } from "@prisma/client";
import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface Props {
  documentId: string;
  document: Document;
}

const DocumentHeaderAction = ({ documentId, document }: Props) => {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const onDelete = () => {
    startTransition(() => {
      deleteDocument(documentId).then((res) => {
        if (!res.success) {
          toast.error(res.message);
          return;
        }

        // handle success
        toast.success(res.message);
        setOpen(false);
        router.back();
      });
    });
  };

  const statusChange = () => {
    startTransition(() => {
      updateDocumentStatus(documentId).then((res) => {
        if (!res.success) {
          toast.error(res.message);
          return;
        }

        // handle success
        toast.success(res.message);
        router.refresh();
      });
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        <Button
          variant="outline"
          className="text-primary hover:text-primary/80 flex-1 sm:flex-none"
          onClick={statusChange}
          disabled={pending}
        >
          {document.published ? "Unpublish" : "Publish"}
        </Button>
        <Button
          variant="destructive"
          size="icon"
          className="shrink-0"
          onClick={() => setOpen(true)}
        >
          <Trash />
        </Button>
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

export default DocumentHeaderAction;
