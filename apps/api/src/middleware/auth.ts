import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { getAuth } from "@clerk/express";
import { verifyToken } from "@clerk/backend";
import prisma from "@/lib/prisma";

export type AuthSource = "clerk" | "extension_token";

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY ?? "";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const authenticateClerk = async (req: Request, res: Response, next: NextFunction) => {
  // 1. Try Clerk session (cookie-based — works when same-origin)
  let userId: string | null = null;
  let source: AuthSource = "clerk";

  try {
    const { userId: clerkUserId } = getAuth(req);
    if (clerkUserId) {
      userId = clerkUserId;
      source = "clerk";
    }
  } catch {
    // getAuth may throw if no session — that's fine, we'll check Bearer next
  }

  // 2. If no Clerk session, check Authorization header
  if (!userId) {
    const authHeader = req.headers.authorization;
    const token =
      typeof authHeader === "string" && authHeader.toLowerCase().startsWith("bearer ")
        ? authHeader.slice("bearer ".length).trim()
        : "";

    if (token) {
      // 2a. Check if it's a recall extension token (starts with recall_ext_)
      if (token.startsWith("recall_ext_")) {
        try {
          const tokenHash = hashToken(token);
          const record = await prisma.extensionToken.findUnique({
            where: { tokenHash },
          });

          if (record && !record.revokedAt && new Date() <= record.expiresAt) {
            userId = record.userId;
            source = "extension_token";

            // Update last used (fire and forget)
            prisma.extensionToken
              .update({ where: { id: record.id }, data: { lastUsedAt: new Date() } })
              .catch(() => {});
          }
        } catch (err: any) {
          console.error("[Auth] Extension token lookup failed:", err.message);
        }
      }
      // 2b. Otherwise treat it as a Clerk session JWT (cross-origin from web frontend)
      else if (CLERK_SECRET_KEY) {
        try {
          const result = await verifyToken(token, { secretKey: CLERK_SECRET_KEY });

          // verifyToken returns { sub, ... } on success or may throw
          if (result && typeof result === "object" && "sub" in result && typeof result.sub === "string") {
            userId = result.sub;
            source = "clerk";
          }
        } catch (err: any) {
          // Token might be expired or invalid — fall through to 401
        }
      }
    }
  }

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: No valid session or extension token found" });
  }

  try {
    // Check if prisma is healthy
    if (!prisma?.user) {
      console.error("[Auth] Prisma Client not initialized or 'user' model missing.");
      return next(); 
    }

    // Attach auth identity to request
    (req as any).auth = { userId, source };
    
    // Find/Attach local user record
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: userId },
          { id: userId }
        ]
      }
    }).catch(err => {
      console.error("[Auth] Database query failed:", err.message);
      return null;
    });

    // Ensure a local user row exists so downstream writes never fail on FK constraints.
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
        console.error("[Auth] Failed to create fallback local user:", err.message);
        return null;
      });
    }

    if (!user && source === "extension_token") {
      return res.status(401).json({ error: "Unauthorized: Extension token user no longer exists" });
    }

    if (user) {
      (req as any).user = user;
    }

    next();
  } catch (error: any) {
    console.error("[Auth] Unexpected middleware error:", error.message);
    res.status(500).json({ error: "Internal server error during authentication" });
  }
};
