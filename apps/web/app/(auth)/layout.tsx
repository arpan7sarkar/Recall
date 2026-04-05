import Link from "next/link";
import { AnimatedShaderBackground } from "@/components/ui/animated-shader-background";
import { ROUTES } from "@/lib/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-theme="dark" className="relative min-h-screen overflow-hidden bg-[#050505] text-zinc-200">
      <AnimatedShaderBackground className="opacity-60" />
      
      {/* Decorative Overlays */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_-10%,rgba(255,255,255,0.08),transparent_50%),radial-gradient(circle_at_80%_100%,rgba(255,255,255,0.03),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
      <div className="pointer-events-none absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay" />

      <main className="relative z-10 mx-auto grid min-h-screen w-full max-w-7xl items-center gap-12 px-6 py-12 sm:px-12 lg:grid-cols-[1fr_minmax(400px,500px)]">
        {/* Left Sidebar - Desktop only */}
        <section className="hidden flex-col items-start space-y-12 lg:flex">
          <Link
            href={ROUTES.home}
            className="group flex items-center gap-3 rounded-full border border-white/10 bg-white/3 pr-4 pl-2 py-1.5 text-sm font-medium tracking-tight text-zinc-300 transition-all duration-300 hover:border-white/20 hover:bg-white/6 hover:text-white"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-bold text-black group-hover:scale-110 transition-transform duration-300">
              R
            </div>
            Recall
          </Link>


          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">The Ultimate Hub</span>
              <h1 className="max-w-xl text-6xl font-bold tracking-tight text-white leading-[1.1]">
                Your mind, <br /> 
                <span className="text-zinc-500 italic">fully synchronized.</span>
              </h1>
            </div>
            <p className="max-w-md text-lg leading-relaxed text-zinc-400 font-light">
              Enter your digital vault. A seamless atmosphere designed for deep thinking and effortless organization.
            </p>
          </div>

          <div className="mt-12 flex gap-8">
            <div className="space-y-1">
              <p className="text-xl font-medium text-zinc-100">10k+</p>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Active Users</p>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div className="space-y-1">
              <p className="text-xl font-medium text-zinc-100">99.9%</p>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Uptime</p>
            </div>
          </div>
        </section>

        {/* Auth Content */}
        <section className="mx-auto w-full max-w-lg">
          <div className="mb-10 flex flex-col items-center space-y-4 lg:hidden">
            <Link href={ROUTES.home} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-xl font-bold text-black">
              R
            </Link>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
              <p className="text-sm text-zinc-400">Continue building your second brain.</p>
            </div>
          </div>
          <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-700">
             {/* Glow effect behind the card */}
             <div className="absolute -inset-4 bg-linear-to-b from-white/10 to-transparent blur-2xl opacity-20" />
             {children}
          </div>
        </section>
      </main>
    </div>
  );
}

