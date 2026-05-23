import type { ImageLoaderProps } from "next/image";

/**
 * Custom Next.js Image Loader for Supabase Image Transformation.
 *
 * Converts URLs of the form:
 *   https://xxx.supabase.co/storage/v1/object/public/{bucket}/{path}
 * into:
 *   https://xxx.supabase.co/storage/v1/render/image/public/{bucket}/{path}?width=W&quality=Q
 *
 * Non-Supabase URLs (external CDNs, /_next/static, blob:, data:) are
 * returned unchanged so legacy muscache.com or unsplash links still work.
 */
export default function supabaseLoader({
  src,
  width,
  quality,
}: ImageLoaderProps): string {
  // Pass through non-Supabase URLs unchanged
  if (!src.includes("supabase.co/storage/v1/object/public/")) {
    return src;
  }

  // Swap /object/ → /render/image/ to activate Supabase Image Transformation
  const transformed = src.replace(
    "/storage/v1/object/public/",
    "/storage/v1/render/image/public/"
  );

  const params = new URLSearchParams({
    width: String(width),
    quality: String(quality ?? 75),
  });

  return `${transformed}?${params.toString()}`;
}
