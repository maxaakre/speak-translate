import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Half, Side } from '../conversation';
import { LABEL } from '../lang';

interface Props {
  side: Side;
  half: Half;
  listening: boolean;
  color: string;
  onMic: () => void;
  onLang: () => void;
  onReplay: () => void;
}

export function HalfPanel({ side, half, listening, color, onMic, onLang, onReplay }: Props) {
  return (
    // The top half is turned around for the person across the table.
    <View style={[styles.half, side === 'top' && styles.flipped]}>
      <View style={styles.textArea}>
        <Text style={[styles.text, half.kind === 'message' && styles.message]}>{half.text}</Text>
      </View>
      <View style={styles.controls}>
        <Pressable testID={`lang-${side}`} onPress={onLang} style={styles.lang} accessibilityLabel="Change language">
          <Text style={styles.langText}>{LABEL[half.lang]} ▾</Text>
        </Pressable>
        <Pressable
          testID={`mic-${side}`}
          onPress={onMic}
          style={[styles.mic, { backgroundColor: color }, listening && styles.micListening]}
          accessibilityLabel={`Speak ${LABEL[half.lang]}`}
        >
          <Text style={styles.micText}>{listening ? '…' : '🎤'}</Text>
        </Pressable>
        <Pressable testID={`replay-${side}`} onPress={onReplay} style={styles.replay} accessibilityLabel="Play again">
          <Text style={styles.replayText}>🔊</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  half: { flex: 1, padding: 20, justifyContent: 'space-between' },
  flipped: { transform: [{ rotate: '180deg' }], backgroundColor: '#eef4ff' },
  textArea: { flex: 1, justifyContent: 'center' },
  text: { fontSize: 32, fontWeight: '600', lineHeight: 40, color: '#111' },
  message: { fontSize: 24, color: '#b45309' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lang: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: '#ccc', backgroundColor: '#fff' },
  langText: { fontSize: 17 },
  mic: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' },
  micListening: { transform: [{ scale: 1.12 }], opacity: 0.85 },
  micText: { fontSize: 34, color: '#fff' },
  replay: { padding: 12 },
  replayText: { fontSize: 28 },
});
