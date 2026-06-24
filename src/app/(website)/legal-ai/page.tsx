import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Metadata } from "next";
import LegalAiClient from "./_components/legal-ai-client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Scale,
  Sparkles,
  BookOpen,
  MessageSquare,
  FileText,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Asistente Legal IA Honduras | Consulta Leyes al Instante",
  description:
    "Consulta cualquier ley hondureña con inteligencia artificial. Haz preguntas sobre el Código Penal, Código Civil, Constitución y más. Respuestas basadas en la legislación oficial de Honduras.",
  keywords: [
    "asistente legal IA Honduras",
    "consulta leyes Honduras inteligencia artificial",
    "chatbot legal Honduras",
    "preguntas legales Honduras",
    "IA derecho hondureño",
    "Código Penal Honduras IA",
    "consulta jurídica en línea Honduras",
  ],
  openGraph: {
    title: "Asistente Legal IA Honduras | Consulta Leyes al Instante",
    description:
      "Consulta cualquier ley hondureña con inteligencia artificial. Respuestas basadas en la legislación oficial de Honduras.",
    url: "https://www.bibliotecalegalhn.com/legal-ai",
    siteName: "Biblioteca Legal HN",
    locale: "es_HN",
    type: "website",
  },
  alternates: {
    canonical: "https://www.bibliotecalegalhn.com/legal-ai",
  },
};

const EXAMPLE_QUESTIONS = [
  {
    question: "¿Cuáles son los requisitos para interponer un recurso de amparo en Honduras?",
    category: "Derecho Constitucional",
  },
  {
    question: "¿Qué pena establece el Código Penal para el delito de estafa?",
    category: "Derecho Penal",
  },
  {
    question: "¿Cómo se calcula la indemnización por despido injustificado según el Código de Trabajo?",
    category: "Derecho Laboral",
  },
  {
    question: "¿Cuáles son las causales de divorcio contempladas en el Código de Familia?",
    category: "Derecho de Familia",
  },
  {
    question: "¿Qué obligaciones tiene un arrendador según el Código Civil hondureño?",
    category: "Derecho Civil",
  },
  {
    question: "¿Cuáles son los derechos del consumidor reconocidos en la Ley de Protección al Consumidor?",
    category: "Derecho del Consumidor",
  },
];

const COVERED_LAWS = [
  "Constitución Política de Honduras",
  "Código Penal",
  "Código Civil",
  "Código de Familia",
  "Código de Trabajo",
  "Código de Comercio",
  "Código Tributario",
  "Código Procesal Penal",
  "Ley de Municipalidades",
  "Ley General del Ambiente",
  "Ley de Contratación del Estado",
  "Ley Electoral y de las Organizaciones Políticas",
];

