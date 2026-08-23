import type { CorsOptions } from "cors";

const localCorsOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
];

export type CorsEnvironment = Readonly<{
  NODE_ENV?: string;
  CORS_ORIGINS?: string;
}>;

export function getAllowedCorsOrigins(environment: CorsEnvironment = process.env): Set<string> {
  const configuredOrigins = (environment.CORS_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const defaults = environment.NODE_ENV === "production" ? [] : localCorsOrigins;
  return new Set([...defaults, ...configuredOrigins]);
}

export function createCorsOptions(environment: CorsEnvironment = process.env): CorsOptions {
  const allowedOrigins = getAllowedCorsOrigins(environment);

  return {
    origin: (origin, callback) => {
      if (!origin || origin.startsWith("chrome-extension://") || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  };
}
