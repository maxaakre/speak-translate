import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadLangPair, loadSpeeds, loadVoices, saveLangPair, saveSpeeds, saveVoices } from '../settings';

beforeEach(() => AsyncStorage.clear());

describe('language pair settings', () => {
  it('defaults to Polish on top and Swedish at the bottom', async () => {
    expect(await loadLangPair()).toEqual({ top: 'pl', bottom: 'sv' });
  });

  it('returns the pair that was saved', async () => {
    await saveLangPair({ top: 'es', bottom: 'en' });
    expect(await loadLangPair()).toEqual({ top: 'es', bottom: 'en' });
  });

  it('falls back to the default when stored data is not a valid pair', async () => {
    await AsyncStorage.setItem('langPair', JSON.stringify({ top: 'de', bottom: 'sv' }));
    expect(await loadLangPair()).toEqual({ top: 'pl', bottom: 'sv' });
    await AsyncStorage.setItem('langPair', 'not json');
    expect(await loadLangPair()).toEqual({ top: 'pl', bottom: 'sv' });
  });
});

describe('voice settings', () => {
  it('has no chosen voices at first', async () => {
    expect(await loadVoices()).toEqual({});
  });

  it('returns the voices that were saved', async () => {
    await saveVoices({ sv: 'alva', pl: 'zosia' });
    expect(await loadVoices()).toEqual({ sv: 'alva', pl: 'zosia' });
  });

  it('drops unknown languages and ignores corrupt data', async () => {
    await AsyncStorage.setItem('voices', JSON.stringify({ sv: 'alva', de: 'anna', pl: 3 }));
    expect(await loadVoices()).toEqual({ sv: 'alva' });
    await AsyncStorage.setItem('voices', 'not json');
    expect(await loadVoices()).toEqual({});
  });
});

describe('speed settings', () => {
  it('has no chosen speeds at first', async () => {
    expect(await loadSpeeds()).toEqual({});
  });

  it('returns the speeds that were saved', async () => {
    await saveSpeeds({ sv: 'slow', en: 'fast' });
    expect(await loadSpeeds()).toEqual({ sv: 'slow', en: 'fast' });
  });

  it('drops unknown languages and speeds', async () => {
    await AsyncStorage.setItem('speeds', JSON.stringify({ sv: 'slow', de: 'fast', pl: 'turbo' }));
    expect(await loadSpeeds()).toEqual({ sv: 'slow' });
    await AsyncStorage.setItem('speeds', 'not json');
    expect(await loadSpeeds()).toEqual({});
  });
});
