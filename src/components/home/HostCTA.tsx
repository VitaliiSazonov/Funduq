"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import NextLink from "next/link";

export default function HostCTA() {
  const t = useTranslations("home");

  return (
    <section className="py-24 px-6 md:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto bg-charcoal rounded-3xl relative overflow-hidden flex flex-col md:flex-row items-center min-h-[500px] shadow-[0_24px_60px_rgba(26,28,25,0.15)]">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-charcoal/40 backdrop-blur-[2px] z-10" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="w-full h-full object-cover"
            alt="Interior of a modern high-end penthouse"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1oyty-BY7fdPVXOTFC7AhuYHppESSXHmHSmEiPVWN0-PJJTmKAJLP7tj3UFLilKUdGD71JpJvx_908H9i7c5zjlV3zr6qi0vE-Q9O8vu3NANEKYx23R8Z892jVkoNurqrKf4tYkzYaiJVGB0yoUFkO9Eyr8kRaiMNkVXHmvWnED4aL8eEt9GY45oquepdfDtnEUZxbxu-xV1C6-kqojo9hvG8offcd__PlL4oNzSfzJbhtIAMfxvkmfRLm1qMZV-rvUemLgBAnCE"
          />
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="relative z-20 p-12 md:p-20 flex flex-col items-start max-w-2xl"
        >
          <span className="text-white/70 uppercase tracking-widest text-xs font-bold mb-4">
            {t("host_cta_label")}
          </span>
          <h2 className="display-font text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
            {t("host_cta_title")}
          </h2>
          <p className="text-white/80 text-lg mb-10 leading-relaxed">
            {t("host_cta_description")}
          </p>
          <div className="flex flex-wrap gap-4">
            <NextLink
              href="/host/dashboard"
              className="px-8 py-4 bg-gold text-white display-font font-black rounded-lg hover:bg-gold-dark transition-all"
            >
              {t("host_cta_button")}
            </NextLink>
            <button className="px-8 py-4 border border-white/30 text-white display-font font-bold rounded-lg hover:bg-white/10 transition-all cursor-pointer">
              {t("host_cta_learn")}
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
