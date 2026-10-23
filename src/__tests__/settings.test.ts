import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadLangPair, saveLangPair } from '../settings';

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
