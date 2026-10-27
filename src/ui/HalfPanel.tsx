import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Half, Side } from '../conversation';
import { LABEL, MIC_HINT } from '../lang';
import { MicButton } from './MicButton';
import { INK, MUTED, SIDE_THEME, WARN } from './theme';

interface Props {
  side: Side;
  half: Half;
  listening: boolean;
  // Another half is taking its turn, so this one steps back.
  dimmed: boolean;
  onMic: () => void;
  onLang: () => void;
  onReplay: () => void;
}

export function HalfPanel({ side, half, listening, dimmed, onMic, onLang, onReplay }: Props) {
  const { accent, surface } = SIDE_THEME[side];
  const hint = MIC_HINT[half.lang];
  const canReplay = !!half.text && half.kind !== 'message';

  return (
    // The top half is turned around for the person across the table.
    <View style={[styles.half, { backgroundColor: surface }, side === 'top' && styles.flipped, dimmed && styles.dimmed]}>
      <View style={styles.header}>
        <Pressable
          testID={`lang-${side}`}
          onPress={onLang}
          style={({ pressed }) => [styles.lang, { borderColor: accent }, pressed && styles.chipPressed]}
          accessibilityLabel="Change language"
        >
          <Text style={[styles.langText, { color: accent }]}>{LABEL[half.lang]} ▾</Text>
        </Pressable>
        {canReplay && (
          <Pressable
            testID={`replay-${side}`}
            onPress={onReplay}
            style={({ pressed }) => [styles.replay, pressed && styles.chipPressed]}
            accessibilityLabel="Play again"
          >
            <Text style={[styles.replayText, { color: accent }]}>{hint.replay}</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.textArea}>
        <Text
          style={[
            styles.translation,
            half.kind === 'heard' && styles.heard,
            half.kind === 'message' && styles.message,
          ]}
        >
          {half.text}
        </Text>
      </View>

      <View style={styles.micArea}>
        <MicButton
          testID={`mic-${side}`}
          color={accent}
          listening={listening}
          label={`Speak ${LABEL[half.lang]}`}
          onPress={onMic}
        />
        <Text style={[styles.hint, listening && { color: accent }]}>{listening ? hint.listening : hint.idle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  half: { flex: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20 },
  flipped: { transform: [{ rotate: '180deg' }] },
  dimmed: { opacity: 0.45 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lang: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1.5, backgroundColor: '#fff' },
  langText: { fontSize: 17, fontWeight: '600' },
  chipPressed: { opacity: 0.6 },
  replay: { paddingVertical: 8, paddingHorizontal: 4 },
  replayText: { fontSize: 16, fontWeight: '600' },
  textArea: { flex: 1, justifyContent: 'center', paddingVertical: 12 },
  // What the other person reads: the biggest thing on their half.
  translation: { fontSize: 34, lineHeight: 42, fontWeight: '700', color: INK, letterSpacing: -0.4 },
  // What you said yourself: quieter, it is only a check.
  heard: { fontSize: 22, lineHeight: 30, fontWeight: '500', color: MUTED, letterSpacing: 0 },
  message: { fontSize: 20, lineHeight: 28, fontWeight: '600', color: WARN, letterSpacing: 0 },
  micArea: { alignItems: 'center', gap: 12 },
  hint: { fontSize: 15, color: MUTED, fontWeight: '500' },
});
