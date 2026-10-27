import AsyncStorage from '@react-native-async-storage/async-storage';
import { LANGS, Lang, SPEEDS, Speed } from './lang';

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

type PerLang<T> = Partial<Record<Lang, T>>;

// Keeps only known languages with valid values, so stale or corrupt data is dropped.
async function loadPerLang<T>(key: string, isValid: (v: unknown) => v is T): Promise<PerLang<T>> {
  try {
    const raw = await AsyncStorage.getItem(key);
    const stored = raw ? JSON.parse(raw) : {};
    const choice: PerLang<T> = {};
    for (const lang of LANGS) {
      if (isValid(stored?.[lang])) choice[lang] = stored[lang];
    }
    return choice;
  } catch {
    return {};
  }
}

// The chosen voice id per language; a missing language uses the system voice.
export type VoiceChoice = PerLang<string>;

export const loadVoices = () => loadPerLang('voices', (v): v is string => typeof v === 'string');

export async function saveVoices(choice: VoiceChoice): Promise<void> {
  await AsyncStorage.setItem('voices', JSON.stringify(choice));
}

// The chosen speed per language; a missing language speaks at normal speed.
export type SpeedChoice = PerLang<Speed>;

export const loadSpeeds = () => loadPerLang('speeds', (v): v is Speed => SPEEDS.includes(v as Speed));

export async function saveSpeeds(choice: SpeedChoice): Promise<void> {
  await AsyncStorage.setItem('speeds', JSON.stringify(choice));
}
