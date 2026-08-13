import { useSettingsStore } from '../store/useSettingsStore';
import { GeneratedAudioName, generateAudioAssets } from './proceduralAudio';

// Нативные модули (expo-av, expo-file-system) подключаются ТОЛЬКО через
// guarded require: если бинарь собран без них, игра не крашится, а просто
// остаётся без звука. Статические импорты запрещены (урок ExponentAV).
declare const require: (moduleId: string) => any;

const tryRequire = (moduleId: string): any => {
  try {
    return require(moduleId);
  } catch {
    return null;
  }
};

// В тесте (expo start / dev-клиент, __DEV__ === true) звук и музыка НЕ
// инициализируются вовсе. В release-сборках APK/AAB (__DEV__ === false)
// аудио работает полностью.
const getIsDev = (): boolean => {
  try {
    return typeof __DEV__ !== 'undefined' && (globalThis as any).__DEV__ === true;
  } catch {
    return false;
  }
};

interface InternalAudioState {
  initialized: boolean;
  initializing: boolean;
  available: boolean;
  clickPool: any[];
  clickIndex: number;
  simpleSounds: Partial<Record<GeneratedAudioName, any>>;
  musicSound: any;
  unsubscribeSettings: (() => void) | null;
}

const state: InternalAudioState = {
  initialized: false,
  initializing: false,
  available: false,
  clickPool: [],
  clickIndex: 0,
  simpleSounds: {},
  musicSound: null,
  unsubscribeSettings: null,
};

const canPlayUi = (): boolean => {
  try {
    return useSettingsStore.getState().soundEnabled === true;
  } catch {
    return false;
  }
};

