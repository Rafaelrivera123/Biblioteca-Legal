import { Metadata } from "next";
import { ReactNode } from "react";
import AccountSidebar from "./_components/account-sidebar";
import MobileSidebar from "./_components/mobile-sidebar";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

const AccountLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="container space-y-10 md:grid h-auto grid-cols-6 pt-[80px] md:pt-[100px] w-full min-h-screen">
      {/* Sidebar column */}
      <div className="col-span-6 md:col-span-1">
        <div className="hidden md:block">
          <AccountSidebar />
        </div>
        <div className="md:hidden w-full h-fit ">
          <MobileSidebar />
        </div>
      </div>

      {/* Main content */}
      <div className="col-span-6 md:col-span-5 md:px-4 lg:px-6 h-full ">
        <div>{children}</div>
      </div>
    </div>
  );
};

export default AccountLayout;
