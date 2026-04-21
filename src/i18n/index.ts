import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { en } from './en';
import { es } from './es';
import { hi } from './hi';

type TranslationMap = Record<string, string>;

const locales: Record<string, TranslationMap> = { en, es, hi };

interface I18nState {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const useI18n = create<I18nState>()(
  persist(
    (set, get) => ({
      language: 'en',
      setLanguage: (language) => set({ language }),
      t: (key: string, params?: Record<string, string | number>) => {
        const lang = get().language;
        const translations = locales[lang] ?? locales['en']!;
        let value = translations[key] ?? locales['en']![key] ?? key;
        if (params) {
          for (const [k, v] of Object.entries(params)) {
            value = value.replace(`{{${k}}}`, String(v));
          }
        }
        return value;
      },
    }),
    { name: 'collabos-i18n' }
  )
);

export const AVAILABLE_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'hi', label: 'हिन्दी' },
];
