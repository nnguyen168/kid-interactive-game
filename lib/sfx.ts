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
};
