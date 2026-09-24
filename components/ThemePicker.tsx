"use client";

import { THEME_ORDER, THEMES } from "@/lib/themes";
import { useTheme } from "@/lib/ThemeContext";

export default function ThemePicker() {
  const { themeId, setThemeId } = useTheme();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {THEME_ORDER.map((id) => {
        const t = THEMES[id];
        const active = id === themeId;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setThemeId(id)}
            className={`rounded-3xl p-5 text-left shadow-md transition-transform active:scale-95 border-4 ${
              active ? "border-black/20" : "border-transparent"
            }`}
            style={{ backgroundColor: t.colors.soft }}
          >
            <div className="text-5xl mb-2">{t.mascotEmoji}</div>
            <div className="text-xl font-extrabold" style={{ color: t.colors.text }}>
              {t.name}
            </div>
            <div className="text-sm text-slate-600 mt-1">{t.tagline}</div>
            {active && (
              <div
                className="mt-3 inline-block rounded-full px-3 py-1 text-xs font-bold text-white"
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
