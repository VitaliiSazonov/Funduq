import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { 
  Percent, 
  ShieldCheck, 
  MessageSquare, 
  Mail, 
  Phone, 
  MapPin, 
  Award, 
  FileText,
  Clock,
  Briefcase,
  Building,
  User,
  Users
} from "lucide-react";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale } = await params;
  const isRu = locale === "ru";

  const title = isRu
    ? "О нас | Funduq — Отборные виллы и дома для отдыха в ОАЭ"
    : "About Us | Funduq — Honest Luxury Holiday Homes in UAE";

  const description = isRu
    ? "История Funduq. Узнайте, как мы соединяем путешественников с лучшими виллами в Дубае без комиссии и с полной прозрачностью."
    : "Learn the story behind Funduq. Discover how we connect discerning travelers with luxury holiday homes in Dubai with 0% guest commission and full transparency.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: "https://funduq.ae/images/og-default.jpg" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: isRu ? "https://funduq.ae/ru/about" : "https://funduq.ae/about",
      languages: {
        en: "https://funduq.ae/about",
        ru: "https://funduq.ae/ru/about",
      },
    },
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const isRu = locale === "ru";

  return (
    <div className="flex flex-col min-h-screen bg-white">
      
      {/* СЕКЦИЯ 1 — Hero */}
      <section className="relative pt-40 pb-28 px-6 md:px-8 bg-charcoal text-white overflow-hidden">
        {/* Background Visual Accents */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_center,_var(--color-gold)_0%,_transparent_75%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/30 via-transparent to-charcoal/95" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <span className="inline-block px-5 py-2 rounded-full border border-gold/30 text-gold-light text-xs font-bold uppercase tracking-[0.25em] bg-gold/5 backdrop-blur-md mb-8">
            {isRu ? "Наша Философия" : "Our Philosophy"}
          </span>
          
          <h1 className="text-4xl md:text-7xl font-black mb-8 display-font tracking-tight text-white leading-tight">
            {isRu ? "Мы верим, что роскошный отдых" : "We Believe Luxury Travel"}{" "}
            <br className="hidden md:block" />
            <span className="text-gold">{isRu ? "должен быть честным" : "Should Be Fair"}</span>
          </h1>

          <p className="text-gray-300 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed font-medium">
            {isRu
              ? "Funduq соединяет взыскательных путешественников с лучшими виллами ОАЭ — без комиссии и с полной прозрачностью."
              : "Funduq connects discerning travelers with the finest holiday homes in UAE — with zero commission and full transparency."}
          </p>
        </div>
      </section>

      {/* СЕКЦИЯ 2 — История компании */}
      <section className="py-24 px-6 md:px-8 bg-white text-charcoal">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            
            {/* Left Column: Visual key statistics */}
            <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-28">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-gold-dark">
                {isRu ? "ИСТОРИЯ КОМПАНИИ" : "COMPANY HISTORY"}
              </span>
              <h2 className="text-3xl md:text-5xl font-black display-font text-charcoal leading-tight">
                {isRu ? "Как создавался Funduq" : "The Genesis of Funduq"}
              </h2>
              
              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="p-8 rounded-3xl bg-offwhite border border-gray-100/80 luxury-shadow">
                  <div className="text-4xl md:text-5xl font-black text-gold display-font mb-2">700+</div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    {isRu ? "Проверенных вилл" : "Verified Villas"}
                  </p>
                </div>
                
                <div className="p-8 rounded-3xl bg-offwhite border border-gray-100/80 luxury-shadow">
                  <div className="text-4xl md:text-5xl font-black text-gold display-font mb-2">50</div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    {isRu ? "Пунктов проверки" : "Inspection Points"}
                  </p>
                </div>
              </div>

              <div className="p-8 rounded-3xl border border-gold/20 bg-gold/5 flex gap-6 items-start">
                <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center shrink-0 text-gold-dark">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-charcoal mb-1 display-font text-lg">
                    {isRu ? "Только отборный премиум" : "Curated Selection"}
                  </h4>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {isRu 
                      ? "Каждый объект проходит строгий отбор, чтобы соответствовать самым высоким ожиданиям наших гостей." 
                      : "Every property is handpicked and rigorously inspected to match our guests' premium expectations."}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Narrative story text */}
            <div className="lg:col-span-7 space-y-8 text-gray-600 text-lg leading-relaxed pt-2">
              {isRu ? (
                <>
                  <p>
                    Funduq родился из простого разочарования. В 2023 году наш основатель <span className="text-gold-dark font-semibold">Виталий Сазонов</span> — проживший в Дубае несколько лет — заметил, что путешественники платят 15–20% комиссии поверх реальной цены аренды, тогда как владельцы недвижимости были столь же недовольны комиссиями платформ, съедающими их доход.
                  </p>
                  <p className="border-l-4 border-gold pl-6 py-2 italic text-charcoal font-medium bg-offwhite rounded-r-2xl">
                    «Решение было очевидным: создать маркетплейс, который соединяет гостей напрямую с владельцами. Никаких скрытых платежей. Никаких посредников. Только честная, отборная роскошь.»
                  </p>
                  <p>
                    Сегодня Funduq курирует более 700 верифицированных объектов по всему Дубаю, Абу-Даби, Рас-эль-Хайме и Фуджейре — каждый проходит строгую 50-балльную проверку качества перед размещением.
                  </p>
                  <p>
                    Мы убрали все барьеры, чтобы подарить вам кристально чистый процесс бронирования. Вы получаете прямой контакт с собственником, честные цены и бескомпромиссное качество сервиса от начала и до конца вашего пребывания.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Funduq was born from a simple frustration. In 2023, our founder <span className="text-gold-dark font-semibold">Vitalii Sazonov</span> — having lived in Dubai for years — noticed that travelers were paying 15–20% service fees on top of the actual rental price, while property owners were equally frustrated by platform cuts eating into their income.
                  </p>
                  <p className="border-l-4 border-gold pl-6 py-2 italic text-charcoal font-medium bg-offwhite rounded-r-2xl">
                    &ldquo;The answer was straightforward: build a marketplace that connects guests directly with property owners. No hidden fees. No middlemen. Just honest, curated luxury.&rdquo;
                  </p>
                  <p>
                    Today, Funduq curates over 700 verified properties across Dubai, Abu Dhabi, Ras Al Khaimah, and Fujairah — each passing a rigorous 50-point quality inspection before listing.
                  </p>
                  <p>
                    We have stripped away the unnecessary layers to bring you a crystal-clear booking experience. You get direct access to the owners, genuine prices, and uncompromised support throughout your entire stay.
                  </p>
                </>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* СЕКЦИЯ 3 — 3 ценности */}
      <section className="py-24 px-6 md:px-8 bg-offwhite text-charcoal">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gold-dark mb-4 inline-block">
              {isRu ? "НАШИ СТОЛПЫ" : "OUR PILLARS"}
            </span>
            <h2 className="text-3xl md:text-5xl font-black display-font text-charcoal mb-6">
              {isRu ? "Ценности, которым мы верны" : "Values We Stand By"}
            </h2>
            <p className="text-gray-500 text-base md:text-lg">
              {isRu 
                ? "Мы переосмыслили индустрию аренды премиум-класса, поставив во главу угла честность и открытость."
                : "We have redefined the luxury short-term rental landscape by prioritizing absolute integrity and transparency."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Value 1 */}
            <div className="group bg-white p-10 rounded-3xl border border-gray-100/50 luxury-shadow hover:-translate-y-2 hover:border-gold/30 transition-all duration-300">
              <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center mb-8 text-gold-dark group-hover:bg-gold group-hover:text-white transition-all duration-300">
                <Percent className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-charcoal mb-4 display-font group-hover:text-gold-dark transition-colors duration-300">
                {isRu ? "0% комиссии для гостей" : "0% Guest Commission"}
              </h3>
              <p className="text-gray-500 leading-relaxed text-base">
                {isRu ? "Вы платите цену владельца. Точка." : "You pay the owner's price. Period."}
              </p>
            </div>

            {/* Value 2 */}
            <div className="group bg-white p-10 rounded-3xl border border-gray-100/50 luxury-shadow hover:-translate-y-2 hover:border-gold/30 transition-all duration-300">
              <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center mb-8 text-gold-dark group-hover:bg-gold group-hover:text-white transition-all duration-300">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-charcoal mb-4 display-font group-hover:text-gold-dark transition-colors duration-300">
                {isRu ? "50-балльная проверка" : "50-Point Verification"}
              </h3>
              <p className="text-gray-500 leading-relaxed text-base">
                {isRu ? "Каждый объект лично проверяется перед размещением." : "Every property is personally inspected before listing."}
              </p>
            </div>

            {/* Value 3 */}
            <div className="group bg-white p-10 rounded-3xl border border-gray-100/50 luxury-shadow hover:-translate-y-2 hover:border-gold/30 transition-all duration-300">
              <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center mb-8 text-gold-dark group-hover:bg-gold group-hover:text-white transition-all duration-300">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-charcoal mb-4 display-font group-hover:text-gold-dark transition-colors duration-300">
                {isRu ? "Прямой контакт с владельцем" : "Direct Owner Contact"}
              </h3>
              <p className="text-gray-500 leading-relaxed text-base">
                {isRu ? "Настройте ваш отдых, задавайте вопросы, доверяйте." : "Customize your stay, ask questions, build trust."}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* СЕКЦИЯ 4 — Команда */}
      <section className="py-24 px-6 md:px-8 bg-white text-charcoal">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gold-dark mb-4 inline-block">
              {isRu ? "НАШИ ЛЮДИ" : "THE TEAM"}
            </span>
            <h2 className="text-3xl md:text-5xl font-black display-font text-charcoal mb-4">
              {isRu ? "Команда Funduq" : "The People Behind Funduq"}
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto text-sm leading-relaxed">
              {isRu 
                ? "Эксперты, создающие будущее прозрачной аренды роскошной недвижимости в Эмиратах." 
                : "Experts building the future of transparent luxury holiday home rentals in the Emirates."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Card 1: Vitalii Sazonov */}
            <div className="group flex flex-col items-center text-center p-8 rounded-3xl border border-gray-100 bg-offwhite/50 luxury-shadow hover:-translate-y-1 transition-all duration-300">
              <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-gold/20 to-gold/5 border-2 border-gold/10 flex items-center justify-center text-gold-dark mb-6 group-hover:scale-105 transition-transform duration-300 relative overflow-hidden">
                <User className="w-12 h-12 text-gold-dark/60" />
                <span className="absolute bottom-0 inset-x-0 bg-gold/10 text-[10px] font-bold text-gold-dark py-1">VS</span>
              </div>
              <h4 className="text-xl font-bold display-font text-charcoal mb-1">
                Vitalii Sazonov
              </h4>
              <p className="text-sm text-gold-dark font-medium uppercase tracking-widest">
                Founder & CEO
              </p>
            </div>

            {/* Card 2: Head of Operations */}
            <div className="group flex flex-col items-center text-center p-8 rounded-3xl border border-gray-100 bg-offwhite/50 luxury-shadow hover:-translate-y-1 transition-all duration-300">
              <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-gray-100 to-gray-200 border-2 border-gray-100 flex items-center justify-center text-gray-400 mb-6 group-hover:scale-105 transition-transform duration-300 relative overflow-hidden">
                <Users className="w-12 h-12 text-gray-400/60" />
                <span className="absolute bottom-0 inset-x-0 bg-gray-100 text-[10px] font-bold text-gray-500 py-1">OPS</span>
              </div>
              <h4 className="text-xl font-bold display-font text-charcoal mb-1">
                {isRu ? "Руководитель операционного отдела" : "Head of Operations"}
              </h4>
              <p className="text-sm text-gray-400 font-medium uppercase tracking-widest">
                Team Member
              </p>
            </div>

            {/* Card 3: Head of Partnerships */}
            <div className="group flex flex-col items-center text-center p-8 rounded-3xl border border-gray-100 bg-offwhite/50 luxury-shadow hover:-translate-y-1 transition-all duration-300">
              <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-gray-100 to-gray-200 border-2 border-gray-100 flex items-center justify-center text-gray-400 mb-6 group-hover:scale-105 transition-transform duration-300 relative overflow-hidden">
                <Users className="w-12 h-12 text-gray-400/60" />
                <span className="absolute bottom-0 inset-x-0 bg-gray-100 text-[10px] font-bold text-gray-500 py-1">PARTNER</span>
              </div>
              <h4 className="text-xl font-bold display-font text-charcoal mb-1">
                {isRu ? "Руководитель партнерских программ" : "Head of Partnerships"}
              </h4>
              <p className="text-sm text-gray-400 font-medium uppercase tracking-widest">
                Team Member
              </p>
            </div>

          </div>

          <div className="text-center mt-12">
            <span className="inline-block text-sm text-gray-400 italic">
              {isRu ? "Скоро познакомим со всей командой" : "More team members coming soon"}
            </span>
          </div>
        </div>
      </section>

      {/* СЕКЦИЯ 5 — Лицензия и доверие */}
      <section className="py-24 px-6 md:px-8 bg-offwhite text-charcoal">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gold-dark mb-4 inline-block">
              {isRu ? "ДОВЕРИЕ И ЗАКОННОСТЬ" : "LEGAL & COMPLIANCE"}
            </span>
            <h2 className="text-3xl md:text-5xl font-black display-font text-charcoal mb-6">
              {isRu ? "Лицензировано и регулируется" : "Licensed & Regulated"}
            </h2>
            <p className="text-gray-500 leading-relaxed text-base md:text-lg">
              {isRu
                ? "Funduq работает на основании коммерческой лицензии, выданной Департаментом экономики и туризма Дубая."
                : "Funduq operates under a Commercial License issued by the Department of Economy and Tourism, Dubai."}
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-gray-100/80 luxury-shadow p-8 md:p-12 border-l-4 border-l-gold">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-gray-100 pb-8 mb-8">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center text-gold-dark shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-charcoal display-font text-xl">
                    {isRu ? "Официальная регистрация" : "Official Commercial License"}
                  </h3>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mt-0.5">
                    {isRu ? "Департамент Экономики и Туризма Дубая" : "Department of Economy and Tourism, Dubai"}
                  </p>
                </div>
              </div>
              <div className="inline-flex px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold uppercase tracking-wider items-center gap-1.5 w-fit">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {isRu ? "Действительна" : "Active & Valid"}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                  {isRu ? "Компания" : "Company"}
                </span>
                <span className="font-semibold text-charcoal text-base md:text-lg">
                  SEZAVI HOLIDAY HOMES RENTAL L.L.C
                </span>
              </div>

              <div>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                  {isRu ? "Номер лицензии" : "License No."}
                </span>
                <span className="font-mono font-bold text-gold-dark text-base md:text-lg">
                  1216187
                </span>
              </div>

              <div>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                  {isRu ? "Орган выдачи" : "Issued by"}
                </span>
                <span className="font-semibold text-charcoal text-base md:text-lg">
                  {isRu ? "Департамент экономики и туризма Дубая" : "Department of Economy and Tourism, Dubai"}
                </span>
              </div>

              <div>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                  {isRu ? "Вид деятельности" : "Activity"}
                </span>
                <span className="font-semibold text-charcoal text-base md:text-lg">
                  {isRu ? "Аренда домов для отпуска" : "Vacation Homes Rental"}
                </span>
              </div>

              <div className="md:col-span-2 pt-4 border-t border-gray-100 flex gap-2 items-center text-sm text-gray-400">
                <Clock className="w-4 h-4 text-gold-dark shrink-0" />
                <span>
                  {isRu ? "Срок действия: до 27 июля 2026 года" : "Valid until: 27 July 2026"}
                </span>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* СЕКЦИЯ 6 — Контакты */}
      <section className="py-24 px-6 md:px-8 bg-charcoal text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_bottom_left,_var(--color-gold)_0%,_transparent_60%)]" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-gold/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
                {isRu ? "КОНТАКТЫ" : "GET IN TOUCH"}
              </span>
              <h2 className="text-3xl md:text-5xl font-black display-font leading-tight">
                {isRu ? "Связаться с нами" : "We'd Love to Hear From You"}
              </h2>
              <p className="text-gray-400 text-base md:text-lg leading-relaxed">
                {isRu 
                  ? "Есть вопросы или нужна помощь с бронированием? Наша премиум консьерж-служба всегда готова помочь вам спланировать идеальный отдых."
                  : "Have questions or need assistance with your booking? Our premium concierge team is always here to help you plan your perfect getaway."}
              </p>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Email Card */}
              <a 
                href="mailto:hello@funduq.com" 
                className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-gold/40 hover:bg-white/10 transition-all duration-300 flex flex-col items-start gap-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold group-hover:scale-110 transition-transform duration-300">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    {isRu ? "Напишите нам" : "Email Us"}
                  </span>
                  <span className="font-bold text-lg text-white group-hover:text-gold transition-colors">
                    hello@funduq.com
                  </span>
                </div>
              </a>

              {/* Phone Card */}
              <a 
                href="tel:+971585825323" 
                className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-gold/40 hover:bg-white/10 transition-all duration-300 flex flex-col items-start gap-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold group-hover:scale-110 transition-transform duration-300">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    {isRu ? "Позвоните нам" : "Call Us"}
                  </span>
                  <span className="font-bold text-lg text-white group-hover:text-gold transition-colors">
                    +971 58 582 5323
                  </span>
                </div>
              </a>

              {/* Address Card */}
              <div className="p-8 rounded-3xl bg-white/5 border border-white/10 flex flex-col items-start gap-4 md:col-span-2">
                <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    {isRu ? "Адрес" : "Office Address"}
                  </span>
                  <span className="font-bold text-lg text-white">
                    {isRu ? "Дубай, Объединенные Арабские Эмираты" : "Dubai, United Arab Emirates"}
                  </span>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
