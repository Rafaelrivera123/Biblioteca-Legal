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
import SubscribeModal from "./subscribe-modal";

interface Props {
  data: Article;
  index: number;
  isLoggedin: boolean;
  hasSubscription: boolean;
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
  hasSubscription,
  doc
