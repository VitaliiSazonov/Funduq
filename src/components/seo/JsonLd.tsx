/**
 * JsonLd Component
 * Renders structured data in JSON-LD format for SEO purposes.
 * This is a Server Component.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
