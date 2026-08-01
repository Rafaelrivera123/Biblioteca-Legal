"use client";

import { deleteCompany } from "@/actions/companies/delete";
import {
  pauseCompanySubscription,
  resumeCompanySubscription,
} from "@/actions/subscription/company";
import AlertModal from "@/components/ui/alert-modal";
import { Button } from "@/components/ui/button";
import { CompanySubscription } from "@prisma/client";
import { Trash } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CompanyWithEmployees } from "../page";
const AddCompanySubscribeModal = dynamic(
  () => import("@/components/shared/modals/add-company-subscribe-modal"),
  {
    ssr: false,
  }
);
const EmployeeContainer = dynamic(() => import("./employee-container"), {
  ssr: false,
});

interface Props {
  data: CompanyWithEmployees;
  subscription: CompanySubscription | null;
}
const CompanyHeader = ({ data, subscription }: Props) => {
  const [open, setOpen] = useState(false);
  const [pending, startTranistion] = useTransition();
  const router = useRouter();

  const now = new Date();

  const shouldPauseSubscription =
    subscription?.isActive && new Date(subscription.currentPeriodEnd) > now;

  const shouldResumeSubscription =
    subscription &&
    !subscription.isActive &&
    new Date(subscription.currentPeriodEnd) > now;

  const onRemoveCompany = () => {
    startTranistion(() => {
      deleteCompany(data.id).then((res) => {
        if (!res.success) {
          toast.error(res.message);
          return;
        }

        // handle success
        toast.success(res.message);
        setOpen(false);
        router.push("/dashboard/companies");
      });
    });
  };

  const onPause = () => {
    startTranistion(() => {
      pauseCompanySubscription(data.id).then((res) => {
        if (!res.success) {
          toast.error(res.message);
          return;
        }

        // handle success
        toast.success(res.message);
      });
    });
  };

  const onResume = () => {
    startTranistion(() => {
      resumeCompanySubscription(data.id).then((res) => {
        if (!res.success) {
          toast.error(res.message);
          return;
        }

        toast.success(res.message);
      });
    });
  };

  return (
    <>
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-bold text-[22px] sm:text-[24px] leading-[120%] break-words">
            {data.name}
          </h1>
          <div className="flex items-center gap-3 sm:gap-x-5">
            <Button
              variant="outline"
              className="text-rose-500 hover:text-rose-500/80 bg-white"
              onClick={() => setOpen(true)}
            >
              <Trash />
            </Button>

            {shouldPauseSubscription ? (
              <Button
                onClick={onPause}
                disabled={pending}
                className="bg-rose-500 hover:bg-rose-500/80"
              >
                Pause
              </Button>
            ) : shouldResumeSubscription ? (
              <Button
                onClick={onResume}
                disabled={pending}
                className="bg-green-500 hover:bg-green-500/80"
              >
                Resume
              </Button>
            ) : (
              <AddCompanySubscribeModal
                trigger={
                  <Button>
                    {(() => {
                      if (!subscription) return "Subscribe";

                      if (subscription.isActive) {
                        const endsAt = new Date(subscription.currentPeriodEnd);
                        return endsAt < now ? "Renew" : "Pause";
                      }

                      return "Subscribe";
                    })()}
                  </Button>
                }
                initialData={subscription!}
                companyId={data.id}
              />
            )}
          </div>
        </div>
        <div className="mt-[20px] space-y-[10px] mb-10">
          <p className="text-[18px]">
            <span className="font-semibold">Company Location: </span>{" "}
            <span>{data.location}</span>
          </p>
          <p className="text-[18px]">
            <span className="font-semibold">Contact Email: </span>{" "}
            <span>{data.contact_email}</span>
          </p>
          <p className="text-[18px]">
            <span className="font-semibold">Employees Number: </span>{" "}
            <span>{data.employees.length}</span>
          </p>
          <p>{data.overview}</p>
        </div>

        <EmployeeContainer users={data.employees} companyId={data.id} />
      </div>

      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        loading={pending}
        onConfirm={onRemoveCompany}
      />
    </>
  );
};

export default CompanyHeader;
