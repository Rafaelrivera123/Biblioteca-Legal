import { logoSrc, siteAssets } from "@/helper/assets";
import { MoveLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import ResetRequestForm from "./_components/reset-request-form";

export default function LoginPage() {
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
        <Image
          src={logoSrc}
          width={93}
          height={130}
          alt="Logo"
          className="mb-5"
        />
        <div className="mx-auto w-full max-w-md space-y-10">
          {/* Encabezado */}
          <div className="text-center">
            <h1 className="text-[32px] leading-[120%] font-semibold text-gray-900">
              Restablecer <span className="text-pretty">contraseña</span>
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Ingresa tu correo electrónico para recibir el código OTP
            </p>
          </div>

          {/* Componente del formulario */}
          <ResetRequestForm />

          <div className="w-full flex justify-center">
            <Link href="/" className="flex items-center gap-x-2 group">
              <MoveLeft />{" "}
              <span className="group-hover:underline">Volver al inicio</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
