"use client";

import { Star } from "lucide-react";
import { useLocale } from "next-intl";

import { mockReviews } from "./reviewsData";

export default function ReviewsSection() {
  const locale = useLocale();
  const title = locale === "ru" ? "Отзывы гостей" : "Guest Reviews";
  
  // Aggregate stats
  const totalReviews = 47; // Fake total count for realistic look
  const avgRating = 4.9; // Fake average rating

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-black display-font text-charcoal">{title}</h2>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-gold/10 rounded-full">
          <Star className="w-4 h-4 fill-gold text-gold" />
          <span className="text-sm font-bold text-gold-dark">{avgRating.toFixed(1)}</span>
          <span className="text-xs text-gold-dark/70 font-medium">· {totalReviews} {locale === "ru" ? "отзыва" : "reviews"}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockReviews.map((review) => (
          <div key={review.id} className="bg-white rounded-2xl border border-charcoal/5 p-5 flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold-dark font-black">
                  {review.authorName.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-bold text-charcoal">{review.authorName}</div>
                  <div className="text-xs text-charcoal/50 flex items-center gap-1">
                    <span>{review.flag}</span>
                    <span>{review.country}</span>
                  </div>
                </div>
              </div>
              <div className="text-xs text-charcoal/40 font-medium">{review.date}</div>
            </div>
            
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-3.5 h-3.5 ${i < review.rating ? "fill-gold text-gold" : "fill-charcoal/5 text-charcoal/5"}`} 
                />
              ))}
            </div>
            
            <p className="text-sm text-charcoal/80 leading-relaxed">
              {locale === "ru" ? review.textRu : review.textEn}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
