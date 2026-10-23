import { Pressable, StyleSheet, Text, View } from 'react-native';

export function MiddleBar({ onSwap, onClear }: { onSwap: () => void; onClear: () => void }) {
  return (
    <View style={styles.bar}>
      <Pressable testID="swap" onPress={onSwap} style={styles.button} accessibilityLabel="Swap languages">
        <Text style={styles.text}>⇅ Swap</Text>
      </Pressable>
      <Pressable testID="clear" onPress={onClear} style={styles.button} accessibilityLabel="Clear">
        <Text style={styles.text}>🗑 Clear</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', justifyContent: 'center', gap: 24, paddingVertical: 6, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#ddd', backgroundColor: '#fafafa' },
  button: { paddingVertical: 6, paddingHorizontal: 12 },
  text: { fontSize: 15, color: '#444' },
});
