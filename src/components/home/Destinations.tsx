"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const DESTINATIONS = [
  {
    key: "palm",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBU49llHQ5_GIFlPq6tf2UM8-xte_qNu6Nxqu2FissS39lb2dwCzUVCW-t2EqRZTs-TnslkZ7sA-iWTxjJXX52-fPspovebun-uT3IqrA0m88p1RY5ojZXFs_uRGni8WfEOkM_A0eUwfGwPmIqPjgBBZ_1rC7eWdkjtwkY9GMEnmyDsaWMgFgifmf0tD0YOjINcDyCwRPsIxXPDoKZ82YOUMnqIN7Ym9vpPcnqDCmKJlVuj4uNCLD-58hAXqneieGIo81HmjnrjKX0",
    alt: "Aerial drone view of the Palm Jumeirah in Dubai",
    offset: false,
  },
  {
    key: "saadiyat",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBlAFbadNPU_la8vIb2ukW6dqhdl9wbMQSqda6sCzOP-71_VCJv7wm_5Iab2lICGDym-28CSZoKc2XaL0g1eU37-37ABxE6Q2_BpQ5qJozEXT9_Bg8_oAbD34UMqHppSUb9mrGEhykZLS34mWQ7p57jJ9bUINQV0_nbAmFUvWKoBfJWbbQ-KZOQ4PC6HkAzYMggcmPpMk34TWYoMkjL7ggCjP2c5inMGByXZb0VMVq1YO1TxvTV-Qd30AmwuLzmvcPleobz34tC3sU",
    alt: "Pristine white sand beach of Saadiyat Island Abu Dhabi",
    offset: true,
  },
  {
    key: "marina",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDea5CWVYJN0oWDEkkcaSSNHlxpcXdA166Sv7WZY12F1_Vh7mi5bTW6XaGe6xB4vm79S01wMIDCa1iiXvpF_YVJyxGLlewUDui_3aa7UowcmY7Y7m502qfDlTQz6rPewFbMfCrt6gvcBj4VgnWALTX29sbG9MpLRMZ6ju8ft19OYBfU-OwX25zVS_Dic_A9xezjr25fX6tkQAINLpXhTTyr1WdF0ayweFWY3ans1qQWI1ZHYqws3iXIEJJPSYVNXJ0pHFLzK87Rbn8",
    alt: "Dramatic nighttime skyline of Dubai Marina",
    offset: false,
  },
  {
    key: "alzorah",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAcMHQOYeelU8Qw6PJRsQsQPmCXMP4vcU3f3x2_pJvkRrH4MON6sVgw5EJqdgcXbCfeg9CCi5MVDD5XR_MIrxD_vivigdyw_xBSfoL_VkkvAzxFXWeFjsNwYIRLIqcwxFdpWrJ5XdJnhYQ7Rjt7ByRMm7INeI5XfYPQJXfniLxY_ErEe6h6PYUZ0FvenrLfYGyQDKoNXFXgA494WBg_WsPiGJNYnFkYVm4EG_a-UV_s8tS4aKcRkh7suZvQXstsayoBJ69fTAhj0nk",
    alt: "Lush green mangroves at Al Zorah luxury resort",
    offset: true,
  },
];

export default function Destinations() {
  const t = useTranslations("home");

  return (
    <section className="py-24 px-6 md:px-8 bg-offwhite">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
          <div className="max-w-xl">
            <h2 className="text-4xl font-black text-charcoal display-font tracking-tight mb-4">
              {t("destinations_title")}
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed">
              {t("destinations_subtitle")}
            </p>
          </div>
          <Link
            href="/villas"
            className="text-gold-dark font-bold hover:underline underline-offset-8 transition-all flex items-center gap-2 group"
          >
            {t("destinations_exploreAll")}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Destination Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {DESTINATIONS.map((dest, i) => (
            <motion.div
              key={dest.key}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
              className={`group relative h-[450px] md:h-[500px] overflow-hidden rounded-xl shadow-[0_12px_40px_rgba(26,28,25,0.06)] cursor-pointer ${
                dest.offset ? "md:mt-12" : ""
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                alt={dest.alt}
                src={dest.image}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-8">
                <h3 className="display-font text-2xl font-bold text-white mb-1">
                  {t(`dest_${dest.key}_name`)}
                </h3>
                <p className="text-white/70 text-sm font-medium">
                  {t(`dest_${dest.key}_count`)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
