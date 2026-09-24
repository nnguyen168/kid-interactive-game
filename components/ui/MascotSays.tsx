"use client";

import { ReactNode } from "react";
import { ThemeId } from "@/lib/types";
import { speak, useAutoSpeak } from "@/lib/speech";
import { frenchSpaces } from "@/lib/text";
import Mascot, { MascotMood } from "../Mascot";
import Art from "../Art";

const MASCOT_SIZES = {
  md: "w-20 sm:w-28 lg:w-32",
  lg: "w-32 sm:w-44 lg:w-56",
};

/** The hero with a speech bubble. Tapping either replays the voice. */
export default function MascotSays({
  themeId,
  text,
  speakText,
  mood = "idle",
  autoSpeak = true,
  speakKey,
  size = "md",
  stacked = false,
  children,
}: {
  themeId: ThemeId;
  text: string;
  speakText?: string;
  mood?: MascotMood;
  autoSpeak?: boolean;
  speakKey?: string | number;
  size?: keyof typeof MASCOT_SIZES;
  stacked?: boolean;
  children?: ReactNode;
}) {
  const voice = speakText ?? text;
  useAutoSpeak(autoSpeak ? voice : null, speakKey ?? voice);

  const bubble = (
    <button
      key={speakKey ?? voice}
      type="button"
      onClick={() => speak(voice)}
      className={`rise-in relative flex items-center gap-3 rounded-[2rem] bg-white px-5 py-3 text-left shadow-[0_6px_0_rgba(0,0,0,0.1)] sm:py-4 lg:px-7 lg:py-4 ${
        stacked ? "w-full max-w-md" : "mb-6 flex-1 sm:mb-10"
      }`}
    >
      <span
        className={`absolute h-6 w-6 rotate-45 rounded-sm bg-white ${
          stacked ? "-bottom-2.5 left-1/2 -translate-x-1/2" : "-left-2.5 bottom-7"
        }`}
      />
      <span className="relative flex-1 text-xl font-semibold leading-snug text-slate-800 sm:text-2xl lg:text-[1.8rem]">
        {children ?? frenchSpaces(text)}
      </span>
      <Art name="speaker" className="relative h-8 w-8 shrink-0 lg:h-10 lg:w-10" eager alt="écouter" />
    </button>
  );

  const hero = (
    <button type="button" onClick={() => speak(voice)} aria-label="Réécouter" className="shrink-0">
      <Mascot themeId={themeId} mood={mood} className={MASCOT_SIZES[size]} />
    </button>
  );

  if (stacked) {
    return (
      <div className="flex w-full flex-col items-center gap-3">
        {bubble}
        {hero}
      </div>
    );
  }
  return (
    <div className="flex w-full items-end gap-1 sm:gap-3">
      {hero}
      {bubble}
    </div>
  );
}
