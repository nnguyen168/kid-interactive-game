"use client";

import { ReactNode } from "react";

export default function BigButton({
  onClick,
  children,
  color,
  textColor,
  disabled,
  className = "",
}: {
  onClick?: () => void;
  children: ReactNode;
  color?: string;
  textColor?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={color ? { backgroundColor: color, color: textColor ?? "#fff" } : undefined}
      className={`rounded-3xl px-6 py-5 text-xl font-extrabold shadow-lg active:scale-95 transition-transform disabled:opacity-40 disabled:pointer-events-none ${
        color ? "" : "bg-slate-700 text-white"
      } ${className}`}
    >
      {children}
    </button>
  );
}
