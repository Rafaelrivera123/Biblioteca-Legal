import { Facebook, Instagram, Mail } from "lucide-react";
import Image from "next/image";

export default function Footer() {
  const quickLinks = [
    { name: "Inicio", href: "/" },
    { name: "Colección", href: "/collections" },
    { name: "Suscripciones", href: "/subscriptions" },
    { name: "Contacto", href: "/contact" },
  ];

  const legalLinks = [
    { name: "Acerca de", href: "/about-us" },
    { name: "Términos y Condiciones", href: "/terms-and-condition" },
    { name: "Política de Privacidad", href: "/privacy-policy" },
    { name: "Política de Reembolso", href: "/refund-policy" },
  ];

  return (
    <footer className="bg-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-4">
              <Image
                src="https://files.edgestore.dev/ln9m9j3kr2yibrue/staticFiled/_public/white%20logo.webp"
                height={100}
                width={100}
                alt="Logo"
              />
            </div>
            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
              Su biblioteca legal virtual integral con acceso a leyes, decretos
              y documentos legales.
            </p>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-1">
            <h4 className="text-lg font-semibold mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-slate-300 hover:text-white transition-colors duration-200 text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="lg:col-span-1">
            <h4 className="text-lg font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-slate-300 hover:text-white transition-colors duration-200 text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Us */}
          <div className="lg:col-span-1">
            <h4 className="text-lg font-semibold mb-4">Contáctenos</h4>
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-slate-400" />
              <a
                href="mailto:rrivera@bibliotecalegalhn.com"
                className="text-slate-300 hover:text-white transition-colors duration-200 text-sm"
              >
                soporte@bibliotecalegalhn.com
              </a>
            </div>

            <div className="mt-8 flex items-center gap-x-5">
              <a
                className="cursor-pointer"
                href="https://www.facebook.com/people/Biblioteca-Legal/61577353097593"
                target="_blank"
              >
                <Facebook className="w-4 h-4 text-slate-400 mt-2 hover:text-white transition-colors duration-200" />
              </a>
              <a
                className="cursor-pointer"
                href="https://www.instagram.com/bibliotecalegalhn"
                target="_blank"
              >
                <Instagram className="w-4 h-4 text-slate-400 mt-2 hover:text-white transition-colors duration-200" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-slate-700 mt-8 pt-8">
          <p className="text-center text-slate-400 text-sm">
            © 2025 BIBLIOTECA LEGAL Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
