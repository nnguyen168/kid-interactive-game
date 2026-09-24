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
      className={`rounded-3xl px-6 py-5 lg:px-9 lg:py-6 text-xl lg:text-2xl font-extrabold shadow-[0_6px_0_rgba(0,0,0,0.25)] active:shadow-[0_2px_0_rgba(0,0,0,0.25)] active:translate-y-1 transition-[transform,box-shadow] disabled:opacity-40 disabled:pointer-events-none ${
        color ? "" : "bg-slate-700 text-white"
      } ${className}`}
    >
      {children}
    </button>
  );
}
