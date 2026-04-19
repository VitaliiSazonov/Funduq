import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://funduq.vercel.app';

  // Fetch all properties to generate dynamic routes
  const { data: properties } = await supabase
    .from('properties')
    .select('id, updated_at')
    .eq('status', 'active');

  // Next-intl prefix default is en
  const propertyEntries: MetadataRoute.Sitemap = (properties || []).map((prop) => ({
    url: `${baseUrl}/en/villas/${prop.id}`,
    lastModified: prop.updated_at ? new Date(prop.updated_at) : new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/en`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/en/villas`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/en/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/en/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  return [...staticPages, ...propertyEntries];
}
