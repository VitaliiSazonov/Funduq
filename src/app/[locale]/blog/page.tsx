import { blogPosts } from '@/data/blog-posts';
import { Link } from '@/i18n/navigation';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dubai Travel Guides & Holiday Home Tips | Funduq Blog',
  description: 'Expert guides, travel tips, and neighborhood insights for holiday homes in Dubai and the UAE.',
};

export default function BlogIndexPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const isRu = locale === 'ru';
  
  // Categorize logic could be implemented here; for now, we just list them out.
  const categories = ['All', 'Guides', 'Travel', 'Destinations'];

  return (
    <main className="min-h-screen bg-sand-light pt-24 pb-20">
      {/* Page Header */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pt-12 pb-16">
        <h1 className="text-4xl md:text-6xl font-black text-charcoal display-font tracking-tight mb-6">
          {isRu ? 'Блог и Путеводители' : 'Blog & Guides'}
        </h1>
        <p className="text-lg text-charcoal/60 max-w-2xl font-medium">
          {isRu
            ? 'Экспертные советы, путеводители по районам и инсайты рынка краткосрочной аренды в Дубае.'
            : 'Expert tips, neighborhood guides, and insights into the short-term rental market in Dubai.'}
        </p>
        
        {/* Categories (Static UI for aesthetics as per request) */}
        <div className="flex flex-wrap gap-3 mt-10">
          {categories.map((cat, i) => (
            <button
              key={cat}
              className={`px-5 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                i === 0
                  ? 'bg-gold text-white shadow-lg'
                  : 'bg-white text-charcoal/60 hover:bg-gold/10 hover:text-gold'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Blog Grid */}
      <section className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="bg-white rounded-3xl p-6 md:p-8 flex flex-col hover:-translate-y-2 transition-transform duration-300 luxury-shadow group"
            >
              <div className="flex items-center gap-4 text-xs font-bold text-gold uppercase tracking-wider mb-4">
                <span className="bg-gold/10 px-3 py-1 rounded-full">{post.category}</span>
                <div className="flex items-center gap-1.5 opacity-60">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{post.readTime} min read</span>
                </div>
              </div>
              
              <h2 className="text-xl md:text-2xl font-black text-charcoal display-font leading-tight mb-4 group-hover:text-gold transition-colors">
                {isRu ? post.titleRu : post.titleEn}
              </h2>
              
              <p className="text-charcoal/60 font-medium line-clamp-3 mb-6 flex-grow">
                {isRu ? post.descriptionRu : post.descriptionEn}
              </p>
              
              <div className="flex items-center justify-between mt-auto pt-6 border-t border-charcoal/5">
                <div className="flex items-center gap-2 text-sm text-charcoal/40 font-bold">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(post.publishedAt).toLocaleDateString(isRu ? 'ru-RU' : 'en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-sand flex items-center justify-center text-charcoal group-hover:bg-gold group-hover:text-white transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
