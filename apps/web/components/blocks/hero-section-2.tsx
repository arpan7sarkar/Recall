'use client'

import React from 'react'
import Link from 'next/link'
import { ChevronRight, Menu, X, ArrowRight, Sparkles, Brain, Zap, Search, Github } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatedGroup } from '@/components/ui/animated-group'
import { cn } from '@/lib/utils'
import { useScroll } from 'motion/react'
import { ROUTES } from '@/lib/constants'

const transitionVariants = {
    item: {
        hidden: {
            opacity: 0,
            filter: 'blur(12px)',
            y: 12,
        },
        visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: {
                type: 'spring',
                bounce: 0.3,
                duration: 1.5,
            } as any,
        },
    },
}

export function HeroSection() {
    return (
        <>
            <HeroHeader />
            <main className="overflow-hidden bg-[#070707]">
                <section>
                    <div className="relative pt-32 pb-20">
                        {/* High-end atmospheric background from previous logic */}
                        <div className="absolute inset-x-0 top-0 -z-10 h-[800px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent opacity-80"></div>
                        
                        <div className="mx-auto max-w-5xl px-6 text-center">
                            <AnimatedGroup
                                className="flex flex-col items-center"
                                variants={{
                                    container: {
                                        visible: {
                                            transition: {
                                                staggerChildren: 0.1,
                                                delayChildren: 0.2,
                                            },
                                        },
                                    },
                                    ...transitionVariants,
                                }}
                            >
                                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8">
                                    <Sparkles size={12} className="text-indigo-400" />
                                    <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400">Introducing Spatial Intelligence</span>
                                </div>
                                
                                <h1 className="text-5xl sm:text-6xl md:text-8xl font-serif text-white tracking-tight leading-[1.05] mb-8 max-w-4xl mx-auto italic">
                                    Build your digital <br />
                                    <span className="text-indigo-400">omniscience</span>
                                </h1>
                                
                                <p className="mt-4 max-w-2xl text-zinc-400 text-lg sm:text-xl font-light leading-relaxed">
                                    Recall is the spatial knowledge operating system for high-output thinkers. 
                                    Capture everything, connect deeply, and find insights instantly.
                                </p>
                                
                                <div className="mt-12 flex flex-col sm:flex-row items-center gap-4">
                                    <Button
                                        asChild
                                        size="lg"
                                        className="rounded-full px-8 py-6 text-base bg-white text-[#070707] hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95">
                                        <Link href={ROUTES.register}>
                                            <span className="flex items-center gap-2">Initialize Node <ArrowRight size={18} /></span>
                                        </Link>
                                    </Button>
                                    <Button
                                        asChild
                                        size="lg"
                                        variant="ghost"
                                        className="rounded-full px-8 py-6 text-base text-white border border-white/10 hover:bg-white/5 transition-all active:scale-95">
                                        <Link href="#features">
                                            <span>View Protocol</span>
                                        </Link>
                                    </Button>
                                </div>
                            </AnimatedGroup>
                        </div>

                        <AnimatedGroup
                            className="w-full"
                            variants={{
                                container: {
                                    visible: {
                                        transition: {
                                            staggerChildren: 0.05,
                                            delayChildren: 0.8,
                                        },
                                    },
                                },
                                ...transitionVariants,
                            }}>
                            <div className="relative mt-20 overflow-hidden px-6 lg:px-0">
                                <div
                                    aria-hidden
                                    className="bg-linear-to-b to-[#070707] absolute inset-0 z-10 from-transparent from-50%"
                                />
                                <div className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl border border-white/5 bg-[#0e0e0e]/50 backdrop-blur-sm p-2 shadow-2xl ring-1 ring-white/10">
                                    <img
                                        className="aspect-video w-full rounded-xl object-cover opacity-90 transition-opacity hover:opacity-100"
                                        src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=2700"
                                        alt="Recall Dashboard Preview"
                                    />
                                    {/* Overlay Subtle Glow */}
                                    <div className="absolute inset-0 bg-indigo-500/5 mix-blend-overlay pointer-events-none" />
                                </div>
                            </div>
                        </AnimatedGroup>
                    </div>
                </section>

                <section className="bg-[#070707] pb-32 pt-20">
                    <div className="group relative m-auto max-w-5xl px-6">
                        <div className="absolute inset-0 z-10 flex scale-95 items-center justify-center opacity-0 duration-500 group-hover:scale-100 group-hover:opacity-100">
                            <Link
                                href="#customers"
                                className="px-6 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-sm font-medium text-white hover:bg-white/10 transition-all flex items-center gap-2">
                                <span>Learn our methodology</span>
                                <ArrowRight className="size-3" />
                            </Link>
                        </div>
                        
                        <div className="mb-12 text-center opacity-20 group-hover:opacity-10 group-hover:blur-sm transition-all duration-500">
                             <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white">Trusted by teams at</p>
                        </div>

                        <div className="group-hover:blur-xs mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-12 transition-all duration-500 group-hover:opacity-30">
                            <div className="flex justify-center opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                                <span className="text-xl font-serif font-black tracking-tighter text-white flex items-center gap-2">
                                    <Zap className="size-5 fill-current" /> FAST
                                </span>
                            </div>
                            <div className="flex justify-center opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                                <span className="text-xl font-serif font-black tracking-tighter text-white flex items-center gap-2">
                                    <Brain className="size-5 fill-current" /> SCALE
                                </span>
                            </div>
                            <div className="flex justify-center opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                                <span className="text-xl font-serif font-black tracking-tighter text-white flex items-center gap-2">
                                    <Search className="size-5" /> INDEX
                                </span>
                            </div>
                            <div className="flex justify-center opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                                <span className="text-xl font-serif font-black tracking-tighter text-white flex items-center gap-2">
                                    <Github className="size-5 fill-current" /> REPO
                                </span>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    )
}

const menuItems = [
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'About', href: '#about' },
]

