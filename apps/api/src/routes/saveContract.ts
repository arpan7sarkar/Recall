export class SaveValidationError extends Error {
  readonly status = 400;

  constructor(message: string) {
    super(message);
    this.name = "SaveValidationError";
  }
}

function optionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function normalizeSaveUrl(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new SaveValidationError("A valid URL is required.");
  }

  let parsed: URL;
  try {
    parsed = new URL(value.trim());
  } catch {
    throw new SaveValidationError("Please enter a valid URL.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new SaveValidationError("URL must use http or https.");
  }
  if (!parsed.hostname) {
    throw new SaveValidationError("Please enter a valid URL with a host.");
  }

  parsed.hash = "";
  const host = parsed.hostname.toLowerCase();
  if (host.includes("instagram.com")) {
    parsed.search = "";
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length >= 2 && ["reel", "p", "tv"].includes(parts[0])) {
      parsed.pathname = `/${parts[0]}/${parts[1]}/`;
    }
  }
  if (host.includes("linkedin.com")) parsed.search = "";
  return parsed.toString();
}

export function parseYoutubeTimestamp(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const raw = String(value).trim();
  if (!raw) return null;
  if (/^\d+$/.test(raw)) return Number(raw);
  const parts = raw.split(":");
  if (parts.length < 2 || parts.length > 3 || parts.some((part) => !/^\d+$/.test(part))) {
    throw new SaveValidationError("YouTube timestamp must be seconds, mm:ss, or hh:mm:ss.");
  }
  const numbers = parts.map(Number);
  const [hours, minutes, seconds] = parts.length === 2 ? [0, numbers[0], numbers[1]] : numbers;
  if (minutes > 59 || seconds > 59) {
    throw new SaveValidationError("YouTube timestamp must use valid minute and second values.");
  }
  return hours * 3600 + minutes * 60 + seconds;
}

export interface SaveMetadataInput {
  title?: unknown;
  author?: unknown;
  podcastName?: unknown;
  note?: unknown;
}

export function normalizeSaveMetadata(input: SaveMetadataInput) {
  return {
    title: optionalString(input.title),
    author: optionalString(input.author),
    podcastName: optionalString(input.podcastName),
    note: optionalString(input.note),
  };
}
