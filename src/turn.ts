import { Action, ConversationState, Side, other } from './conversation';
import { LABEL, LOCALE } from './lang';
import { Services, SttError, SttErrorCode } from './services/types';

const STT_MESSAGE: Record<SttErrorCode, string> = {
  'no-speech': "Didn't catch that",
  permission: 'Allow microphone in Settings',
  unavailable: 'Speech not available offline',
};

export function createTurnRunner(
  services: Services,
  dispatch: (a: Action) => void,
  getState: () => ConversationState,
) {
  const { stt, translator, tts } = services;
  // Bumped on every cancel, so an older turn notices it is stale after each await.
  let token = 0;

  function cancel() {
    token += 1;
    stt.stop();
    tts.stop();
  }

  async function startTurn(side: Side): Promise<void> {
    cancel();
    const mine = token;
    const turnId = getState().turnId + 1;
    dispatch({ type: 'start', side });

    const state = getState();
    const from = state[side].lang;
    const to = state[other(side)].lang;
    const stale = () => mine !== token;
    const message = (text: string) => dispatch({ type: 'message', turnId, text });

    let heard: string;
    try {
      heard = (await stt.listen(LOCALE[from])).trim();
    } catch (e) {
      if (stale()) return;
      return message(STT_MESSAGE[e instanceof SttError ? e.code : 'unavailable']);
    }
    if (stale()) return;
    if (!heard) return message(STT_MESSAGE['no-speech']);
    dispatch({ type: 'heard', turnId, text: heard });

    let translated = heard;
    if (from !== to) {
      for (const lang of [from, to]) {
        const ready = await translator.isReady(lang);
        if (stale()) return;
        if (!ready) return message(`${LABEL[lang]} not downloaded`);
      }
      try {
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
      await tts.speak(translated, LOCALE[to]);
    } catch {
      // The text is on screen; a failed voice is not worth an error message.
    }
    if (stale()) return;
    dispatch({ type: 'done', turnId });
  }

  return { startTurn, cancel };
}
