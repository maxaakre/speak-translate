# Speak Translate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A personal iPhone app for face-to-face spoken translation between Swedish, Polish, Spanish and English. It runs fully offline and costs nothing to run.

**Architecture:** Expo (React Native, TypeScript) app with one screen, split into two halves (the top half is rotated 180°). Pure TypeScript holds the conversation state (a reducer) and the turn flow (listen → translate → speak). Three adapter interfaces hide the native parts: speech-to-text, translation and text-to-speech. Logic is unit-tested with fakes, and the native adapters are checked by hand on the device.

**Tech Stack:** Expo (latest stable SDK, development build), TypeScript, `expo-speech-recognition`, `expo-speech`, Google ML Kit on-device translation (`react-native-mlkit-translate-text` or a local Expo module), `@react-native-async-storage/async-storage`, Jest (`jest-expo`) and `@testing-library/react-native`.

**Spec:** `docs/superpowers/specs/2026-10-23-speak-translate-design.md`

## Global Constraints

- Languages: Swedish, Polish, Spanish, English, any pair. Locales: `sv-SE`, `pl-PL`, `es-ES`, `en-US`.
- No server, no API keys, no paid services. Every turn must work in **airplane mode** once the language packs are downloaded.
- Target: **iPhone 16, iOS 26.6.2** only. iOS 26-only APIs are allowed. ML Kit does not run in the iOS simulator, so test native parts on the device.
- Latency: aim for ~1 s from pause to translation. **2–3 s is acceptable.** Use the built-in auto-stop on pause, with no custom silence detection.
- Offline beats speed and app size. If built-in speech recognition can't run a language offline, use iOS 26 SpeechAnalyzer, then an on-device Whisper model. Never fall back to the network.
- Only the latest sentence shows on each half. No history.
- Remember the last language pair between launches.
- Download all four language packs on first launch, and show a "downloading / ready" state.
- Tapping a mic while audio is playing stops the playback and starts listening.
- Ask for mic and speech permission on the first mic tap.
- Text must be big enough to read across a table. Start talking within a couple of taps.

## Review Focus

