"use client";
import { logoutAction } from "@/actions/auth/logout";
import AlertModal from "@/components/ui/alert-modal";
import { Button } from "@/components/ui/button";
import clsx from "clsx";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { accountTablists } from "./data";

interface Props {
  onTabClick?: () => void;
}

const AccountSidebar = ({ onTabClick }: Props) => {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  const onLogout = () => {
    startTransition(() => {
      logoutAction()
        .then(() => {
          router.push("/");
          router.refresh();
        })
        .catch(() => {
          router.push("/");
          router.refresh();
        });
    });
  };

  return (
    <div className=" h-full">
      <div className="flex h-full max-h-screen flex-col gap-2 ">
        <div className="flex-1 overflow-auto">
          <nav className="grid items-start pr-6 text-sm font-medium space-y-2">
            {accountTablists.map((tab) => (
              <Link
                key={tab.id}
                className={clsx(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                  {
                    "flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-white  transition-all hover:text-white/80 dark:bg-gray-800 dark:text-gray-50 dark:hover:text-gray-50":
                      pathname === tab.path,
                  }
                )}
                href={tab.path}
                onClick={onTabClick && onTabClick}
              >
                {tab.linkText}
              </Link>
            ))}

            <Button
              variant="link"
              className={clsx(
                "flex items-start text-start mr-auto gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
              )}
              onClick={() => setOpen(true)}
            >
              Cerrar sesión
            </Button>
          </nav>
        </div>
      </div>

      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onLogout}
        loading={pending}
        title="¿Estás seguro que quieres cerrar sesión?"
        message=""
      />
    </div>
  );
};

export default AccountSidebar;
