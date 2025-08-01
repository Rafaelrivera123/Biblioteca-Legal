import { updateArticleMeta } from "@/actions/article-meta/update";
import ContentViewer from "@/app/dashboard/documents/[documentId]/[sectionId]/[chapterId]/_components/contentViwer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import useOutsideClick from "@/hooks/useOutsideClick";
import { getBackgroundClass } from "@/lib/colors";
import { cn } from "@/lib/utils";
import { Article, UserArticleMeta } from "@prisma/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, Lock, MessageSquare } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import ColorPicker from "./tool/color-picker";
import CommentPopover from "./tool/comment-provider";

interface Props {
  data: Article;
  index: number;
  isLoggedin: boolean;
  documentId: string;
  highlightedArticle?: number | null;
}

interface ApiRes {
  success: boolean;
  message: string;
  data: UserArticleMeta | null;
}

const ArticleCard = ({
  data,
  isLoggedin,
  documentId,
  highlightedArticle,
}: Props) => {
  const [pending, startTransition] = useTransition();
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [bookmarked, setBookmarked] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const queryClient = useQueryClient();

  const { data: articleMeta, isLoading } = useQuery<ApiRes>({
    queryKey: ["meta", data.id],
    queryFn: () =>
      fetch(`/api/article-meta-data/${data.id}`).then((res) => res.json()),
  });

  useEffect(() => {
    if (articleMeta?.success && articleMeta?.data) {
      setSelectedColor(articleMeta.data.selectedColor!);
      setComment(articleMeta.data.comment ?? "");
      setBookmarked(articleMeta.data.isBookmarked);
    }
  }, [articleMeta]);

  useOutsideClick(cardRef, () => {
    setIsColorPickerOpen(false);
    setIsCommentOpen(false);
  });

  const onColorUpdate = (color: string) => {
    startTransition(() => {
      updateArticleMeta({
        articleId: data.id,
        selectedColor: color,
        documentId,
      }).then((res) => {
        if (!res.success) {
          toast.error(res.message);

          return;
        }

        // handle success
        queryClient.invalidateQueries({ queryKey: ["meta", data.id] });
        setIsColorPickerOpen(false);
      });
    });
  };

  const onBookmark = () => {
    startTransition(() => {
      updateArticleMeta({
        articleId: data.id,
        isBookmarked: !bookmarked,
        documentId,
      }).then((res) => {
        if (!res.success) {
          toast.error(res.message);

          return;
        }

        // handle success
        queryClient.invalidateQueries({ queryKey: ["meta", data.id] });
        setIsColorPickerOpen(false);
      });
    });
  };

  const onCommentSubmit = () => {
    startTransition(() => {
      updateArticleMeta({
        articleId: data.id,
        comment: comment,
        documentId,
      }).then((res) => {
        if (!res.success) {
          toast.error(res.message);

          return;
        }

        // handle success
        queryClient.invalidateQueries({ queryKey: ["meta", data.id] });
        setIsCommentOpen(false);
        setIsColorPickerOpen(false);
      });
    });
  };

  const onCommentDelete = () => {
    startTransition(() => {
      updateArticleMeta({
        articleId: data.id,
        comment: "",
        documentId,
      }).then((res) => {
        if (!res.success) {
          toast.error(res.message);

          return;
        }

        // handle success
        queryClient.invalidateQueries({ queryKey: ["meta", data.id] });
        setIsCommentOpen(false);
        setIsColorPickerOpen(false);
      });
    });
  };

  return (
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
              onClick={() => setIsColorPickerOpen(true)}
              disabled={isLoading || pending || !isLoggedin}
            >
              Artículo {data.articleNumber}{" "}
              {!isLoggedin && <Lock className="ml-1" />}
            </Button>

            {!isColorPickerOpen && !isCommentOpen && (
              <div className="flex items-center gap-x-3">
                {articleMeta?.data?.isBookmarked && (
                  <Button
                    size="icon"
                    variant="outline"
                    className="text-primary border-primary/50"
                    onClick={onBookmark}
                    disabled={pending || isLoading}
                  >
                    <Bookmark className="fill-[#1E2A38]   " />
                  </Button>
                )}
                {articleMeta?.data?.comment && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        size="icon"
                        variant="outline"
                        className="text-primary border-primary/50"
                      >
                        <MessageSquare className="fill-[#1E2A38]  hover:scale-100 " />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-fit">
                      {articleMeta.data.comment}
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            )}

            <AnimatePresence>
              {isColorPickerOpen && (
                <ColorPicker
                  isBookmarked={bookmarked}
                  selectedColor={selectedColor}
                  onColorSelect={(color) => {
                    setSelectedColor(color); // update UI
                    onColorUpdate(color); // update server
                  }}
                  onBookmark={onBookmark}
                  onOpenComment={() => setIsCommentOpen(true)}
                />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isCommentOpen && (
                <CommentPopover
                  loading={pending || isLoading}
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
  );
};

export default ArticleCard;
