import { auth } from "@/auth";
import { getCurrentUserSubscription } from "@/helper/subscription";
import { prisma } from "@/lib/db";
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import CancelSubscriptionContainer from "./_components/cancel-subscription/cancel-subscription-container";
import ResetTipsCard from "./_components/reset-tips-card";
const ChangePasswordForm = dynamic(
  () => import("./_components/password-reset/password-reset-form"),
  {
    ssr: false,
  }
);
const ProfileForm = dynamic(() => import("./_components/profile-form"), {
  ssr: false,
});

const Page = async () => {
  const cu = await auth();
  if (!cu?.user.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: {
      id: cu.user.id,
    },
  });

  if (!user) redirect("/login");

  const cs = await getCurrentUserSubscription();
  const subType = cs?.type;
  const now = new Date();
  const isActive = cs?.subscription.isActive;
  const currentPeriodEnd = cs?.subscription.currentPeriodEnd;
  const hasFullAccess =
    isActive && !!currentPeriodEnd && currentPeriodEnd > now;
  return (
    <div className="space-y-20 mb-20">
      <ProfileForm user={user} />

      <ResetTipsCard userId={user.id} />

      <ChangePasswordForm />

      {subType === "user" && hasFullAccess && <CancelSubscriptionContainer />}
    </div>
  );
};

export default Page;
