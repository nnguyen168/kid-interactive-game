"use client";

import { useEffect } from "react";

/**
 * App-wide keyboard play, so the whole game works without a mouse:
 * - Arrow keys jump between the main buttons of the screen (elements marked
 *   `data-nav`), choosing the nearest one in that direction.
 * - Enter or Space presses the focused button or link.
 * - Holding a key down does not fire the same button over and over.
 * Screens that use the arrows themselves (the 3D game) mark their root with
 * `data-arrow-keys="game"`; arrows are then left to the game unless a pop-up
 * with `data-nav` buttons is open.
 */

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
const ARROWS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

function visible(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
}

function candidates(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>("[data-nav]")].filter(
    (el) => !(el as HTMLButtonElement).disabled && visible(el),
  );
}

function center(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/** Nearest element in the arrow's direction, favouring ones straight ahead. */
function nextInDirection(from: HTMLElement, list: HTMLElement[], [dx, dy]: [number, number]) {
  const a = center(from);
  let best: HTMLElement | null = null;
  let bestScore = Infinity;
  for (const el of list) {
    if (el === from) continue;
    const b = center(el);
    const along = (b.x - a.x) * dx + (b.y - a.y) * dy;
    if (along <= 4) continue;
    const across = Math.abs((b.x - a.x) * dy) + Math.abs((b.y - a.y) * dx);
    const score = along + across * 2;
    if (score < bestScore) {
      bestScore = score;
      best = el;
    }
  }
  return best;
}

export default function KeyboardNav() {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const active = document.activeElement as HTMLElement | null;
      const onControl = !!active && active !== document.body && active.matches(FOCUSABLE);

      // A held key must not press the same button again and again.
      if (e.repeat && (e.key === "Enter" || e.key === " ") && onControl) {
        e.preventDefault();
        return;
      }

      // Links only react to Enter by default; let Space work too.
      if (e.key === " " && onControl && active instanceof HTMLAnchorElement) {
        e.preventDefault();
        active.click();
        return;
      }

      const dir = ARROWS[e.key];
      if (!dir) return;
      const list = candidates();
      if (list.length === 0) return;
      const game = document.querySelector('[data-arrow-keys="game"]');
      const inList = !!active && list.includes(active);
      // In the 3D game the arrows walk the hero; only steal them for an open pop-up.
      if (game && !list.some((el) => !game.contains(el) || el.closest("[data-popup]"))) return;
      e.preventDefault();
      if (!inList) {
        list[0].focus();
        return;
      }
      const next = nextInDirection(active!, list, dir);
      next?.focus();
    }

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, []);

  return null;
}
