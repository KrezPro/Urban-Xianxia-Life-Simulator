export type GeneratedAudioName =
  | 'click'
  | 'toggleOn'
  | 'toggleOff'
  | 'tab'
  | 'success'
  | 'error'
  | 'music';

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

const buildMusic = (): string => {
  const duration = 4.0;
  const samples = createSamples(duration);

  addTone(samples, {
    start: 0,
    duration: 3.9,
    freq: NOTE.A2,
    volume: 0.065,
    type: 'sine',
    attack: 0.25,
    release: 0.55,
  });

  addTone(samples, {
    start: 2.0,
    duration: 1.9,
    freq: NOTE.E2,
    volume: 0.055,
    type: 'sine',
    attack: 0.2,
    release: 0.45,
  });

  addTone(samples, {
    start: 0,
    duration: 3.9,
    freq: NOTE.A3,
    volume: 0.028,
    type: 'triangle',
    attack: 0.5,
    release: 0.7,
  });

  const melody = [NOTE.A4, NOTE.C5, NOTE.E5, NOTE.D5, NOTE.C5, NOTE.A4, NOTE.G4, NOTE.A4];
  melody.forEach((freq, index) => {
    addTone(samples, {
      start: index * 0.5,
      duration: 0.42,
      freq,
      volume: 0.11,
      type: 'sine',
      attack: 0.02,
      release: 0.14,
    });
  });

  addTone(samples, {
    start: 0.5,
    duration: 0.22,
    freq: NOTE.E5,
    volume: 0.025,
    type: 'sine',
    attack: 0.02,
    release: 0.08,
  });

  addTone(samples, {
    start: 2.5,
    duration: 0.22,
    freq: NOTE.G5,
    volume: 0.02,
    type: 'sine',
    attack: 0.02,
    release: 0.08,
  });

  applyFade(samples, 0.035);
  return encodeWavBase64(samples);
};

export const generateAudioAssets = (): Record<GeneratedAudioName, string> => {
  return {
    click: buildClick(),
    toggleOn: buildToggleOn(),
    toggleOff: buildToggleOff(),
    tab: buildTab(),
    success: buildSuccess(),
    error: buildError(),
    music: buildMusic(),
  };
};