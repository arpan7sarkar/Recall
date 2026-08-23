export class SaveFormValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SaveFormValidationError";
  }
}

export interface UrlSaveFormInput {
  url: string;
  selectedType: string | null;
  title?: string;
  author?: string;
  podcastName?: string;
  note?: string;
  youtubeTimestamp?: string;
  tags?: string[];
  collectionId?: string | null;
}

function normalizeOptional(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized || undefined;
}

export function parseYoutubeTimestamp(value: string | undefined): number | undefined {
  const raw = value?.trim();
  if (!raw) return undefined;
  if (/^\d+$/.test(raw)) return Number(raw);
  const parts = raw.split(":");
  if (parts.length < 2 || parts.length > 3 || parts.some((part) => !/^\d+$/.test(part))) {
    throw new SaveFormValidationError("YouTube timestamp must be seconds, mm:ss, or hh:mm:ss.");
  }
  const numbers = parts.map(Number);
  const [hours, minutes, seconds] = parts.length === 2 ? [0, numbers[0], numbers[1]] : numbers;
  if (minutes > 59 || seconds > 59) {
    throw new SaveFormValidationError("YouTube timestamp must use valid minute and second values.");
  }
  return hours * 3600 + minutes * 60 + seconds;
}

export function normalizeSaveUrl(value: string): string {
  const raw = value.trim();
  if (!raw) throw new SaveFormValidationError("A valid URL is required.");
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new SaveFormValidationError("Please enter a valid URL.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new SaveFormValidationError("URL must use http or https.");
  }
  if (!parsed.hostname) throw new SaveFormValidationError("Please enter a valid URL with a host.");
  parsed.hash = "";
  return parsed.toString();
}

export function buildUrlSavePayload(input: UrlSaveFormInput) {
  return {
    url: normalizeSaveUrl(input.url),
    itemType: input.selectedType ?? undefined,
    title: normalizeOptional(input.title),
    author: normalizeOptional(input.author),
    podcastName: normalizeOptional(input.podcastName),
    note: normalizeOptional(input.note),
    youtubeTimestamp: parseYoutubeTimestamp(input.youtubeTimestamp),
    tags: Array.from(new Set((input.tags ?? []).map((tag) => tag.trim()).filter(Boolean))),
    collectionId: input.collectionId || undefined,
  };
}
