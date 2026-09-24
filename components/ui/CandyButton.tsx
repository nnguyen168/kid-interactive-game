"use client";

import Link from "next/link";
import { CSSProperties, ReactNode } from "react";
import { shade } from "@/lib/color";
import { sfx } from "@/lib/sfx";
import { ArtKey } from "@/lib/art";
import Art from "../Art";

type Size = "md" | "lg" | "xl";

const SIZES: Record<Size, string> = {
  md: "px-6 py-3 text-xl lg:text-2xl gap-2 rounded-[1.4rem]",
  lg: "px-8 py-4 text-2xl lg:text-3xl gap-3 rounded-[1.8rem]",
  xl: "px-10 py-5 text-3xl lg:text-4xl gap-4 rounded-[2.2rem]",
};

const ICON_SIZES: Record<Size, string> = {
  md: "w-8 h-8 lg:w-10 lg:h-10",
  lg: "w-10 h-10 lg:w-12 lg:h-12",
  xl: "w-12 h-12 lg:w-16 lg:h-16",
};

export function candyStyle(color: string): CSSProperties {
  return {
    background: `linear-gradient(180deg, ${shade(color, 0.2)} 0%, ${color} 55%, ${shade(color, -0.06)} 100%)`,
    boxShadow: `0 7px 0 ${shade(color, -0.35)}, 0 12px 22px rgba(0,0,0,0.18), inset 0 2px 0 rgba(255,255,255,0.45)`,
  };
}

export const CANDY_PRESS =
  "transition-[transform,box-shadow] duration-100 active:translate-y-[6px] active:!shadow-[0_1px_0_rgba(0,0,0,0.25)]";

export default function CandyButton({
  color,
  children,
  onClick,
  href,
  size = "lg",
  icon,
  iconRight,
  className = "",
  disabled,
  textColor = "#FFFFFF",
  autoFocus,
}: {
  color: string;
  children?: ReactNode;
  onClick?: () => void;
  href?: string;
  size?: Size;
  icon?: ArtKey;
  iconRight?: ReactNode;
  className?: string;
  disabled?: boolean;
  textColor?: string;
  /** Focus on appear, so Enter or Space continues without the mouse. */
  autoFocus?: boolean;
}) {
  const classes = `relative inline-flex items-center justify-center font-bold select-none ${SIZES[size]} ${CANDY_PRESS} disabled:opacity-50 ${className}`;
  const style = { ...candyStyle(color), color: textColor, textShadow: "0 2px 0 rgba(0,0,0,0.22)" };
  const content = (
    <>
      <span className="pointer-events-none absolute inset-x-4 top-1.5 h-[38%] rounded-full bg-white/25" />
      {icon && <Art name={icon} className={`relative ${ICON_SIZES[size]}`} eager />}
      {children && <span className="relative">{children}</span>}
      {iconRight && <span className="relative">{iconRight}</span>}
    </>
  );

  if (href) {
    return (
      <Link href={href} onClick={() => sfx.pop()} className={classes} style={style} data-nav autoFocus={autoFocus}>
        {content}
      </Link>
    );
  }
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        sfx.pop();
        onClick?.();
      }}
      className={classes}
      style={style}
      data-nav
      autoFocus={autoFocus}
    >
      {content}
    </button>
  );
}
