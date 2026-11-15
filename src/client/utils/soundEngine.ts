type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

let sharedCtx: AudioContext | null = null;
let muted = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!sharedCtx) {
    const AudioCtx = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
    if (!AudioCtx) return null;
    try {
      sharedCtx = new AudioCtx();
    } catch {
      return null;
    }
  }
  if (sharedCtx.state === 'suspended') {
    void sharedCtx.resume().catch(() => undefined);
  }
  return sharedCtx;
}

export function initSoundEngine(): void {
  getAudioContext();
}

export function isSoundMuted(): boolean {
  return muted;
}

export function setSoundMuted(nextMuted: boolean): void {
  muted = nextMuted;
}

function scheduleTone(
  ctx: AudioContext,
  options: {
    type: OscillatorType;
    startFreq: number;
    endFreq: number;
    startTime: number;
    duration: number;
    gain: number;
    filterFreq?: number;
  }
): void {
  const { type, startFreq, endFreq, startTime, duration, gain, filterFreq } = options;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(startFreq, startTime);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), startTime + duration);

  amp.gain.setValueAtTime(0.0001, startTime);
  amp.gain.linearRampToValueAtTime(gain, startTime + 0.005);
  amp.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  if (filterFreq) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, startTime);
    osc.connect(filter);
    filter.connect(amp);
  } else {
    osc.connect(amp);
  }

  amp.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
}

/** Short, crisp wooden percussive click (~45ms). */
export function playMove(): void {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  scheduleTone(ctx, {
    type: 'triangle',
    startFreq: 250,
    endFreq: 95,
    startTime: now,
    duration: 0.045,
    gain: 0.18,
    filterFreq: 950,
  });
}

/** Sharper dual-tone capture thud (~70ms). */
export function playCapture(): void {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  scheduleTone(ctx, {
    type: 'triangle',
    startFreq: 310,
    endFreq: 80,
    startTime: now,
    duration: 0.07,
    gain: 0.2,
    filterFreq: 1300,
  });
  scheduleTone(ctx, {
    type: 'sine',
    startFreq: 680,
    endFreq: 210,
    startTime: now,
    duration: 0.035,
    gain: 0.1,
  });
}

/** Tense double-pulse check alert (~150ms). */
export function playCheck(): void {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  scheduleTone(ctx, {
    type: 'triangle',
    startFreq: 520,
    endFreq: 480,
    startTime: now,
    duration: 0.06,
    gain: 0.14,
  });
  scheduleTone(ctx, {
    type: 'triangle',
    startFreq: 660,
    endFreq: 600,
    startTime: now + 0.075,
    duration: 0.075,
    gain: 0.16,
  });
}

/** Low muted buzz for wrong move (~180ms). */
export function playMistake(): void {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  scheduleTone(ctx, {
    type: 'sawtooth',
    startFreq: 155,
    endFreq: 105,
    startTime: now,
    duration: 0.18,
    gain: 0.13,
    filterFreq: 380,
  });
}

/** Warm, uplifting 3-note major arpeggio chime (~350ms). */
export function playVictory(): void {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99];
  notes.forEach((freq, idx) => {
    const start = now + idx * 0.085;
    scheduleTone(ctx, {
      type: 'sine',
      startFreq: freq,
      endFreq: freq,
      startTime: start,
      duration: idx === 2 ? 0.18 : 0.13,
      gain: 0.13,
    });
  });
}

export function playBoardCue(isCheck: boolean, isCapture: boolean): void {
  if (isCheck) playCheck();
  else if (isCapture) playCapture();
  else playMove();
}
