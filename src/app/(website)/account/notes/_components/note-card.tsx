import { removeNotes } from "@/actions/article-meta/update";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Bookmark, ExternalLink, Loader2, Trash } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { UserArticleMetaWithArticle } from "./notes-card";

interface Props {
  meta: UserArticleMetaWithArticle;
  index: number;
  documentSlug?: string | null;
  documentId?: string;
}

const NoteCard = ({ meta, index, documentSlug, documentId }: Props) => {
  const [pending, startTransition] = useTransition();
  const queryClient = useQueryClient();

  const displayLabel = meta.article.articleLabel ?? String(meta.article.articleNumber);
  const docHref = `/collections/${documentSlug || documentId}`;

  const RemoveNotes = () => {
    startTransition(() => {
      removeNotes({ metaId: meta.id }).then((res) => {
        if (!res.success) {
          toast.error(res.message || "Error al eliminar la nota.");
          return;
        }
        toast.success("Nota eliminada.");
        queryClient.invalidateQueries({ queryKey: ["notesWithDoc"] });
        queryClient.invalidateQueries({ queryKey: ["notes"] });
      });
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-x-2 font-semibold">
          {meta.isBookmarked ? (
            <Bookmark className="h-5 w-5 fill-primary" />
          ) : (
            <Bookmark className="h-5 w-5" />
          )}
          Artículo {displayLabel}
        </p>
        <div className="flex items-center gap-1">
          <Link href={docHref} target="_blank">
            <Button variant="outline" size="icon" className="shadow-none text-primary hover:text-primary/80">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="icon"
            onClick={RemoveNotes}
            disabled={pending}
            className="shadow-none"
          >
            {pending ? (
              <Loader2 className="animate-spin h-4 w-4 text-red-600" />
            ) : (
              <Trash className="h-4 w-4 text-red-500" />
            )}
          </Button>
        </div>
      </div>
      <p className="mt-2 border-input border-[1px] px-2 py-1 rounded-sm text-[15px]">
        {meta.comment}
      </p>
    </div>
  );
};

export default NoteCard;
