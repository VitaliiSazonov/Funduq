import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { 
  CheckCircle2, 
  Star, 
  Clock, 
  Calendar, 
  Building2,
  ArrowRight
} from "lucide-react";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://funduq.ae";

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: `${baseUrl}/${locale}/about`,
      siteName: "Funduq",
      locale: locale === "ru" ? "ru_RU" : "en_AE",
      type: "website",
      images: [{ url: "https://funduq.ae/images/og-default.jpg" }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("metaTitle"),
      description: t("metaDescription"),
    },
    alternates: {
      canonical: `${baseUrl}/${locale}/about`,
      languages: {
        en: `${baseUrl}/en/about`,
        ru: `${baseUrl}/ru/about`,
      },
    },
  };
}

function splitStat(stat: string) {
  const spaceIndex = stat.indexOf(" ");
  if (spaceIndex === -1) return { val: stat, label: "" };
  return {
    val: stat.substring(0, spaceIndex),
    label: stat.substring(spaceIndex + 1)
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "about" });

  const statItems = [
    { raw: t("statsVillas"), Icon: Building2 },
    { raw: t("statsRating"), Icon: Star },
    { raw: t("statsYears"), Icon: Calendar },
    { raw: t("statsSupport"), Icon: Clock },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      
      {/* Блок 1 — Hero */}
      <section className="relative pt-48 pb-32 px-6 md:px-8 bg-charcoal text-white overflow-hidden">
        {/* Background Visual Accents */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--color-gold)_0%,_transparent_70%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/40 via-transparent to-charcoal/95" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gold/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gold/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s' }} />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <h1 className="text-5xl md:text-8xl font-black mb-8 display-font tracking-tight text-white leading-none">
            {t("heroTitle").split(" ")[0]} <span className="text-gold">{t("heroTitle").split(" ").slice(1).join(" ")}</span>
          </h1>

          <p className="text-gray-300 text-lg md:text-2xl max-w-3xl mx-auto leading-relaxed font-medium">
            {t("heroSubtitle")}
          </p>
        </div>
      </section>

      {/* Блок 2 — Наша миссия */}
      <section className="relative py-28 px-6 md:px-8 bg-white text-charcoal">
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-[120px] leading-none font-serif text-gold/10 select-none pointer-events-none">
            &ldquo;
          </div>
          
          <span className="relative z-10 text-xs font-bold uppercase tracking-[0.3em] text-gold-dark mb-6 inline-block">
            {t("missionTitle")}
          </span>
          
          <h2 className="relative z-10 text-2xl md:text-4xl font-bold display-font text-charcoal mb-10 leading-relaxed tracking-tight max-w-3xl mx-auto">
            {t("missionText")}
          </h2>
          
          <div className="w-20 h-1.5 bg-gold mx-auto rounded-full" />
        </div>
      </section>

      {/* Блок 3 — Цифры (stats) */}
      <section className="py-24 px-6 md:px-8 bg-[#fcfcf9] border-y border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {statItems.map((item, i) => {
              const { val, label } = splitStat(item.raw);
              return (
                <div 
                  key={i}
                  className="p-10 rounded-[32px] bg-white border border-gray-100 luxury-shadow flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center text-gold-dark mb-6 group-hover:scale-110 transition-transform duration-300">
                    <item.Icon className="w-8 h-8" />
                  </div>
                  <div className="text-4xl md:text-5xl font-black text-charcoal mb-2 display-font tracking-tight">
                    {val}
                  </div>
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-gray-400">
                    {label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Блок 4 — Почему Funduq */}
      <section className="py-28 px-6 md:px-8 bg-white text-charcoal">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-gold-dark mb-4 inline-block">
              THE ADVANTAGES
            </span>
            <h2 className="text-3xl md:text-6xl font-black display-font text-charcoal tracking-tight">
              {t("whyTitle")}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {[1, 2, 3, 4, 5].map((itemNum) => (
              <div 
                key={itemNum}
                className="flex items-center gap-6 p-6 md:p-8 rounded-[24px] border border-gray-100 bg-[#fcfcfb] hover:border-gold/30 hover:bg-white hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <p className="text-lg md:text-xl font-semibold text-charcoal group-hover:text-gold-dark transition-colors duration-300">
                  {t(`whyItem${itemNum}`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Блок 5 — CTA */}
      <section className="relative py-32 px-6 md:px-8 bg-charcoal text-white overflow-hidden">
        {/* Decorative gradients */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_center,_var(--color-gold)_0%,_transparent_65%)]" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-6xl font-black display-font mb-10 leading-tight">
            {t("ctaTitle")}
          </h2>
          
          <Link
            href="/villas"
            className="inline-flex items-center gap-3 bg-gold hover:bg-gold-light text-charcoal font-black text-lg px-10 py-5 rounded-full transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-gold/20 group"
          >
            {t("ctaButton")}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>
      </section>

    </div>
  );
}
