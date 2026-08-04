import { logoSrc, siteAssets } from "@/helper/assets";
import { prisma } from "@/lib/db";
import Image from "next/image";
import { redirect } from "next/navigation";
import ResetNowForm from "./_components/reset-now-form";

export default async function ResetNowPage({
  params,
}: {
  params: { id: string };
}) {
  const otpId = params.id;
  const exist = await prisma.resetReq.findFirst({
    where: {
      id: otpId,
    },
  });

  if (!exist) {
    redirect("/reset-request?error=otp-missing");
  }

  if (!exist.isOtpVerified) {
    redirect(`/reset-request/otp/${otpId}`);
  }

  if (exist.expiresAt < new Date()) {
    redirect("/reset-request?error=otp-expired");
  }

  return (
    <div className="flex min-h-screen">
      {/* Lado izquierdo - Imagen */}
      <div className="hidden lg:w-3/5 md:w-1/2 bg-gray-900 lg:block relative">
        <Image
          src={siteAssets.loginSidebar}
          alt="Reunión de equipo"
          fill
          className="object-cover"
        />
      </div>

      {/* Lado derecho - Formulario de restablecimiento */}
      <div className="flex w-full flex-col items-center justify-center px-4 py-12 lg:w-1/2 relative">
        <Image src={logoSrc} width={83} height={100} alt="Logo" />
        <div className="mx-auto w-full max-w-md space-y-12">
          <div className="text-center">
            <h1 className="text-[32px] leading-[120%]  font-semibold text-gray-900">
              Restablecer <span className="text-primary">contraseña</span>
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Ingresa tu nueva contraseña
            </p>
          </div>

          <ResetNowForm otpId={otpId} />
        </div>
      </div>
    </div>
  );
}
