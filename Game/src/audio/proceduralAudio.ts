export type GeneratedAudioName =
  | 'click'
  | 'toggleOn'
  | 'toggleOff'
  | 'tab'
  | 'success'
  | 'error'
  | 'music';

export type MusicStyle = 'calm' | 'mystic' | 'energetic';

export interface MusicOptions {
  seed: number;
  style: MusicStyle;
}

const SAMPLE_RATE = 22050;

const BASE64_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const NOTE = {
  E2: 82.41,
  A2: 110.0,
  A3: 220.0,
  G4: 392.0,
  A4: 440.0,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  G5: 783.99,
  A5: 880.0,
};

type WaveType = 'sine' | 'square' | 'triangle';

interface ToneOptions {
  start: number;
  duration: number;
  freq: number;
  volume: number;
  type?: WaveType;
  attack?: number;
  release?: number;
  pitchEnd?: number;
}

const createSamples = (durationSeconds: number): Float32Array => {
  return new Float32Array(Math.max(1, Math.floor(durationSeconds * SAMPLE_RATE)));
};

const writeString = (view: DataView, offset: number, text: string): void => {
  for (let i = 0; i < text.length; i += 1) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
};

const bytesToBase64 = (bytes: Uint8Array): string => {
  let result = '';
  let part = '';
  const flush = () => {
    result += part;
    part = '';
  };
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const triplet = (b0 << 16) | (b1 << 8) | b2;
    part += BASE64_CHARS[(triplet >> 18) & 63];
    part += BASE64_CHARS[(triplet >> 12) & 63];
    part += i + 1 < bytes.length ? BASE64_CHARS[(triplet >> 6) & 63] : '=';
    part += i + 2 < bytes.length ? BASE64_CHARS[triplet & 63] : '=';
    if (part.length > 8192) {
      flush();
    }
  }
  flush();
  return result;
};

const encodeWavBase64 = (samples: Float32Array): string => {
  const dataSize = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    const value = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    view.setInt16(offset, Math.round(value), true);
    offset += 2;
  }
  return bytesToBase64(new Uint8Array(buffer));
};

const addTone = (samples: Float32Array, options: ToneOptions): void => {
  const duration = Math.max(0, options.duration);
  if (duration <= 0) {
    return;
  }
  const startSample = Math.max(0, Math.floor(options.start * SAMPLE_RATE));
  const durationSamples = Math.floor(duration * SAMPLE_RATE);
  const endSample = Math.min(samples.length, startSample + durationSamples);
  const type = options.type || 'sine';
  const attack = Math.max(0.001, options.attack ?? 0.005);
  const release = Math.max(0.001, options.release ?? 0.02);
  const pitchEnd = options.pitchEnd;
  let phase = 0;
  for (let i = startSample; i < endSample; i += 1) {
    const t = (i - startSample) / SAMPLE_RATE;
    const progress = duration > 0 ? t / duration : 0;
    const currentFrequency =
      pitchEnd === undefined
        ? options.freq
        : options.freq + (pitchEnd - options.freq) * progress;
    phase += (2 * Math.PI * currentFrequency) / SAMPLE_RATE;
    let sample = 0;
    if (type === 'sine') {
      sample = Math.sin(phase);
    } else if (type === 'square') {
      sample = Math.sin(phase) >= 0 ? 1 : -1;
    } else {
      sample = (2 / Math.PI) * Math.asin(Math.sin(phase));
    }
    let envelope = 1;
    if (t < attack) {
      envelope = Math.max(0, t / attack);
    } else if (t > duration - release) {
      envelope = Math.max(0, (duration - t) / release);
    }
    samples[i] += sample * options.volume * envelope;
  }
};

const applyFade = (samples: Float32Array, fadeSeconds: number): void => {
  const fadeSamples = Math.floor(fadeSeconds * SAMPLE_RATE);
  if (fadeSamples <= 0 || samples.length <= fadeSamples * 2) {
    return;
  }
  for (let i = 0; i < fadeSamples; i += 1) {
    const k = i / fadeSamples;
    samples[i] *= k;
    samples[samples.length - 1 - i] *= k;
  }
};

const buildClick = (): string => {
  const samples = createSamples(0.05);
  addTone(samples, {
    start: 0,
    duration: 0.042,
    freq: 880,
    pitchEnd: 1320,
    volume: 0.46,
    type: 'triangle',
    attack: 0.001,
    release: 0.02,
  });
  addTone(samples, {
    start: 0,
    duration: 0.018,
    freq: 1760,
    volume: 0.14,
    type: 'sine',
    attack: 0.001,
    release: 0.012,
  });
  return encodeWavBase64(samples);
};

const buildToggleOn = (): string => {
  const samples = createSamples(0.1);
  addTone(samples, {
    start: 0,
    duration: 0.045,
    freq: 660,
    volume: 0.34,
    type: 'triangle',
    attack: 0.002,
    release: 0.018,
  });
  addTone(samples, {
    start: 0.045,
    duration: 0.05,
    freq: 990,
    volume: 0.34,
    type: 'triangle',
    attack: 0.002,
    release: 0.022,
  });
  return encodeWavBase64(samples);
};

const buildToggleOff = (): string => {
  const samples = createSamples(0.1);
  addTone(samples, {
    start: 0,
    duration: 0.045,
    freq: 660,
    volume: 0.32,
    type: 'triangle',
    attack: 0.002,
    release: 0.018,
  });
  addTone(samples, {
    start: 0.045,
    duration: 0.05,
    freq: 440,
    volume: 0.32,
    type: 'triangle',
    attack: 0.002,
    release: 0.022,
  });
  return encodeWavBase64(samples);
};

