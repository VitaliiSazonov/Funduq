"use client";

import { motion } from "framer-motion";
import { ShieldCheck, ArrowRightCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const RECOMMENDED = [
  {
    key: "skyline",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCRZ4koy9_t1koJLf72OKJUlNcJq6jTIe7KmjjJ6gJRVk8LWEnwuCG5KU6zreX0Ri33SqvLRO2PguiJpXAMWmgZY7wOmloOcAI2o5F0evn-CocRkKHwRXaQpmUxvquaP_PcZAufeom62X1LpSqtKNvbV5zUjnnKA9y-PZJ_LLdN7gw7nlQAwRWLc3bDSdgtj1V2M4p4ay31PNnHfsZmfUmAcGLKkPQTF8dXh5zyawq0rZGCrGL_kgboWQfh787Hnu4Q06T8aOsxh00",
    alt: "Penthouse with panoramic Dubai Marina skyline views",
  },
  {
    key: "palmPearl",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA2Ihm2Z4pGqNpTRTlky3i-TQ2fxQatTT4O36fj55W-yfWuQaxOXfltWb1MlmyGA5UEAL9frevWcrj6w9GebuOjcuJXUpnQ2iWhGhRxZLoPP3r69cDOovRdFJqaKFp1UxArEqpylJGDpDNGYiaU_peY1ZCl5by10dRIvmGtbJ9BeU9DvNW7jN-w3JKUrbADc1CVwx7yv9qYT4rYt6ZpR40t6-60NYWjZMbqIltryUK_klpCT1H2qiXHgJvfFjRAfoL_jea3og1nmTY",
    alt: "Luxury villa on Palm Jumeirah with infinity pool",
  },
  {
    key: "ecoRetreat",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBlAFbadNPU_la8vIb2ukW6dqhdl9wbMQSqda6sCzOP-71_VCJv7wm_5Iab2lICGDym-28CSZoKc2XaL0g1eU37-37ABxE6Q2_BpQ5qJozEXT9_Bg8_oAbD34UMqHppSUb9mrGEhykZLS34mWQ7p57jJ9bUINQV0_nbAmFUvWKoBfJWbbQ-KZOQ4PC6HkAzYMggcmPpMk34TWYoMkjL7ggCjP2c5inMGByXZb0VMVq1YO1TxvTV-Qd30AmwuLzmvcPleobz34tC3sU",
    alt: "Al Zorah beach eco-retreat with turquoise water",
  },
];

export default function RecommendedStays() {
  const t = useTranslations("home");

  return (
    <section className="py-24 px-6 md:px-8 bg-offwhite">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
          <div className="max-w-xl">
            <h2 className="display-font text-4xl font-black text-charcoal tracking-tight mb-4">
              {t("recommended_title")}
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed">
              {t("recommended_subtitle")}
            </p>
          </div>
          <Link
            href="/villas"
            className="bg-charcoal text-white px-8 py-3 rounded-lg display-font font-bold hover:bg-charcoal/90 transition-all"
          >
            {t("recommended_viewAll")}
          </Link>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {RECOMMENDED.map((item, i) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: i * 0.15,
                ease: [0.23, 1, 0.32, 1],
              }}
              className="group cursor-pointer"
            >
              {/* Portrait Image Card */}
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden mb-6 shadow-md group-hover:shadow-2xl transition-all duration-500">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  alt={item.alt}
                  src={item.image}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Verified Badge */}
                <div className="absolute top-4 left-4">
                  <span className="bg-white/90 backdrop-blur-sm text-charcoal px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit">
                    <ShieldCheck className="w-3.5 h-3.5 text-gold fill-gold/20" />
                    {t("recommended_verified")}
                  </span>
                </div>

                {/* Bottom Content */}
                <div className="absolute bottom-6 left-6 text-white">
                  <p className="text-xs uppercase tracking-[0.2em] font-bold text-white/80 mb-2">
                    {t(`rec_${item.key}_label`)}
                  </p>
                  <h3 className="text-2xl display-font font-black">
                    {t(`rec_${item.key}_name`)}
                  </h3>
                </div>
              </div>

              {/* Info Below Card */}
              <div className="flex justify-between items-center px-2">
                <div>
                  <p className="text-gray-500 text-sm font-medium">
                    {t(`rec_${item.key}_meta`)}
                  </p>
                  <p className="text-charcoal font-black mt-1">
                    {t(`rec_${item.key}_price`)}{" "}
                    <span className="font-medium text-gray-500 text-sm">
                      / {t("arrivals_night")}
                    </span>
                  </p>
                </div>
                <ArrowRightCircle className="w-6 h-6 text-gray-400 group-hover:text-gold transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
