"use client";

// Tiny synthesized sound effects (Web Audio) so the app needs no audio files.

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  freq: number,
  start: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.16,
  slideTo?: number
) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + start;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

let noiseBuffer: AudioBuffer | null = null;

/** Filtered white noise: water splashes, kicks and crowd roars. */
function noise(start: number, duration: number, volume: number, frequency: number, q = 1) {
  const ac = audio();
  if (!ac) return;
  if (!noiseBuffer) {
    noiseBuffer = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const t0 = ac.currentTime + start;
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer;
  src.loop = true;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = frequency;
  filter.Q.value = q;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + Math.min(0.08, duration / 3));
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start(t0);
  src.stop(t0 + duration + 0.05);
}

export const sfx = {
  unlock() {
    audio();
  },
  pop() {
    tone(520, 0, 0.1, "triangle", 0.14, 880);
  },
  count() {
    tone(880, 0, 0.12, "sine", 0.12, 1320);
  },
  correct() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.075, 0.22, "triangle", 0.15));
  },
  wrong() {
    tone(260, 0, 0.16, "sine", 0.13, 200);
    tone(200, 0.13, 0.22, "sine", 0.11, 150);
  },
  star() {
    [1318.5, 1760, 2093].forEach((f, i) => tone(f, i * 0.05, 0.16, "sine", 0.08));
  },
  fanfare() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
    notes.forEach((f, i) =>
      tone(f, i * 0.13, i === notes.length - 1 ? 0.7 : 0.18, "square", 0.05)
    );
  },
  whoosh() {
    tone(260, 0, 0.28, "sine", 0.07, 1100);
  },
  splash() {
    noise(0, 0.9, 0.16, 2200, 0.7);
    noise(0.1, 0.7, 0.08, 900, 0.9);
  },
  kick() {
    tone(150, 0, 0.14, "sine", 0.35, 55);
    noise(0, 0.06, 0.12, 3000, 1.2);
  },
  meow() {
    tone(760, 0, 0.18, "triangle", 0.09, 980);
    tone(980, 0.16, 0.32, "triangle", 0.08, 560);
  },
  cheer() {
    noise(0, 1.8, 0.12, 1100, 0.5);
    noise(0.05, 1.6, 0.08, 2400, 0.8);
  },
};
