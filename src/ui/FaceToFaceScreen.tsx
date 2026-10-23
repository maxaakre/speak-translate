import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Side, initialState, reducer } from '../conversation';
import { LANGS, LOCALE } from '../lang';
import { PackStatus, ensurePacks } from '../packs';
import { Services } from '../services/types';
import { loadLangPair, saveLangPair } from '../settings';
import { createTurnRunner } from '../turn';
import { HalfPanel } from './HalfPanel';
import { MiddleBar } from './MiddleBar';
import { PackBanner } from './PackBanner';

export function FaceToFaceScreen({ services }: { services: Services }) {
  const [state, dispatch] = useReducer(reducer, initialState('pl', 'sv'));
  const [loaded, setLoaded] = useState(false);
  const [packs, setPacks] = useState<PackStatus | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const runner = useMemo(() => createTurnRunner(services, dispatch, () => stateRef.current), [services]);
  useEffect(() => () => runner.cancel(), [runner]);

  useEffect(() => {
    loadLangPair().then((pair) => {
      dispatch({ type: 'setLang', side: 'top', lang: pair.top });
      dispatch({ type: 'setLang', side: 'bottom', lang: pair.bottom });
      setLoaded(true);
    });
  }, []);

  // Save only after loading, so the defaults never overwrite the remembered pair.
  useEffect(() => {
    if (loaded) saveLangPair({ top: state.top.lang, bottom: state.bottom.lang });
  }, [loaded, state.top.lang, state.bottom.lang]);

  const downloadPacks = useCallback(() => {
    ensurePacks(services.translator, setPacks);
  }, [services]);
  useEffect(downloadPacks, [downloadPacks]);

  const nextLang = (side: Side) => {
    const current = state[side].lang;
    dispatch({ type: 'setLang', side, lang: LANGS[(LANGS.indexOf(current) + 1) % LANGS.length] });
  };

  const replay = (side: Side) => {
    const half = state[side];
    if (half.text && half.kind !== 'message') services.tts.speak(half.text, LOCALE[half.lang]).catch(() => {});
  };

  const panel = (side: Side, color: string) => (
    <HalfPanel
      side={side}
      half={state[side]}
      color={color}
      listening={state.active === side && state.phase === 'listening'}
      onMic={() => runner.startTurn(side)}
      onLang={() => nextLang(side)}
      onReplay={() => replay(side)}
    />
  );

  return (
    <View style={styles.screen}>
      {panel('top', '#dc2626')}
      <PackBanner status={packs} onRetry={downloadPacks} />
      <MiddleBar onSwap={() => dispatch({ type: 'swap' })} onClear={() => dispatch({ type: 'clear' })} />
      {panel('bottom', '#2563eb')}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff', paddingTop: 54, paddingBottom: 34 },
});
