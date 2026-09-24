import { Theme } from "@/lib/types";
import Art from "../Art";

/** A tiny story for the challenge: each answer moves the hero toward the goal. */
export default function ChallengeTrack({ theme, steps, total }: { theme: Theme; steps: number; total: number }) {
  const pct = Math.min(1, steps / total);
  const reached = steps >= total;
  return (
    <div className="relative h-16 w-full max-w-4xl rounded-full bg-white/85 shadow-[0_6px_0_rgba(0,0,0,0.12)] sm:h-20">
      <div className="absolute left-12 right-24 top-1/2 h-3 -translate-y-1/2 rounded-full bg-slate-200 sm:left-14 sm:right-28 lg:h-4">
        <div className="h-full rounded-full bg-amber-400 transition-[width] duration-700" style={{ width: `${pct * 100}%` }} />
        {Array.from({ length: total - 1 }, (_, i) => (
          <span
            key={i}
            className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full lg:h-4 lg:w-4 ${i < steps ? "bg-amber-500" : "bg-white"}`}
            style={{ left: `${((i + 1) / total) * 100}%` }}
          />
        ))}
      </div>
      <div
        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-[left] duration-700 ease-out"
        style={{ left: `calc(3rem + (100% - 9rem) * ${pct})` }}
      >
        <Art key={steps} name={theme.challenge.mover} className="bounce-once w-12 h-12 sm:w-16 sm:h-16" eager />
      </div>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 sm:right-4">
        <Art name={theme.challenge.target} className={`w-14 h-14 sm:w-[4.5rem] sm:h-[4.5rem] ${reached ? "bounce-once" : ""}`} eager />
      </div>
    </div>
  );
}
