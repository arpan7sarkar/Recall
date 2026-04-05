"use client";

import { useEffect } from "react";

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: { ctrl?: boolean; meta?: boolean; alt?: boolean; shift?: boolean } = { ctrl: true, meta: true }
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const { ctrl = false, meta = false, alt = false, shift = false } = options;
      
      const ctrlMatched = ctrl ? e.ctrlKey : !e.ctrlKey;
      const metaMatched = meta ? e.metaKey : !e.metaKey;
      const altMatched = alt ? e.altKey : !e.altKey;
      const shiftMatched = shift ? e.shiftKey : !e.shiftKey;

      // Special case: if both ctrl and meta are true, allow either one (common for Windows/Mac parity)
      const ctrlMetaMatched = (options.ctrl && options.meta) 
        ? (e.ctrlKey || e.metaKey) 
        : (ctrlMatched && metaMatched);

      if (ctrlMetaMatched && altMatched && shiftMatched && e.key.toLowerCase() === key.toLowerCase()) {
        e.preventDefault();
        callback();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [key, callback, options.ctrl, options.meta, options.alt, options.shift]);
}
