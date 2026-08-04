import { removeHighlight } from "@/actions/article-meta/update";
import ContentViewer from "@/app/dashboard/documents/[documentId]/[sectionId]/[chapterId]/_components/contentViwer";
import AlertModal from "@/components/ui/alert-modal";
import { Button } from "@/components/ui/button";
import ResponsiveDialog from "@/components/ui/responsive-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getBackgroundClass } from "@/lib/colors";
import { cn } from "@/lib/utils";
import { Article } from "@prisma/client";
import { useQueryClient } from "@tanstack/react-query";
import { Bookmark, ExternalLink, Trash } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface Props {
  metaId: string;
  selectedColor: string;
  isBookmarked: boolean;
  documentSlug?: string | null;
  documentId?: string;
  article: Article;
}

const HighlightCard = ({
  metaId,
  selectedColor,
  isBookmarked,
  documentSlug,
  documentId,
  article,
}: Props) => {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [contentOpen, setContentOpen] = useState(false);
  const queryClient = useQueryClient();

  const displayLabel = article.articleLabel ?? String(article.articleNumber ?? "");
  const docHref = `/collections/${documentSlug || documentId}`;

  const onRemoveHighlight = () => {
    startTransition(() => {
      removeHighlight({ metaId }).then((res) => {
        if (!res.success) {
          toast.error(res.message || "Error al eliminar");
          return;
        }
        toast.success("Resaltado eliminado");
        setOpen(false);
        queryClient.invalidateQueries({ queryKey: ["highlights"] });
      });
    });
  };

  return (
    <>
      <div className={cn("shadow-none w-full rounded-[6px]", getBackgroundClass(selectedColor))}>
        <div className="h-[45px] md:h-[60px] w-full flex items-center justify-between px-5">
          <div
            className="flex items-center justify-between w-full cursor-pointer"
            onClick={() => setContentOpen((p) => !p)}
          >
            <div className="flex items-center gap-2">
              {isBookmarked ? (
                <Bookmark className="fill-primary h-5 w-5 shrink-0" />
              ) : (
                <Bookmark className="h-5 w-5 shrink-0" />
              )}
              <span className="text-[14px] md:text-[16px]">
                Artículo {displayLabel}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Link
                href={docHref}
                target="_blank"
                onClick={(e) => e.stopPropagation()}
              >
                <Button variant="link" size="icon" className="text-primary hover:text-primary/80">
                  <ExternalLink size={16} />
                </Button>
              </Link>
              <Button
                variant="link"
                className="hover:text-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(true);
                }}
              >
                <Trash size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AlertModal
        loading={pending}
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onRemoveHighlight}
      />

      <ResponsiveDialog
        open={contentOpen}
        onOpenChange={(p) => setContentOpen(p)}
        title={`Artículo ${displayLabel}`}
        description=""
      >
        <ScrollArea className="min-h-[200px] h-auto lg:max-h-[400px]">
          <ContentViewer content={article.content} />
        </ScrollArea>
      </ResponsiveDialog>
    </>
  );
};

export default HighlightCard;
