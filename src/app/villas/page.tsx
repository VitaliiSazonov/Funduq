import { redirect } from "next/navigation";

// Villas page.tsx — next-intl middleware rewrites "/villas" to "/en/villas",
// which maps to app/[locale]/villas/page.tsx. This file exists as a fallback.
export default function VillasRedirect() {
  redirect("/en/villas");
}
