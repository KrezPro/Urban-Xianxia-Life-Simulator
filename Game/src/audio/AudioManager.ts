import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { GeneratedAudioName, generateAudioAssets } from './proceduralAudio';
import { useSettingsStore } from '../store/useSettingsStore';

class AudioManagerClass {
  private initialized = false;
  private initializing = false;
  private clickPool: Audio.Sound[] = [];
  private clickIndex = 0;
  private simpleSounds: Partial<Record<GeneratedAudioName, Audio.Sound>> = {};
  private musicSound: Audio.Sound | null = null;
  private unsubscribeSettings: (() => void) | null = null;

  async init(): Promise<void> {
    if (this.initialized || this.initializing) {
      return;
    }

    this.initializing = true;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
      if (!baseDir) {
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
        this.clickPool.push(await this.loadSound(fileUris.click, false, 0.5));
      }

      const simpleNames: GeneratedAudioName[] = [
        'toggleOn',
        'toggleOff',
        'tab',
        'success',
        'error',
      ];

      for (const name of simpleNames) {
        this.simpleSounds[name] = await this.loadSound(fileUris[name], false, 0.5);
      }

      this.musicSound = await this.loadSound(fileUris.music, true, 0.16);

      this.unsubscribeSettings = useSettingsStore.subscribe((state, prevState) => {
        if (state.musicEnabled !== prevState.musicEnabled) {
          if (state.musicEnabled) {
            void this.startMusic();
          } else {
            void this.stopMusic();
          }
        }
      });

      this.initialized = true;
      await this.syncMusic();
    } catch {
      // Аудио не должно ломать игру.
    } finally {
      this.initializing = false;
    }
  }

  private async loadSound(uri: string, isLooping: boolean, volume: number): Promise<Audio.Sound> {
    const sound = new Audio.Sound();
    await sound.loadAsync({ uri }, { shouldPlay: false, isLooping });
    await sound.setVolumeAsync(volume);
    return sound;
  }

  private canPlayUi = (): boolean => {
    try {
      return useSettingsStore.getState().soundEnabled;
    } catch {
      return false;
    }
  };

  private async playSound(sound?: Audio.Sound): Promise<void> {
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
        // Игнорируем ошибки коротких звуков.
      }
    }
  }

  playUiPress = (): void => {
    if (!this.initialized || !this.canPlayUi()) {
      return;
    }

    const poolSize = Math.max(1, this.clickPool.length);
    const sound = this.clickPool[this.clickIndex];
    this.clickIndex = (this.clickIndex + 1) % poolSize;
    void this.playSound(sound);
  };

  playTab = (): void => {
    if (!this.initialized || !this.canPlayUi()) {
      return;
    }

    void this.playSound(this.simpleSounds.tab);
  };

  playSuccess = (): void => {
    if (!this.initialized || !this.canPlayUi()) {
      return;
    }

    void this.playSound(this.simpleSounds.success);
  };

  playError = (): void => {
    if (!this.initialized || !this.canPlayUi()) {
      return;
    }

    void this.playSound(this.simpleSounds.error);
  };

  playToggle = (value: boolean, force: boolean = false): void => {
    if (!this.initialized) {
      return;
    }

    if (!force && !this.canPlayUi()) {
      return;
    }

    void this.playSound(this.simpleSounds[value ? 'toggleOn' : 'toggleOff']);
  };

  private async startMusic(): Promise<void> {
    if (!this.musicSound) {
      return;
    }

    try {
      await this.musicSound.setIsLoopingAsync(true);
      await this.musicSound.setPositionAsync(0);
      await this.musicSound.playAsync();
    } catch {
      // Музыка не критична.
    }
  }

  private async stopMusic(): Promise<void> {
    if (!this.musicSound) {
      return;
    }

    try {
      await this.musicSound.stopAsync();
    } catch {
      // Музыка не критична.
    }
  }

  syncMusic = async (): Promise<void> => {
    try {
      const { musicEnabled } = useSettingsStore.getState();
      if (musicEnabled) {
        await this.startMusic();
      } else {
        await this.stopMusic();
      }
    } catch {
      // Музыка не критична.
    }
  };

  dispose = (): void => {
    if (this.unsubscribeSettings) {
      this.unsubscribeSettings();
      this.unsubscribeSettings = null;
    }

    const unload = async (sound?: Audio.Sound) => {
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

    this.clickPool.forEach((sound) => void unload(sound));
    this.clickPool = [];

    Object.values(this.simpleSounds).forEach((sound) => {
      if (sound) {
        void unload(sound);
      }
    });
    this.simpleSounds = {};

    void unload(this.musicSound);
    this.musicSound = null;

    this.initialized = false;
  };
}

export const AudioManager = new AudioManagerClass();