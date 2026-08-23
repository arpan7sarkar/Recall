export interface TextStats {
  wordCount: number | null;
  readingTime: number | null;
}

export function calculateTextStats(value: string | null | undefined): TextStats {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return { wordCount: null, readingTime: null };

  const wordCount = text.split(/\s+/u).filter(Boolean).length;
  return {
    wordCount,
    readingTime: Math.max(1, Math.ceil(wordCount / 200)),
  };
}
