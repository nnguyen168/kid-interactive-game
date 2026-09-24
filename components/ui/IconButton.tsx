"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { sfx } from "@/lib/sfx";
import { ArtKey } from "@/lib/art";
import Art from "../Art";
import { CANDY_PRESS, candyStyle } from "./CandyButton";

export default function IconButton({
  art,
  children,
  label,
  href,
  onClick,
  color = "#FFFFFF",
  className = "",
}: {
  art?: ArtKey;
  children?: ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  color?: string;
  className?: string;
}) {
  const classes = `relative inline-flex shrink-0 items-center justify-center rounded-full w-14 h-14 sm:w-16 sm:h-16 lg:w-[4.5rem] lg:h-[4.5rem] ${CANDY_PRESS} ${className}`;
  const inner = art ? <Art name={art} className="w-9 h-9 sm:w-11 sm:h-11 lg:w-12 lg:h-12" eager /> : children;

  if (href) {
    return (
      <Link href={href} aria-label={label} onClick={() => sfx.pop()} className={classes} style={candyStyle(color)}>
        {inner}
      </Link>
    );
  }
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        sfx.pop();
        onClick?.();
      }}
      className={classes}
      style={candyStyle(color)}
    >
      {inner}
    </button>
  );
}
