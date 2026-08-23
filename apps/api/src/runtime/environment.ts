export type RuntimeRole = "api" | "worker";

const requiredEnvironment: Record<RuntimeRole, readonly string[]> = {
  api: ["DATABASE_URL", "REDIS_URL"],
  worker: ["REDIS_URL"],
};

export function getMissingEnvironment(
  role: RuntimeRole,
  environment: NodeJS.ProcessEnv = process.env
): string[] {
  return requiredEnvironment[role].filter((name) => !environment[name]?.trim());
}

export function getRuntimeDiagnostics(
  environment: NodeJS.ProcessEnv = process.env
): {
  nodeEnv: string;
  configured: Record<string, boolean>;
} {
  return {
    nodeEnv: environment.NODE_ENV ?? "development",
    configured: {
      database: Boolean(environment.DATABASE_URL?.trim()),
      redis: Boolean(environment.REDIS_URL?.trim()),
      clerk: Boolean(environment.CLERK_SECRET_KEY?.trim()),
      cors: Boolean(environment.CORS_ORIGINS?.trim()),
      storage: Boolean(
        environment.CLOUDFLARE_R2_BUCKET?.trim() &&
          environment.CLOUDFLARE_R2_ACCESS_KEY?.trim() &&
          environment.CLOUDFLARE_R2_SECRET_KEY?.trim() &&
          environment.CLOUDFLARE_R2_ENDPOINT?.trim()
      ),
      vector: Boolean(environment.PINECONE_API_KEY?.trim() && environment.PINECONE_INDEX?.trim()),
      ai: Boolean(environment.OPENAI_API_KEY?.trim()),
    },
  };
}
