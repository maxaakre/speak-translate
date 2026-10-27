import { Action, ConversationState, Side, other } from './conversation';
import { LABEL, LOCALE, Lang } from './lang';
import { Services, SpeakOptions, SttError, SttErrorCode } from './services/types';

const STT_MESSAGE: Record<SttErrorCode, string> = {
  'no-speech': "Didn't catch that",
  permission: 'Allow microphone in Settings',
  unavailable: 'Speech not available offline',
};

export function createTurnRunner(
  services: Services,
  dispatch: (a: Action) => void,
  getState: () => ConversationState,
  speechFor: (lang: Lang) => SpeakOptions = () => ({}),
) {
  const { stt, translator, tts } = services;
  // Bumped on every cancel, so an older turn notices it is stale after each await.
  // Owned here rather than read from state: React state lags behind quick taps.
  let token = 0;
  // The side whose mic is open, so tapping it again finishes instead of restarting.
  let listeningSide: Side | null = null;

  function cancel() {
    token += 1;
    listeningSide = null;
    stt.stop();
    tts.stop();
  }

  async function startTurn(side: Side): Promise<void> {
    if (listeningSide === side) return stt.finish();
    cancel();
    const turnId = token;
    const state = getState();
    dispatch({ type: 'start', side, turnId });

    const from = state[side].lang;
    const to = state[other(side)].lang;
    const stale = () => turnId !== token;
    const message = (text: string) => dispatch({ type: 'message', turnId, text });

    let heard: string;
    listeningSide = side;
    try {
      heard = (await stt.listen(LOCALE[from])).trim();
    } catch (e) {
      if (stale()) return;
      listeningSide = null;
      return message(STT_MESSAGE[e instanceof SttError ? e.code : 'unavailable']);
    }
    if (stale()) return;
    listeningSide = null;
    if (!heard) return message(STT_MESSAGE['no-speech']);
    dispatch({ type: 'heard', turnId, text: heard });

    let translated = heard;
    if (from !== to) {
      try {
        for (const lang of [from, to]) {
          const ready = await translator.isReady(lang);
          if (stale()) return;
          if (!ready) return message(`${LABEL[lang]} not downloaded`);
        }
        translated = await translator.translate(heard, from, to);
      } catch {
        if (stale()) return;
        return message('Translation failed');
      }
      if (stale()) return;
    }
    dispatch({ type: 'translated', turnId, text: translated });

    dispatch({ type: 'speaking', turnId });
    try {
      await tts.speak(translated, LOCALE[to], speechFor(to));
    } catch {
      // The text is on screen; a failed voice is not worth an error message.
    }
    if (stale()) return;
    dispatch({ type: 'done', turnId });
  }

  return { startTurn, cancel };
}
