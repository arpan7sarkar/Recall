import { SignUp } from "@clerk/nextjs";
import { authClerkAppearance } from "@/components/auth/clerkAppearance";

export default function RegisterPage() {
  return (
    <SignUp
      appearance={authClerkAppearance}
      signInUrl="/login"
      forceRedirectUrl="/dashboard"
    />
  );
}
