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
        {/* Google Tag Manager */}
        <Script id="gtm-script" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-WQ7QDB86');
          `}
        </Script>
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
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WQ7QDB86"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <main className="min-h-screen bg-offwhite">{children}</main>
        <Script id="google-ads-conversion" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            window.trackWhatsAppAndRedirect = function(url) {
              var redirected = false;
              function doRedirect() {
                if (!redirected) {
                  redirected = true;
                  window.location.href = url;
                }
              }
              window.dataLayer.push({
                event: 'whatsapp_click',
                event_category: 'engagement',
                event_label: 'request_to_book',
                page_location: window.location.href,
                eventCallback: doRedirect,
                eventTimeout: 500
              });
              // Fallback: если GTM eventCallback не вызвался за 500мс — всё равно открываем
              setTimeout(doRedirect, 500);
              return false;
            };
            window.gtag_report_conversion = window.trackWhatsAppAndRedirect;
          `}
        </Script>
      </body>
    </html>
  );
}
