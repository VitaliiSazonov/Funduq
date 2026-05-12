export interface Review {
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
