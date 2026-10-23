import { ensurePacks, PackStatus } from '../packs';
import { Translator } from '../services/types';
import { Lang } from '../lang';

function fakeTranslator(ready: Lang[], failing: Lang[] = []) {
  return {
    isReady: jest.fn(async (lang: Lang) => ready.includes(lang)),
    download: jest.fn(async (lang: Lang) => {
      if (failing.includes(lang)) throw new Error('offline');
    }),
    translate: jest.fn(),
  } satisfies Translator;
}

describe('ensurePacks', () => {
  it('downloads only missing languages and ends with all ready', async () => {
    const t = fakeTranslator(['sv', 'en']);
    const result = await ensurePacks(t, () => {});
    expect(t.download.mock.calls.map((c) => c[0]).sort()).toEqual(['es', 'pl']);
    expect(result).toEqual({ sv: 'ready', pl: 'ready', es: 'ready', en: 'ready' });
  });

  it('marks a failed download as failed while the others still become ready', async () => {
    const t = fakeTranslator([], ['es']);
    const result = await ensurePacks(t, () => {});
    expect(result).toEqual({ sv: 'ready', pl: 'ready', es: 'failed', en: 'ready' });
  });

  it('reports downloading before ready', async () => {
    const t = fakeTranslator(['sv', 'pl', 'en']);
    const seen: PackStatus['es'][] = [];
    await ensurePacks(t, (s) => seen.push(s.es));
    expect(seen).toContain('downloading');
    expect(seen[seen.length - 1]).toBe('ready');
    expect(seen.indexOf('downloading')).toBeLessThan(seen.lastIndexOf('ready'));
  });
});
