import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import prisma from "@/lib/prisma";

export const authenticateClerk = async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: No session found" });
  }

  try {
    // Optional: Sync user with local DB if needed, or just attach userId to request
    // For now, we attach the clerk userId to the request for backend use
    (req as any).auth = { userId };
    
    // We can also find the local user record if we need DB relations
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: userId }, // If Clerk uses Google
          { id: userId }        // Or if we use Clerk ID as primary ID
        ]
      }
    });

    if (user) {
      (req as any).user = user;
    }

    next();
  } catch (error) {
    console.error("Clerk Auth Error:", error);
    res.status(500).json({ error: "Internal server error during authentication" });
  }
};
