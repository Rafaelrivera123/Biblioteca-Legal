import { removeBookmark } from "@/actions/article-meta/update";
import ContentViewer from "@/app/dashboard/documents/[documentId]/[sectionId]/[chapterId]/_components/contentViwer";
import AlertModal from "@/components/ui/alert-modal";
import { Button } from "@/components/ui/button";
import ResponsiveDialog from "@/components/ui/responsive-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Article, Document } from "@prisma/client";
import { useQueryClient } from "@tanstack/react-query";
import { Bookmark, ExternalLink, Trash } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface Props {
  articleId: string;
  metaId: string;
  article: Article;
  document: Document;
}

const BookmarkCard = ({ articleId, metaId, article, document }: Props) => {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [contentOpen, setContentOpen] = useState(false);
  const queryClient = useQueryClient();

  const displayLabel = article.articleLabel ?? String(article.articleNumber);
  const docHref = `/collections/${document.slug || document.id}`;

  const onRemoveBookmark = () => {
    startTransition(() => {
      removeBookmark({ metaId }).then((res) => {
        if (!res.success) {
          toast.error(res.message || "Error al eliminar el marcador");
          return;
        }
        toast.success("Marcador eliminado");
        setOpen(false);
        queryClient.invalidateQueries({ queryKey: ["markers"] });
        queryClient.invalidateQueries({ queryKey: ["article", articleId] });
      });
    });
  };

  return (
    <>
      <div
        className="w-full px-5 shadow-none h-[45px] md:h-[60px] rounded-[6px] border flex items-center cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setContentOpen((p) => !p)}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Bookmark className="fill-primary h-5 w-5 shrink-0" />
            <span className="text-[14px]">Artículo {displayLabel}</span>
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

      <AlertModal
        loading={pending}
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onRemoveBookmark}
      />

      <ResponsiveDialog
        open={contentOpen}
        onOpenChange={(p) => setContentOpen(p)}
        title={`Artículo ${displayLabel}`}
        description={document.name}
      >
        <ScrollArea className="min-h-[200px] h-auto lg:max-h-[400px]">
          <ContentViewer content={article.content} />
        </ScrollArea>
      </ResponsiveDialog>
    </>
  );
};

export default BookmarkCard;
