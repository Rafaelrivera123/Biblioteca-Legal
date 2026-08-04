"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";
import AccountSidebar from "./account-sidebar";

const MobileSidebar = () => {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="w-full sm:w-fit min-h-11" onClick={() => setOpen((p) => !p)}>
          Menú de cuenta
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="max-h-[85dvh]">
        <SheetHeader>
          <SheetTitle>Menú</SheetTitle>
        </SheetHeader>

        <AccountSidebar onTabClick={() => setOpen((p) => !p)} />
      </SheetContent>
    </Sheet>
  );
};

export default MobileSidebar;
