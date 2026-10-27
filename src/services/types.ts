import { Lang } from '../lang';

export type SttErrorCode = 'no-speech' | 'permission' | 'unavailable';

export class SttError extends Error {
  constructor(public code: SttErrorCode, msg?: string) {
    super(msg ?? code);
    this.name = 'SttError';
  }
}

export interface SpeechToText {
  listen(locale: string): Promise<string>;
  /** Stops listening and throws away what was heard. */
  stop(): void;
  /** Stops listening and keeps what was heard. */
  finish(): void;
}

export interface Translator {
  isReady(lang: Lang): Promise<boolean>;
  download(lang: Lang): Promise<void>;
  translate(text: string, from: Lang, to: Lang): Promise<string>;
}

export interface VoiceOption {
  id: string;
  name: string;
  locale: string;
  enhanced: boolean;
}

export interface TextToSpeech {
  /** Without a voice the system picks one for the locale. */
  speak(text: string, locale: string, voice?: string): Promise<void>;
  stop(): void;
  voices(): Promise<VoiceOption[]>;
}

export interface Services {
  stt: SpeechToText;
  translator: Translator;
  tts: TextToSpeech;
}
