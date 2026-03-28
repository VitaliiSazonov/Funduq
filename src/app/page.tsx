import { redirect } from "next/navigation";

// Root page.tsx — next-intl middleware rewrites "/" to "/en" (or "/ru" based on cookie),
// which maps to app/[locale]/page.tsx. This file exists as a fallback
// in case the middleware rewrite is somehow bypassed.
export default function RootPage() {
  redirect("/en");
}
