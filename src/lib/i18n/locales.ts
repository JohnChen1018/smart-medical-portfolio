export const LOCALES = [
  { id: "zh-Hant", label: "繁體中文", htmlLang: "zh-Hant" },
  { id: "yue", label: "粵語", htmlLang: "yue" },
  { id: "en", label: "English", htmlLang: "en" },
  { id: "zh-Hans", label: "简体中文", htmlLang: "zh-Hans" },
  { id: "ja", label: "日本語", htmlLang: "ja" },
  { id: "ko", label: "한국어", htmlLang: "ko" },
  { id: "es", label: "Español", htmlLang: "es" },
  { id: "fr", label: "Français", htmlLang: "fr" },
  { id: "de", label: "Deutsch", htmlLang: "de" },
  { id: "pt", label: "Português", htmlLang: "pt" },
  { id: "ms", label: "Bahasa Melayu", htmlLang: "ms" },
] as const;

export type LocaleId = (typeof LOCALES)[number]["id"];

export const LOCALE_STORAGE_KEY = "medical-portfolio-locale";

export function isLocale(value: string | null | undefined): value is LocaleId {
  return LOCALES.some((item) => item.id === value);
}

export function htmlLangFor(locale: LocaleId) {
  return LOCALES.find((item) => item.id === locale)?.htmlLang ?? "zh-Hant";
}
