import { redirect } from "next/navigation";

// Villas page.tsx — next-intl middleware rewrites "/villas" to "/en/villas",
// which maps to app/[locale]/villas/page.tsx. This file exists as a fallback.
// We preserve query parameters (e.g. ?sort=price_asc) through the redirect.
export default async function VillasRedirect({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolved = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(resolved)) {
    if (typeof value === "string") {
      params.set(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
    }
  }
  const qs = params.toString();
  redirect(qs ? `/en/villas?${qs}` : "/en/villas");
}
