import { SignUp } from "@clerk/nextjs";

export default function RegisterPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
      <SignUp 
        appearance={{
          elements: {
            formButtonPrimary: "bg-[#0ea5e9] hover:bg-[#0284c7]",
            card: "bg-[#1e293b] border border-[#334155] shadow-lg",
          }
        }}
        signInUrl="/login"
        forceRedirectUrl="/dashboard"
      />
    </div>
  );
}
