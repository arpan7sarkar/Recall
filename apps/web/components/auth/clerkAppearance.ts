export const authClerkAppearance = {
  variables: {
    colorScheme: "dark",
    colorPrimary: "#ffffff",
    colorText: "#f4f4f5",
    colorTextSecondary: "#a1a1aa",
    colorInputText: "#f4f4f5",
    colorInputBackground: "#09090b",
    colorTextOnPrimaryBackground: "#000000",
    colorBackground: "transparent",
    colorDanger: "#ef4444",
    colorSuccess: "#10b981",
    colorWarning: "#f59e0b",
    borderRadius: "0.75rem",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full",
    card: "w-full rounded-[2rem] border border-white/10 bg-black/40 backdrop-blur-xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] px-2 py-4",
    headerTitle: "text-zinc-100 text-3xl font-bold tracking-tight mb-2 text-left",
    headerSubtitle: "text-zinc-400 text-sm leading-relaxed mb-4 text-left",
    socialButtonsBlockButton:
      "h-12 border border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10 transition-all duration-300",
    socialButtonsBlockButtonText: "text-zinc-100 font-semibold",
    socialButtonsBlockButtonArrow: "text-zinc-400",
    socialButtonsProviderIcon__github: "invert brightness-100",
    socialButtonsProviderIcon__google: "brightness-110",
    dividerLine: "bg-white/10",
    dividerText: "text-zinc-500 text-xs font-bold uppercase tracking-[0.2em]",
    formFieldLabel: "text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2 block",
    formFieldInput:
      "h-12 rounded-xl border border-white/10 bg-white/5 text-zinc-100 placeholder:text-zinc-600 transition-all duration-300 focus:border-white/30 focus:bg-white/10 focus:ring-4 focus:ring-white/5",
    formFieldInputShowPasswordButton: "text-zinc-500 hover:text-zinc-100",
    formFieldErrorText: "text-red-400 text-xs mt-1 font-medium",
    alertText: "text-red-400 font-medium",
    otpCodeFieldInput:
      "h-12 rounded-xl border border-white/10 bg-white/5 text-zinc-100 focus:border-white/30 focus:ring-4 focus:ring-white/5",
    formButtonPrimary:
      "h-12 w-full rounded-xl bg-zinc-100 text-zinc-950 font-bold shadow-[0_20px_40px_-15px_rgba(255,255,255,0.15)] hover:bg-white hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 text-sm tracking-widest uppercase",
    footerActionText: "text-zinc-500 text-sm",
    footerActionLink: "text-zinc-100 font-bold hover:text-white transition-colors",
    formResendCodeLink: "text-zinc-100 hover:text-zinc-300 transition-colors",
    identityPreviewText: "text-zinc-100 font-medium",
    identityPreviewEditButton: "text-zinc-100 hover:text-white transition-colors",
    formFieldSuccessText: "text-emerald-400 text-xs mt-1",
    formFieldWarningText: "text-amber-400 text-xs mt-1",
    alert: "bg-red-500/10 border border-red-500/20 rounded-xl",
  },
};


