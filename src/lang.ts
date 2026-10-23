export type Lang = 'sv' | 'pl' | 'es' | 'en';

export const LANGS: Lang[] = ['sv', 'pl', 'es', 'en'];

export const LOCALE: Record<Lang, string> = {
  sv: 'sv-SE',
  pl: 'pl-PL',
  es: 'es-ES',
  en: 'en-US',
};

export const LABEL: Record<Lang, string> = {
  sv: 'Svenska',
  pl: 'Polski',
  es: 'Español',
  en: 'English',
};
