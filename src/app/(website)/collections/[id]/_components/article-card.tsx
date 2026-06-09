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
import { Bookmark, MessageSquare, Sparkles, ChevronDown, ChevronUp, Crown } from "lucide-react";
import dynamic from "next/dynamic";
import { memo, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import ColorPicker from "./tool/color-picker";
import CommentPopover from "./tool/comment-provider";

const SubscribeModal = dynamic(() => import("./subscribe-modal"), { ssr: false });

interface LockedSummaryProps {
  aiSummary: string;
  onUnlock: () => void;
}

const LockedSummary = ({ aiSummary, onUnlock }: LockedSummaryProps) => (
  <div className="mb-4 relative">
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
      <div className="flex items-center gap-1 mb-1">
        <Sparkles className="w-3 h-3 text-purple-600" />
        <span className="text-xs font-semibold text-purple-700">Resumen generado por IA</span>
      </div>
      <div className="relative">
        <p className="text-sm text-purple-900 leading-relaxed line-clamp-2 select-none">
          {aiSummary}
        </p>
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-purple-50 to-transparent" />
      </div>
    </div>
    <div className="absolute inset-0 flex items-center justify-center">
      <button
        onClick={onUnlock}
        className="flex items-center gap-2 bg-white border border-purple-300 shadow-sm rounded-full px-4 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-50 transition-colors"
      >
        <Crown className="w-3 h-3" />
        Ver resumen completo
      </button>
    </div>
  </div>
);

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
  index,
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
  const [showSummary, setShowSummary] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (hasSubscription) return;
    const blockCopy = (e: ClipboardEvent) => { e.preventDefault(); };
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
  const isFirstCard = index === 0;

  const handleArticleButtonClick = () => {
    if (!isLoggedin || !hasSubscription) {
      setShowSubscribeModal(true);
      return;
    }
    setIsColorPickerOpen(true);
  };

  const handleSummaryClick = () => {
    if (!isLoggedin || !hasSubscription) {
      setShowSubscribeModal(true);
      return;
    }
    setShowSummary((prev) => !prev);
  };

  const invalidateMeta = () => {
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
            <div className="flex items-center gap-x-2 relative flex-wrap">
              <Button
                id={isFirstCard ? "tour-article-tools" : undefined}
                className="bg-[#1E2A384D]/30 hover:bg-[#1E2A384D]/40 w-fit text-black"
                onClick={handleArticleButtonClick}
                disabled={isMetaLoading || pending}
              >
                Artículo {displayLabel}
              </Button>
              {data.aiSummary && hasSubscription && (
                <Button
                  id={isFirstCard ? "tour-ai-summary" : undefined}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1 text-xs border-purple-300 text-purple-700 hover:bg-purple-50"
                  onClick={handleSummaryClick}
                >
                  <Sparkles className="w-3 h-3" />
                  Resumen IA
                  {showSummary
                    ? <ChevronUp className="w-3 h-3" />
                    : <ChevronDown className="w-3 h-3" />}
                </Button>
              )}
              {data.aiSummary && !hasSubscription && (
                <button
                  id={isFirstCard ? "tour-ai-summary" : undefined}
                  onClick={() => setShowSubscribeModal(true)}
                  className="flex items-center gap-1 text-xs border border-purple-300 text-purple-600 rounded-md px-2 py-1 hover:bg-purple-50 transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  Resumen IA disponible
                </button>
              )}
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
            <AnimatePresence>
              {showSummary && hasSubscription && data.aiSummary && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mb-4 overflow-hidden"
                >
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="flex items-center gap-1 mb-1">
                      <Sparkles className="w-3 h-3 text-purple-600" />
                      <span className="text-xs font-semibold text-purple-700">Resumen generado por IA</span>
                    </div>
                    <p className="text-sm text-purple-900 leading-relaxed">{data.aiSummary}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {data.aiSummary && !hasSubscription && (
              <LockedSummary
                aiSummary={data.aiSummary}
                onUnlock={() => setShowSubscribeModal(true)}
              />
            )}
            <ContentViewer content={data.content} />
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
};

export default memo(ArticleCard);