const buildTab = (): string => {
  const samples = createSamples(0.07);
  addTone(samples, {
    start: 0,
    duration: 0.03,
    freq: 520,
    volume: 0.22,
    type: 'sine',
    attack: 0.002,
    release: 0.016,
  });
  addTone(samples, {
    start: 0.028,
    duration: 0.034,
    freq: 780,
    volume: 0.2,
    type: 'sine',
    attack: 0.002,
    release: 0.018,
  });
  return encodeWavBase64(samples);
};

const buildSuccess = (): string => {
  const samples = createSamples(0.3);
  const notes = [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.A5];
  notes.forEach((freq, index) => {
    addTone(samples, {
      start: index * 0.055,
      duration: 0.14,
      freq,
      volume: 0.22,
      type: 'sine',
      attack: 0.004,
      release: 0.06,
    });
  });
  return encodeWavBase64(samples);
};

const buildError = (): string => {
  const samples = createSamples(0.2);
  addTone(samples, {
    start: 0,
    duration: 0.18,
    freq: 190,
    pitchEnd: 120,
    volume: 0.26,
    type: 'square',
    attack: 0.004,
    release: 0.06,
  });
  addTone(samples, {
    start: 0,
    duration: 0.16,
    freq: 95,
    volume: 0.16,
    type: 'sine',
    attack: 0.004,
    release: 0.05,
  });
  return encodeWavBase64(samples);
};

// Детерминированный RNG (mulberry32): один seed = одна и та же мелодия.
const mulberry32 = (seed: number): (() => number) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const SCALES: Record<string, number[]> = {
  majorPent: [0, 2, 4, 7, 9],
  minorPent: [0, 3, 5, 7, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
};

const ROOTS = [98.0, 110.0, 123.47, 130.81, 146.83, 164.81];

const noteFreq = (root: number, semitones: number, octave: number): number =>
  root * Math.pow(2, octave + semitones / 12);

// Генератор фоновой мелодии из seed+style: пад, бас-пульс, мелодия по ладу,
// эхо и стилевые украшения. 8 секунд, applyFade для бесшовного loop.
const buildMusicFromSeed = (seed: number, style: MusicStyle): string => {
  const rnd = mulberry32(Math.max(1, Math.floor(seed)) || 7);
  const duration = 8.0;
  const samples = createSamples(duration);
  const scaleName =
    style === 'mystic'
      ? 'dorian'
      : style === 'energetic'
      ? 'minorPent'
      : rnd() < 0.5
      ? 'majorPent'
      : 'minorPent';
  const scale = SCALES[scaleName] || SCALES.minorPent;
  const root = ROOTS[Math.floor(rnd() * ROOTS.length)] || 110.0;
  const step = style === 'energetic' ? 0.25 : style === 'mystic' ? 0.66 : 0.5;

  const padFreqs = [
    noteFreq(root, 0, 0),
    noteFreq(root, scale[2] ?? 7, 0),
    noteFreq(root, scale[4] ?? 12, 0),
  ];
  padFreqs.forEach((freq) => {
    addTone(samples, {
      start: 0,
      duration: duration - 0.1,
      freq,
      volume: style === 'energetic' ? 0.05 : 0.06,
      type: 'sine',
      attack: 0.4,
      release: 0.8,
    });
    if (style === 'mystic') {
      addTone(samples, {
        start: 0,
        duration: duration - 0.1,
        freq: freq * 1.003,
        volume: 0.03,
        type: 'sine',
        attack: 0.5,
        release: 0.9,
      });
    }
  });

  for (let t = 0; t < duration - 0.5; t += 2) {
    addTone(samples, {
      start: t,
      duration: 0.9,
      freq: noteFreq(root, 0, -1),
      volume: style === 'energetic' ? 0.09 : 0.06,
      type: 'sine',
      attack: 0.02,
      release: 0.3,
    });
  }

  const steps = Math.floor((duration - 1) / step);
  for (let i = 0; i < steps; i += 1) {
    if (style === 'mystic' && rnd() < 0.4) {
      continue;
    }
    const degree = scale[Math.floor(rnd() * scale.length)] ?? 0;
    const octave = rnd() < 0.25 ? 2 : 1;
    const freq = noteFreq(root, degree, octave);
    const volume = style === 'energetic' ? 0.09 : 0.1;
    const type: WaveType = style === 'energetic' ? 'triangle' : 'sine';
    addTone(samples, {
      start: i * step,
      duration: step * 0.9,
      freq,
      volume,
      type,
      attack: 0.015,
      release: step * 0.4,
    });
    if (rnd() < 0.3) {
      addTone(samples, {
        start: i * step + step / 2,
        duration: step * 0.7,
        freq,
        volume: volume * 0.35,
        type: 'sine',
        attack: 0.01,
        release: step * 0.3,
      });
    }
    if (style === 'mystic' && rnd() < 0.2) {
      addTone(samples, {
        start: i * step,
        duration: 0.3,
        freq: noteFreq(root, degree, 3),
        volume: 0.02,
        type: 'sine',
        attack: 0.01,
        release: 0.15,
      });
    }
  }

  applyFade(samples, 0.05);
  return encodeWavBase64(samples);
};

export const generateAudioAssets = (
  opts?: MusicOptions
): Record<GeneratedAudioName, string> => {
  const seed = opts?.seed ?? 7;
  const style: MusicStyle = opts?.style ?? 'calm';
  return {
    click: buildClick(),
    toggleOn: buildToggleOn(),
    toggleOff: buildToggleOff(),
    tab: buildTab(),
    success: buildSuccess(),
    error: buildError(),
    music: buildMusicFromSeed(seed, style),
  };
};