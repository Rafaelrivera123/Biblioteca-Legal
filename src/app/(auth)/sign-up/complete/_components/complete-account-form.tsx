"use client";

import { completeAccountAction } from "@/actions/auth/complete-account";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { trackEvent } from "@/lib/analytics";
import {
  completeAccountSchema,
  CompleteAccountSchemaType,
} from "@/schemas/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  defaultValues: {
    first_name: string;
    last_name: string;
    email: string;
  };
  /** When true, email came from the provider and should stay read-only. */
  emailLocked?: boolean;
  /** When set to "subscribe", continue to Personal checkout after signup. */
  intent?: "subscribe";
};

export default function CompleteAccountForm({
  defaultValues,
  emailLocked = true,
  intent,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<CompleteAccountSchemaType>({
    resolver: zodResolver(completeAccountSchema),
    defaultValues: {
      ...defaultValues,
      terms: false as unknown as true,
      promotion: true,
    },
  });

  function onSubmit(values: CompleteAccountSchemaType) {
    startTransition(async () => {
      const result = await completeAccountAction(values);
      if (!result.success) {
        toast.error(result.message || "Error al crear la cuenta.");
        return;
      }

      trackEvent("sign_up", { method: "oauth" });
      toast.success(result.message);
      router.push(
        intent === "subscribe"
          ? "/subscriptions?checkout=monthly"
          : "/collections"
      );
      router.refresh();
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-[20px] max-w-[730px] mx-auto py-10"
      >
        <h1 className="text-black font-semibold text-[20px] leading-[120%]">
          Confirma tus datos
        </h1>
        <p className="text-sm text-gray-600">
          Usa tu cuenta de Google o Facebook para registrarte. Confirma tu
          nombre y correo para crear tu cuenta en Biblioteca Legal.
        </p>

        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Ingresa tu nombre" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Apellido</FormLabel>
              <FormControl>
                <Input placeholder="Ingresa tu apellido" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo electrónico</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ingresa tu correo electrónico"
                  type="email"
                  readOnly={emailLocked}
                  className={emailLocked ? "bg-gray-50" : undefined}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3 pt-[20px]">
          <FormField
            control={form.control}
            name="terms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border-0">
                <FormControl>
                  <Checkbox
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Acepto los Términos de servicio y la Política de privacidad
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="promotion"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Me gustaría recibir actualizaciones sobre productos,
                    servicios y promociones
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="pt-[30px]">
          <SubmitButton isLoading={isPending}>Crear mi cuenta</SubmitButton>
        </div>
      </form>
    </Form>
  );
}