1. **Nothing heard** (the person taps the mic and says nothing, or it's too noisy). Expect a short "Didn't catch that" on that half, no translation, and no crash. Test in Task 3.
2. **A language pack is missing at turn time** (the first download failed, or the app was offline on first launch). Expect a clear message naming the language, not an empty translation. Test in Task 3.
3. **The other mic is tapped mid-turn** (listening or speaking on one side, then the other side taps). Expect the current turn to stop cleanly and the new one to start. Stale results must not land on screen. Test in Task 3.
4. **Permission denied** for the mic or speech. Expect a message telling the person to enable it in Settings. Test in Task 3 (stt rejects with `permission`).
5. **Same language on both halves.** Expect no translation call. The text is shown and spoken as-is. Test in Task 3.

---

### Task 1: Project scaffold + device spike

Proves on the real iPhone that speech → translate → speak works offline for all four languages. **Its results decide whether Task 7 is needed.**

**Files:**
- Create: Expo project at repo root (`app.json`, `package.json`, `tsconfig.json`, `.gitignore` including `.superpowers/`)
- Create: `src/lang.ts`
- Create: `app/spike.tsx` (temporary, deleted in Task 6)
- Create: `docs/spike-results.md`

**Interfaces:**
- Produces: `type Lang = 'sv' | 'pl' | 'es' | 'en'`, `LANGS: Lang[]`, `LOCALE: Record<Lang, string>` (the locales above), `LABEL: Record<Lang, string>` (`Svenska`, `Polski`, `Español`, `English`) in `src/lang.ts`.

- [ ] **Step 1:** Run `git init`, scaffold with `npx create-expo-app@latest . --template default` (TypeScript), and add `.superpowers/` to `.gitignore`. Commit `chore: scaffold expo app`.
- [ ] **Step 2:** Install `expo-speech-recognition`, `expo-speech`, `expo-dev-client` and `react-native-mlkit-translate-text`. Add the `expo-speech-recognition` config plugin with mic and speech usage strings to `app.json`.
- [ ] **Step 3:** Build to the device with `npx expo run:ios --device`. Expected: the app launches on the iPhone 16. **If the ML Kit library fails to build**, create a local Expo module `modules/mlkit-translate` (Swift, pod `GoogleMLKit/Translate`) that exposes `downloadModel(lang)`, `isModelDownloaded(lang)` and `translate(text, from, to)`, then rebuild.
- [ ] **Step 4:** Write `src/lang.ts` and `app/spike.tsx`. For each language, the spike screen has:
  - a button that logs `ExpoSpeechRecognitionModule.supportsOnDeviceRecognition()` and the supported locales
  - a "listen (on-device)" button with `requiresOnDeviceRecognition: true`
  - "download model", "translate sample" and "speak sample" buttons
- [ ] **Step 5:** On the device, download all four models, then turn on **airplane mode**. For each language, record in `docs/spike-results.md`:
  - on-device recognition works (yes/no)
  - how good the transcript is
  - translation works offline
  - the voice speaks
  - rough seconds from pause to spoken output
- [ ] **Step 6:** Write a one-line verdict in `docs/spike-results.md`: either "built-in STT OK for all → skip Task 7", or "Task 7 needed for: <langs>". Commit `chore: device spike and results`.

---

### Task 2: Conversation state

**Files:**
- Create: `src/conversation.ts`
- Test: `src/__tests__/conversation.test.ts`

**Interfaces:**
- Consumes: `Lang` from `src/lang.ts`.
- Produces:
  ```ts
  type Side = 'top' | 'bottom';
  type Phase = 'idle' | 'listening' | 'translating' | 'speaking';
  interface Half { lang: Lang; text: string; kind: 'heard' | 'translation' | 'message' | null }
  interface ConversationState { top: Half; bottom: Half; active: Side | null; phase: Phase; turnId: number }
  type Action =
    | { type: 'start'; side: Side }                    // turnId += 1, clears both texts
    | { type: 'heard'; turnId: number; text: string }  // active side text, kind 'heard'
    | { type: 'translated'; turnId: number; text: string } // other side text, kind 'translation'
    | { type: 'speaking'; turnId: number }
    | { type: 'done'; turnId: number }                 // phase idle, active null
    | { type: 'message'; turnId: number; text: string } // active side text, kind 'message', phase idle
    | { type: 'setLang'; side: Side; lang: Lang }
    | { type: 'swap' }                                 // swap langs only
    | { type: 'clear' };
  function initialState(top: Lang, bottom: Lang): ConversationState;
  function reducer(s: ConversationState, a: Action): ConversationState;
  const other: (side: Side) => Side;
  ```

- [ ] **Step 1: Write failing tests**, one per behaviour:
  - `start('bottom')` sets `active='bottom'`, `phase='listening'`, increments `turnId`, and clears both texts.
  - `heard` puts the text on the active half with `kind='heard'`, and `phase='translating'`.
  - `translated` puts the text on the **other** half with `kind='translation'`.
  - Actions whose `turnId` doesn't match the current one are **ignored** (state unchanged).
  - `swap` exchanges `top.lang` and `bottom.lang`. `clear` empties both texts.
  - `message` puts the text on the active half with `kind='message'`, and `phase='idle'`.
- [ ] **Step 2:** Run `npx jest src/__tests__/conversation.test.ts`. Expected: FAIL (module not found).
- [ ] **Step 3:** Implement the reducer in `src/conversation.ts`.
- [ ] **Step 4:** Run the tests again. Expected: PASS.
- [ ] **Step 5:** Commit `feat: conversation state reducer`.

---

### Task 3: Turn runner (listen → translate → speak)

**Files:**
- Create: `src/services/types.ts`, `src/turn.ts`
- Test: `src/__tests__/turn.test.ts`

**Interfaces:**
- Consumes: `Lang` and `LOCALE` (Task 1), plus `Action`, `Side`, `other` and `ConversationState` (Task 2).
- Produces:
  ```ts
  // src/services/types.ts
  class SttError extends Error { constructor(public code: 'no-speech' | 'permission' | 'unavailable', msg?: string) }
  interface SpeechToText { listen(locale: string): Promise<string>; stop(): void }
  interface Translator {
    isReady(lang: Lang): Promise<boolean>;
    download(lang: Lang): Promise<void>;
    translate(text: string, from: Lang, to: Lang): Promise<string>;
  }
  interface TextToSpeech { speak(text: string, locale: string): Promise<void>; stop(): void }
  interface Services { stt: SpeechToText; translator: Translator; tts: TextToSpeech }

  // src/turn.ts
  function createTurnRunner(services: Services, dispatch: (a: Action) => void, getState: () => ConversationState):
    { startTurn(side: Side): Promise<void>; cancel(): void };
  ```
- User-facing messages (exact copy):
  - `"Didn't catch that"`
  - `"<LABEL> not downloaded"`
  - `"Allow microphone in Settings"`
  - `"Speech not available offline"`

- [ ] **Step 1: Write failing tests** using fake services (jest mocks):
  - Happy path: dispatches `start`, `heard('Hej')`, `translated('Cześć')`, `speaking`, `done`. `tts.speak` is called with `('Cześć', 'pl-PL')`.
  - `stt.listen` rejects with `SttError('no-speech')`: dispatches `message("Didn't catch that")`, and translate is not called.
  - `stt.listen` rejects with `SttError('permission')`: dispatches `message('Allow microphone in Settings')`.
  - `translator.isReady('pl')` is false: dispatches `message('Polski not downloaded')`, and speak is not called.
  - Same language on both halves: translate is not called, and the heard text is dispatched as `translated` and spoken.
  - `startTurn('top')` while a bottom turn is in flight: calls `tts.stop()` and `stt.stop()`. The old turn's late result is dispatched with the old `turnId`, so the reducer drops it.
- [ ] **Step 2:** Run `npx jest src/__tests__/turn.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement `createTurnRunner`. Each `startTurn` calls `cancel()` first, captures the new `turnId` from `getState()` after dispatching `start`, and tags every later dispatch with it.
- [ ] **Step 4:** Run the tests again. Expected: PASS.
- [ ] **Step 5:** Commit `feat: turn runner with error handling`.

---

### Task 4: Settings persistence + language pack setup

**Files:**
- Create: `src/settings.ts`, `src/packs.ts`
- Test: `src/__tests__/settings.test.ts`, `src/__tests__/packs.test.ts`

**Interfaces:**
- Consumes: `Lang` and `LANGS`, plus `Translator`.
- Produces:
  ```ts
  // settings.ts — AsyncStorage key 'langPair'
  function loadLangPair(): Promise<{ top: Lang; bottom: Lang }>; // default { top: 'pl', bottom: 'sv' }
  function saveLangPair(pair: { top: Lang; bottom: Lang }): Promise<void>;
  // packs.ts
  type PackStatus = Record<Lang, 'checking' | 'downloading' | 'ready' | 'failed'>;
  function ensurePacks(t: Translator, onChange: (s: PackStatus) => void): Promise<PackStatus>;
  ```

- [ ] **Step 1: Write failing tests:**
  - With nothing stored, `loadLangPair` returns `{top:'pl', bottom:'sv'}`. After saving, it returns the saved pair. Stored junk (an invalid lang) falls back to the default.
  - `ensurePacks` skips download for languages that are ready, downloads the rest, and ends with all four `'ready'`. One download rejecting gives that language `'failed'` while the others still end `'ready'`.
- [ ] **Step 2:** Run `npx jest src/__tests__/settings.test.ts src/__tests__/packs.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement both. Use the AsyncStorage jest mock (`@react-native-async-storage/async-storage/jest/async-storage-mock`).
- [ ] **Step 4:** Run the tests again. Expected: PASS.
- [ ] **Step 5:** Commit `feat: remember language pair and download packs`.

---

### Task 5: Face-to-face screen

**Files:**
- Create: `src/ui/HalfPanel.tsx`, `src/ui/MiddleBar.tsx`, `src/ui/PackBanner.tsx`, `src/ui/FaceToFaceScreen.tsx`
- Test: `src/__tests__/FaceToFaceScreen.test.tsx`

**Interfaces:**
- Consumes: everything from Tasks 2–4.
- Produces: `FaceToFaceScreen({ services }: { services: Services })`.
- Layout (from the approved mockup):
  - Two equal halves. The top half is wrapped in `transform: [{ rotate: '180deg' }]`.
  - Each half has a language picker (cycles or opens a list of the 4 `LABEL`s), a mic button (≥ 72 pt, with a `testID` of `mic-top` or `mic-bottom`), and a 🔊 replay button.
  - Main text is ≥ 28 pt.
  - The middle bar has swap and clear.
  - `PackBanner` shows while any pack isn't `ready`, and lists any that `failed` with a retry.
  - The mic button shows the listening state.

- [ ] **Step 1: Write failing tests** with fake services:
  - Pressing `mic-bottom` with the fake STT returning `'Hej'` and the translator returning `'Cześć'` shows `Hej` and `Cześć`.
  - Pressing swap swaps the picker labels and calls `saveLangPair`.
  - The banner shows `Downloading…` while the fake `download` is pending, and disappears when it resolves.
  - Replay calls `tts.speak` with that half's text and locale.
- [ ] **Step 2:** Run `npx jest src/__tests__/FaceToFaceScreen.test.tsx`. Expected: FAIL.
- [ ] **Step 3:** Implement the components. The screen holds `useReducer(reducer)`, creates the turn runner once, loads the lang pair on mount, saves it on `setLang` or `swap`, and runs `ensurePacks` on mount.
- [ ] **Step 4:** Run `npx jest`. Expected: all PASS.
- [ ] **Step 5:** Commit `feat: face-to-face screen`.

---

### Task 6: Real adapters + wire up on device

**Files:**
- Create: `src/services/expoStt.ts`, `src/services/mlkitTranslator.ts`, `src/services/expoTts.ts`, `src/services/index.ts`
- Modify: `app/index.tsx` (or the template's root route) to render `<FaceToFaceScreen services={realServices} />`, and remove the template tabs
- Delete: `app/spike.tsx`

**Interfaces:**
- Consumes: the `Services` types (Task 3) and the ML Kit API proven in Task 1.
- Produces: `realServices: Services` from `src/services/index.ts`.

- [ ] **Step 1:** Implement `expoStt`:
  - `listen` asks for permission first (if denied, throw `SttError('permission')`).
  - It starts with `{ lang: locale, requiresOnDeviceRecognition: true, interimResults: false, continuous: false }`.
  - It resolves on the final `result` event.
  - A `no-speech` or empty result throws `SttError('no-speech')`. On-device being unsupported throws `SttError('unavailable')`.
  - `stop` calls `abort()`.
- [ ] **Step 2:** Implement `mlkitTranslator` with the ML Kit calls from Task 1. Implement `expoTts` with `Speech.speak(text, { language: locale, onDone, onError })` wrapped in a Promise, and `Speech.stop()`.
- [ ] **Step 3:** Run `npx jest` (the logic is unchanged). Expected: PASS. Run `npx tsc --noEmit`. Expected: no errors.
- [ ] **Step 4:** Build to the device (`npx expo run:ios --device`). With **airplane mode on**, check by hand:
  - sv→pl, pl→sv, sv→es, es→sv, sv→en
  - tapping the other mic mid-speech
  - a silent tap
  - the language pair is remembered after force-quit

  Each pair should show the translation and speak it within ~3 s.
- [ ] **Step 5:** Commit `feat: wire native speech, translation and voice`.

---

### Task 7 (only if Task 1's verdict says so): Offline speech fallback

**Files:**
- Create: `modules/speech-analyzer/` (local Expo module, Swift), `src/services/analyzerStt.ts`. Then, if still needed, `src/services/whisperStt.ts`.
- Modify: `src/services/index.ts`. Pick the STT per locale: built-in where Task 1 said it works, otherwise analyzer, otherwise Whisper.

**Interfaces:**
- Consumes: `SpeechToText` and `SttError` (Task 3).
- Produces: `analyzerStt: SpeechToText`, `whisperStt: SpeechToText`, and `pickStt(locale: string): SpeechToText` in `src/services/index.ts`.

- [ ] **Step 1: Write a failing test** for `pickStt`: given a support table `{ 'sv-SE': 'analyzer', 'pl-PL': 'builtin', ... }`, it returns the matching adapter for each locale.
- [ ] **Step 2:** Run `npx jest src/__tests__/pickStt.test.ts`. Expected: FAIL. Then implement it. Expected: PASS.
- [ ] **Step 3:** Build the `speech-analyzer` module:
  - Swift, using `SpeechAnalyzer` with `SpeechTranscriber` (or `DictationTranscriber` if the locale isn't in `SpeechTranscriber.supportedLocales`).
  - It installs the locale asset via `AssetInventory` when one is missing.
  - It exposes `transcribeOnce(locale): Promise<string>`, finishing on silence, and `stop()`.
- [ ] **Step 4:** On the device in airplane mode, re-test the failing languages. If any still fail, add `whisperStt` using `whisper.rn` with a multilingual model (start with `ggml-base`, downloaded on first launch alongside the language packs) and re-test.
- [ ] **Step 5:** Update `docs/spike-results.md` with which engine each language uses. Commit `feat: offline speech fallback`.
