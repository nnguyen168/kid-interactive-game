"use client";

import { THEME_ORDER, THEMES } from "@/lib/themes";
import { useTheme } from "@/lib/ThemeContext";

export default function ThemePicker() {
  const { themeId, setThemeId } = useTheme();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
      {THEME_ORDER.map((id) => {
        const t = THEMES[id];
        const active = id === themeId;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setThemeId(id)}
            className={`rounded-3xl p-5 lg:p-7 text-left shadow-md hover:-translate-y-1 hover:shadow-xl active:scale-95 active:translate-y-0 transition-all border-4 ${
              active ? "border-black/20" : "border-transparent"
            }`}
            style={{ backgroundColor: t.colors.soft }}
          >
            <div className="text-5xl lg:text-7xl mb-2 lg:mb-3 animate-float">{t.mascotEmoji}</div>
            <div className="text-xl lg:text-3xl font-extrabold" style={{ color: t.colors.text }}>
              {t.name}
            </div>
            <div className="text-sm lg:text-base text-slate-600 mt-1">{t.tagline}</div>
            {active && (
              <div
                className="mt-3 inline-block rounded-full px-3 py-1 lg:px-4 lg:py-1.5 text-xs lg:text-sm font-bold text-white"
                style={{ backgroundColor: t.colors.primary }}
              >
                Choisi ✓
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
