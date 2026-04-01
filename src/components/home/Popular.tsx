"use client";

import { motion } from "framer-motion";
import { Star, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

const POPULAR = [
  {
    key: "skyline",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCRZ4koy9_t1koJLf72OKJUlNcJq6jTIe7KmjjJ6gJRVk8LWEnwuCG5KU6zreX0Ri33SqvLRO2PguiJpXAMWmgZY7wOmloOcAI2o5F0evn-CocRkKHwRXaQpmUxvquaP_PcZAufeom62X1LpSqtKNvbV5zUjnnKA9y-PZJ_LLdN7gw7nlQAwRWLc3bDSdgtj1V2M4p4ay31PNnHfsZmfUmAcGLKkPQTF8dXh5zyawq0rZGCrGL_kgboWQfh787Hnu4Q06T8aOsxh00",
    alt: "Skyline Sanctuary penthouse with cityscape view",
    rating: "4.95",
  },
  {
    key: "palmPearl",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA2Ihm2Z4pGqNpTRTlky3i-TQ2fxQatTT4O36fj55W-yfWuQaxOXfltWb1MlmyGA5UEAL9frevWcrj6w9GebuOjcuJXUpnQ2iWhGhRxZLoPP3r69cDOovRdFJqaKFp1UxArEqpylJGDpDNGYiaU_peY1ZCl5by10dRIvmGtbJ9BeU9DvNW7jN-w3JKUrbADc1CVwx7yv9qYT4rYt6ZpR40t6-60NYWjZMbqIltryUK_klpCT1H2qiXHgJvfFjRAfoL_jea3og1nmTY",
    alt: "Palm Pearl Estate infinity pool at sunset",
    rating: "5.0",
  },
  {
    key: "obsidian",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC1oyty-BY7fdPVXOTFC7AhuYHppESSXHmHSmEiPVWN0-PJJTmKAJLP7tj3UFLilKUdGD71JpJvx_908H9i7c5zjlV3zr6qi0vE-Q9O8vu3NANEKYx23R8Z892jVkoNurqrKf4tYkzYaiJVGB0yoUFkO9Eyr8kRaiMNkVXHmvWnED4aL8eEt9GY45oquepdfDtnEUZxbxu-xV1C6-kqojo9hvG8offcd__PlL4oNzSfzJbhtIAMfxvkmfRLm1qMZV-rvUemLgBAnCE",
    alt: "The Obsidian Loft modern interior with panoramic windows",
    rating: "4.88",
  },
  {
    key: "azure",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBUNpWypMBr3XMsFzcfMaUHpBC9ZgJSnRfuOPHk4OiLVHoKe5lYLrgJ3wRLUIj64zYP2QAtwYsLbdAyb4N-9Y5u4gg-68TOp3lFUr00xmLtkZIxjD5YVYqmDlxqzcP65uYni6ZjNUA-rmNnPTC4YCDJxYFvwq-7F2IItNo8eIu1OTUTqaueYBjUcUD0DQMtpnpoJDQa-dvdIKCWoYvAX77RTUXWqqlt7Z3lWgdPx_xN-pIdHq2yBM_1RnFIeGOgs_2-30NUj7nsyKI",
    alt: "Azure Horizon Villa with blue doors on The World Islands",
    rating: "4.92",
  },
];

export default function Popular() {
  const t = useTranslations("home");

  return (
    <section className="py-16 px-6 md:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="display-font text-2xl font-extrabold text-charcoal tracking-tight">
          {t("popular_title")}{" "}
          <span className="text-gray-400 font-medium text-xl">
            ({t("popular_subtitle")})
          </span>
        </h2>
        <div className="flex gap-2">
          <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-charcoal hover:bg-gray-50 transition-all cursor-pointer">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-charcoal hover:bg-gray-50 transition-all cursor-pointer">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4-Column Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {POPULAR.map((item, i) => (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="group cursor-pointer"
          >
            {/* Square Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                alt={item.alt}
                src={item.image}
              />
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-md text-[10px] font-bold shadow-sm uppercase tracking-wider text-charcoal">
                {t("popular_badge")}
              </div>
              <button className="absolute top-3 right-3 text-white drop-shadow-md cursor-pointer">
                <Heart className="w-5 h-5" />
              </button>
            </div>

            {/* Info */}
            <div className="space-y-0.5">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-sm text-charcoal">
                  {t(`pop_${item.key}_name`)}
                </h3>
                <div className="flex items-center gap-1 text-xs">
                  <Star className="w-3.5 h-3.5 text-gold fill-gold" />
                  <span className="font-bold">{item.rating}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {t(`pop_${item.key}_location`)}
              </p>
              <p className="text-xs text-gray-500">
                {t(`pop_${item.key}_dates`)}
              </p>
              <p className="text-sm mt-1.5 font-bold text-charcoal">
                {t(`pop_${item.key}_price`)}{" "}
                <span className="font-normal text-gray-500">
                  {t("arrivals_night")}
                </span>
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