const Page = async () => {
  const cu = await auth();
  const isLoggedin = !!cu;
  let hasSubscription = false;

  if (cu?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: cu.user.id },
      select: {
        role: true,
        userSubscription: {
          select: { isActive: true, currentPeriodEnd: true },
        },
      },
    });
    if (user?.role === "admin") {
      hasSubscription = true;
    } else {
      hasSubscription = !!(
        user?.userSubscription?.isActive &&
        new Date(user.userSubscription.currentPeriodEnd) > new Date()
      );
    }
  }

  if (hasSubscription) {
    return (
      <div className="min-h-screen pt-[60px]">
        <LegalAiClient isLoggedin={isLoggedin} hasSubscription={hasSubscription} />
      </div>
    );
  }

  return (
    <div className="mt-20">

      {/* Hero */}
      <section className="bg-[#1E2A38] py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white text-sm font-medium px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Inteligencia Artificial aplicada al Derecho hondureño
          </div>
          <h1 className="text-white font-bold text-[32px] md:text-[48px] leading-[120%] mb-6">
            Consulta cualquier ley hondureña al instante
          </h1>
          <p className="text-gray-300 text-[16px] md:text-[18px] leading-relaxed max-w-2xl mx-auto mb-10">
            Nuestro asistente legal con inteligencia artificial tiene acceso a
            toda la legislación de Honduras disponible en Biblioteca Legal HN.
            Haz preguntas en lenguaje natural y obtén respuestas claras basadas
            en las leyes y códigos oficiales.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 text-white"
              asChild
            >
              <Link href="/subscriptions">
                <Sparkles className="mr-2 w-5 h-5" />
                Activar Plan Personal — $5.99/mes
              </Link>
            </Button>
            {!isLoggedin && (
              <Button
                size="lg"
                variant="outline"
                className="text-white border-white hover:bg-white/10"
                asChild
              >
                <Link href="/login">Iniciar sesión</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Qué puede hacer */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center font-bold text-[28px] md:text-[36px] text-[#1E2A38] mb-4">
            ¿Qué puede hacer el Asistente Legal IA?
          </h2>
          <p className="text-center text-muted-foreground text-[16px] max-w-2xl mx-auto mb-14">
            Diseñado para abogados, estudiantes de derecho y cualquier ciudadano
            que necesite entender la legislación hondureña de forma rápida y clara.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="font-bold text-[18px] text-[#1E2A38] mb-3">
                Responde preguntas legales
              </h3>
              <p className="text-muted-foreground text-[14px] leading-relaxed">
                Formula preguntas en lenguaje cotidiano y recibe respuestas
                basadas en la legislación hondureña vigente, con referencias
                exactas al artículo correspondiente.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="font-bold text-[18px] text-[#1E2A38] mb-3">
                Analiza documentos
              </h3>
              <p className="text-muted-foreground text-[14px] leading-relaxed">
                Sube contratos, escrituras o cualquier documento legal y el
                asistente lo analiza a la luz de la legislación hondureña para
                identificar cláusulas, riesgos o vacíos legales.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="font-bold text-[18px] text-[#1E2A38] mb-3">
                Explica artículos complejos
              </h3>
              <p className="text-muted-foreground text-[14px] leading-relaxed">
                Pide que te explique cualquier artículo de ley en términos
                simples, con ejemplos prácticos de cómo aplica en situaciones
                cotidianas en Honduras.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Preguntas de ejemplo */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center font-bold text-[28px] md:text-[36px] text-[#1E2A38] mb-4">
            Ejemplos de preguntas que puedes hacer
          </h2>
          <p className="text-center text-muted-foreground text-[16px] max-w-2xl mx-auto mb-12">
            El asistente está entrenado para responder preguntas sobre cualquier
            rama del derecho hondureño.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {EXAMPLE_QUESTIONS.map((item, i) => (
              <div
                key={i}
                className="bg-white border border-black/10 rounded-xl p-5 hover:border-purple-200 hover:shadow-sm transition-all"
              >
                <span className="text-[11px] font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                  {item.category}
                </span>
                <p className="mt-3 text-[14px] text-[#1E2A38] leading-relaxed font-medium">
                  &ldquo;{item.question}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leyes que cubre */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center font-bold text-[28px] md:text-[36px] text-[#1E2A38] mb-4">
            Legislación hondureña disponible
          </h2>
          <p className="text-center text-muted-foreground text-[16px] max-w-2xl mx-auto mb-12">
            El asistente tiene acceso a todos los documentos publicados en
            Biblioteca Legal HN, incluyendo códigos, leyes especiales,
            reglamentos y convenios internacionales ratificados por Honduras.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
            {COVERED_LAWS.map((law, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                <span className="text-[14px] text-[#1E2A38] font-medium">{law}</span>
              </div>
            ))}
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
              <span className="text-[14px] text-[#1E2A38] font-medium">
                Y toda la colección de Biblioteca Legal HN
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="py-20 px-4 bg-[#1E2A38]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center font-bold text-[28px] md:text-[36px] text-white mb-14">
            Cómo funciona
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                step: "1",
                title: "Activa el Plan Personal",
                desc: "Suscríbete por $5.99 al mes y accede inmediatamente al asistente legal y a todas las herramientas premium.",
              },
              {
                step: "2",
                title: "Escribe tu pregunta",
                desc: "Formula tu consulta en español, de forma natural, como si le preguntaras a un colega abogado.",
              },
              {
                step: "3",
                title: "Obtén tu respuesta",
                desc: "El asistente busca en la legislación hondureña y te responde con referencias exactas a los artículos aplicables.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-purple-600 text-white font-bold text-[20px] flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-white font-bold text-[18px] mb-3">{item.title}</h3>
                <p className="text-gray-300 text-[14px] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-bold text-[28px] md:text-[36px] text-[#1E2A38] mb-4">
            Empieza a consultar la ley hoy
          </h2>
          <p className="text-muted-foreground text-[16px] mb-8">
            Menos que una fotocopia. Acceso ilimitado a toda la legislación
            hondureña con inteligencia artificial por solo $5.99 al mes.
          </p>
          <Button
            size="lg"
            className="bg-[#1E2A38] hover:bg-[#1E2A38]/90 text-white"
            asChild
          >
            <Link href="/subscriptions">
              <Sparkles className="mr-2 w-5 h-5" />
              Activar Plan Personal — $5.99/mes
            </Link>
          </Button>
          <p className="text-muted-foreground text-[12px] mt-4">
            Cancela cuando quieras. Sin contratos.
          </p>
        </div>
      </section>

    </div>
  );
};

export default Page;
