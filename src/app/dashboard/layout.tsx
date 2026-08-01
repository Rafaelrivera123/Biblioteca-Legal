import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import SIdebar from "./_components/sidebar";
import Topbar from "./_components/top-bar";

const DashboardLayout = async ({ children }: { children: ReactNode }) => {
  const cu = await auth();

  if (!cu) redirect("/login");

  if (cu.user.role !== "admin") redirect("/");

  const user = await prisma.user.findUnique({
    where: {
      id: cu.user.id,
    },
  });

  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <SIdebar />
      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:ml-64">
        {/* Top Bar */}
        <Topbar name={(user.first_name + " " + user.last_name) as string} />

        <div className="min-h-[calc(100vh-80px)] overflow-x-hidden bg-[#F5F7FA] p-3 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
