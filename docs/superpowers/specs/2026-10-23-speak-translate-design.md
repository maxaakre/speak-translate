# Speak Translate — Design

Date: 2026-10-23

## Intent

A personal iPhone app for **short, face-to-face spoken conversations** between two people who don't share a language.

Real moments that prompted it:

- Talking with a **cleaner at home** (Swedish ↔ Polish).
- Asking at a **pharmacy in Spain** for something for stomach pain (Swedish ↔ Spanish).

The owner speaks Swedish. The other person must understand too, so the translation is **shown big and read aloud** to them.

## Goals

- Two-way spoken translation between **Swedish, Polish, Spanish and English** (any pair).
- **Feels near-live**: aim for about 1 second from the speaker pausing to the translation appearing and being spoken. **2–3 seconds is acceptable** (owner's call), so the built-in auto-stop on pause is good enough; no custom silence detection needed. (Zero latency is impossible; the owner accepted this.)
- **Free to run.** No server, no API keys, no per-minute costs.
- **Works offline** after language packs are downloaded once (e.g. abroad without mobile data).
- Built in **React Native**, runs on the owner's iPhone.

## Non-goals

- App Store release, accounts, or multiple users.
- Android (not needed, though the stack doesn't rule it out).
- Long speeches, live captions, or translating phone calls/video.
- Conversation history, saving or sharing transcripts.
- Cloud translation or paid AI models.

## Anti-goals (would count as failure even if it technically works)

- Needs a server or ongoing paid service.
- Stops working without mobile data.
- Text too small for the other person to read across a table.
- Fiddly to start: the owner should be talking within a couple of taps.

## Constraints

- **Translation quality:** free on-device translation is accepted, knowing it's meant for simple, casual sentences and may get words slightly wrong. The owner chose free over better quality.
- **Install cost:** a free Apple ID works but the app expires after 7 days; a paid Apple Developer account (~$99/yr) avoids that. The owner hasn't chosen yet; the build must work with either.
- **Real device only** for testing ML Kit (no iOS simulator support).
- **Target device:** iPhone 16, iOS 26.6.2. Only this device needs to work, so iOS 26-only APIs are fine.
- **Offline beats speed and app size.** If a language can't be recognised offline with the built-in tools, the owner wants a bigger on-device speech model rather than falling back to the internet, even if it's slower (2–3 s) and makes the app larger.

## Decided: how it works

### Screen: "Face to face" (single main screen)

The owner picked this layout from three options (face to face / chat bubbles / hands-free).

- The phone **lies flat on a table** between the two people.
- The screen is split in two halves:
  - **Bottom half** belongs to the owner.
  - **Top half** is **rotated 180°** so the other person reads it right way up.
- Each half has:
  - A **language picker** (Svenska, Polski, Español, English).
  - A large **mic button**.
  - A **🔊 replay** button for the last translation shown on that half.
- A thin bar in the middle with **swap** (swap the two languages) and **clear**.

### A turn

1. A person taps **their** mic and speaks in their half's language.
2. Recording **stops automatically when they pause**.
3. Their own half shows what they said (so they can see if it was heard right).
4. The other half shows the **translation in large text**.
5. The translation is **read aloud** in the other half's language.

### Behaviour

- Only the **latest** sentence is shown on each half. No history.
- The app **remembers the last language pair** between launches.

### Tech stack

- **React Native with Expo** (development build, since native modules are required).
- **Speech-to-text, in order of preference** (must run fully on-device):
  1. iOS built-in recognition (e.g. `expo-speech-recognition`) with `requiresOnDeviceRecognition`, if it supports sv-SE, pl-PL, es-ES and en on-device.
  2. iOS 26 **SpeechAnalyzer / SpeechTranscriber** (or `DictationTranscriber`) via a small custom Expo native module, if option 1 doesn't cover a language offline.
  3. An **on-device Whisper model** (e.g. `whisper.rn`) for any language still not covered. Accepted trade-off: larger app and slower turns.
- **Translation:** **Google ML Kit on-device translation** (supports sv, pl, es, en). Candidate library: `react-native-mlkit-translate-text`. Non-English pairs pivot through English internally.
- **Text-to-speech:** iOS built-in voices (e.g. `expo-speech`).

## Known risks / unverified

- **Offline speech recognition for Swedish and Polish** is not confirmed. iOS supports both for dictation; whether they run fully on-device must be tested on the real phone (`supportsOnDeviceRecognition`, and `SpeechTranscriber.supportedLocales` on iOS 26). The fallback order above decides what to do.
- **Apple's Translation framework** appears not to support Swedish (third-party lists; not officially confirmed). The spike may check `LanguageAvailability` on the device, but ML Kit is the plan.
- **ML Kit React Native wrappers** are small community libraries. Expo compatibility and current React Native support are unverified. A thin custom Expo native module wrapping ML Kit is the fallback.
- Pivoting through English may reduce Swedish ↔ Polish quality.

Recommended first step: a **throwaway spike** on the real iPhone proving speech → translate → speak works offline for sv/pl/es/en before building the UI properly.

## Calls made by the designer (not discussed with the owner)

- **Locales:** Spanish = es-ES (Spain), English = en-US for speech and voices.
- **Language packs:** downloaded on first launch for all four languages, with a clear "downloading / ready" state, so the app is ready before travelling.
- **Tapping a mic while audio is playing** stops the playback and starts listening.
- **Microphone/speech permissions** are asked on first mic tap.

## Left to the builder

- Exact visual styling, colours, fonts, icons.
- Library choices within the stack above, if the candidates don't work.
- Project structure, state management, testing approach.
