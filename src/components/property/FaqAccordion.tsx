"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  faqs: FaqItem[];
}

export default function FaqAccordion({ faqs }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-3">
      {faqs.map((faq, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div
            key={idx}
            className="bg-white border border-charcoal/5 rounded-2xl overflow-hidden transition-all"
          >
            <button
              onClick={() => toggle(idx)}
              className="w-full flex items-center justify-between p-5 text-left select-none transition-colors hover:bg-charcoal/[0.02]"
              aria-expanded={isOpen}
            >
              <span className="font-bold text-charcoal text-[15px] md:text-base">
                {faq.question}
              </span>
              <ChevronDown
                className={cn(
                  "w-5 h-5 text-gold-dark transition-transform duration-300 flex-shrink-0 ml-4",
                  isOpen && "rotate-180"
                )}
              />
            </button>
            <div
              className={cn(
                "grid transition-all duration-300 ease-in-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <div className="p-5 pt-0 text-sm md:text-[15px] text-charcoal/60 leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
