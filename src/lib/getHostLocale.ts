import { cookies } from 'next/headers';

export type SupportedLocale = 'en' | 'ru';

/**
 * Read the user's preferred locale from the NEXT_LOCALE cookie.
 * Falls back to 'en' when cookie is absent or invalid.
 * Used in host pages that live outside the [locale] segment.
 */
export async function getHostLocale(): Promise<SupportedLocale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value;
  if (locale === 'en' || locale === 'ru') return locale;
  return 'en';
}

/**
 * Load the full message bundle for the given locale.
 */
export async function getHostMessages(locale: SupportedLocale) {
  return (await import(`../../messages/${locale}.json`)).default;
}
