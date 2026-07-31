import Link from "next/link";
import { LawFaqItem } from "@/lib/law-faqs";

interface Props {
  faqs: LawFaqItem[];
}

/**
 * Sección visible de preguntas frecuentes + JSON-LD FAQPage.
 * Server component (sin JS): usa <details>/<summary> nativos, así que
 * funciona igual para el usuario y para el rastreador de Google.
 */
const LawFaq = ({ faqs }: Props) => {
  if (!faqs.length) return null;

  return (
    <section className="container max-w-[800px] mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold mb-6">Preguntas frecuentes</h2>
      <div className="flex flex-col gap-3">
        {faqs.map((faq) => (
          <details
            key={faq.question}
            className="group rounded-lg border border-black/10 px-4 py-3 open:bg-slate-50"
          >
            <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-medium text-sm md:text-base">
              {faq.question}
              <span className="shrink-0 text-muted-foreground transition-transform group-open:rotate-45 text-xl leading-none">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm md:text-base text-muted-foreground leading-relaxed">
              {faq.answer}
              {faq.link && (
                <>
                  {" "}
                  <Link
                    href={faq.link.href}
                    className="text-primary underline underline-offset-2 hover:no-underline"
                  >
                    {faq.link.label}
                  </Link>
                </>
              )}
            </p>
          </details>
        ))}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
              },
            })),
          }),
        }}
      />
    </section>
  );
};

export default LawFaq;
