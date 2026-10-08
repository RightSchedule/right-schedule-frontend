"use client";

import { useSyncExternalStore } from "react";

const CHANGE_EVENT = "stored-flag-change";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/**
 * A boolean kept in localStorage for per-viewer conveniences such as a collapsed sidebar. Renders
 * `false` on the server and until storage is read, and falls back to `false` when storage is blocked.
 */
export function useStoredFlag(key: string): [boolean, (value: boolean) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return window.localStorage.getItem(key) === "1";
      } catch {
        return false;
      }
    },
    () => false
  );

  function set(next: boolean) {
    try {
      window.localStorage.setItem(key, next ? "1" : "0");
    } catch {
      // Storage unavailable: the flag then lasts only until the next render reads it back.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return [value, set];
}
