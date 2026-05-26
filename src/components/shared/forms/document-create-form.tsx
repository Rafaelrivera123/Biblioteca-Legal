"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";

import { createDocument, editDocument } from "@/actions/document/create";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from "@/components/ui/multi-select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { documentFormSchema, DocumentFormSchemaType } from "@/schemas/document";
import { Category, Document } from "@prisma/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

interface Props {
  initialData?: Document;
}

export function DocumentCreateForm({ initialData }: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const queryClient = useQueryClient();
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => fetch("/api/categories").then((res) => res.json()),
  });

  const form = useForm<DocumentFormSchemaType>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      categoryIds: [],
      short_description: initialData?.short_description ?? "",
      name: initialData?.name ?? "",
      law_number: initialData?.law_number ?? "",
      publishedDate: initialData?.createdAt ?? undefined,
    },
  });

  function handleSubmit(data: DocumentFormSchemaType) {
    startTransition(() => {
      if (initialData) {
        editDocument(initialData.id, data).then((res) => {
          if (!res.success) {
            toast.error(res.message);
            return;
          }
          queryClient.invalidateQueries({ queryKey: ["documents"] });
          toast.success(res.message);
          router.back();
        });
      } else {
        createDocument(data).then((res) => {
          if (!res.success) {
            toast.error(res.message);
            return;
          }
          queryClient.invalidateQueries({ queryKey: ["documents"] });
          toast.success(res.message);
          router.back();
        });
      }
    });
  }

  const shortCharacter = form.watch("short_description").length;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6 bg-white p-[30px] border-[1px] border-black/20 rounded-[8px]"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Document Name *
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter document name"
                    {...field}
                    className="w-full"
                  />
                </FormControl>
                <FormDescription className="text-xs text-gray-500">
                  This is the name of your document.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoryIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Category
                </FormLabel>
                <FormControl>
                  <MultiSelector
                    values={field.value}
                    onValuesChange={field.onChange}
                    loop
                    className="w-full"
                    renderValue={(id) => {
                      const match = categories?.find((cat) => cat.id === id);
                      return match ? match.name : id;
                    }}
                  >
                    <MultiSelectorTrigger className="border border-input">
                      <MultiSelectorInput placeholder="Select category" />
                    </MultiSelectorTrigger>
                    <MultiSelectorContent>
                      <MultiSelectorList>
                        {categories &&
                          categories.length > 0 &&
                          categories.map(({ id, name }) => (
                            <MultiSelectorItem value={id} key={id}>
                              {name}
                            </MultiSelectorItem>
                          ))}
                      </MultiSelectorList>
                    </MultiSelectorContent>
                  </MultiSelector>
                </FormControl>
                <FormDescription className="text-xs text-gray-500">
                  Choose the most appropriate category for this document.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="short_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">
                Description
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Brief description of the document"
                  className="min-h-[100px] resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription
                className={cn(
                  "text-xs text-gray-500",
                  shortCharacter > 145 && "text-red-500"
                )}
              >
                Provide a short summary of the document content (
                {shortCharacter} / 145)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="law_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Reference Number
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., DOC-2024-001"
                    {...field}
                    className="w-full"
                  />
                </FormControl>
                <FormDescription className="text-xs text-gray-500">
                  Internal reference number for tracking (optional).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="publishedDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-sm font-medium text-gray-700">
                  Published Date
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal text-primary hover:text-primary/80",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd-MM-yyyy")
                        ) : (
                          <span>DD-MM-YYYY</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription className="text-xs text-gray-500">
                  The date when this document was published or created.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            className="px-6 text-primary hover:text-primary/80"
          >
            Cancel
          </Button>
          <SubmitButton isLoading={pending} className="w-fit">
            {initialData ? "Save" : "Create"}
          </SubmitButton>
        </div>
      </form>
    </Form>
  );
}
