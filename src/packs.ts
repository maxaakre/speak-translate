import { LANGS, Lang } from './lang';
import { Translator } from './services/types';

export type PackStatus = Record<Lang, 'checking' | 'downloading' | 'ready' | 'failed'>;

export async function ensurePacks(t: Translator, onChange: (s: PackStatus) => void): Promise<PackStatus> {
  let status = Object.fromEntries(LANGS.map((l) => [l, 'checking'])) as PackStatus;
  const set = (lang: Lang, value: PackStatus[Lang]) => {
    status = { ...status, [lang]: value };
    onChange(status);
  };
  onChange(status);

  // One at a time: parallel ML Kit downloads of the shared English model can race.
  for (const lang of LANGS) {
    try {
      if (await t.isReady(lang)) {
        set(lang, 'ready');
        continue;
      }
      set(lang, 'downloading');
      await t.download(lang);
      set(lang, 'ready');
    } catch {
      set(lang, 'failed');
    }
  }
  return status;
}
