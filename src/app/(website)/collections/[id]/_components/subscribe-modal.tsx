"use client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Crown } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Props {
  open: boolean;
  onClose: () => void;
}

const SubscribeModal = ({ open, onClose }: Props) => {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm text-center">
        <div className="flex justify-center mb-2">
          <Image
            src="https://files.edgestore.dev/ln9m9j3kr2yibrue/staticFiled/_public/logo.webp"
            alt="Biblioteca Legal"
            width={70}
            height={70}
            className="object-contain"
          />
        </div>
        <DialogHeader>
          <DialogTitle className="text-center text-primary text-[18px]">
            Función exclusiva del Plan Personal
          </DialogTitle>
        </DialogHeader>
        <p className="text-gray-500 text-[14px] leading-[160%] mt-1">
          Resalta artículos, guarda favoritos y agrega comentarios
          con el <strong className="text-primary">Plan Personal</strong> de Biblioteca Legal HN.
        </p>
        <div className="flex flex-col gap-3 mt-4">
          <Button
            className="w-full bg-primary text-white hover:bg-primary/90"
            onClick={() => {
              onClose();
              router.push("/subscriptions");
            }}
          >
            <Crown className="mr-2 h-4 w-4" />
            Ver Plan Personal — USD $5.99/mes
          </Button>
          <Button
            variant="outline"
            className="w-full text-primary border-primary/30"
            onClick={onClose}
          >
            Continuar sin suscripción
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscribeModal;
