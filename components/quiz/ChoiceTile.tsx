"use client";

import { CSSProperties, ReactNode } from "react";
import Art from "../Art";
import { candyStyle } from "../ui/CandyButton";

export type TileState = "idle" | "wrong" | "correct" | "hint" | "dim";

export const TILE_COLORS = ["#3B82F6", "#A855F7", "#F97316"];

const BURST: [number, number][] = [
  [-80, -70],
  [0, -105],
  [80, -70],
  [-100, 10],
  [100, 10],
  [0, 80],
];

export default function ChoiceTile({
  state,
  color,
  onSelect,
  onSpeak,
  children,
  label,
  wide = false,
}: {
  state: TileState;
  color: string;
  onSelect: () => void;
  onSpeak?: () => void;
  children: ReactNode;
  label: string;
  wide?: boolean;
}) {
  const tileColor = state === "correct" ? "#22C55E" : state === "wrong" ? "#CBD5E1" : color;
  const animation =
    state === "correct" ? "bounce-once" : state === "wrong" ? "shake" : state === "hint" ? "hint-glow" : "";
  const disabled = state === "wrong" || state === "correct" || state === "dim";

  return (
    <div className={`relative ${state === "dim" ? "opacity-40" : ""} transition-opacity`}>
      <button
        type="button"
        aria-label={label}
        disabled={disabled}
        onClick={onSelect}
        data-nav
        className={`relative flex w-full ${wide ? "min-h-24 px-6 py-5 lg:min-h-40" : "aspect-[4/3] lg:aspect-[16/10]"} items-center justify-center rounded-[1.8rem] lg:rounded-[2.4rem] transition-[transform,box-shadow] duration-100 enabled:active:translate-y-[6px] enabled:active:!shadow-[0_1px_0_rgba(0,0,0,0.25)] ${animation}`}
        style={candyStyle(tileColor)}
      >
        <span className="pointer-events-none absolute inset-x-5 top-2 h-[30%] rounded-full bg-white/25" />
        <span className="relative flex items-center justify-center">{children}</span>
        {state === "correct" && (
          <span className="pop-in absolute -top-3 -right-3 flex h-10 w-10 lg:h-14 lg:w-14 items-center justify-center rounded-full bg-white text-2xl lg:text-3xl font-bold text-green-600 shadow-md">
            ✓
          </span>
        )}
        {state === "wrong" && (
          <span className="pop-in absolute -top-3 -right-3 flex h-10 w-10 lg:h-14 lg:w-14 items-center justify-center rounded-full bg-white text-2xl lg:text-3xl font-bold text-rose-500 shadow-md">
            ✕
          </span>
        )}
      </button>

      {onSpeak && state !== "correct" && state !== "wrong" && (
        <button
          type="button"
          aria-label="Écouter le mot"
          onClick={onSpeak}
          className="absolute -top-3 -left-3 flex h-11 w-11 lg:h-14 lg:w-14 items-center justify-center rounded-full bg-white shadow-[0_4px_0_rgba(0,0,0,0.15)] active:translate-y-1"
        >
          <Art name="speaker" className="w-7 h-7 lg:w-9 lg:h-9" eager />
        </button>
      )}

      {state === "correct" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
          {BURST.map(([dx, dy], i) => (
            <span
              key={i}
              className="star-burst absolute"
              style={{ "--dx": `${dx}px`, "--dy": `${dy}px`, animationDelay: `${i * 30}ms` } as CSSProperties}
            >
              <Art name="glowing-star" className="w-10 h-10 lg:w-14 lg:h-14" eager />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
