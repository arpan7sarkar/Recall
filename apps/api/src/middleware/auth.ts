import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { getAuth } from "@clerk/express";
import { verifyToken } from "@clerk/backend";
import prisma from "@/lib/prisma";

export type AuthSource = "clerk" | "extension_token";

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY ?? "";
const clerkClockSkewInMs = Number(process.env.CLERK_CLOCK_SKEW_MS ?? 15000);

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function extractBearerToken(req: Request): string {
  const authHeader = req.headers.authorization;
  if (typeof authHeader === "string" && authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }
  return "";
}

function isLikelyJwt(token: string): boolean {
  return token.split(".").length === 3;
}

export const authenticateClerk = async (req: Request, res: Response, next: NextFunction) => {
  let userId: string | null = null;
  let source: AuthSource = "clerk";

  const bearerToken = extractBearerToken(req);
  const isExtensionToken = bearerToken.toLowerCase().startsWith("recall_ext_");

  try {
    // 1. Handle Extension Tokens
    if (isExtensionToken) {
      const tokenHash = hashToken(bearerToken);
      const record = await prisma.extensionToken.findUnique({
        where: { tokenHash },
      }).catch((err: any) => {
        console.error("[Auth] DB Error (Extension Token):", err.message);
        throw err;
      });

      if (record && !record.revokedAt && new Date() <= record.expiresAt) {
        userId = record.userId;
        source = "extension_token";

        // Update last used (fire and forget)
        prisma.extensionToken
          .update({ where: { id: record.id }, data: { lastUsedAt: new Date() } })
          .catch(() => {});
      } else if (record?.revokedAt) {
        return res.status(401).json({ error: "Token revoked. Generate a new one." });
      } else if (record && new Date() > record.expiresAt) {
        return res.status(401).json({ error: "Token expired. Generate a new one." });
      } else {
        return res.status(401).json({ error: "Invalid extension token." });
      }
    }

    // 2. Validate explicit Bearer JWT first (most reliable for cross-origin API calls in dev).
    if (!userId && bearerToken && !isExtensionToken && CLERK_SECRET_KEY && isLikelyJwt(bearerToken)) {
      try {
        const result = await verifyToken(bearerToken, {
          secretKey: CLERK_SECRET_KEY,
          clockSkewInMs: Number.isFinite(clerkClockSkewInMs) ? clerkClockSkewInMs : 15000,
        });
        if (result && typeof result === "object" && "sub" in result) {
          userId = result.sub as string;
          source = "clerk";
        }
      } catch {
        // Invalid JWT - fall through to middleware auth context check.
      }
    }

    // 3. Handle Clerk Sessions (cookie/context path)
    if (!userId && !isExtensionToken) {
      try {
        const auth = getAuth(req);
        if (auth?.userId) {
          userId = auth.userId;
          source = "clerk";
        }
      } catch (err: any) {
        // Safe skip: getAuth may throw if clerkMiddleware isn't registered yet
        // but it's now registered globally in index.ts
        console.log("[Auth] Clerk session check skipped/failed:", err.message);
      }
    }

    // 4. Final check
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: Invalid session or extension token" });
    }

    // 5. Context assignment and User Lookup
    (req as any).auth = { userId, source };

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: userId },
          { id: userId },
        ],
      },
    }).catch((err) => {
      console.error("[Auth] Database User Lookup Error:", err.message);
      return null;
    });

    // 6. Auto-sync for Clerk users
    if (!user && source === "clerk") {
      user = await prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: {
          id: userId,
          email: `${userId}@clerk.local`,
          name: "Clerk User",
        },
      }).catch((err) => {
        console.error("[Auth] DB User Sync Error:", err.message);
        return null;
      });
    }

    if (!user && source === "extension_token") {
      return res.status(401).json({ error: "Linked user not found." });
    }

    if (user) (req as any).user = user;
    
    return next();
  } catch (error: any) {
    console.error("[Auth] Middleware Critical Failure:", error.message);
    return res.status(500).json({ error: "Internal Authentication Error" });
  }
};
