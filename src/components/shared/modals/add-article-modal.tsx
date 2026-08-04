"use client";
import { createArticle } from "@/actions/document/section/article/create";
import { editArticle } from "@/actions/document/section/article/edit";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { articleSchema, articleSchemaType } from "@/schemas/document";
import { zodResolver } from "@hookform/resolvers/zod";
import { Article } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { ReactNode, useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import RichTextEditor from "../sections/RichTextEditor";

interface Props {
  trigger: ReactNode;
  initialData?: Article;
  chapterId: string;
  documentId: string;
  sectionId: string;
}
export default function AddArticleModal({
  trigger,
  initialData,
  chapterId,
  documentId,
  sectionId,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm<articleSchemaType>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      content: initialData ? initialData.content : "",
      chapterId: initialData ? initialData.chapterId : chapterId,
      articleNumber: initialData ? initialData?.articleNumber : 1,
    },
  });

  function onSubmit(values: articleSchemaType) {
    startTransition(() => {
      if (initialData) {
        editArticle({
          articleId: initialData.id,
          data: values,
          documentId: documentId,
          sectionId: sectionId,
        }).then((res) => {
          if (!res.success) {
            toast.error(res.message);
            return;
          }

          // handle success
          toast.success(res.message);
          form.reset();
          setOpen(false);
        });
      } else {
        createArticle(values, documentId, sectionId).then((res) => {
          if (!res.success) {
            toast.error(res.message);
            return;
          }

          // handle success
          toast.success(res.message);
          form.reset();
          setOpen(false);
        });
      }
    });
  }

  useEffect(() => {
    if (open && initialData) {
      form.reset({
        content: initialData.content,
        chapterId: chapterId,
        articleNumber: initialData.articleNumber,
      });
    }
  }, [open, initialData, form, chapterId]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent className="w-[calc(100%-2rem)] max-w-4xl overflow-y-auto p-0">
        <ScrollArea className="max-h-[80dvh] p-4 sm:p-8">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8 mb-2 "
            >
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        content={field.value}
                        onChange={(content) => field.onChange(content)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="articleNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Article Number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        value={field.value}
                        placeholder="Write Article number"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-x-4">
                <Button
                  variant="outline"
                  className="text-primary hover:text-primary/80"
                  onClick={() => {
                    form.reset();
                    setOpen(false);
                  }}
                  type="button"
                  disabled={pending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {initialData ? "Save Now" : "Submit"}{" "}
                  {pending && <Loader2 className="animate-spin" />}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </AlertDialogContent>
    </AlertDialog>
  );
}
