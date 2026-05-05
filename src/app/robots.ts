import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/login', '/dashboard', '/admin', '/_next/'],
    },
    sitemap: 'https://funduq.ae/sitemap.xml',
  };
}