const playSound = async (sound: any): Promise<void> => {
  if (!sound) {
    return;
  }

  try {
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch {
    try {
      await sound.playAsync();
    } catch {
      // Тишина вместо краша.
    }
  }
};

const safePlay = (name: GeneratedAudioName): void => {
  try {
    if (!state.initialized || !state.available) {
      return;
    }

    if (!canPlayUi()) {
      return;
    }

    if (name === 'click') {
      const poolSize = Math.max(1, state.clickPool.length);
      const sound = state.clickPool[state.clickIndex];
      state.clickIndex = (state.clickIndex + 1) % poolSize;
      void playSound(sound);
      return;
    }

    void playSound(state.simpleSounds[name]);
  } catch {
    // Звук никогда не должен ломать обработчики кнопок.
  }
};

// Standalone-функции: вызовы в UI пишутся как playUiPress?.() —
// TypeError "property of undefined" исключён конструктивно.
export const playUiPress = (): void => {
  safePlay('click');
};

export const playTab = (): void => {
  safePlay('tab');
};

export const playSuccess = (): void => {
  safePlay('success');
};

export const playError = (): void => {
  safePlay('error');
};

export const playToggle = (value: boolean, force: boolean = false): void => {
  try {
    if (!state.initialized || !state.available) {
      return;
    }

    if (!force && !canPlayUi()) {
      return;
    }

    void playSound(state.simpleSounds[value ? 'toggleOn' : 'toggleOff']);
  } catch {
    // Тишина вместо краша.
  }
};

const startMusic = async (): Promise<void> => {
  const sound = state.musicSound;
  if (!sound) {
    return;
  }

  try {
    await sound.setIsLoopingAsync(true);
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch {
    // Музыка не критична.
  }
};

const stopMusic = async (): Promise<void> => {
  if (!state.musicSound) {
    return;
  }

  try {
    await state.musicSound.stopAsync();
  } catch {
    // Музыка не критична.
  }
};

export const syncMusic = (): void => {
  try {
    if (!state.initialized || !state.available) {
      return;
    }

    const musicEnabled = useSettingsStore.getState().musicEnabled === true;
    if (musicEnabled) {
      void startMusic();
    } else {
      void stopMusic();
    }
  } catch {
    // Музыка не критична.
  }
};

const loadSound = async (
  AudioClass: any,
  uri: string,
  isLooping: boolean,
  volume: number
): Promise<any> => {
  const sound = new AudioClass();
  await sound.loadAsync({ uri }, { shouldPlay: false, isLooping });
  await sound.setVolumeAsync(volume);
  return sound;
};

const initAsync = async (): Promise<void> => {
  const av = tryRequire('expo-av');
  const fs = tryRequire('expo-file-system');

  if (!av || !av.Audio || !av.Audio.Sound || !fs) {
    state.initializing = false;
    return;
  }

  await av.Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
  });

  const baseDir = fs.cacheDirectory || fs.documentDirectory;
  if (!baseDir) {
    state.initializing = false;
    return;
  }

  const audioDir = `${baseDir}audio/`;
  try {
    await fs.makeDirectoryAsync(audioDir, { intermediates: true });
  } catch {
    // Папка может уже существовать.
  }

  const names: GeneratedAudioName[] = [
    'click',
    'toggleOn',
    'toggleOff',
    'tab',
    'success',
    'error',
    'music',
  ];

  const fileUris: Record<GeneratedAudioName, string> = {
    click: `${audioDir}click.wav`,
    toggleOn: `${audioDir}toggle_on.wav`,
    toggleOff: `${audioDir}toggle_off.wav`,
    tab: `${audioDir}tab.wav`,
    success: `${audioDir}success.wav`,
    error: `${audioDir}error.wav`,
    music: `${audioDir}music_loop.wav`,
  };

  const missing: GeneratedAudioName[] = [];
  for (const name of names) {
    try {
      const info = await fs.getInfoAsync(fileUris[name]);
      if (!info.exists) {
        missing.push(name);
      }
    } catch {
      missing.push(name);
    }
  }

  if (missing.length > 0) {
    const assets = generateAudioAssets();
    for (const name of missing) {
      await fs.writeAsStringAsync(fileUris[name], assets[name], {
        encoding: fs.EncodingType.Base64,
      });
    }
  }

  for (let i = 0; i < 3; i += 1) {
    state.clickPool.push(await loadSound(av.Audio.Sound, fileUris.click, false, 0.5));
  }

  const simpleNames: GeneratedAudioName[] = ['toggleOn', 'toggleOff', 'tab', 'success', 'error'];
  for (const name of simpleNames) {
    state.simpleSounds[name] = await loadSound(av.Audio.Sound, fileUris[name], false, 0.5);
  }

  state.musicSound = await loadSound(av.Audio.Sound, fileUris.music, true, 0.16);

  state.unsubscribeSettings = useSettingsStore.subscribe((current, prev) => {
    if (current.musicEnabled !== prev.musicEnabled) {
      if (current.musicEnabled) {
        void startMusic();
      } else {
        void stopMusic();
      }
    }
  });

  state.initialized = true;
  state.available = true;
  state.initializing = false;
  syncMusic();
};

export const initAudio = (): void => {
  try {
    if (state.initialized || state.initializing) {
      return;
    }

    if (getIsDev()) {
      // Тест на телефоне: звук и музыка не запускаются.
      return;
    }

    state.initializing = true;
    void initAsync().catch(() => {
      state.initializing = false;
    });
  } catch {
    state.initializing = false;
  }
};

export const disposeAudio = (): void => {
  try {
    if (state.unsubscribeSettings) {
      state.unsubscribeSettings();
      state.unsubscribeSettings = null;
    }

    const unload = async (sound: any) => {
      if (!sound) {
        return;
      }

      try {
        await sound.stopAsync();
      } catch {
        // Уже остановлен.
      }

      try {
        await sound.unloadAsync();
      } catch {
        // Уже выгружен.
      }
    };

    state.clickPool.forEach((sound) => void unload(sound));
    state.clickPool = [];

    Object.values(state.simpleSounds).forEach((sound) => {
      if (sound) {
        void unload(sound);
      }
    });
    state.simpleSounds = {};

    void unload(state.musicSound);
    state.musicSound = null;

    state.initialized = false;
    state.available = false;
    state.initializing = false;
  } catch {
    // Dispose не должен бросать.
  }
};

// Dual export: объект для совместимости форм импорта, но основной контракт —
// standalone-функции выше.
const AudioManager = {
  playUiPress,
  playTab,
  playSuccess,
  playError,
  playToggle,
  initAudio,
  disposeAudio,
  syncMusic,
};

export default AudioManager;