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

// Shown under each mic in that half's own language, so each person can read it.
export const MIC_HINT: Record<Lang, { idle: string; listening: string; replay: string }> = {
  sv: { idle: 'Tryck och prata', listening: 'Lyssnar – tryck när du är klar', replay: 'Spela upp' },
  pl: { idle: 'Naciśnij i mów', listening: 'Słucham – naciśnij, gdy skończysz', replay: 'Odtwórz' },
  es: { idle: 'Toca y habla', listening: 'Escuchando – toca al terminar', replay: 'Reproducir' },
  en: { idle: 'Tap and speak', listening: 'Listening – tap when you’re done', replay: 'Play' },
};
