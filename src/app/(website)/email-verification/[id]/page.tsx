import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EmailVerificationConfirmed({
  params,
}: {
  params: { id: string };
}) {
  // Do not verify accounts via open GET — that was forgeable by user id.
  // Registration already marks emailVerified; this page only confirms status.
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, emailVerified: true },
  });

  if (!user) notFound();

  const isVerified = !!user.emailVerified;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="mx-auto max-w-md w-full shadow-lg">
        <CardHeader className="flex flex-col items-center space-y-2 pt-6 pb-2">
          <div
            className={`rounded-full p-3 ${
              isVerified ? "bg-green-100" : "bg-amber-100"
            }`}
          >
            {isVerified ? (
              <CheckCircle className="h-12 w-12 text-green-600" />
            ) : (
              <XCircle className="h-12 w-12 text-amber-600" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-center text-slate-800">
            {isVerified ? "Correo verificado" : "Verificación pendiente"}
          </h1>
        </CardHeader>

        <CardContent className="text-center px-6 pt-4">
          <div className="mb-6">
            <p className="text-slate-600 mb-4">
              {isVerified
                ? "Tu correo electrónico ya está verificado. Puedes iniciar sesión en tu cuenta."
                : "Tu correo aún no está verificado. Revisa tu bandeja de entrada o contacta soporte si necesitas ayuda."}
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3 px-6 pb-6">
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Iniciar sesión</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
