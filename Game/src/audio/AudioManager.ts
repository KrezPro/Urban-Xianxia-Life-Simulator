import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useSettingsStore } from '../store/useSettingsStore';
import { GeneratedAudioName, generateAudioAssets } from './proceduralAudio';

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
  clickPool: Audio.Sound[];
  clickIndex: number;
  simpleSounds: Partial<Record<GeneratedAudioName, Audio.Sound>>;
  musicSound: Audio.Sound | null;
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

const playSound = async (sound: Audio.Sound | undefined): Promise<void> => {
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
  uri: string,
  isLooping: boolean,
  volume: number
): Promise<Audio.Sound | null> => {
  try {
    const sound = new Audio.Sound();
    await sound.loadAsync({ uri }, { shouldPlay: false, isLooping });
    await sound.setVolumeAsync(volume);
    return sound;
  } catch {
    return null;
  }
};

const initAsync = async (): Promise<void> => {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
    if (!baseDir) {
      state.initializing = false;
      return;
    }

    const audioDir = `${baseDir}audio/`;
    try {
      await FileSystem.makeDirectoryAsync(audioDir, { intermediates: true });
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
        const info = await FileSystem.getInfoAsync(fileUris[name]);
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
        await FileSystem.writeAsStringAsync(fileUris[name], assets[name], {
          encoding: FileSystem.EncodingType.Base64,
        });
      }
    }

    for (let i = 0; i < 3; i += 1) {
      const sound = await loadSound(fileUris.click, false, 0.5);
      if (sound) {
        state.clickPool.push(sound);
      }
    }

    const simpleNames: GeneratedAudioName[] = ['toggleOn', 'toggleOff', 'tab', 'success', 'error'];
    for (const name of simpleNames) {
      const sound = await loadSound(fileUris[name], false, 0.5);
      if (sound) {
        state.simpleSounds[name] = sound;
      }
    }

    state.musicSound = await loadSound(fileUris.music, true, 0.16);

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
  } catch {
    // Нативный модуль недоступен, деградируем в тишину.
    state.initializing = false;
  }
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

    const unload = async (sound: Audio.Sound | undefined) => {
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