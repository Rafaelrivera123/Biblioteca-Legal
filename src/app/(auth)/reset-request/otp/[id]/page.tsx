import { logoSrc, siteAssets } from "@/helper/assets";
import { prisma } from "@/lib/db";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import OTPForm from "./_components/otp-form";

export default async function OTPPage({ params }: { params: { id: string } }) {
  const otpId = params.id;

  const exist = await prisma.resetReq.findFirst({
    where: {
      id: otpId,
    },
  });

  if (!exist) {
    redirect("/reset-request?error=otp-missing");
  }

  return (
    <div className="flex min-h-screen">
      {/* Lado izquierdo - Imagen */}
      <div className="hidden lg:w-3/5 md:w-1/2 bg-gray-900 lg:block relative">
        <Image
          src={siteAssets.loginSidebar}
          alt="Reunión del equipo"
          fill
          className="object-cover"
        />
      </div>

      {/* Lado derecho - Formulario OTP */}
      <div className="flex w-full flex-col items-center justify-center px-4 py-12 lg:w-1/2 relative">
        <Image
          src={logoSrc}
          width={93}
          height={130}
          alt="Logo"
          className="absolute top-10"
        />
        <div className="mx-auto w-full max-w-md space-y-12">
          {/* Encabezado */}
          <div className="text-center">
            <h1 className="text-[32px] leading-[120%] font-semibold text-gray-900">
              Introduce el <span className="text-primary">código OTP</span>
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Ingresa el código OTP que fue enviado a tu correo para cambiar la
              contraseña
            </p>
          </div>

          {/* Componente del formulario */}
          <Suspense>
            <OTPForm otpId={otpId} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
