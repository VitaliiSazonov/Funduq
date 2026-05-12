export function slugify(text: string): string {
  const cyrillicToLatin: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
    з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
    п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
    ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
    А: "a", Б: "b", В: "v", Г: "g", Д: "d", Е: "e", Ё: "yo", Ж: "zh",
    З: "z", И: "i", Й: "y", К: "k", Л: "l", М: "m", Н: "n", О: "o",
    П: "p", Р: "r", С: "s", Т: "t", У: "u", Ф: "f", Х: "kh", Ц: "ts",
    Ч: "ch", Ш: "sh", Щ: "shch", Ъ: "", Ы: "y", Ь: "", Э: "e", Ю: "yu", Я: "ya"
  };

  const transliterated = text.split('').map(char => cyrillicToLatin[char] || char).join('');

  return transliterated
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function buildVillaUrl(id: string | number, title: string): string {
  return `/villas/${slugify(title)}-${id}`;
}

export function extractIdFromSlug(slug: string): string {
  const parts = slug.split("-");
  // UUID v4 always has 5 parts joined by hyphens.
  // e.g. 103fbc80-b1b4-4589-9657-fa7ef2d068dc
  return parts.slice(-5).join("-");
}
