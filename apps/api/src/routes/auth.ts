import { Router, Request, Response } from "express";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { authenticateClerk } from "@/middleware/auth";

const router = Router();

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateToken(): string {
  return `recall_ext_${crypto.randomBytes(32).toString("hex")}`;
}

const EXPIRY_DAYS_OPTIONS = [1, 7, 30, 90] as const;

// ────────────────────────────────────────────────────────────
// Extension Token Management (requires Clerk auth from website)
// ────────────────────────────────────────────────────────────

/**
 * @route   POST /auth/extension-tokens
 * @desc    Generate a new extension access token (shown once)
 * @access  Private (Clerk)
 */
router.post("/extension-tokens", authenticateClerk, async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { label, expiresInDays } = req.body ?? {};
  const days = EXPIRY_DAYS_OPTIONS.includes(expiresInDays) ? expiresInDays : 7;
  const tokenLabel = typeof label === "string" && label.trim().length > 0 ? label.trim().slice(0, 64) : "My Extension";

  try {
    // Limit active tokens per user to 5
    const activeCount = await prisma.extensionToken.count({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    });

    if (activeCount >= 5) {
      return res.status(400).json({ error: "You can have at most 5 active extension tokens. Revoke an existing one first." });
    }

    const plainToken = generateToken();
    const tokenHash = hashToken(plainToken);
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const record = await prisma.extensionToken.create({
      data: {
        userId,
        tokenHash,
        label: tokenLabel,
        expiresAt,
      },
    });

    // Return the plaintext token ONCE — frontend must display & let user copy
    res.status(201).json({
      id: record.id,
      token: plainToken,
      label: record.label,
      expiresAt: record.expiresAt.toISOString(),
      createdAt: record.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("[ExtTokens] Create error:", error);
    res.status(500).json({ error: "Failed to create extension token" });
  }
});

/**
 * @route   GET /auth/extension-tokens
 * @desc    List all extension tokens for user (no secrets)
 * @access  Private (Clerk)
 */
router.get("/extension-tokens", authenticateClerk, async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const tokens = await prisma.extensionToken.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        label: true,
        expiresAt: true,
        lastUsedAt: true,
        revokedAt: true,
        createdAt: true,
      },
    });

    const mapped = tokens.map((t) => ({
      ...t,
      status: t.revokedAt
        ? "revoked"
        : new Date() > t.expiresAt
          ? "expired"
          : "active",
    }));

    res.json(mapped);
  } catch (error) {
    console.error("[ExtTokens] List error:", error);
    res.status(500).json({ error: "Failed to fetch extension tokens" });
  }
});

/**
 * @route   DELETE /auth/extension-tokens/:id
 * @desc    Revoke an extension token
 * @access  Private (Clerk)
 */
router.delete("/extension-tokens/:id", authenticateClerk, async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  const { id } = req.params;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const token = await prisma.extensionToken.findUnique({ where: { id } });

    if (!token || token.userId !== userId) {
      return res.status(404).json({ error: "Token not found" });
    }

    if (token.revokedAt) {
      return res.status(400).json({ error: "Token is already revoked" });
    }

    await prisma.extensionToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("[ExtTokens] Revoke error:", error);
    res.status(500).json({ error: "Failed to revoke token" });
  }
});

// ────────────────────────────────────────────────────────────
// Extension Token Validation (used by the Chrome extension)
// ────────────────────────────────────────────────────────────

/**
 * @route   POST /auth/extension/validate
 * @desc    Validate an extension token and return user info
 * @access  Public (token in body)
 */
router.post("/extension/validate", async (req: Request, res: Response) => {
  const { token } = req.body ?? {};

  if (typeof token !== "string" || !token.startsWith("recall_ext_")) {
    return res.status(400).json({ error: "Invalid token format" });
  }

  try {
    const tokenHash = hashToken(token);
    const record = await prisma.extensionToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true, email: true, name: true, avatarUrl: true } } },
    });

    if (!record) {
      return res.status(401).json({ error: "Invalid token" });
    }

    if (record.revokedAt) {
      return res.status(401).json({ error: "This token has been revoked. Generate a new one from your dashboard." });
    }

    if (new Date() > record.expiresAt) {
      return res.status(401).json({ error: "This token has expired. Generate a new one from your dashboard." });
    }

    // Update last used timestamp
    await prisma.extensionToken.update({
      where: { id: record.id },
      data: { lastUsedAt: new Date() },
    });

    res.json({
      valid: true,
      user: record.user,
    });
  } catch (error) {
    console.error("[ExtTokens] Validate error:", error);
    res.status(500).json({ error: "Failed to validate token" });
  }
});

// ────────────────────────────────────────────────────────────
// Existing routes: Sync & Me
// ────────────────────────────────────────────────────────────

/**
 * @route   POST /auth/sync
 * @desc    Sync Clerk user with local database
 * @access  Private (Clerk)
 */
router.post("/sync", authenticateClerk, async (req: Request, res: Response) => {
  const auth = (req as any).auth;
  const { email, name, avatarUrl } = req.body;

  if (!auth?.userId || auth?.source !== "clerk") {
    return res.status(401).json({ error: "Missing Clerk userId" });
  }

  try {
    const normalizedEmail =
      typeof email === "string" && email.trim().length > 0
        ? email.trim().toLowerCase()
        : `${auth.userId}@clerk.local`;

    const user = await prisma.user.upsert({
      where: { id: auth.userId },
      update: {
        email: normalizedEmail,
        name: name || undefined,
        avatarUrl: avatarUrl || undefined,
      },
      create: {
        id: auth.userId,
        email: normalizedEmail,
        name: name || "Anonymous",
        avatarUrl: avatarUrl || null,
      },
    });

    res.json({ user });
  } catch (error) {
    console.error("User sync error:", error);
    res.status(500).json({ error: "Failed to sync user" });
  }
});

/**
 * @route   GET /auth/me
 * @desc    Get current user profile
 */
router.get("/me", authenticateClerk, async (req: Request, res: Response) => {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(404).json({ error: "User not found in local database" });
  }
    
  res.json(user);
});

export default router;
