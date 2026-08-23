import { SignIn } from "@clerk/nextjs";
import { authClerkAppearance } from "@/components/auth/clerkAppearance";
import { getAuthRouteWithRedirect, getSafeAuthRedirect } from "@/lib/auth-redirect";

type AuthPageProps = {
  searchParams?: Promise<{ redirect?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: AuthPageProps) {
  const params = searchParams ? await searchParams : {};
  const redirect = getSafeAuthRedirect(params.redirect);

  return (
    <SignIn
      appearance={authClerkAppearance}
      signUpUrl={getAuthRouteWithRedirect("/register", redirect)}
      forceRedirectUrl={redirect}
      fallbackRedirectUrl={redirect}
    />
  );
}
