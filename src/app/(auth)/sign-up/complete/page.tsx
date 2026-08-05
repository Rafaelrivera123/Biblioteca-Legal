import { auth } from "@/auth";
import HeaderSection from "@/components/shared/sections/header";
import { siteAssets } from "@/helper/assets";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import CompleteAccountForm from "./_components/complete-account-form";

export default async function CompleteAccountPage({
  searchParams,
}: {
  searchParams?: { intent?: string };
}) {
  const session = await auth();
  const intent = searchParams?.intent === "subscribe" ? "subscribe" : undefined;
  const completePath =
    intent === "subscribe"
      ? "/sign-up/complete?intent=subscribe"
      : "/sign-up/complete";

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(completePath)}`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      first_name: true,
      last_name: true,
      email: true,
      name: true,
      accountCompleted: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  if (user.accountCompleted) {
    redirect(
      intent === "subscribe" ? "/subscriptions?checkout=monthly" : "/collections"
    );
  }

  const nameParts = (user.name ?? "").trim().split(/\s+/).filter(Boolean);
  const first_name =
    user.first_name || nameParts[0] || "";
  const last_name =
    user.last_name || (nameParts.length > 1 ? nameParts.slice(1).join(" ") : "");

  return (
    <div>
      <HeaderSection
        imageUrl={siteAssets.registrationPage}
        title="Crea tu cuenta"
        description="Confirma tus datos para finalizar el registro"
      />

      <div className="my-[50px] md:my-[100px] container max-w-[830px] w-full mx-auto md:px-[60px] md:py-[30px] md:shadow-[0px_4px_12px_0px_#0000001A] rounded-[16px]">
        <div>
          <h1 className="text-black font-semibold text-[25px] lg:text-[40px] leading-[120%]">
            Crea una cuenta
          </h1>
          <p className="text-black font-medium text-[14px] leading-[120%] md:text-[18px]">
            Ya autenticamos tu identidad. Confirma tu nombre y correo para
            crear tu cuenta.
          </p>
        </div>
        <CompleteAccountForm
          defaultValues={{
            first_name,
            last_name,
            email: user.email,
          }}
          emailLocked={Boolean(user.email)}
          intent={intent}
        />
      </div>
    </div>
  );
}
