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

export type Speed = 'slow' | 'normal' | 'fast';

export const SPEEDS: Speed[] = ['slow', 'normal', 'fast'];

export const RATE: Record<Speed, number> = { slow: 0.7, normal: 1, fast: 1.25 };

interface UiText {
  idle: string;
  listening: string;
  replay: string;
  voice: string;
  systemVoice: string;
  enhanced: string;
  speed: Record<Speed, string>;
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
    speed: { slow: 'Långsam', normal: 'Normal', fast: 'Snabb' },
    sample: 'Hej, så här låter jag.',
  },
  pl: {
    idle: 'Naciśnij i mów',
    listening: 'Słucham – naciśnij, gdy skończysz',
    replay: 'Odtwórz',
    voice: 'Głos',
    systemVoice: 'Domyślny',
    enhanced: 'Ulepszony',
    speed: { slow: 'Wolno', normal: 'Normalnie', fast: 'Szybko' },
    sample: 'Cześć, tak brzmię.',
  },
  es: {
    idle: 'Toca y habla',
    listening: 'Escuchando – toca al terminar',
    replay: 'Reproducir',
    voice: 'Voz',
    systemVoice: 'Predeterminada',
    enhanced: 'Mejorada',
    speed: { slow: 'Lento', normal: 'Normal', fast: 'Rápido' },
    sample: 'Hola, así sueno.',
  },
  en: {
    idle: 'Tap and speak',
    listening: 'Listening – tap when you’re done',
    replay: 'Play',
    voice: 'Voice',
    systemVoice: 'Default',
    enhanced: 'Enhanced',
    speed: { slow: 'Slow', normal: 'Normal', fast: 'Fast' },
    sample: 'Hi, this is how I sound.',
  },
};
