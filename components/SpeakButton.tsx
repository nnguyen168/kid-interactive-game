"use client";

import { useSpeak } from "@/lib/useSpeech";

export default function SpeakButton({
  text,
  label = "Écouter",
  size = "md",
}: {
  text: string;
  label?: string;
  size?: "sm" | "md";
}) {
  const speak = useSpeak();
  const dimensions = size === "sm" ? "h-10 w-10 text-xl" : "h-14 w-14 text-2xl";

  return (
    <button
      type="button"
      onClick={() => speak(text)}
      aria-label={label}
      className={`${dimensions} shrink-0 rounded-full bg-white shadow-md ring-2 ring-black/5 flex items-center justify-center active:scale-90 transition-transform hover:ring-black/10`}
    >
      🔊
    </button>
  );
}
