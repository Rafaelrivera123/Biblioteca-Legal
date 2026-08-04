"use client";

import { sendSubscriptionReqCompany } from "@/actions/companies/subscription";
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
import { Textarea } from "@/components/ui/textarea";
import {
  companyContactSchema,
  CompanyContactSchemaType,
} from "@/schemas/company";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { ReactNode, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface Props {
  trigger: ReactNode;
}

export default function CompanyContactModal({ trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm<CompanyContactSchemaType>({
    resolver: zodResolver(companyContactSchema),
    defaultValues: {
      companyName: "",
      numberOfEmployee: undefined,
      managerEmail: "",
      about: "",
    },
  });

  function onSubmit(values: CompanyContactSchemaType) {
    startTransition(() => {
      sendSubscriptionReqCompany(values).then((res) => {
        if (!res.success) {
          toast.error(res.message);
          return;
        }

        toast.success(res.message);
        form.reset();
        setOpen(false);
      });
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent className="w-[calc(100%-2rem)] max-w-xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la empresa</FormLabel>
                  <FormControl>
                    <Input placeholder="ej. OpenAI" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="numberOfEmployee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de usuarios</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="ej. 1"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value || "0"))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="managerEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo del encargado de cuenta</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="gerente@ejemplo.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="about"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cuéntanos sobre tu empresa</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Háblanos sobre tu empresa..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-x-4">
              <Button
                type="button"
                variant="outline"
                className="text-primary hover:text-primary/80 w-full sm:w-auto"
                disabled={pending}
                onClick={() => {
                  form.reset();
                  setOpen(false);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={pending} className="w-full sm:w-auto">
                Enviar{" "}
                {pending && <Loader2 className="ml-2 animate-spin w-4 h-4" />}
              </Button>
            </div>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
