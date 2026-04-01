"use client";

import { motion } from "framer-motion";
import { Banknote, MessageSquare, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

const USP_ITEMS = [
  { key: "commission", Icon: Banknote },
  { key: "direct", Icon: MessageSquare },
  { key: "verified", Icon: ShieldCheck },
];

export default function WhyFunduq() {
  const t = useTranslations("home");

  return (
    <section className="py-24 bg-[#f4f4ef]">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          {USP_ITEMS.map((item, i) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15, ease: [0.23, 1, 0.32, 1] }}
              className="flex flex-col items-start gap-6"
            >
              <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center">
                <item.Icon className="w-7 h-7 text-gold-dark" />
              </div>
              <h4 className="display-font text-xl font-bold text-charcoal">
                {t(`usp_${item.key}_title`)}
              </h4>
              <p className="text-gray-500 leading-relaxed">
                {t(`usp_${item.key}_desc`)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
