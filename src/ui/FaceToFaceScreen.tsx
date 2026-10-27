import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Side, initialState, reducer } from '../conversation';
import { LOCALE, Lang, RATE, Speed, UI_TEXT } from '../lang';
import { PackStatus, ensurePacks } from '../packs';
import { Services, SpeakOptions, VoiceOption } from '../services/types';
import {
  SpeedChoice,
  VoiceChoice,
  loadLangPair,
  loadSpeeds,
  loadVoices,
  saveLangPair,
  saveSpeeds,
  saveVoices,
} from '../settings';
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
  const [speeds, setSpeeds] = useState<SpeedChoice>({});
  const stateRef = useRef(state);
  stateRef.current = state;

  const speechFor = (lang: Lang): SpeakOptions => ({ voice: chosen[lang], rate: RATE[speeds[lang] ?? 'normal'] });
  // The runner outlives renders, so it reads the latest choices through a ref.
  const speechForRef = useRef(speechFor);
  speechForRef.current = speechFor;

  const runner = useMemo(
    () => createTurnRunner(services, dispatch, () => stateRef.current, (lang) => speechForRef.current(lang)),
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
    loadSpeeds().then(setSpeeds);
    services.tts.voices().then(setVoices).catch(() => {});
  }, [services]);

  const playSample = (lang: Lang, options: SpeakOptions) => {
    services.tts.stop();
    services.tts.speak(UI_TEXT[lang].sample, LOCALE[lang], options).catch(() => {});
  };

  const chooseVoice = (lang: Lang, voice: string | undefined) => {
    const next = { ...chosen, [lang]: voice };
    if (!voice) delete next[lang];
    setChosen(next);
    saveVoices(next);
    playSample(lang, { ...speechFor(lang), voice });
  };

  const chooseSpeed = (lang: Lang, speed: Speed) => {
    const next = { ...speeds, [lang]: speed };
    setSpeeds(next);
    saveSpeeds(next);
    playSample(lang, { ...speechFor(lang), rate: RATE[speed] });
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
    if (half.text && half.kind !== 'message') services.tts.speak(half.text, LOCALE[half.lang], speechFor(half.lang)).catch(() => {});
  };

  const panel = (side: Side) => (
    <HalfPanel
      side={side}
      half={state[side]}
      listening={state.active === side && state.phase === 'listening'}
      dimmed={state.phase === 'listening' && state.active !== side}
      voices={voices.filter((v) => v.locale === LOCALE[state[side].lang])}
      voice={chosen[state[side].lang]}
      speed={speeds[state[side].lang] ?? 'normal'}
      onVoice={(voice) => chooseVoice(state[side].lang, voice)}
      onSpeed={(speed) => chooseSpeed(state[side].lang, speed)}
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
