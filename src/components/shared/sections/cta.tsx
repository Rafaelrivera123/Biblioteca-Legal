import { Button } from "@/components/ui/button";
import Link from "next/link";

const CTA = () => {
  return (
    <div className="w-full bg-primary py-[60px]">
      <h1 className="text-white font-bold text-[25px] lg:text-[40px] leading-[120%] text-center">
        ¿Listo para acceder a nuestra colección legal?
      </h1>
      <p className="text-white/70 font-medium text-[14px] lg:text-[18px] leading-[120%] text-center mt-[15px]">
        Únete a miles de profesionales legales que confían en nuestra completa
        biblioteca jurídica.
      </p>

      <div className="w-full flex flex-wrap justify-center px-4 mt-[45px] gap-x-[30px] gap-y-4">
        <Button
          className="bg-white text-primary hover:bg-white/80 transition-all duration-300"
          asChild
        >
          <Link href="/sign-up">Regístrate ahora</Link>
        </Button>
        <Button
          variant="outline"
          className="bg-transparent text-white border-white hover:bg-white/5 hover:text-white transition-all duration-300"
          asChild
        >
          <Link href="/login">Iniciar sesión</Link>
        </Button>
      </div>
    </div>
  );
};

export default CTA;
