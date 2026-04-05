import { SignIn } from "@clerk/nextjs";
import { authClerkAppearance } from "@/components/auth/clerkAppearance";

export default function LoginPage() {
  return (
    <SignIn
      appearance={authClerkAppearance}
      signUpUrl="/register"
      forceRedirectUrl="/dashboard"
    />
  );
}
