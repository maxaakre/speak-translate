import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Half, Side } from '../conversation';
import { LABEL, LANGS, Lang, SPEEDS, Speed, UI_TEXT } from '../lang';
import { VoiceOption } from '../services/types';
import { MicButton } from './MicButton';
import { INK, MUTED, SIDE_THEME, WARN } from './theme';

interface Props {
  side: Side;
  half: Half;
  listening: boolean;
  // Another half is taking its turn, so this one steps back.
  dimmed: boolean;
  // Voices for this half's language, and the chosen one (undefined: system voice).
  voices: VoiceOption[];
  voice: string | undefined;
  speed: Speed;
  onMic: () => void;
  onLang: (lang: Lang) => void;
  onVoice: (voice: string | undefined) => void;
  onSpeed: (speed: Speed) => void;
  onReplay: () => void;
}

type Menu = 'lang' | 'voice' | null;

export function HalfPanel(props: Props) {
  const { side, half, listening, dimmed, voices, voice, speed } = props;
  const { accent, surface } = SIDE_THEME[side];
  const text = UI_TEXT[half.lang];
  const canReplay = !!half.text && half.kind !== 'message';
  const voiceName = voices.find((v) => v.id === voice)?.name ?? text.systemVoice;
  const [menu, setMenu] = useState<Menu>(null);

  const toggle = (which: Menu) => setMenu((open) => (open === which ? null : which));
  const pickLang = (lang: Lang) => {
    setMenu(null);
    if (lang !== half.lang) props.onLang(lang);
  };
  const option = { accent, surface };

  return (
    // The top half is turned around for the person across the table.
    <View style={[styles.half, { backgroundColor: surface }, side === 'top' && styles.flipped, dimmed && styles.dimmed]}>
      <View style={styles.header}>
        <View style={styles.chips}>
          <Chip
            testID={`lang-${side}`}
            label={LABEL[half.lang]}
            open={menu === 'lang'}
            accent={accent}
            accessibilityLabel="Change language"
            onPress={() => toggle('lang')}
          />
          <Chip
            testID={`voice-${side}`}
            label={voiceName}
            open={menu === 'voice'}
            accent={accent}
            accessibilityLabel="Change voice and speed"
            onPress={() => toggle('voice')}
          />
        </View>
        {canReplay && (
          <Pressable
            testID={`replay-${side}`}
            onPress={props.onReplay}
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
          onPress={props.onMic}
        />
        <Text style={[styles.hint, listening && { color: accent }]}>{listening ? text.listening : text.idle}</Text>
      </View>

      {/* Inside the half, so the menus turn around with the top half. */}
      {menu && (
        <>
          <Pressable
            testID={`menu-backdrop-${side}`}
            style={StyleSheet.absoluteFill}
            onPress={() => setMenu(null)}
            accessibilityLabel="Close list"
          />
          <View style={styles.menu} accessibilityRole="menu">
            <ScrollView style={styles.menuScroll} bounces={false}>
              {menu === 'lang' &&
                LANGS.map((lang) => (
                  <Option
                    key={lang}
                    testID={`lang-option-${side}-${lang}`}
                    label={LABEL[lang]}
                    current={lang === half.lang}
                    {...option}
                    onPress={() => pickLang(lang)}
                  />
                ))}

              {menu === 'voice' && (
                <>
                  {/* Stays open on every choice, so voices and speeds can be compared. */}
                  <View style={styles.speeds}>
                    {SPEEDS.map((s) => {
                      const current = s === speed;
                      return (
                        <Pressable
                          key={s}
                          testID={`speed-${side}-${s}`}
                          onPress={() => props.onSpeed(s)}
                          style={({ pressed }) => [
                            styles.speed,
                            current && { backgroundColor: accent },
                            pressed && !current && styles.optionPressed,
                          ]}
                          accessibilityRole="button"
                          accessibilityState={{ selected: current }}
                        >
                          <Text
                            style={[styles.speedText, current && styles.speedTextCurrent]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                          >
                            {text.speed[s]}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <Option
                    testID={`voice-option-${side}-system`}
                    label={text.systemVoice}
                    current={!voice}
                    {...option}
                    onPress={() => props.onVoice(undefined)}
                  />
                  {voices.map((v) => (
                    <Option
                      key={v.id}
                      testID={`voice-option-${side}-${v.id}`}
                      label={v.name}
                      detail={v.enhanced ? text.enhanced : undefined}
                      current={v.id === voice}
                      {...option}
                      onPress={() => props.onVoice(v.id)}
                    />
                  ))}
                </>
              )}
            </ScrollView>
          </View>
        </>
      )}
    </View>
  );
}

interface ChipProps {
  testID: string;
  label: string;
  open: boolean;
  accent: string;
  accessibilityLabel: string;
  onPress: () => void;
}

function Chip({ testID, label, open, accent, accessibilityLabel, onPress }: ChipProps) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, { borderColor: accent }, open && { backgroundColor: accent }, pressed && styles.chipPressed]}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ expanded: open }}
    >
      <Text style={[styles.chipText, { color: open ? '#fff' : accent }]} numberOfLines={1}>
        {label} {open ? '▴' : '▾'}
      </Text>
    </Pressable>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  chips: { flexDirection: 'row', gap: 8, flexShrink: 1 },
  chip: { maxWidth: 160, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5, backgroundColor: '#fff' },
  chipText: { fontSize: 16, fontWeight: '600' },
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
    width: 320,
    maxWidth: '100%',
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
  speeds: { flexDirection: 'row', gap: 4, margin: 6, marginBottom: 8, padding: 4, borderRadius: 12, backgroundColor: '#ECEDF3' },
  speed: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 9, paddingHorizontal: 10 },
  speedText: { fontSize: 15, fontWeight: '600', color: INK },
  speedTextCurrent: { color: '#fff' },
  optionPressed: { backgroundColor: '#ECEDF3' },
  optionDetail: { fontSize: 13, color: MUTED, marginTop: 1 },
  optionText: { fontSize: 18, color: INK, fontWeight: '500' },
  check: { fontSize: 18, fontWeight: '700' },
});
