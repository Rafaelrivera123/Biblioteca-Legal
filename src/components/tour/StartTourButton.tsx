"use client";

import { Button } from "@/components/ui/button";
import { requestGuestTour } from "@/lib/guest-tour";
import { Compass } from "lucide-react";

export default function StartTourButton() {
  return (
    <Button
      size="lg"
      type="button"
      onClick={() => requestGuestTour()}
      className="gap-2"
    >
      <Compass className="h-4 w-4" />
      Iniciar tour
    </Button>
  );
}
