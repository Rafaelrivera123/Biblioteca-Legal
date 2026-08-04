import Script from "next/script";

const ADSENSE_CLIENT = "ca-pub-5685390714020326";

/**
 * Carga el script de AdSense solo en páginas de contenido (leyes/códigos),
 * no en marketing, auth ni dashboard.
 */
export default function AdSenseScript() {
  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      crossOrigin="anonymous"
      strategy="lazyOnload"
    />
  );
}
