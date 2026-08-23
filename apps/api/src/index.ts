import "dotenv/config";
import crypto from "node:crypto";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { clerkMiddleware } from "@clerk/express";
import authRoutes from "./routes/auth";
import itemRoutes from "./routes/items";
import tagsRoutes from "./routes/tags";
import collectionsRoutes from "./routes/collections";
import searchRoutes from "./routes/search";
import graphRoutes from "./routes/graph";
import { getRuntimeDiagnostics } from "./runtime/environment";
import { getApiReadiness } from "./runtime/apiReadiness";
import { readinessHttpStatus } from "./runtime/readiness";

const app = express();
const PORT = parseInt(process.env.PORT || "4000", 10);
const HOST = process.env.HOST || "0.0.0.0";
const clerkClockSkewInMs = Number(process.env.CLERK_CLOCK_SKEW_MS ?? 15000);
const configuredCorsOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const defaultCorsOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
];
const allowedCorsOrigins = new Set([...defaultCorsOrigins, ...configuredCorsOrigins]);

// Standard middleware - ORDER MATTERS
// 1. CORS (must be first to handle preflight OPTIONS)
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (origin.startsWith("chrome-extension://")) {
        callback(null, true);
        return;
      }

      if (allowedCorsOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
// 2. Body parsing (must come before Clerk/auth middleware)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = req.header("x-request-id") || crypto.randomUUID();
  res.setHeader("X-Request-ID", requestId);
  next();
});
// 3. Clerk (Registered globally to initialize context)
app.use(
  clerkMiddleware({
    clockSkewInMs: Number.isFinite(clerkClockSkewInMs) ? clerkClockSkewInMs : 15000,
  })
);

// 4. Security & Logging
app.use(helmet());
app.use(morgan("dev"));

// Routes
app.use("/v1/auth", authRoutes);
app.use("/v1/items", itemRoutes);
app.use("/v1/tags", tagsRoutes);
app.use("/v1/collections", collectionsRoutes);
app.use("/v1/search", searchRoutes);
app.use("/v1/graph", graphRoutes);

/**
 * @route   GET /health
 * @desc    Health check endpoint
 * @access  Public
 */
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "recall-api",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/live", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "recall-api",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/ready", async (_req: Request, res: Response) => {
  try {
    const readiness = await getApiReadiness();
    res.status(readinessHttpStatus(readiness)).json({
      ...readiness,
      service: "recall-api",
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({
      status: "not_ready",
      checks: { runtime: { status: "error" } },
      service: "recall-api",
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @route   GET /
 * @desc    Welcome route
 * @access  Public
 */
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ message: "Welcome to Recall API - Your Recall" });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[GlobalError]", err.name, err.message);
  console.error(err.stack);
  const code = (err as Error & { code?: string }).code;
  if (code === "LIMIT_FILE_SIZE") {
    res.status(413).json({ error: "File exceeds the configured upload limit.", code });
    return;
  }
  if (err.name === "MulterError" || err.message.startsWith("Invalid file type")) {
    res.status(415).json({ error: err.message, code: "INVALID_UPLOAD" });
    return;
  }
  res.status(500).json({ error: "Something went wrong!" });
});

// Start server - bind the port FIRST so Render detects it
const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📡 Health check: http://${HOST}:${PORT}/health`);
  console.log("[API] Runtime diagnostics", getRuntimeDiagnostics());
});

// Graceful shutdown
const shutdown = () => {
  console.log("SIGTERM received, shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Catch unhandled errors to prevent silent crashes
process.on("unhandledRejection", (reason) => {
  console.error("[Unhandled Rejection]", reason);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("[Uncaught Exception]", err);
  process.exit(1);
});
