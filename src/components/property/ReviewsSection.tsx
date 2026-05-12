"use client";

import { Star } from "lucide-react";
import { useLocale } from "next-intl";

interface Review {
  id: string;
  authorName: string;
  country: string;
  flag: string;
  date: string;
  rating: number;
  textEn: string;
  textRu: string;
}

export const mockReviews: Review[] = [
  {
    id: "1",
    authorName: "Sarah M.",
    country: "United Kingdom",
    flag: "🇬🇧",
    date: "March 2026",
    rating: 5,
    textEn: "Absolutely stunning villa! The views were incredible and the host was very responsive. The pool area is a dream.",
    textRu: "Абсолютно потрясающая вилла! Виды были невероятными, а хозяин очень отзывчив. Зона бассейна просто мечта."
  },
  {
    id: "2",
    authorName: "Alexey V.",
    country: "Russia",
    flag: "🇷🇺",
    date: "February 2026",
    rating: 5,
    textEn: "Great location and very clean. We had everything we needed for a family vacation. Highly recommended.",
    textRu: "Отличное расположение и очень чисто. У нас было все необходимое для семейного отдыха. Очень рекомендую."
  },
  {
    id: "3",
    authorName: "Ahmed A.",
    country: "United Arab Emirates",
    flag: "🇦🇪",
    date: "January 2026",
    rating: 4,
    textEn: "Beautiful property with luxurious amenities. Check-in was smooth. The only minor issue was the Wi-Fi speed in the bedrooms.",
    textRu: "Красивый дом с роскошными удобствами. Заселение прошло гладко. Единственная небольшая проблема - скорость Wi-Fi в спальнях."
  },
  {
    id: "4",
    authorName: "Julia K.",
    country: "Germany",
    flag: "🇩🇪",
    date: "December 2025",
    rating: 5,
    textEn: "One of the best stays we've had in Dubai. The interior design is top-notch and the neighborhood is very peaceful.",
    textRu: "Один из лучших вариантов проживания в Дубае. Дизайн интерьера на высшем уровне, а район очень спокойный."
  }
];

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
