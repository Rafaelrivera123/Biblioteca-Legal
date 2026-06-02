import { removeBookmark } from "@/actions/article-meta/update";
import ContentViewer from "@/app/dashboard/documents/[documentId]/[sectionId]/[chapterId]/_components/contentViwer";
import AlertModal from "@/components/ui/alert-modal";
import { Button } from "@/components/ui/button";
import ResponsiveDialog from "@/components/ui/responsive-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getBackgroundClass } from "@/lib/colors";
import { cn } from "@/lib/utils";
import { Article } from "@prisma/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, ExternalLink, Loader2, Trash } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface Props {
  articleId: string;
  index: number;
  metaId: string;
  selectedColor: string;
  isBookmarked: boolean;
  documentSlug?: string | null;
  documentId?: string;
}

interface ApiProps {
  success: boolean;
  data: Article;
  message?: string;
}

const HighlightCard = ({ articleId, metaId, selectedColor, isBookmarked, documentSlug, documentId }: Props) => {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [contentOpen, setContentOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<ApiProps>({
    queryKey: ["meta", articleId],
    queryFn: () => fetch(`/api/article/${articleId}`).then((res) => res.json()),
  });

  const displayLabel = data?.data?.articleLabel ?? String(data?.data?.articleNumber ?? "");
  const docHref = `/collections/${documentSlug || documentId}`;

  const onRemoveBookmark = () => {
    startTransition(() => {
      removeBookmark({ metaId }).then((res) => {
        if (!res.success) {
          toast.error(res.message || "Error al eliminar");
          return;
        }
        toast.success("Resaltado eliminado");
        setOpen(false);
        queryClient.invalidateQueries({ queryKey: ["markers"] });
        queryClient.invalidateQueries({ queryKey: ["meta", articleId] });
      });
    });
  };

  let content;
  if (isLoading) {
    content = (
      <div className="min-h-[100px] flex items-center justify-center">
        <Loader2 className="animate-spin opacity-70" />
      </div>
    );
  } else if (!data?.data) {
    content = <div className="text-gray-500 p-4">Artículo no encontrado.</div>;
  } else {
    content = <ContentViewer content={data.data.content} />;
  }

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
                onClick={(e) => { e.stopPropagation(); setOpen(true); }}
              >
                <Trash size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AlertModal loading={pending} isOpen={open} onClose={() => setOpen(false)} onConfirm={onRemoveBookmark} />

      <ResponsiveDialog
        open={contentOpen}
        onOpenChange={(p) => setContentOpen(p)}
        title={`Artículo ${displayLabel}`}
        description=""
      >
        <ScrollArea className="min-h-[200px] h-auto lg:max-h-[400px]">
          {content}
        </ScrollArea>
      </ResponsiveDialog>
    </>
  );
};

export default HighlightCard;
