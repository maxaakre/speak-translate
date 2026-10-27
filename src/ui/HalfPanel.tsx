import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Half, Side } from '../conversation';
import { LABEL, LANGS, Lang, UI_TEXT } from '../lang';
import { VoiceOption } from '../services/types';
import { MicButton } from './MicButton';
import { INK, MUTED, SIDE_THEME, WARN } from './theme';

interface Props {
  side: Side;
  half: Half;
  listening: boolean;
  // Another half is taking its turn, so this one steps back.
  dimmed: boolean;
  onMic: () => void;
  // Voices for this half's language, and the chosen one (undefined: system voice).
  voices: VoiceOption[];
  voice: string | undefined;
  onLang: (lang: Lang) => void;
  onVoice: (voice: string | undefined) => void;
  onReplay: () => void;
}

export function HalfPanel({ side, half, listening, dimmed, voices, voice, onMic, onLang, onVoice, onReplay }: Props) {
  const { accent, surface } = SIDE_THEME[side];
  const text = UI_TEXT[half.lang];
  const canReplay = !!half.text && half.kind !== 'message';
  const [menuOpen, setMenuOpen] = useState(false);

  const pick = (lang: Lang) => {
    setMenuOpen(false);
    if (lang !== half.lang) onLang(lang);
  };

  return (
    // The top half is turned around for the person across the table.
    <View style={[styles.half, { backgroundColor: surface }, side === 'top' && styles.flipped, dimmed && styles.dimmed]}>
      <View style={styles.header}>
        <Pressable
          testID={`lang-${side}`}
          onPress={() => setMenuOpen((open) => !open)}
          style={({ pressed }) => [styles.lang, { borderColor: accent }, pressed && styles.chipPressed]}
          accessibilityLabel="Change language"
          accessibilityState={{ expanded: menuOpen }}
        >
          <Text style={[styles.langText, { color: accent }]}>
            {LABEL[half.lang]} {menuOpen ? '▴' : '▾'}
          </Text>
        </Pressable>
        {canReplay && (
          <Pressable
            testID={`replay-${side}`}
            onPress={onReplay}
            style={({ pressed }) => [styles.replay, pressed && styles.chipPressed]}
            accessibilityLabel="Play again"
          >
            <Text style={[styles.replayText, { color: accent }]}>{text.replay}</Text>
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
        <Text style={[styles.hint, listening && { color: accent }]}>{listening ? text.listening : text.idle}</Text>
      </View>

      {/* Inside the half, so the menu turns around with the top half. */}
      {menuOpen && (
        <>
          <Pressable
            testID={`lang-backdrop-${side}`}
            style={StyleSheet.absoluteFill}
            onPress={() => setMenuOpen(false)}
            accessibilityLabel="Close language list"
          />
          <View style={styles.menu} accessibilityRole="menu">
            <ScrollView style={styles.menuScroll} bounces={false}>
              {LANGS.map((lang) => (
                <Option
                  key={lang}
                  testID={`lang-option-${side}-${lang}`}
                  label={LABEL[lang]}
                  current={lang === half.lang}
                  accent={accent}
                  surface={surface}
                  onPress={() => pick(lang)}
                />
              ))}

              <Text style={styles.section}>{text.voice}</Text>
              <Option
                testID={`voice-option-${side}-system`}
                label={text.systemVoice}
                current={!voice}
                accent={accent}
                surface={surface}
                onPress={() => onVoice(undefined)}
              />
              {voices.map((v) => (
                <Option
                  key={v.id}
                  testID={`voice-option-${side}-${v.id}`}
                  label={v.name}
                  detail={v.enhanced ? text.enhanced : undefined}
                  current={v.id === voice}
                  accent={accent}
                  surface={surface}
                  onPress={() => onVoice(v.id)}
                />
              ))}
            </ScrollView>
          </View>
        </>
      )}
    </View>
  );
}

interface OptionProps {
  testID: string;
  label: string;
  detail?: string;
  current: boolean;
  accent: string;
  surface: string;
  onPress: () => void;
}

function Option({ testID, label, detail, current, accent, surface, onPress }: OptionProps) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [styles.option, current && { backgroundColor: surface }, pressed && styles.optionPressed]}
      accessibilityRole="menuitem"
      accessibilityState={{ selected: current }}
    >
      <View>
        <Text style={[styles.optionText, current && { color: accent, fontWeight: '700' }]}>{label}</Text>
        {detail && <Text style={styles.optionDetail}>{detail}</Text>}
      </View>
      {current && <Text style={[styles.check, { color: accent }]}>✓</Text>}
    </Pressable>
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
  menu: {
    position: 'absolute',
    top: 62,
    left: 24,
    minWidth: 240,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: 16,
    marginHorizontal: 6,
    borderRadius: 10,
  },
  menuScroll: { maxHeight: 300 },
  section: { marginTop: 10, marginBottom: 4, marginHorizontal: 22, fontSize: 14, fontWeight: '600', color: MUTED },
  optionPressed: { backgroundColor: '#ECEDF3' },
  optionDetail: { fontSize: 13, color: MUTED, marginTop: 1 },
  optionText: { fontSize: 18, color: INK, fontWeight: '500' },
  check: { fontSize: 18, fontWeight: '700' },
});
