"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const COLLECTIONS = [
  {
    key: "modernist",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC3oGAW96xYnPFUMDTqFgZC2z5yse7wKZ-oRAwod4-0D6DowcCA_ijmUcVOGElE-fWFo7zTb8_SNhYaUte42vqR6rmwcaPvX5tmBIDyjaGJymH0V4NJ8uqfIvOGmiLbfKzD46kFaZJuSufR5xQV5T6UAs0o5TnBOeJcTz7atVkBRhZG-p4YU9Q2LKytzAkWlXv7W2xoQEEQPpsxNACsjKxDkcnuC7R2wqav12IlCCj75BsPs9FF89t745GRXEkFQA8YhgkxpMjqFfM",
    alt: "Modernist architecture villa at twilight",
    badge: "coll_modernist_badge",
    desc: "coll_modernist_sub",
  },
  {
    key: "serene",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBUNpWypMBr3XMsFzcfMaUHpBC9ZgJSnRfuOPHk4OiLVHoKe5lYLrgJ3wRLUIj64zYP2QAtwYsLbdAyb4N-9Y5u4gg-68TOp3lFUr00xmLtkZIxjD5YVYqmDlxqzcP65uYni6ZjNUA-rmNnPTC4YCDJxYFvwq-7F2IItNo8eIu1OTUTqaueYBjUcUD0DQMtpnpoJDQa-dvdIKCWoYvAX77RTUXWqqlt7Z3lWgdPx_xN-pIdHq2yBM_1RnFIeGOgs_2-30NUj7nsyKI",
    alt: "Mediterranean beachfront residence with blue doors",
    badge: "coll_serene_badge",
    desc: "coll_serene_sub",
  },
];

export default function SignatureCollections() {
  const t = useTranslations("home");

  return (
    <section className="py-16 px-6 md:px-8 max-w-7xl mx-auto">
      <h2 className="display-font text-2xl font-extrabold text-charcoal mb-8 tracking-tight">
        {t("collections_title")}
      </h2>

      {/* 2-column equal grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px]">
        {COLLECTIONS.map((coll, i) => (
          <Link
            href="/villas"
            key={coll.key}
            className="relative rounded-3xl overflow-hidden group cursor-pointer block"
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: i * 0.15,
                ease: [0.23, 1, 0.32, 1],
              }}
              className="h-full"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                alt={coll.alt}
                src={coll.image}
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-6">
                <span className="text-[10px] uppercase font-bold tracking-[0.3em] mb-2 bg-gold/20 backdrop-blur px-3 py-1 rounded-full">
                  {t(coll.badge)}
                </span>
                <h3 className="text-3xl display-font font-extrabold">
                  {t(`coll_${coll.key}_name`)}
                </h3>
                <p className="text-sm mt-2 opacity-80">{t(coll.desc)}</p>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </section>
  );
}
