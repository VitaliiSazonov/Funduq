import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
      {
        userAgent: ['GPTBot', 'PerplexityBot', 'ClaudeBot', 'anthropic-ai', 'Bingbot'],
        allow: '/',
      },
    ],
    sitemap: 'https://funduq.ae/sitemap.xml',
  };
}
