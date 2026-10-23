import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LABEL, LANGS } from '../lang';
import { PackStatus } from '../packs';

export function PackBanner({ status, onRetry }: { status: PackStatus | null; onRetry: () => void }) {
  if (!status) return null;
  const values = LANGS.map((l) => status[l]);
  const failed = LANGS.filter((l) => status[l] === 'failed');

  if (values.includes('downloading')) {
    return (
      <View style={styles.banner}>
        <Text style={styles.text}>Downloading languages…</Text>
      </View>
    );
  }
  if (failed.length) {
    return (
      <View style={[styles.banner, styles.error]}>
        <Text style={styles.text}>Couldn't download: {failed.map((l) => LABEL[l]).join(', ')}</Text>
        <Pressable onPress={onRetry} style={styles.retry}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 8, backgroundColor: '#fef3c7' },
  error: { backgroundColor: '#fee2e2' },
  text: { fontSize: 15 },
  retry: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#fff' },
  retryText: { fontSize: 15, fontWeight: '600' },
});
