import { Pressable, StyleSheet, Text, View } from 'react-native';
import { INK } from './theme';

export function MiddleBar({ onSwap, onClear }: { onSwap: () => void; onClear: () => void }) {
  return (
    // Icons only: both people read this bar, from opposite sides.
    <View style={styles.bar}>
      <Pressable
        testID="swap"
        onPress={onSwap}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        accessibilityLabel="Swap languages"
      >
        <Text style={styles.icon}>⇅</Text>
      </Pressable>
      <Pressable
        testID="clear"
        onPress={onClear}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        accessibilityLabel="Clear"
      >
        <Text style={styles.icon}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', justifyContent: 'center', gap: 16, paddingVertical: 8, backgroundColor: '#fff' },
  button: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ECEDF3' },
  pressed: { backgroundColor: '#D6D8E3', transform: [{ scale: 0.92 }] },
  icon: { fontSize: 20, color: INK, fontWeight: '600' },
});