export const HeroHeader = () => {
    const [menuState, setMenuState] = React.useState(false)
    const [scrolled, setScrolled] = React.useState(false)

    const { scrollYProgress } = useScroll()

    React.useEffect(() => {
        const unsubscribe = scrollYProgress.on('change', (latest) => {
            setScrolled(latest > 0.02)
        })
        return () => unsubscribe()
    }, [scrollYProgress])

    return (
        <header>
            <nav
                data-state={menuState && 'active'}
                className={cn('group fixed z-[100] w-full transition-all duration-300', scrolled ? 'bg-black/50 backdrop-blur-2xl py-3 border-b border-white/5' : 'py-6')}>
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-12">
                            <Link
                                href="/"
                                aria-label="home"
                                className="flex items-center space-x-3 group">
                                <div className="w-8 h-8 rounded bg-linear-to-br from-zinc-200 to-zinc-400 text-[#070707] flex items-center justify-center font-serif font-black text-sm shadow-md group-hover:scale-110 transition-transform">
                                    R
                                </div>
                                <span className="font-serif font-medium text-lg tracking-wide text-zinc-100 italic">Recall</span>
                            </Link>

                            <div className="hidden lg:block">
                                <ul className="flex gap-10 text-sm font-medium">
                                    {menuItems.map((item, index) => (
                                        <li key={index}>
                                            <Link
                                                href={item.href}
                                                className="text-zinc-400 hover:text-white block duration-150 transition-colors">
                                                <span>{item.name}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                             <div className="hidden sm:flex items-center gap-4">
                                <Button
                                    asChild
                                    variant="ghost"
                                    className="text-zinc-400 hover:text-white text-sm font-medium hover:bg-transparent">
                                    <Link href={ROUTES.login}>Log in</Link>
                                </Button>
                                <Button
                                    asChild
                                    className="rounded-full bg-white text-[#070707] hover:bg-zinc-200 px-6 py-2 shadow-sm font-medium transition-all active:scale-95">
                                    <Link href={ROUTES.register}>Start free</Link>
                                </Button>
                             </div>

                            <button
                                onClick={() => setMenuState(!menuState)}
                                aria-label={menuState ? 'Close Menu' : 'Open Menu'}
                                className="relative z-20 -m-2.5 block cursor-pointer p-2.5 lg:hidden text-white">
                                <Menu className={cn("m-auto size-6 duration-200", menuState && "rotate-180 scale-0 opacity-0")} />
                                <X className={cn("absolute inset-0 m-auto size-6 duration-200 opacity-0 scale-0", menuState && "rotate-0 scale-100 opacity-100")} />
                            </button>
                        </div>
                        
                        {/* Mobile Menu Overlay */}
                        <div className={cn(
                             "fixed inset-0 top-[72px] bg-black/90 backdrop-blur-3xl z-40 lg:hidden p-8 transition-all duration-300 flex flex-col gap-10",
                             menuState ? "opacity-100 pointer-events-auto translate-y-0" : "opacity-0 pointer-events-none -translate-y-4"
                        )}>
                             <ul className="flex flex-col gap-8">
                                {menuItems.map((item, index) => (
                                    <li key={index}>
                                        <Link
                                            href={item.href}
                                            onClick={() => setMenuState(false)}
                                            className="text-2xl font-serif text-white block">
                                            {item.name}
                                        </Link>
                                    </li>
                                ))}
                             </ul>
                             <div className="flex flex-col gap-4 mt-auto border-t border-white/10 pt-8">
                                <Button
                                    asChild
                                    className="w-full rounded-full bg-white text-black py-6 text-lg font-medium">
                                    <Link href={ROUTES.register}>Get Started</Link>
                                </Button>
                                <Button
                                    asChild
                                    variant="outline"
                                    className="w-full rounded-full border-white/10 text-white py-6 text-lg font-medium">
                                    <Link href={ROUTES.login}>Sign In</Link>
                                </Button>
                             </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}
