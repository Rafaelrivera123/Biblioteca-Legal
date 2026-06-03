"use client";
import { updateArticleMeta } from "@/actions/article-meta/update";
import ContentViewer from "@/app/dashboard/documents/[documentId]/[sectionId]/[chapterId]/_components/contentViwer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import useOutsideClick from "@/hooks/useOutsideClick";
import { getBackgroundClass } from "@/lib/colors";
import { cn } from "@/lib/utils";
import { Article, UserArticleMeta } from "@prisma/client";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, MessageSquare } from "lucide-react";
import dynamic from "next/dynamic";
import { memo, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import ColorPicker from "./tool/color-picker";
import CommentPopover from "./tool/comment-provider";

const SubscribeModal = dynamic(() => import("./subscribe-modal"), { ssr: false });

interface Props {
  data: Article;
  index: number;
  isLoggedin: boolean;
  hasSubscription: boolean;
  documentId: string;
  highlightedArticle?: number | null;
  initialMeta: UserArticleMeta | null;
  isMetaLoading: boolean;
}

const ArticleCard = ({
  data,
  isLoggedin,
  hasSubscription,
  documentId,
  highlightedArticle,
  initialMeta,
  isMetaLoading,
}: Props) => {
  const [pending, startTransition] = useTransition();
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [bookmarked, setBookmarked] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  // Bloquear copy/paste para usuarios sin suscripción
  useEffect(() => {
    if (hasSubscription) return;
    const blockCopy = (e: ClipboardEvent) => {
      e.preventDefault();
    };
    document.addEventListener("copy", blockCopy);
    document.addEventListener("cut", blockCopy);
    return () => {
      document.removeEventListener("copy", blockCopy);
      document.removeEventListener("cut", blockCopy);
    };
  }, [hasSubscription]);

  useEffect(() => {
    if (initialMeta) {
      setSelectedColor(initialMeta.selectedColor ?? "");
      setComment(initialMeta.comment ?? "");
      setBookmarked(initialMeta.isBookmarked);
    }
  }, [initialMeta]);

  useOutsideClick(cardRef, () => {
    setIsColorPickerOpen(false);
    setIsCommentOpen(false);
  });

  if (!data?.id) return null;

  const displayLabel = data.articleLabel ?? String(data.articleNumber);

  const handleArticleButtonClick = () => {
    if (!isLoggedin || !hasSubscription) {
      setShowSubscribeModal(true);
      return;
    }
    setIsColorPickerOpen(true);
  };

  const invalidateMeta = () => {
    // Invalida el batch del chapter para que se refresque
    queryClient.invalidateQueries({ queryKey: ["meta-batch"] });
  };

  const onColorUpdate = (color: string) => {
    startTransition(() => {
      updateArticleMeta({ articleId: data.id, selectedColor: color, documentId }).then((res) => {
        if (!res.success) { toast.error(res.message); return; }
        invalidateMeta();
        setIsColorPickerOpen(false);
      });
    });
  };

  const onBookmark = () => {
    startTransition(() => {
      updateArticleMeta({ articleId: data.id, isBookmarked: !bookmarked, documentId }).then((res) => {
        if (!res.success) { toast.error(res.message); return; }
        invalidateMeta();
        setIsColorPickerOpen(false);
      });
    });
  };

  const onCommentSubmit = () => {
    startTransition(() => {
      updateArticleMeta({ articleId: data.id, comment, documentId }).then((res) => {
        if (!res.success) { toast.error(res.message); return; }
        invalidateMeta();
        setIsCommentOpen(false);
        setIsColorPickerOpen(false);
      });
    });
  };

  const onCommentDelete = () => {
    startTransition(() => {
      updateArticleMeta({ articleId: data.id, comment: "", documentId }).then((res) => {
        if (!res.success) { toast.error(res.message); return; }
        invalidateMeta();
        setIsCommentOpen(false);
        setIsColorPickerOpen(false);
      });
    });
  };

  return (
    <>
      <SubscribeModal open={showSubscribeModal} onClose={() => setShowSubscribeModal(false)} />
      <motion.div
        ref={cardRef}
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          className={cn(
            "rounded-lg shadow-sm border transition-colors duration-300 relative",
            highlightedArticle === data.articleNumber
              ? getBackgroundClass("highlighted")
              : getBackgroundClass(selectedColor),
            isColorPickerOpen && "z-10"
          )}
        >
          <CardHeader>
            <div className="flex items-center gap-x-2 relative">
              <Button
                className="bg-[#1E2A384D]/30 hover:bg-[#1E2A384D]/40 w-fit text-black"
                onClick={handleArticleButtonClick}
                disabled={isMetaLoading || pending}
              >
                Artículo {displayLabel}
              </Button>
              {hasSubscription && !isColorPickerOpen && !isCommentOpen && (
                <div className="flex items-center gap-x-3">
                  {initialMeta?.isBookmarked && (
                    <Button size="icon" variant="outline" className="text-primary border-primary/50" onClick={onBookmark} disabled={pending || isMetaLoading}>
                      <Bookmark className="fill-[#1E2A38]" />
                    </Button>
                  )}
                  {initialMeta?.comment && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button size="icon" variant="outline" className="text-primary border-primary/50">
                          <MessageSquare className="fill-[#1E2A38]" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-fit">{initialMeta.comment}</PopoverContent>
                    </Popover>
                  )}
                </div>
              )}
              <AnimatePresence>
                {isColorPickerOpen && hasSubscription && (
                  <ColorPicker
                    isBookmarked={bookmarked}
                    selectedColor={selectedColor}
                    onColorSelect={(color) => { setSelectedColor(color); onColorUpdate(color); }}
                    onBookmark={onBookmark}
                    onOpenComment={() => setIsCommentOpen(true)}
                  />
                )}
              </AnimatePresence>
              <AnimatePresence>
                {isCommentOpen && hasSubscription && (
                  <CommentPopover
                    loading={pending || isMetaLoading}
                    comment={comment}
                    setComment={setComment}
                    onDelete={onCommentDelete}
                    inputRef={commentInputRef}
                    onSubmit={onCommentSubmit}
                  />
                )}
              </AnimatePresence>
            </div>
          </CardHeader>
          <CardContent>
            <ContentViewer content={data.content} />
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
};

export default memo(ArticleCard);
