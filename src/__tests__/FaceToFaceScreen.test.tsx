import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { FaceToFaceScreen } from '../ui/FaceToFaceScreen';
import { Services } from '../services/types';

function fakeServices() {
  return {
    stt: { listen: jest.fn().mockResolvedValue('Hej'), stop: jest.fn() },
    translator: {
      isReady: jest.fn().mockResolvedValue(true),
      download: jest.fn().mockResolvedValue(undefined),
      translate: jest.fn().mockResolvedValue('Cześć'),
    },
    tts: { speak: jest.fn().mockResolvedValue(undefined), stop: jest.fn() },
  } satisfies Services;
}

beforeEach(() => AsyncStorage.clear());

async function renderReady(services = fakeServices()) {
  await render(<FaceToFaceScreen services={services} />);
  await waitFor(() => expect(screen.getByTestId('lang-bottom')).toHaveTextContent(/Svenska/));
  return services;
}

describe('FaceToFaceScreen', () => {
  it('shows what was said and its translation after a mic tap', async () => {
    await renderReady();
    await fireEvent.press(screen.getByTestId('mic-bottom'));
    expect(await screen.findByText('Cześć')).toBeTruthy();
    expect(screen.getByText('Hej')).toBeTruthy();
  });

  it('swap exchanges the language labels and remembers the pair', async () => {
    await renderReady();
    await fireEvent.press(screen.getByTestId('swap'));
    expect(screen.getByTestId('lang-top')).toHaveTextContent(/Svenska/);
    expect(screen.getByTestId('lang-bottom')).toHaveTextContent(/Polski/);
    await waitFor(async () =>
      expect(JSON.parse((await AsyncStorage.getItem('langPair'))!)).toEqual({ top: 'sv', bottom: 'pl' }),
    );
  });

  it('tapping a language label moves to the next language and remembers it', async () => {
    await renderReady();
    await fireEvent.press(screen.getByTestId('lang-top'));
    expect(screen.getByTestId('lang-top')).toHaveTextContent(/Español/);
    await waitFor(async () =>
      expect(JSON.parse((await AsyncStorage.getItem('langPair'))!)).toEqual({ top: 'es', bottom: 'sv' }),
    );
  });

  it('starts with the remembered language pair', async () => {
    await AsyncStorage.setItem('langPair', JSON.stringify({ top: 'en', bottom: 'es' }));
    await render(<FaceToFaceScreen services={fakeServices()} />);
    await waitFor(() => expect(screen.getByTestId('lang-top')).toHaveTextContent(/English/));
    expect(screen.getByTestId('lang-bottom')).toHaveTextContent(/Español/);
  });

  it('shows a downloading banner until the packs are ready', async () => {
    const services = fakeServices();
    let finish!: () => void;
    services.translator.isReady.mockResolvedValue(false);
    services.translator.download.mockImplementation(() => new Promise<void>((r) => (finish = r)));
    await render(<FaceToFaceScreen services={services} />);

    expect(await screen.findByText(/Downloading/)).toBeTruthy();
    for (let i = 0; i < 4; i++) {
      await act(async () => finish());
    }
    await waitFor(() => expect(screen.queryByText(/Downloading/)).toBeNull());
    expect(screen.getByText(/Offline ready/)).toBeTruthy();
  });

  it('says offline ready when every pack is already downloaded', async () => {
    await renderReady();
    expect(await screen.findByText(/Offline ready/)).toBeTruthy();
  });

  it('lists a failed pack with a retry that downloads it again', async () => {
    const services = fakeServices();
    services.translator.isReady.mockResolvedValue(false);
    services.translator.download.mockImplementation(async (lang) => {
      if (lang === 'pl') throw new Error('offline');
    });
    await render(<FaceToFaceScreen services={services} />);

    expect(await screen.findByText("Couldn't download: Polski")).toBeTruthy();
    services.translator.download.mockResolvedValue(undefined);
    await fireEvent.press(screen.getByText('Retry'));
    await waitFor(() => expect(screen.queryByText('Retry')).toBeNull());
  });

  it('replay speaks that half again in its language', async () => {
    const services = await renderReady();
    await fireEvent.press(screen.getByTestId('mic-bottom'));
    await screen.findByText('Cześć');
    services.tts.speak.mockClear();
    await fireEvent.press(screen.getByTestId('replay-top'));
    expect(services.tts.speak).toHaveBeenCalledWith('Cześć', 'pl-PL');
  });

  it('clear removes both texts', async () => {
    await renderReady();
    await fireEvent.press(screen.getByTestId('mic-bottom'));
    await screen.findByText('Cześć');
    await fireEvent.press(screen.getByTestId('clear'));
    expect(screen.queryByText('Cześć')).toBeNull();
    expect(screen.queryByText('Hej')).toBeNull();
  });
});
