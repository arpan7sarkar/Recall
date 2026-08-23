import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const requirements = {
  api: ["DATABASE_URL", "REDIS_URL"],
  worker: ["REDIS_URL"],
  web: [],
};

function readDotEnv(path) {
  if (!existsSync(path)) return {};
  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separator = line.indexOf("=");
        const name = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
        return [name, value];
      })
  );
}

const environment = {
  ...readDotEnv(resolve(root, "apps/api/.env")),
  ...readDotEnv(resolve(root, "apps/web/.env.local")),
  ...process.env,
};

export function validateEnvironment(values, requestedRole = "all") {
  const roles = requestedRole === "all" ? ["api", "worker", "web"] : [requestedRole];
  const unknownRoles = roles.filter((name) => !requirements[name]);
  if (unknownRoles.length > 0) {
    return { code: 2, message: `Unknown role: ${unknownRoles.join(", ")}. Use api, worker, web, or all.` };
  }

  const missing = [...new Set(roles.flatMap((name) => requirements[name].filter((key) => !values[key]?.trim())))];
  if (missing.length > 0) {
    return {
      code: 1,
      message: `Missing required environment variables: ${missing.join(", ")}\nCopy apps/api/.env.example to apps/api/.env and fill the service values.`,
    };
  }

  return { code: 0, message: `Environment contract valid for ${roles.join(", ")}` };
}

const role = process.argv.find((argument) => argument.startsWith("--role="))?.split("=")[1] ?? "all";
const result = validateEnvironment(environment, role);
const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  if (result.code === 0) console.log(result.message);
  else {
    console.error(result.message);
    process.exit(result.code);
  }
}
