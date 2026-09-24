"use client";

import { useEffect, useSyncExternalStore } from "react";

// A tiny global store so any mascot on screen can animate its mouth while
// the browser's French text-to-speech is talking.

let speaking = false;
let currentId = 0;
let voice: SpeechSynthesisVoice | null = null;
const listeners = new Set<() => void>();

function setSpeaking(value: boolean) {
  if (speaking === value) return;
  speaking = value;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function pickVoice() {
  const french = window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang?.toLowerCase().startsWith("fr"));
  voice =
    french.find((v) => /google|amélie|amelie|audrey|marie|denise|premium|enhanced|natural/i.test(v.name)) ??
    french[0] ??
    null;
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  pickVoice();
  window.speechSynthesis.addEventListener("voiceschanged", pickVoice);
}

export function speak(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onEnd?.();
    return;
  }
  const synth = window.speechSynthesis;
  if (!voice) pickVoice();
  const id = ++currentId;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "fr-FR";
  utterance.rate = 0.92;
  utterance.pitch = 1.15;
  if (voice) utterance.voice = voice;
  // Interrupted utterances still fire end/error, so only the latest one may
  // update the shared state or run its callback.
  utterance.onstart = () => {
    if (id === currentId) setSpeaking(true);
  };
  utterance.onend = () => {
    if (id !== currentId) return;
    setSpeaking(false);
    onEnd?.();
  };
  utterance.onerror = () => {
    if (id === currentId) setSpeaking(false);
  };
  synth.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  currentId++;
  window.speechSynthesis.cancel();
  setSpeaking(false);
}

/** Reads `text` aloud whenever `key` changes (e.g. a new question appears). */
export function useAutoSpeak(text: string | null, key: string | number | null) {
  useEffect(() => {
    if (!text) return;
    const timer = setTimeout(() => speak(text), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

export function useIsSpeaking(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => speaking,
    () => false
  );
}

const PRAISE = ["Bravo !", "Super !", "Génial !", "Excellent !", "Tu es un champion !", "Trop fort !", "Magnifique !"];
const ENCOURAGE = ["Presque ! Essaie encore.", "Oups ! Réessaie.", "Pas grave, encore une fois !"];

export function randomPraise(): string {
  return PRAISE[Math.floor(Math.random() * PRAISE.length)];
}

export function randomEncouragement(): string {
  return ENCOURAGE[Math.floor(Math.random() * ENCOURAGE.length)];
}
