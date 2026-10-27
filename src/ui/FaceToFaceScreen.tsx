import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Side, initialState, reducer } from '../conversation';
import { LOCALE, Lang, UI_TEXT } from '../lang';
import { PackStatus, ensurePacks } from '../packs';
import { Services, VoiceOption } from '../services/types';
import { VoiceChoice, loadLangPair, loadVoices, saveLangPair, saveVoices } from '../settings';
import { createTurnRunner } from '../turn';
import { HalfPanel } from './HalfPanel';
import { MiddleBar } from './MiddleBar';
import { PackBanner } from './PackBanner';

export function FaceToFaceScreen({ services }: { services: Services }) {
  const [state, dispatch] = useReducer(reducer, initialState('pl', 'sv'));
  const [loaded, setLoaded] = useState(false);
  const [packs, setPacks] = useState<PackStatus | null>(null);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [chosen, setChosen] = useState<VoiceChoice>({});
  const stateRef = useRef(state);
  stateRef.current = state;
  const chosenRef = useRef(chosen);
  chosenRef.current = chosen;

  const runner = useMemo(
    () => createTurnRunner(services, dispatch, () => stateRef.current, (lang) => chosenRef.current[lang]),
    [services],
  );
  useEffect(() => () => runner.cancel(), [runner]);

  useEffect(() => {
    loadLangPair().then((pair) => {
      dispatch({ type: 'setLang', side: 'top', lang: pair.top });
      dispatch({ type: 'setLang', side: 'bottom', lang: pair.bottom });
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    loadVoices().then(setChosen);
    services.tts.voices().then(setVoices).catch(() => {});
  }, [services]);

  const chooseVoice = (lang: Lang, voice: string | undefined) => {
    const next = { ...chosen, [lang]: voice };
    if (!voice) delete next[lang];
    setChosen(next);
    saveVoices(next);
    services.tts.stop();
    services.tts.speak(UI_TEXT[lang].sample, LOCALE[lang], voice).catch(() => {});
  };

  // Save only after loading, so the defaults never overwrite the remembered pair.
  useEffect(() => {
    if (loaded) saveLangPair({ top: state.top.lang, bottom: state.bottom.lang });
  }, [loaded, state.top.lang, state.bottom.lang]);

  const downloadPacks = useCallback(() => {
    ensurePacks(services.translator, setPacks);
  }, [services]);
  useEffect(downloadPacks, [downloadPacks]);

  const replay = (side: Side) => {
    const half = state[side];
    if (half.text && half.kind !== 'message') services.tts.speak(half.text, LOCALE[half.lang], chosen[half.lang]).catch(() => {});
  };

  const panel = (side: Side) => (
    <HalfPanel
      side={side}
      half={state[side]}
      listening={state.active === side && state.phase === 'listening'}
      dimmed={state.phase === 'listening' && state.active !== side}
      voices={voices.filter((v) => v.locale === LOCALE[state[side].lang])}
      voice={chosen[state[side].lang]}
      onVoice={(voice) => chooseVoice(state[side].lang, voice)}
      onMic={() => runner.startTurn(side)}
      onLang={(lang) => dispatch({ type: 'setLang', side, lang })}
      onReplay={() => replay(side)}
    />
  );

  return (
    <View style={styles.screen}>
      {panel('top')}
      <PackBanner status={packs} onRetry={downloadPacks} />
      <MiddleBar onSwap={() => dispatch({ type: 'swap' })} onClear={() => dispatch({ type: 'clear' })} />
      {panel('bottom')}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff', paddingTop: 54, paddingBottom: 34 },
});
