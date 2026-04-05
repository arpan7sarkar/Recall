import { Router, Request, Response } from "express";
import prisma from "@/lib/prisma";
import { authenticateClerk } from "@/middleware/auth";

const router = Router();

/**
 * @route   POST /auth/sync
 * @desc    Sync Clerk user with local database
 * @access  Private (Clerk)
 */
router.post("/sync", authenticateClerk, async (req: Request, res: Response) => {
  const auth = (req as any).auth;
  const { email, name, avatarUrl } = req.body;

  if (!auth?.userId) {
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
