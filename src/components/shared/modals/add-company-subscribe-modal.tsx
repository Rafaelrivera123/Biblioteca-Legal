"use client";
import {
  renewsubscribeCompany,
  subscribeCompany,
} from "@/actions/subscription/company";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  companySubscriptionSchema,
  CompanySubscriptionSchemaType,
} from "@/schemas/company";
import { zodResolver } from "@hookform/resolvers/zod";
import { CompanySubscription } from "@prisma/client";
import { format } from "date-fns";
import { ArrowRightLeft, CalendarIcon, Loader2 } from "lucide-react";
import { ReactNode, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface Props {
  trigger: ReactNode;
  companyId: string;
  initialData?: CompanySubscription;
}
export default function AddCompanySubscribeModal({
  trigger,
  companyId,
  initialData,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm<CompanySubscriptionSchemaType>({
    resolver: zodResolver(companySubscriptionSchema),
    defaultValues: {
      companyId,
    },
  });

  function onSubmit(values: CompanySubscriptionSchemaType) {
    startTransition(() => {
      if (initialData) {
        renewsubscribeCompany(values, initialData.id).then((res) => {
          if (!res.success) {
            toast.error(res.message);
            return;
          }

          // handle success
          toast.success(res.message);
          setOpen(false);
        });
      } else {
        subscribeCompany(values).then((res) => {
          if (!res.success) {
            toast.error(res.message);
            return;
          }

          // handle success
          toast.success(res.message);
          setOpen(false);
        });
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent className="w-[calc(100%-2rem)] max-w-2xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <FormField
                control={form.control}
                name="currentPeriodStart"
                render={({ field }) => (
                  <FormItem className="flex flex-col flex-1 min-w-0">
                    <FormLabel>From</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full sm:w-[240px] pl-3 text-left font-normal text-primary hover:text-primary/80",
                              !field.value && ""
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
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
                          disabled={{ before: new Date() }}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                variant="outline"
                className="text-primary sm:mt-5 self-center rotate-90 sm:rotate-0"
                disabled
              >
                <ArrowRightLeft />
              </Button>
              <FormField
                control={form.control}
                name="currentPeriodEnd"
                render={({ field }) => (
                  <FormItem className="flex flex-col flex-1 min-w-0">
                    <FormLabel>To</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full sm:w-[240px] pl-3 text-left font-normal text-primary hover:text-primary/80",
                              !field.value && ""
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
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
                          disabled={{ before: new Date() }}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="txn_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction ID</FormLabel>
                  <FormControl>
                    <Input
                      className="w-full"
                      placeholder=""
                      type="text"
                      {...field}
                      disabled={pending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-x-4">
              <Button
                variant="outline"
                className="text-primary hover:text-primary/80 w-full sm:w-auto"
                onClick={() => {
                  form.reset();
                  setOpen(false);
                }}
                type="button"
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending} className="w-full sm:w-auto">
                Continue
                {pending && <Loader2 className="animate-spin" />}
              </Button>
            </div>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
