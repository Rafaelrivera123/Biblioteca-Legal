import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import dynamic from "next/dynamic";
import WaitListContainer from "./_components/wait-list-container";

const AddWaitlistDialog = dynamic(
  () => import("@/components/shared/modals/add-waitlist-modal"),
  {
    ssr: false,
  }
);

const Page = async () => {
  const userQue = await prisma.userQue.findMany();

  return (
    <div>
      <div className="w-full flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
        <h1 className="text-primary font-semibold text-[26px] sm:text-[32px] leading-[120%]">
          Waitlist
        </h1>
        <AddWaitlistDialog
          trigger={<Button className="w-full sm:w-auto">Add New waitlist</Button>}
        />
      </div>
      <WaitListContainer data={userQue ?? []} />
    </div>
  );
};

export default Page;
