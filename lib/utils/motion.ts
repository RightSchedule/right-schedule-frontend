import { addTransitionType, startTransition, type CSSProperties } from "react";

/** Runs a state update as a React Transition tagged with a type, so `<ViewTransition>` can pick an animation. */
export function transition(type: string, update: () => void): void {
  startTransition(() => {
    addTransitionType(type);
    update();
  });
}

export const stagger = (i: number) => ({ "--i": i }) as CSSProperties;
