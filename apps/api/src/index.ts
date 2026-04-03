import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";
import authRoutes from "./routes/auth";
import itemRoutes from "./routes/items";
import tagsRoutes from "./routes/tags";
import collectionsRoutes from "./routes/collections";
import searchRoutes from "./routes/search";
import graphRoutes from "./routes/graph";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Standard middleware
app.use(clerkMiddleware()); // Clerk sessions
app.use(helmet()); // Security headers
app.use(morgan("dev")); // Logging
app.use(cors()); // CORS support
app.use(express.json()); // JSON body parser
app.use(express.urlencoded({ extended: true }));

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
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

/**
 * @route   GET /
 * @desc    Welcome route
 * @access  Public
 */
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ message: "Welcome to Recall API — Your Second Brain" });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: Function) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
});
