"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, Mail, MoveLeft } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { loginAction } from "@/actions/auth/login";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { loginFormSchema, LoginFormValues } from "@/schemas/auth";
import Cookies from "js-cookie"; // Import js-cookie for cookie retrieval
import SocialAuthButtons from "@/components/auth/social-auth-buttons";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

// Retrieve remembered email only (never store passwords in cookies)
const rememberedEmail = Cookies.get("rememberMeEmail");
const isRemembered = !!rememberedEmail;

type Props = {
  socialProviders?: Array<"google" | "facebook">;
};

export default function LoginForm({
  socialProviders = ["google", "facebook"],
}: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [isMounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  // Middleware uses callbackUrl; some links use redirectTo
  const redirectTo =
    searchParams.get("redirectTo") ??
    searchParams.get("callbackUrl") ??
    undefined;
  const authError = searchParams.get("error");

  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (authError === "EmailRequired") {
      toast.error(
        "No pudimos obtener tu correo. Permite el acceso al email o regístrate manualmente."
      );
    }
  }, [authError]);

  // Initialize the form
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: rememberedEmail ?? "",
      password: "",
      rememberMe: isRemembered ?? false,
    },
  });

  // Handle form submission
  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);

    const userAgent = navigator.userAgent;

    const ip = await fetch("https://api.ipify.org?format=json")
      .then((res) => res.json())
      .then((data) => data.ip)
      .catch(() => "unknown");

    startTransition(() => {
      loginAction({ data, userAgent, ipAddress: ip })
        .then((res) => {
          if (!res?.success) {
            toast.error(res?.message ?? "No se pudo iniciar sesión.");
            setIsLoading(false);
            return;
          }
          const destination =
            redirectTo && redirectTo.startsWith("/")
              ? redirectTo
              : res.role === "admin"
                ? "/dashboard"
                : "/";
          router.push(destination);
          router.refresh();
        })
        .catch((err) => {
          console.error(err);
          toast.error("Error al iniciar sesión. Intenta de nuevo.");
          setIsLoading(false);
        });
    });
  }

  const loading = isLoading || pending;

  if (!isMounted) return;

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Campo de correo electrónico */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      placeholder="Ingresa tu correo electrónico"
                      type="email"
                      className="border-primary border-[1px]  min-h-[45px] "
                      disabled={loading}
                      startIcon={Mail}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Campo de contraseña */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      placeholder="Ingresa tu contraseña"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      className=" pr-10 border-primary border-[1px]  min-h-[45px]"
                      startIcon={Lock}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Recordarme y Olvidé mi contraseña */}
          <div className="flex items-center justify-between">
            <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={loading}
                  />
                  <label
                    htmlFor="rememberMe"
                    className="text-sm font-medium text-gray-700"
                  >
                    Recuérdame
                  </label>
                </div>
              )}
            />
            <Link
              href="/reset-request"
              className="text-sm font-medium text-primary"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {/* Botón de enviar */}
          <Button
            type="submit"
            className="w-full  min-h-[45px]"
            disabled={loading}
          >
            {pending
              ? "Iniciando sesión..."
              : isLoading
                ? "Un momento..."
                : "Iniciar sesión"}
          </Button>
        </form>
      </Form>

      <SocialAuthButtons callbackUrl="/" providers={socialProviders} />

      {/* Enlace para registrarse */}
      <div className="text-center text-sm">
        <span className="text-gray-600">¿Nuevo en nuestra plataforma?</span>{" "}
        <Link
          href="/sign-up"
          className="font-medium text-primary hover:underline"
        >
          Regístrate aquí
        </Link>
      </div>

      <div className="w-full flex justify-center">
        <Link href="/" className="flex items-center gap-x-2 group">
          <MoveLeft />
          <span className="group-hover:underline">Volver al inicio</span>
        </Link>
      </div>
    </>
  );
}
