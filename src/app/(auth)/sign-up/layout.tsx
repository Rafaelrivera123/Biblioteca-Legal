import { auth } from "@/auth";
import Navbar from "@/components/ui/navbar";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

const RegistrationLayout = async ({ children }: { children: ReactNode }) => {
  const cu = await auth();
  let user;
  if (cu?.user.id) {
    user = await prisma.user.findUnique({
      where: {
        id: cu.user.id,
      },
    });
  }

  // OAuth users land here logged-in with accountCompleted=false to finish
  // signup. Only bounce away users who already completed their account
  // (otherwise middleware ↔ this layout fight in an infinite redirect).
  if (cu && cu.user.accountCompleted !== false) {
    redirect("/");
  }

  return (
    <div>
      <Navbar isLoggedin={!!cu} user={user ?? null} />
      {children}
    </div>
  );
};

export default RegistrationLayout;
