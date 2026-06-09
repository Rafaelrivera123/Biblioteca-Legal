import { auth } from "@/auth";
import Footer from "@/components/ui/footer";
import Navbar from "@/components/ui/navbar";
import { prisma } from "@/lib/db";
import { GoogleAnalytics } from "@next/third-parties/google";
import NextTopLoader from "nextjs-toploader";
import { ReactNode, Suspense } from "react";
import CookieBanner from "@/components/shared/cookie-banner";
import { Analytics } from "@vercel/analytics/react";
import dynamic from "next/dynamic";
const OnboardingTour = dynamic(() => import("@/components/tour/OnboardingTour"), { ssr: false });
const WebsiteLayout = async ({ children }: { children: ReactNode }) => {
  const cu = await auth();
  let user;
  if (cu?.user?.id) {
    user = await prisma.user.findUnique({
      where: { id: cu.user.id },
    });
  }
  return (
    <div>
      <Navbar isLoggedin={!!cu} user={user ?? null} />
      {children}
      <Footer />
      <CookieBanner />
      <NextTopLoader showSpinner={false} color="#FFFFFF" />
      <GoogleAnalytics gaId={process.env.GOOGLE_ANALYTICS_ID!} />
      <Analytics />
      {/* Tour deshabilitado temporalmente */}
      {/* {cu && user && (
        <Suspense>
          <OnboardingTour
            onboardingCompleted={user.onboardingCompleted}
            isLoggedin={true}
          />
        </Suspense>
      )} */}
    </div>
  );
};
export default WebsiteLayout;
