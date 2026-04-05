import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import prisma from "@/lib/prisma";

export const authenticateClerk = async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: No session found" });
  }

  try {
    // 1. Check if prisma is healthy
    if (!prisma?.user) {
      console.error("[Auth] Prisma Client not initialized or 'user' model missing.");
      return next(); 
    }

    // 2. Attach clerk userId to request
    (req as any).auth = { userId };
    
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
    if (!user) {
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

    if (user) {
      (req as any).user = user;
    }

    next();
  } catch (error: any) {
    console.error("[Auth] Unexpected middleware error:", error.message);
    res.status(500).json({ error: "Internal server error during authentication" });
  }
};
