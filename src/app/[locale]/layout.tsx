import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale, getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Header from "@/components/ui/Header";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const titles: Record<string, string> = {
    en: "Funduq | Luxury Short-Term Rentals in UAE",
    ru: "Funduq | Резиденции премиум-класса в ОАЭ",
  };

  const descriptions: Record<string, string> = {
    en: "Experience the ultimate in luxury living with Funduq's curated selection of villas, penthouses, and desert resorts across the UAE.",
    ru: "Эксклюзивная коллекция вилл, пентхаусов и пустынных резортов по всем Эмиратам для самых взыскательных гостей.",
  };

  return {
    title: titles[locale] ?? titles.en,
    description: descriptions[locale] ?? descriptions.en,
    alternates: {
      languages: {
        en: "https://funduq.vercel.app",
        ru: "https://funduq.vercel.app/ru",
      },
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Validate locale
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <>
      {/* Set lang attribute on <html> — the root layout has suppressHydrationWarning */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang="${locale}"`,
        }}
      />

      {/* SEO: hreflang alternate links */}
      <link rel="alternate" hrefLang="en" href="https://funduq.vercel.app" />
      <link rel="alternate" hrefLang="ru" href="https://funduq.vercel.app/ru" />
      <link rel="alternate" hrefLang="x-default" href="https://funduq.vercel.app" />

      <NextIntlClientProvider messages={messages}>
        <Header />
        {children}
      </NextIntlClientProvider>
    </>
  );
}
