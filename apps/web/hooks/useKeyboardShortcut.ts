"use client";

import { useEffect } from "react";

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  meta = true
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const metaPressed = meta ? e.metaKey || e.ctrlKey : true;
      if (metaPressed && e.key.toLowerCase() === key.toLowerCase()) {
        e.preventDefault();
        callback();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [key, callback, meta]);
}
