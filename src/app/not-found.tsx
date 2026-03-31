import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center px-6">
      <div className="text-center max-w-lg">
        {/* Decorative Number */}
        <div className="relative mb-8">
          <span className="text-[12rem] md:text-[16rem] font-black text-white/[0.03] display-font leading-none select-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 gold-gradient rounded-2xl flex items-center justify-center shadow-luxury rotate-12">
              <span className="text-white font-black text-2xl display-font -rotate-12">
                F
              </span>
            </div>
          </div>
        </div>

        {/* Text */}
        <h1 className="text-3xl md:text-4xl font-black text-white display-font tracking-tight mb-4">
          Страница не найдена
        </h1>
        <p className="text-white/40 font-medium mb-10 leading-relaxed">
          Запрашиваемая страница не существует или была перемещена.
          <br />
          The page you&apos;re looking for doesn&apos;t exist.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="px-8 py-4 rounded-full bg-gold text-white font-black text-sm uppercase tracking-wider hover:bg-gold-dark transition-all duration-300 luxury-shadow"
          >
            На главную / Home
          </Link>
          <Link
            href="/villas"
            className="px-8 py-4 rounded-full border border-white/10 text-white/60 font-bold text-sm uppercase tracking-wider hover:border-gold hover:text-gold transition-all duration-300"
          >
            Коллекция / Explore
          </Link>
        </div>

        {/* Decorative line */}
        <div className="mt-16 flex items-center justify-center gap-3">
          <div className="h-px w-12 bg-gold/20" />
          <span className="text-[10px] font-black text-gold/30 uppercase tracking-[0.3em]">
            FUNDUQ
          </span>
          <div className="h-px w-12 bg-gold/20" />
        </div>
      </div>
    </div>
  );
}
