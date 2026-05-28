"use client";
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
import { memo, useEffect, useRef, useState, useTransition } from "react";
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
        queryClient.invalidateQueries({ queryKey: ["
