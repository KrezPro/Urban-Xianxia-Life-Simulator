import { useSettingsStore } from '../store/useSettingsStore';
import { GeneratedAudioName, generateAudioAssets } from './proceduralAudio';

declare const require: (moduleId: string) => any;

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
  lastError: string;
  avError: string;
  fsError: string;
  retryScheduled: boolean;
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
  lastError: '',
  avError: '',
  fsError: '',
  retryScheduled: false,
};

const setLastError = (value: string): void => {
  state.lastError = value;
};

export const getAudioDebugInfo = () => ({
  initialized: state.initialized,
  available: state.available,
  isDev: getIsDev(),
  musicSoundLoaded: state.musicSound !== null,
  lastError: state.lastError,
  avError: state.avError,
  fsError: state.fsError,
});

const pickAv = (): any => {
  let mod: any = null;
  try {
    mod = require('expo-av');
  } catch (error: any) {
    state.avError = `require: ${String(error?.message || error)}`;
    return null;
  }
  const levels = [mod, mod?.default];
  for (const level of levels) {
    if (level && level.Audio && level.Audio.Sound) {
      state.avError = '';
      return level;
    }
  }
  state.avError = 'no Audio.Sound in module';
  return null;
};

const hasLegacyFsApi = (m: any): boolean =>
  !!m &&
  (typeof m.cacheDirectory === 'string' || typeof m.documentDirectory === 'string') &&
  typeof m.writeAsStringAsync === 'function';

const pickFs = (): any => {
  const candidates: any[] = [];
  try {
    candidates.push(require('expo-file-system/legacy'));
  } catch (error: any) {
    state.fsError = `legacy require: ${String(error?.message || error)}`;
  }
  try {
    candidates.push(require('expo-file-system'));
  } catch (error: any) {
    state.fsError = `main require: ${String(error?.message || error)}`;
  }
  for (const candidate of candidates) {
    const levels = [candidate, candidate?.default];
    for (const level of levels) {
      if (hasLegacyFsApi(level)) {
        state.fsError = '';
        return level;
      }
    }
  }
  if (!state.fsError) {
    state.fsError = 'no legacy fs API in module';
  }
  return null;
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
  try {
    const sound = new AudioClass();
    await sound.loadAsync({ uri }, { shouldPlay: false, isLooping });
    await sound.setVolumeAsync(volume);
    return sound;
  } catch {
    return null;
  }
};

const initAsync = async (): Promise<void> => {
  const av = pickAv();
  const fs = pickFs();

  if (!av || !fs) {
    if (!state.lastError) {
      setLastError('native audio modules missing');
    }
    return;
  }

  try {
    await av.Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    const baseDir = fs.cacheDirectory || fs.documentDirectory;
    if (!baseDir) {
      setLastError('no cache/document directory');
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
      const sound = await loadSound(av.Audio.Sound, fileUris.click, false, 0.5);
      if (sound) {
        state.clickPool.push(sound);
      }
    }

    const simpleNames: GeneratedAudioName[] = ['toggleOn', 'toggleOff', 'tab', 'success', 'error'];
    for (const name of simpleNames) {
      const sound = await loadSound(av.Audio.Sound, fileUris[name], false, 0.5);
      if (sound) {
        state.simpleSounds[name] = sound;
      }
    }

    state.musicSound = await loadSound(av.Audio.Sound, fileUris.music, true, 0.22);
    if (!state.musicSound) {
      setLastError('music loop failed to load');
    }

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
    syncMusic();
  } catch (error: any) {
    setLastError(`init: ${String(error?.message || error)}`);
  }
};

const runInitOnce = (): void => {
  state.initializing = true;
  void initAsync()
    .catch((error: any) => {
      setLastError(`initAsync: ${String(error?.message || error)}`);
    })
    .finally(() => {
      state.initializing = false;
      if (!state.initialized && !state.retryScheduled) {
        state.retryScheduled = true;
        setTimeout(() => {
          state.retryScheduled = false;
          if (!state.initialized && !state.initializing && !getIsDev()) {
            runInitOnce();
          }
        }, 4000);
      }
    });
};

export const initAudio = (): void => {
  try {
    if (state.initialized || state.initializing) {
      return;
    }
    if (getIsDev()) {
      return;
    }
    runInitOnce();
  } catch (error: any) {
    setLastError(`initAudio: ${String(error?.message || error)}`);
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