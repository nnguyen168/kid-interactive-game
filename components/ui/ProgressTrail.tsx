import Art from "../Art";
import { ArtKey } from "@/lib/art";

/** Board-game style path: one stop per question, stars for completed ones. */
export default function ProgressTrail({
  total,
  results,
  color,
  goal = "trophy",
}: {
  total: number;
  results: boolean[];
  color: string;
  goal?: ArtKey;
}) {
  const current = results.length;
  return (
    <div className="flex max-w-full items-center rounded-full bg-white/85 px-2 py-2 sm:px-3 shadow-[0_5px_0_rgba(0,0,0,0.12)]">
      {Array.from({ length: total }, (_, i) => {
        const done = i < current;
        const isCurrent = i === current;
        return (
          <div key={i} className="flex items-center">
            {i > 0 && (
              <div className={`h-1.5 w-1 sm:w-4 lg:w-7 rounded-full ${i <= current ? "bg-amber-400" : "bg-slate-200"}`} />
            )}
            <div
              className={`flex items-center justify-center rounded-full w-4 h-4 sm:w-8 sm:h-8 lg:w-11 lg:h-11 ${isCurrent ? "pulse-soft" : ""}`}
              style={{
                background: done ? "transparent" : isCurrent ? color : "#E2E8F0",
                boxShadow: isCurrent ? `0 0 0 4px ${color}40` : undefined,
              }}
            >
              {done ? (
                <Art
                  name={results[i] ? "glowing-star" : "star"}
                  className={`pop-in ${results[i] ? "w-full h-full" : "w-[80%] h-[80%]"}`}
                  eager
                />
              ) : (
                <span className={`hidden sm:inline text-sm lg:text-lg font-bold ${isCurrent ? "text-white" : "text-slate-400"}`}>
                  {i + 1}
                </span>
              )}
            </div>
          </div>
        );
      })}
      <Art name={goal} className="ml-1 sm:ml-2 w-6 h-6 sm:w-8 sm:h-8 lg:w-11 lg:h-11" eager />
    </div>
  );
}
