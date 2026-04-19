import { blogPosts } from '@/data/blog-posts';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Calendar, Clock, ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import Script from 'next/script';

export async function generateStaticParams() {
  const locales = ['en', 'ru'];
  const params: { locale: string; slug: string }[] = [];
  
  for (const locale of locales) {
    for (const post of blogPosts) {
      params.push({ locale, slug: post.slug });
    }
  }
  
  return params;
}

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return {};

  const isRu = locale === 'ru';
  const title = isRu ? post.titleRu : post.titleEn;
  const description = isRu ? post.descriptionRu : post.descriptionEn;

  return {
    title: `${title} | Funduq Guides`,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: ['Funduq Editorial Team'],
    },
  };
}

export default function BlogPostPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) notFound();

  const isRu = locale === 'ru';
  
  // Get a couple of related posts for the sidebar
  const relatedPosts = blogPosts.filter((p) => p.slug !== slug).slice(0, 3);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: isRu ? post.titleRu : post.titleEn,
    description: isRu ? post.descriptionRu : post.descriptionEn,
    image: 'https://funduq.ae/images/og-default.jpg', // Default OG image
    author: {
      '@type': 'Organization',
      name: 'Funduq Editorial Team',
      url: 'https://funduq.ae'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Funduq',
      logo: {
        '@type': 'ImageObject',
        url: 'https://funduq.ae/logo.png'
      }
    },
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
  };

  return (
    <>
      <Script
        id="article-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-sand-light pt-32 pb-20">
        <article className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col lg:flex-row gap-12 lg:gap-16">
          
          {/* Main Content */}
          <div className="flex-1 lg:max-w-3xl">
            {/* Meta Info */}
            <div className="flex items-center gap-4 text-xs font-bold text-gold uppercase tracking-wider mb-6">
              <span className="bg-gold/10 px-3 py-1 rounded-full">{post.category}</span>
              <div className="flex items-center gap-1.5 opacity-60 text-charcoal">
                <Clock className="w-3.5 h-3.5" />
                <span>{post.readTime} min read</span>
              </div>
              <div className="flex items-center gap-1.5 opacity-60 text-charcoal">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(post.publishedAt).toLocaleDateString(isRu ? 'ru-RU' : 'en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}</span>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-charcoal display-font leading-tight mb-8">
              {isRu ? post.titleRu : post.titleEn}
            </h1>

            {/* Content Body */}
            <div 
              className="prose prose-lg prose-charcoal max-w-none 
                         prose-headings:font-black prose-headings:display-font 
                         prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 
                         prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
                         prose-p:text-charcoal/80 prose-p:leading-relaxed prose-p:mb-6
                         prose-ul:list-disc prose-ul:ml-6 prose-li:text-charcoal/80"
              dangerouslySetInnerHTML={{ __html: isRu ? (post.contentRu || post.contentEn) : post.contentEn }}
            />
          </div>

          {/* Sidebar */}
          <aside className="lg:w-80 shrink-0 space-y-8">
            {/* CTA Widget */}
            <div className="bg-charcoal text-white rounded-3xl p-8 sticky top-32 luxury-shadow">
              <h3 className="text-2xl font-black display-font mb-4">
                {isRu ? 'Найти идеальный дом?' : 'Find Your Perfect Holiday Home?'}
              </h3>
              <p className="text-white/70 mb-8 font-medium">
                {isRu 
                  ? 'Откройте для себя эксклюзивные апартаменты и виллы по всему Дубаю.' 
                  : 'Discover exclusive apartments and luxury villas across Dubai and the UAE.'}
              </p>
              <Link
                href="/villas"
                className="flex items-center justify-center gap-2 w-full px-6 py-4 rounded-xl bg-gold text-white font-black uppercase tracking-wider hover:bg-gold-dark transition-all duration-300"
              >
                {isRu ? 'Смотреть жилье' : 'Browse Properties'}
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Related Articles Widget */}
            <div className="bg-white rounded-3xl p-8 border border-charcoal/5">
              <h3 className="text-xl font-black text-charcoal display-font mb-6">
                {isRu ? 'Похожие статьи' : 'Related Reads'}
              </h3>
              <div className="space-y-6">
                {relatedPosts.map((relatedPost) => (
                  <Link 
                    key={relatedPost.slug} 
                    href={`/blog/${relatedPost.slug}`}
                    className="block group"
                  >
                    <div className="text-xs font-bold text-gold uppercase tracking-wider mb-2">
                       {relatedPost.category}
                    </div>
                    <h4 className="text-charcoal font-black leading-tight group-hover:text-gold transition-colors">
                      {isRu ? relatedPost.titleRu : relatedPost.titleEn}
                    </h4>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
          
        </article>
      </main>
    </>
  );
}
