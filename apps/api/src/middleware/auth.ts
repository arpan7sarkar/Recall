import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import prisma from "@/lib/prisma";
import { type ExtensionAuthSource, verifyExtensionToken } from "@/lib/extensionJwt";

export const authenticateClerk = async (req: Request, res: Response, next: NextFunction) => {
  const { userId: clerkUserId } = getAuth(req);

  let userId: string | null = clerkUserId ?? null;
  let source: ExtensionAuthSource = clerkUserId ? "clerk" : "extension";

  if (!userId) {
    const authHeader = req.headers.authorization;
    const token =
      typeof authHeader === "string" && authHeader.toLowerCase().startsWith("bearer ")
        ? authHeader.slice("bearer ".length).trim()
        : "";

    if (token) {
      const payload = verifyExtensionToken(token);
      if (payload?.sub) {
        userId = payload.sub;
        source = "extension";
      }
    }
  }

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: No valid session or extension token found" });
  }

  try {
    // 1. Check if prisma is healthy
    if (!prisma?.user) {
      console.error("[Auth] Prisma Client not initialized or 'user' model missing.");
      return next(); 
    }

    // 2. Attach auth identity to request
    (req as any).auth = { userId, source };
    
    // 3. Find/Attach local user record
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

    // 4. Ensure a local user row exists so downstream writes never fail on FK constraints.
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

    if (!user && source === "extension") {
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
