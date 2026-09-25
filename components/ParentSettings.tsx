"use client";

import { useState } from "react";
import Art from "./Art";
import CandyButton from "./ui/CandyButton";
import { GearIcon } from "./ui/icons";
import { useProgress } from "@/lib/ProgressContext";
import { sfx } from "@/lib/sfx";
import { ArtKey } from "@/lib/art";
import { Level, Subject } from "@/lib/types";

const SUBJECTS: { id: Subject; label: string; art: ArtKey; levels: [string, string, string] }[] = [
  {
    id: "maths",
    label: "Les nombres",
    art: "numbers",
    levels: [
      "Compter jusqu'à 10, additions en images",
      "Calculs jusqu'à 10, nombres jusqu'à 20",
      "Calculs jusqu'à 20, doubles, suites",
    ],
  },
  {
    id: "francais",
    label: "Les lettres",
    art: "letters",
    levels: [
      "Lettres, majuscules, premières syllabes",
      "Lire des mots, syllabes, sons",
      "Rimes, syllabes manquantes, alphabet",
    ],
  },
];

/** A discreet gear for grown-ups: see and change the difficulty level of each subject. */
export default function ParentSettings() {
  const { progress, ready, setLevel } = useProgress();
  const [open, setOpen] = useState(false);

  function choose(subject: Subject, level: Level) {
    sfx.pop();
    setLevel(subject, level);
  }

  function resetAll() {
    sfx.whoosh();
    setLevel("maths", 1);
    setLevel("francais", 1);
  }

  return (
    <>
      <button
        type="button"
        aria-label="Espace parents"
        onClick={() => {
          sfx.pop();
          setOpen(true);
        }}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-slate-500 shadow-[0_4px_0_rgba(0,0,0,0.12)] transition hover:text-slate-700 lg:h-14 lg:w-14"
      >
        <GearIcon className="h-7 w-7 lg:h-8 lg:w-8" />
      </button>

      {open && ready && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-3 backdrop-blur-[2px]" data-popup>
          <div className="rise-in w-full max-w-2xl rounded-[2rem] border-4 border-white bg-sky-50 p-5 shadow-2xl sm:p-7" role="dialog" aria-label="Espace parents">
            <h2 className="text-2xl font-bold text-slate-800 sm:text-3xl">Espace parents</h2>
            <p className="mt-1 text-base text-slate-600 sm:text-lg">
              Choisissez le niveau des questions. Il monte tout seul quand votre enfant gagne des étoiles.
            </p>

            <div className="mt-5 flex flex-col gap-5">
              {SUBJECTS.map((s) => (
                <section key={s.id} className="rounded-3xl bg-white p-4 shadow-[0_4px_0_rgba(0,0,0,0.06)]">
                  <div className="flex items-center gap-3">
                    <Art name={s.art} className="h-10 w-10" eager />
                    <h3 className="text-xl font-bold text-slate-800">{s.label}</h3>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
                    {([1, 2, 3] as Level[]).map((level) => {
                      const current = progress.level[s.id] === level;
                      return (
                        <button
                          key={level}
                          type="button"
                          data-nav
                          aria-pressed={current}
                          onClick={() => choose(s.id, level)}
                          className={`flex flex-col items-center gap-1 rounded-2xl border-4 px-2 py-2 text-center transition ${
                            current ? "border-violet-500 bg-violet-50" : "border-slate-200 bg-white hover:border-violet-300"
                          }`}
                        >
                          <span className={`text-lg font-bold ${current ? "text-violet-700" : "text-slate-700"}`}>Niveau {level}</span>
                          <span className="text-xs leading-tight text-slate-500 sm:text-sm">{s.levels[level - 1]}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                data-nav
                onClick={resetAll}
                className="rounded-full border-2 border-slate-300 bg-white px-4 py-2 text-base font-bold text-slate-600 hover:border-slate-400"
              >
                Tout remettre au niveau 1
              </button>
              <CandyButton color="#7C3AED" size="md" onClick={() => setOpen(false)} autoFocus>
                Fermer
              </CandyButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
