import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { blogPosts } from '@/data/blog-posts';
import { dubaiAreas } from '@/data/dubai-areas';
import { buildVillaUrl } from "@/lib/utils/slugify";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://funduq.ae';

  // 1. Fetch active properties from Supabase for dynamic villas
  const { data: properties } = await supabase
    .from('properties')
    .select('id, title, updated_at')
    .eq('status', 'active');

  // Dynamic villa entries: /villas/{slug}-{id}
  const propertyEntries: MetadataRoute.Sitemap = (properties || []).map((prop) => ({
    url: `${baseUrl}${buildVillaUrl(prop.id, prop.title)}`,
    lastModified: prop.updated_at ? new Date(prop.updated_at) : new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  // 2. Static pages: /, /villas, /blog, /about
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/villas`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // 3. Dynamic areas: /areas/{slug}
  const areaEntries: MetadataRoute.Sitemap = dubaiAreas.map((area) => ({
    url: `${baseUrl}/areas/${area.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  // 4. Dynamic blog posts: /blog/{slug}
  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.publishedAt ? new Date(post.publishedAt) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticPages, ...propertyEntries, ...areaEntries, ...blogEntries];
}

