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

interface UiText {
  idle: string;
  listening: string;
  replay: string;
  voice: string;
  systemVoice: string;
  enhanced: string;
  // Spoken when a voice is picked, so it can be heard before a conversation.
  sample: string;
}

// Each half's controls are written in that half's own language, so each person can read them.
export const UI_TEXT: Record<Lang, UiText> = {
  sv: {
    idle: 'Tryck och prata',
    listening: 'Lyssnar – tryck när du är klar',
    replay: 'Spela upp',
    voice: 'Röst',
    systemVoice: 'Standard',
    enhanced: 'Förbättrad',
    sample: 'Hej, så här låter jag.',
  },
  pl: {
    idle: 'Naciśnij i mów',
    listening: 'Słucham – naciśnij, gdy skończysz',
    replay: 'Odtwórz',
    voice: 'Głos',
    systemVoice: 'Domyślny',
    enhanced: 'Ulepszony',
    sample: 'Cześć, tak brzmię.',
  },
  es: {
    idle: 'Toca y habla',
    listening: 'Escuchando – toca al terminar',
    replay: 'Reproducir',
    voice: 'Voz',
    systemVoice: 'Predeterminada',
    enhanced: 'Mejorada',
    sample: 'Hola, así sueno.',
  },
  en: {
    idle: 'Tap and speak',
    listening: 'Listening – tap when you’re done',
    replay: 'Play',
    voice: 'Voice',
    systemVoice: 'Default',
    enhanced: 'Enhanced',
    sample: 'Hi, this is how I sound.',
  },
};
