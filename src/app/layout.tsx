import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import "./globals.css";

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
  metadataBase: new URL("https://funduq.vercel.app"),
  title: "Funduq – Holiday Homes & Short-Term Rentals in Dubai",
  description:
    "Find and book verified holiday homes, apartments and villas in Dubai. Flexible check-in, transparent pricing, no hidden fees.",
  keywords: ["Dubai holiday homes", "short-term rentals Dubai", "villas in Dubai", "vacation rentals UAE", "Funduq"],
  authors: [{ name: "Funduq" }],
  openGraph: {
    type: "website",
    locale: "en_AE",
    url: "https://funduq.vercel.app",
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
      "url": "https://funduq.vercel.app",
      "logo": "https://funduq.vercel.app/favicon.ico",
      "sameAs": [
        "https://www.instagram.com/funduq",
        "https://twitter.com/funduq"
      ]
    },
    {
      "@type": "WebSite",
      "name": "Funduq",
      "url": "https://funduq.vercel.app",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://funduq.vercel.app/en/villas?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "LodgingBusiness",
      "name": "Funduq Holiday Homes",
      "description": "Verified holiday homes, apartments and villas in Dubai. Flexible check-in, transparent pricing.",
      "url": "https://funduq.vercel.app",
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
      </body>
    </html>
  );
}
