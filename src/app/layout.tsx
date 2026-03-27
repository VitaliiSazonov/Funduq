import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Funduq | Luxury Short-Term Rentals in UAE",
  description: "Experience the ultimate in luxury living with Funduq's curated selection of villas, penthouses, and desert resorts across the UAE.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSans.variable}`}>
      <head>
        {/* DNS prefetch + preconnect for Supabase (images + API) */}
        <link rel="dns-prefetch" href="https://jftowqfrhhohkqkslfaa.supabase.co" />
        <link rel="preconnect" href="https://jftowqfrhhohkqkslfaa.supabase.co" crossOrigin="anonymous" />
      </head>
      <body className="antialiased selection:bg-gold/20 selection:text-gold-dark scroll-smooth">
        <main className="min-h-screen bg-offwhite">
          {children}
        </main>
      </body>
    </html>
  );
}
