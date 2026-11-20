"use client";

import { useState } from "react";
import { LineVisual, PicturesVisual, RevisionVisual } from "@/lib/content/revision";
import { NUMBER_WORDS } from "@/lib/content/maths";
import { sfx } from "@/lib/sfx";
import { speak } from "@/lib/speech";
import Art from "../Art";

function objectSize(total: number) {
  if (total <= 6) return "w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20";
  if (total <= 10) return "w-11 h-11 sm:w-14 sm:h-14 lg:w-16 lg:h-16";
  return "w-9 h-9 sm:w-11 sm:h-11 lg:w-12 lg:h-12";
}

/**
 * The objects of the sum. For "−", the last ones get crossed out one by one, as
 * a child does on paper; for "+", two groups side by side. Tap to count.
 */
function Pictures({ v, small = false }: { v: PicturesVisual; small?: boolean }) {
  const [counted, setCounted] = useState<number[]>([]);
  const minus = v.op === "-";
  const groups = minus ? [v.a] : [v.a, v.b];
  const total = minus ? v.a : v.a + v.b;
  const size = small ? "w-9 h-9 sm:w-11 sm:h-11 lg:w-12 lg:h-12" : objectSize(total);

  function tap(index: number) {
    const at = counted.indexOf(index);
    if (at >= 0) {
      speak(NUMBER_WORDS[at + 1]);
      return;
    }
    const n = counted.length + 1;
    setCounted([...counted, index]);
    sfx.count();
    speak(NUMBER_WORDS[n] ?? String(n));
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
      {groups.map((count, gi) => (
        <div key={gi} className="flex items-center gap-3 sm:gap-6">
          {gi > 0 && <span className="text-5xl font-bold text-slate-400 lg:text-6xl">+</span>}
          <div className="flex max-w-[36rem] flex-wrap justify-center gap-1.5 lg:gap-2.5">
            {Array.from({ length: count }, (_, i) => {
              const index = gi * v.a + i;
              const crossed = minus && i >= v.a - v.b;
              const order = i - (v.a - v.b);
              const badge = counted.indexOf(index) + 1;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={crossed}
                  onClick={() => tap(index)}
                  aria-label={crossed ? "enlevé" : "compter"}
                  className="pop-in relative rounded-2xl p-0.5 transition-transform enabled:active:scale-90"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <span
                    className={`block ${crossed ? "cross-out" : "float-y"}`}
                    style={crossed ? { animationDelay: `${900 + order * 450}ms` } : undefined}
                  >
                    <Art name={v.art} className={size} eager />
                  </span>
                  {crossed && (
                    <span
                      className="pop-in absolute inset-0 flex items-center justify-center text-4xl font-bold text-rose-500 lg:text-6xl"
                      style={{ animationDelay: `${900 + order * 450}ms` }}
                    >
                      ✕
                    </span>
                  )}
                  {badge > 0 && (
                    <span className="pop-in absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-base font-bold text-white shadow-[0_3px_0_#B45309] lg:h-9 lg:w-9 lg:text-xl">
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

const CELL = 64;
/** SVG shapes scale around their own centre, not the corner of the drawing. */
const GROW = { transformBox: "fill-box", transformOrigin: "center" } as const;
const BASE = 96;

/**
 * A number line with one hop per step, drawn one after the other. With `viaTen`,
 * the hops up to 10 and the hops after it have different colours.
 */
function NumberLine({ v, color, showEnd }: { v: LineVisual; color: string; showEnd: boolean }) {
  const count = v.hi - v.lo + 1;
  const width = count * CELL;
  const x = (n: number) => (n - v.lo) * CELL + CELL / 2;
  const dir = v.to > v.from ? 1 : -1;
  const hops = Array.from({ length: Math.abs(v.to - v.from) }, (_, i) => v.from + i * dir);

  return (
    <svg viewBox={`0 0 ${width} 156`} className="mx-auto block w-full" style={{ maxWidth: `${count * 4.2}rem` }} role="img" aria-label={`Ligne des nombres de ${v.lo} à ${v.hi}`}>
      <line x1={8} y1={BASE} x2={width - 8} y2={BASE} stroke="#94a3b8" strokeWidth={5} strokeLinecap="round" />
      {Array.from({ length: count }, (_, i) => {
        const n = v.lo + i;
        const isStart = n === v.from;
        const isEnd = showEnd && n === v.to;
        return (
          <g key={n}>
            <line x1={x(n)} y1={BASE - 10} x2={x(n)} y2={BASE + 10} stroke="#64748b" strokeWidth={4} strokeLinecap="round" />
            {(isStart || isEnd) && <circle cx={x(n)} cy={BASE + 30} r={21} fill={isEnd ? "#22c55e" : color} className={isEnd ? "pop-in" : undefined} style={GROW} />}
            <text
              x={x(n)}
              y={BASE + 39}
              textAnchor="middle"
              fontSize={n >= 10 ? 24 : 27}
              fontWeight={800}
              fill={isStart || isEnd ? "#ffffff" : "#334155"}
            >
              {n}
            </text>
          </g>
        );
      })}
      {hops.map((n, i) => {
        const x1 = x(n);
        const x2 = x(n + dir);
        const mid = (x1 + x2) / 2;
        const afterTen = v.viaTen && (dir < 0 ? n <= 10 : n >= 10);
        const stroke = afterTen ? "#8b5cf6" : "#f97316";
        const delay = `${400 + i * 450}ms`;
        return (
          <g key={n}>
            <path d={`M ${x1} ${BASE - 12} Q ${mid} ${BASE - 70} ${x2} ${BASE - 12}`} fill="none" stroke={stroke} strokeWidth={5} strokeLinecap="round" pathLength={1} className="draw-hop" style={{ animationDelay: delay }} />
            <circle cx={x2} cy={BASE - 12} r={6} fill={stroke} className="pop-in" style={{ ...GROW, animationDelay: `${400 + i * 450 + 350}ms` }} />
            <text x={mid} y={BASE - 46} textAnchor="middle" fontSize={18} fontWeight={800} fill={stroke} className="pop-in" style={{ ...GROW, animationDelay: delay }}>
              {i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function RevisionPicture({ visual, color, showEnd = false, small = false }: { visual: RevisionVisual; color: string; showEnd?: boolean; small?: boolean }) {
  return visual.kind === "pictures" ? <Pictures v={visual} small={small} /> : <NumberLine v={visual} color={color} showEnd={showEnd} />;
}
