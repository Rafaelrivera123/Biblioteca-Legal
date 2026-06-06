"use client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Crown, Sparkles, Bookmark, MessageSquare } from "lucide-react";
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
            Estudia derecho más rápido
          </DialogTitle>
        </DialogHeader>
        <p className="text-gray-500 text-[13px] leading-[160%] mt-1">
          Entiende cada artículo en segundos con el{" "}
          <strong className="text-primary">Plan Personal</strong>
        </p>
        {/* Beneficios */}
        <ul className="text-left space-y-2 mt-3">
          <li className="flex items-start gap-2 text-[13px] text-gray-700">
            <Sparkles className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
            <span><strong>Resúmenes IA por artículo</strong> — entiende el contenido al instante</span>
          </li>
          <li className="flex items-start gap-2 text-[13px] text-gray-700">
            <Bookmark className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <span><strong>Favoritos y resaltado</strong> — marca lo que entra en el parcial</span>
          </li>
          <li className="flex items-start gap-2 text-[13px] text-gray-700">
            <MessageSquare className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <span><strong>Notas por artículo</strong> — agrega tus apuntes directamente en la ley</span>
          </li>
        </ul>
        <p className="text-[12px] text-gray-400 mt-2">Menos que una fotocopia — USD $5.99/mes</p>
        <div className="flex flex-col gap-3 mt-3">
          <Button
            className="w-full bg-primary text-white hover:bg-primary/90"
            onClick={() => {
              onClose();
              router.push("/subscriptions");
            }}
          >
            <Crown className="mr-2 h-4 w-4" />
            Activar Plan Personal
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
