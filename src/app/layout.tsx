import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://funduq.ae"),
  title: "Funduq – Holiday Homes & Short-Term Rentals in Dubai",
  description:
    "Find and book verified holiday homes, apartments and villas in Dubai. Flexible check-in, transparent pricing, no hidden fees.",
  keywords: ["Dubai holiday homes", "short-term rentals Dubai", "villas in Dubai", "vacation rentals UAE", "Funduq"],
  authors: [{ name: "Funduq" }],
  openGraph: {
    type: "website",
    locale: "en_AE",
    url: "https://funduq.ae",
    title: "Funduq – Holiday Homes & Short-Term Rentals in Dubai",
    description: "Find and book verified holiday homes, apartments and villas in Dubai.",
    siteName: "Funduq",
  },
  twitter: {
    card: "summary_large_image",
    title: "Funduq – Holiday Homes & Short-Term Rentals in Dubai",
    description: "Find and book verified holiday homes, apartments and villas in Dubai.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "name": "Funduq",
      "url": "https://funduq.ae",
      "logo": "https://funduq.ae/favicon.ico",
      "sameAs": [
        "https://www.instagram.com/funduq",
        "https://twitter.com/funduq"
      ]
    },
    {
      "@type": "WebSite",
      "name": "Funduq",
      "url": "https://funduq.ae",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://funduq.ae/en/villas?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "LodgingBusiness",
      "name": "Funduq Holiday Homes",
      "description": "Verified holiday homes, apartments and villas in Dubai. Flexible check-in, transparent pricing.",
      "url": "https://funduq.ae",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Dubai",
        "addressRegion": "Dubai",
        "addressCountry": "AE"
      }
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${dmSans.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* DNS prefetch + preconnect for Supabase (images + API) */}
        <link rel="dns-prefetch" href="https://jftowqfrhhohkqkslfaa.supabase.co" />
        <link
          rel="preconnect"
          href="https://jftowqfrhhohkqkslfaa.supabase.co"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased selection:bg-gold/20 selection:text-gold-dark scroll-smooth">
        <main className="min-h-screen bg-offwhite">{children}</main>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-18163609312"
          strategy="lazyOnload"
        />
        <Script id="google-ads" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-18163609312');
          `}
        </Script>
        <Script id="google-ads-conversion" strategy="lazyOnload">
          {`
            window.trackWhatsAppAndRedirect = function(url) {
              var redirected = false;
              function doRedirect() {
                if (!redirected) {
                  redirected = true;
                  window.location.href = url;
                }
              }

              // Метод 1: gtag event_callback — редирект только после отправки hit
              gtag('event', 'conversion', {
                'send_to': 'AW-18163609312/KNr0CI_Nna0cEODditVD',
                'event_callback': doRedirect
              });

              // Метод 2: GA4 событие параллельно (менее чувствительно к задержкам)
              gtag('event', 'whatsapp_click', {
                'event_category': 'engagement',
                'event_label': 'request_to_book',
                'page_location': window.location.href
              });

              // Фолбэк: если callback не сработал за 500мс — всё равно открываем
              setTimeout(doRedirect, 500);
              
              return false; // Блокируем нативный переход
            };

            // Keep legacy name pointing to the robust handler
            window.gtag_report_conversion = window.trackWhatsAppAndRedirect;
          `}
        </Script>
      </body>
    </html>
  );
}
