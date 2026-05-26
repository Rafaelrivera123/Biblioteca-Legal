import { Document } from "@prisma/client";
import * as z from "zod";

export const documentFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Document name must be at least 2 characters." })
    .max(100, { message: "Document name must not exceed 100 characters." }),
  categoryIds: z.array(z.string()).optional().default([]),
  short_description: z
    .string()
    .max(145, { message: "Description must not exceed 145 characters." })
    .optional()
    .default(""),
  law_number: z.string().optional().default(""),
  publishedDate: z.date().optional(),
});

export type DocumentFormSchemaType = z.infer<typeof documentFormSchema>;

export type DocumentsApiResponse = {
  success: boolean;
  message: string;
  data: Document[];
  meta: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
  };
};

export const sectionTitleSchema = z.object({
  name: z.string().min(1),
  documentId: z.string().min(1, { message: "Document ID is required." }),
});
export type SectionTitleSchemaType = z.infer<typeof sectionTitleSchema>;

export const chapterTitleSchema = z.object({
  title: z.string().min(1),
  sectionId: z.string().min(1, { message: "Document ID is required." }),
});
export type ChapterTitleSchemaType = z.infer<typeof chapterTitleSchema>;

export const articleSchema = z.object({
  content: z.string().min(1, { message: "Content is required." }),
  articleNumber: z.number({ message: "Article number is required" }),
  chapterId: z.string().min(1, { message: "Document ID is required." }),
});
export type articleSchemaType = z.infer<typeof articleSchema>;
