import { auth } from "@/auth";
import { logoSrc, siteAssets } from "@/helper/assets";
import { getEnabledSocialProviders } from "@/lib/social-providers";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import LoginForm from "./_components/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { redirectTo?: string; callbackUrl?: string };
}) {
  const cu = await auth();

  if (cu) {
    if (cu.user.accountCompleted === false) {
      redirect("/sign-up/complete");
    }
    const destination =
      searchParams?.redirectTo?.startsWith("/")
        ? searchParams.redirectTo
        : searchParams?.callbackUrl?.startsWith("/")
          ? searchParams.callbackUrl
          : "/";
    redirect(destination);
  }

  return (
    <div className="flex min-h-screen">
      {/* Lado izquierdo - Imagen */}
      <div className="hidden lg:w-3/5 md:w-1/2 bg-gray-900 lg:block relative">
        <Image
          src={siteAssets.loginSidebar}
          alt="Fondo de la página de inicio de sesión"
          fill
          className="object-cover"
        />
      </div>

      {/* Lado derecho - Formulario de inicio de sesión */}
      <div className="flex w-full flex-col items-center justify-center px-4 py-12 lg:w-1/2 relative">
        <Image
          src={logoSrc}
          width={83}
          height={100}
          alt="Logo"
          className="absolute top-5 md:top-10"
        />
        <div className="mx-auto w-full max-w-md space-y-10">
          {/* Texto de bienvenida */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Bienvenido <span>nuevamente</span>
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Por favor, introduce tus credenciales para continuar
            </p>
          </div>

          {/* Componente de formulario de inicio de sesión */}
          <Suspense fallback={null}>
            <LoginForm socialProviders={getEnabledSocialProviders()} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
