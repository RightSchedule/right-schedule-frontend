import { addTransitionType, startTransition } from "react";

export const EASE_OUT_EXPO = "cubic-bezier(0.16, 1, 0.3, 1)";

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Runs a state update as a React Transition tagged with a type, so `<ViewTransition>` can pick an animation. */
export function transition(type: string, update: () => void): void {
  startTransition(() => {
    addTransitionType(type);
    update();
  });
}

/** Grows `el` out of the `from` rect: clip-path reveal plus colour hand-off, so text is never scaled. */
export function morphFromRect(el: HTMLElement, from: DOMRect, source?: HTMLElement | null): void {
  if (prefersReducedMotion() || typeof el.animate !== "function") return;

  el.getAnimations().forEach((a) => a.cancel());
  const to = el.getBoundingClientRect();
  if (to.width === 0 || to.height === 0) return;

  const clamp = (n: number) => Math.max(0, Math.round(n));
  const start = `inset(${clamp(from.top - to.top)}px ${clamp(to.right - from.right)}px ${clamp(
    to.bottom - from.bottom
  )}px ${clamp(from.left - to.left)}px round 8px)`;
  const timing = { duration: 380, easing: EASE_OUT_EXPO, fill: "backwards" as const };

  const target = getComputedStyle(el);
  const finalBg = target.backgroundColor;
  const finalBorder = target.borderTopColor;
  const chip = source ? getComputedStyle(source) : null;

  el.animate(
    [
      {
        clipPath: start,
        backgroundColor: chip?.backgroundColor ?? finalBg,
        borderColor: chip?.borderTopColor ?? finalBorder,
      },
      { clipPath: "inset(0px 0px 0px 0px round 12px)", backgroundColor: finalBg, borderColor: finalBorder },
    ],
    timing
  );

  Array.from(el.children).forEach((child) => {
    child.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 220,
      delay: 110,
      easing: "ease-out",
      fill: "backwards",
    });
  });
}
