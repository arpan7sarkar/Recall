import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { signExtensionToken } from "@/lib/extensionJwt";
import { authenticateClerk } from "@/middleware/auth";

const router = Router();

/**
 * @route   POST /auth/extension/login
 * @desc    Authenticate extension user via email/password and return extension JWT
 * @access  Public
 */
router.post("/extension/login", async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};

  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();

  if (!normalizedEmail || !normalizedPassword) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user?.password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isValidPassword = await bcrypt.compare(normalizedPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signExtensionToken(user.id, user.email);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error("Extension login error:", error);
    res.status(500).json({ error: "Failed to login for extension" });
  }
});

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
