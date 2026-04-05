import jwt, { type JwtPayload } from "jsonwebtoken";

const extensionJwtSecret = process.env.EXTENSION_JWT_SECRET || process.env.JWT_SECRET;
const extensionJwtExpiresIn = process.env.EXTENSION_JWT_EXPIRES_IN || "7d";

export type ExtensionAuthSource = "clerk" | "extension";

export interface ExtensionTokenPayload extends JwtPayload {
  sub: string;
  email: string;
  source: "extension";
}

export function signExtensionToken(userId: string, email: string): string {
  if (!extensionJwtSecret) {
    throw new Error("Missing EXTENSION_JWT_SECRET (or JWT_SECRET) environment variable");
  }

  return jwt.sign(
    {
      email,
      source: "extension",
    },
    extensionJwtSecret,
    {
      subject: userId,
      expiresIn: extensionJwtExpiresIn as jwt.SignOptions["expiresIn"],
    }
  );
}

export function verifyExtensionToken(token: string): ExtensionTokenPayload | null {
  if (!extensionJwtSecret) return null;

  try {
    const decoded = jwt.verify(token, extensionJwtSecret);
    if (typeof decoded !== "object" || decoded === null) return null;

    const subject = decoded.sub;
    const email = (decoded as { email?: unknown }).email;
    const source = (decoded as { source?: unknown }).source;

    if (typeof subject !== "string" || typeof email !== "string" || source !== "extension") {
      return null;
    }

    return decoded as ExtensionTokenPayload;
  } catch {
    return null;
  }
}
