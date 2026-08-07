import { auth } from "@/auth";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import BibliotecaTabs from "./_components/biblioteca-tabs";

export const metadata: Metadata = {
  title: "Mi Biblioteca",
  robots: {
    index: false,
    follow: false,
  },
};

const MiBibliotecaLayout = async ({ children }: { children: ReactNode }) => {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?redirectTo=/mi-biblioteca");
  }

  return (
    <div className="container space-y-6 pt-[80px] md:pt-[100px] pb-10 w-full min-h-screen px-4">
      <div>
        <h1 className="text-tourHub-title2 text-[28px] md:text-[32px] font-bold font-inter">
          Mi Biblioteca
        </h1>
        <p className="text-tourHub-green-dark text-base mt-1">
          Tus documentos guardados, marcadores, destacados y notas en un solo
          lugar.
        </p>
      </div>
      <BibliotecaTabs />
      <div className="min-w-0">{children}</div>
    </div>
  );
};

export default MiBibliotecaLayout;
