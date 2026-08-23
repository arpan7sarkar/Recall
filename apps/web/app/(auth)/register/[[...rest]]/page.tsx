import { SignUp } from "@clerk/nextjs";
import { authClerkAppearance } from "@/components/auth/clerkAppearance";
import { getAuthRouteWithRedirect, getSafeAuthRedirect } from "@/lib/auth-redirect";

type AuthPageProps = {
  searchParams?: Promise<{ redirect?: string | string[] }>;
};

export default async function RegisterPage({ searchParams }: AuthPageProps) {
  const params = searchParams ? await searchParams : {};
  const redirect = getSafeAuthRedirect(params.redirect);

  return (
    <SignUp
      appearance={authClerkAppearance}
      signInUrl={getAuthRouteWithRedirect("/login", redirect)}
      forceRedirectUrl={redirect}
      fallbackRedirectUrl={redirect}
    />
  );
}
