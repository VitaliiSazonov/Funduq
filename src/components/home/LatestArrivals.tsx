"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

const ARRIVALS = [
  {
    key: "beachfront",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBUNpWypMBr3XMsFzcfMaUHpBC9ZgJSnRfuOPHk4OiLVHoKe5lYLrgJ3wRLUIj64zYP2QAtwYsLbdAyb4N-9Y5u4gg-68TOp3lFUr00xmLtkZIxjD5YVYqmDlxqzcP65uYni6ZjNUA-rmNnPTC4YCDJxYFvwq-7F2IItNo8eIu1OTUTqaueYBjUcUD0DQMtpnpoJDQa-dvdIKCWoYvAX77RTUXWqqlt7Z3lWgdPx_xN-pIdHq2yBM_1RnFIeGOgs_2-30NUj7nsyKI",
    alt: "Beachfront Zen Villa on Saadiyat Island",
  },
  {
    key: "penthouse88",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC1oyty-BY7fdPVXOTFC7AhuYHppESSXHmHSmEiPVWN0-PJJTmKAJLP7tj3UFLilKUdGD71JpJvx_908H9i7c5zjlV3zr6qi0vE-Q9O8vu3NANEKYx23R8Z892jVkoNurqrKf4tYkzYaiJVGB0yoUFkO9Eyr8kRaiMNkVXHmvWnED4aL8eEt9GY45oquepdfDtnEUZxbxu-xV1C6-kqojo9hvG8offcd__PlL4oNzSfzJbhtIAMfxvkmfRLm1qMZV-rvUemLgBAnCE",
    alt: "Penthouse 88 in Downtown Dubai",
  },
  {
    key: "desertRose",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC3oGAW96xYnPFUMDTqFgZC2z5yse7wKZ-oRAwod4-0D6DowcCA_ijmUcVOGElE-fWFo7zTb8_SNhYaUte42vqR6rmwcaPvX5tmBIDyjaGJymH0V4NJ8uqfIvOGmiLbfKzD46kFaZJuSufR5xQV5T6UAs0o5TnBOeJcTz7atVkBRhZG-p4YU9Q2LKytzAkWlXv7W2xoQEEQPpsxNACsjKxDkcnuC7R2wqav12IlCCj75BsPs9FF89t745GRXEkFQA8YhgkxpMjqFfM",
    alt: "Desert Rose Estate in Al Marmoom",
  },
];

export default function LatestArrivals() {
  const t = useTranslations("home");

  return (
    <section className="py-16 px-6 md:px-8 bg-[#f4f4ef]">
      <div className="max-w-7xl mx-auto">
        <h2 className="display-font text-2xl font-extrabold text-charcoal tracking-tight mb-8">
          {t("arrivals_title")}
        </h2>

        {/* Compact 3-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {ARRIVALS.map((item, i) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="flex gap-4 group cursor-pointer bg-white p-3 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-transform hover:-translate-y-1"
            >
              {/* Thumbnail */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
                alt={item.alt}
                src={item.image}
              />
              {/* Info */}
              <div className="flex flex-col justify-center min-w-0">
                <h3 className="font-bold text-charcoal text-sm truncate">
                  {t(`latest_${item.key}_name`)}
                </h3>
                <p className="text-xs text-gray-500 mb-2">
                  {t(`latest_${item.key}_location`)}
                </p>
                <p className="text-sm font-bold text-gold-dark">
                  {t(`latest_${item.key}_price`)}{" "}
                  <span className="text-[10px] text-gray-400 font-normal">
                    / {t("arrivals_night")}
                  </span>
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
