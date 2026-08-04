import { verifyEmailToken } from "@/actions/auth/verify-email";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams?: { token?: string; email?: string };
}) {
  const token = searchParams?.token;
  const email = searchParams?.email;

  if (!token || !email) {
    return (
      <VerificationResult
        success={false}
        message="El enlace de verificación no es válido."
      />
    );
  }

  const result = await verifyEmailToken(email, token);

  return (
    <VerificationResult success={result.success} message={result.message} />
  );
}

function VerificationResult({
  success,
  message,
}: {
  success: boolean;
  message: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="mx-auto max-w-md w-full shadow-lg">
        <CardHeader className="flex flex-col items-center space-y-2 pt-6 pb-2">
          <div
            className={`rounded-full p-3 ${
              success ? "bg-green-100" : "bg-red-100"
            }`}
          >
            {success ? (
              <CheckCircle className="h-12 w-12 text-green-600" />
            ) : (
              <XCircle className="h-12 w-12 text-red-600" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-center text-slate-800">
            {success ? "Correo verificado" : "Verificación fallida"}
          </h1>
        </CardHeader>

        <CardContent className="text-center px-6 pt-4">
          <p className="text-slate-600 mb-4">{message}</p>
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
