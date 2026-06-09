import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Metadata } from "next";
import LegalAiClient from "./_components/legal-ai-client";

export const metadata: Metadata = {
  title: "Análisis Legal IA | Biblioteca Legal HN",
  description:
    "Consulta nuestro asistente legal con acceso a toda la legislación hondureña. Haz preguntas legales y obtén respuestas basadas en las leyes y códigos de Honduras.",
};

const Page = async () => {
  const cu = await auth();
  const isLoggedin = !!cu;

  let hasSubscription = false;
  if (cu?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: cu.user.id },
      select: {
        role: true,
        userSubscription: {
          select: { isActive: true, currentPeriodEnd: true },
        },
      },
    });
    if (user?.role === "admin") {
      hasSubscription = true;
    } else {
      hasSubscription = !!(
        user?.userSubscription?.isActive &&
        new Date(user.userSubscription.currentPeriodEnd) > new Date()
      );
    }
  }

  return (
    <div className="min-h-screen pt-[60px]">
      <LegalAiClient
        isLoggedin={isLoggedin}
        hasSubscription={hasSubscription}
      />
    </div>
  );
};

export default Page;
