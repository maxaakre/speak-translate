// Throwaway device spike (plan Task 1). Deleted in Task 6.
import { useState } from 'react';
import { Button, ScrollView, Text, View } from 'react-native';
import * as Speech from 'expo-speech';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import MlkitTranslate from '../modules/mlkit-translate';
import { LABEL, LANGS, LOCALE, Lang } from './lang';

const SAMPLE: Record<Lang, string> = {
  sv: 'Har du något mot magont?',
  pl: 'Czy mam też umyć okna?',
  es: '¿Tiene algo para el dolor de estómago?',
  en: 'Do you have something for a stomach ache?',
};

export default function Spike() {
  const [log, setLog] = useState<string[]>([]);
  const add = (line: string) => setLog((l) => [`${new Date().toLocaleTimeString()} ${line}`, ...l]);

  const checkSupport = async () => {
    add(`supportsOnDevice: ${ExpoSpeechRecognitionModule.supportsOnDeviceRecognition()}`);
    const { locales, installedLocales } = await ExpoSpeechRecognitionModule.getSupportedLocales({});
    for (const lang of LANGS) {
      add(`${LOCALE[lang]} supported=${locales.includes(LOCALE[lang])} installed=${installedLocales.includes(LOCALE[lang])}`);
    }
  };

  const listen = async (lang: Lang) => {
    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perm.granted) return add('permission denied');
    const t0 = Date.now();
    const subs = [
      ExpoSpeechRecognitionModule.addListener('result', (e) => {
        if (e.isFinal) add(`${lang} heard (${Date.now() - t0} ms): ${e.results[0]?.transcript}`);
      }),
      ExpoSpeechRecognitionModule.addListener('error', (e) => add(`${lang} stt error: ${e.error} ${e.message}`)),
      ExpoSpeechRecognitionModule.addListener('end', () => subs.forEach((s) => s.remove())),
    ];
    ExpoSpeechRecognitionModule.start({ lang: LOCALE[lang], requiresOnDeviceRecognition: true, continuous: false });
  };

  const download = async (lang: Lang) => {
    try {
      await MlkitTranslate.downloadModel(lang);
      add(`${lang} model downloaded`);
    } catch (e) {
      add(`${lang} download failed: ${String(e)}`);
    }
  };

  const translate = async (lang: Lang) => {
    const to: Lang = lang === 'sv' ? 'pl' : 'sv';
    const t0 = Date.now();
    try {
      const out = await MlkitTranslate.translate(SAMPLE[lang], lang, to);
      add(`${lang}→${to} (${Date.now() - t0} ms): ${out}`);
    } catch (e) {
      add(`${lang} translate failed: ${String(e)}`);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 60 }}>
      <Button title="Check on-device support" onPress={checkSupport} />
      {LANGS.map((lang) => (
        <View key={lang} style={{ marginTop: 12 }}>
          <Text style={{ fontWeight: '700' }}>{LABEL[lang]}</Text>
          <Button title="Listen (on-device)" onPress={() => listen(lang)} />
          <Button title="Download model" onPress={() => download(lang)} />
          <Button title="Translate sample" onPress={() => translate(lang)} />
          <Button title="Speak sample" onPress={() => Speech.speak(SAMPLE[lang], { language: LOCALE[lang] })} />
        </View>
      ))}
      {log.map((line, i) => (
        <Text key={i} style={{ fontSize: 12, marginTop: 4 }}>{line}</Text>
      ))}
    </ScrollView>
  );
}
