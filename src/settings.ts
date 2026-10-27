import AsyncStorage from '@react-native-async-storage/async-storage';
import { LANGS, Lang } from './lang';

export interface LangPair {
  top: Lang;
  bottom: Lang;
}

const KEY = 'langPair';
const DEFAULT: LangPair = { top: 'pl', bottom: 'sv' };

const isLang = (v: unknown): v is Lang => LANGS.includes(v as Lang);

export async function loadLangPair(): Promise<LangPair> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const pair = raw ? JSON.parse(raw) : null;
    if (pair && isLang(pair.top) && isLang(pair.bottom)) return { top: pair.top, bottom: pair.bottom };
  } catch {
    // Corrupt value: fall through to the default.
  }
  return DEFAULT;
}

export async function saveLangPair(pair: LangPair): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(pair));
}

// The chosen voice id per language; a missing language uses the system voice.
export type VoiceChoice = Partial<Record<Lang, string>>;

const VOICES_KEY = 'voices';

export async function loadVoices(): Promise<VoiceChoice> {
  try {
    const raw = await AsyncStorage.getItem(VOICES_KEY);
    const stored = raw ? JSON.parse(raw) : {};
    const choice: VoiceChoice = {};
    for (const lang of LANGS) {
      if (typeof stored?.[lang] === 'string') choice[lang] = stored[lang];
    }
    return choice;
  } catch {
    return {};
  }
}

export async function saveVoices(choice: VoiceChoice): Promise<void> {
  await AsyncStorage.setItem(VOICES_KEY, JSON.stringify(choice));
}
