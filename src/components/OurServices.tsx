import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, BookOpen, Archive } from "lucide-react";
import Link from "next/link";
export default function OurServices() {
  return (
    <section className="bg-slate-800 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-blue-400 text-lg font-medium mb-4">
            Nuestros Servicios
          </h2>
          <h3 className="text-white text-[20px] md:text-4xl font-bold mb-6">
            Recursos Legales Integrales
          </h3>
          <p className="text-gray-300 text-[14px] md:text-lg max-w-4xl mx-auto">
            Descubre las herramientas y recursos diseñados para mejorar tu
            práctica legal y proporcionarte la información más actualizada.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="bg-transparent border-none shadow-none group hover:bg-white transition-all duration-300 ease-in-out">
            <CardContent className="p-8">
              <div className="mb-6 flex justify-between">
                <h4 className="text-white group-hover:text-slate-800 text-xl md:text-2xl font-bold mb-4 transition-colors duration-300">
                  Biblioteca Jurídica
                </h4>
                <BookOpen className="h-7 w-7 md:w-10 md:h-10 text-white group-hover:text-slate-800 transition-colors duration-300" />
              </div>
              <p className="text-gray-300 group-hover:text-gray-600 text-[14px] md:text-lg font-medium mb-6 transition-colors duration-300">
                Accede a todos los documentos legales, leyes y decretos
              </p>
              <p className="text-gray-300 group-hover:text-gray-600 text-[14px] md:text-lg font-medium mb-6 transition-colors duration-300">
                Nuestra colección integral incluye los documentos legales más
                recientes, organizados y de fácil acceso.
              </p>
              <Button
                variant="outline"
                className="bg-white rounded-full text-slate-800 border-white hover:bg-slate-100 group-hover:bg-slate-800 group-hover:text-white group-hover:border-slate-800 transition-all duration-300"
                asChild
              >
                <Link href="/collections">
                  Explorar Biblioteca
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="bg-transparent border-none shadow-none group hover:bg-white transition-all duration-300 ease-in-out">
            <CardContent className="p-8">
              <div className="mb-6 flex justify-between">
                <h4 className="text-white group-hover:text-slate-800 text-xl md:text-2xl font-bold mb-4 transition-colors duration-300">
                  Actualizaciones Legales
                </h4>
              </div>
              <p className="text-gray-300 group-hover:text-gray-600 text-[14px] md:text-lg font-medium mb-6 transition-colors duration-300">
                Mantente informado con los últimos desarrollos legales
              </p>
              <p className="text-gray-300 group-hover:text-gray-600 text-[14px] md:text-lg font-medium mb-6 transition-colors duration-300">
                Recibe actualizaciones oportunas sobre nuevas leyes, enmiendas y
                cambios legales importantes que afectan tu práctica.
              </p>
              <Button
                variant="outline"
                className="bg-white rounded-full text-slate-800 border-white hover:bg-slate-100 group-hover:bg-slate-800 group-hover:text-white group-hover:border-slate-800 transition-all duration-300"
                asChild
              >
                <Link href="/actualizaciones">
                  Ver Actualizaciones
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="bg-transparent border-none shadow-none group hover:bg-white transition-all duration-300 ease-in-out">
            <CardContent className="p-8">
              <div className="mb-2 flex justify-between">
                <h4 className="text-white group-hover:text-slate-800 text-xl md:text-2xl font-bold mb-4 transition-colors duration-300">
                  Gacetas Oficiales
                </h4>
                <Archive className="h-7 w-7 md:w-10 md:h-10 text-white group-hover:text-slate-800 transition-colors duration-300" />
              </div>
              <span className="inline-block mb-4 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white group-hover:bg-purple-100 group-hover:text-purple-800 transition-colors duration-300">
                Nuevo
              </span>
              <p className="text-gray-300 group-hover:text-gray-600 text-[14px] md:text-lg font-medium mb-6 transition-colors duration-300">
                Accede directo a los PDFs originales de La Gaceta de la República de Honduras
              </p>
              <p className="text-gray-300 group-hover:text-gray-600 text-[14px] md:text-lg font-medium mb-6 transition-colors duration-300">
                Busca por número de Gaceta y descarga el documento oficial, sin tener que buscarlo en otro lado.
              </p>
              <Button
                variant="outline"
                className="bg-white rounded-full text-slate-800 border-white hover:bg-slate-100 group-hover:bg-slate-800 group-hover:text-white group-hover:border-slate-800 transition-all duration-300"
                asChild
              >
                <Link href="/gacetas">
                  Ver Gacetas
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
