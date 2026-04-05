'use client'

import React from 'react'
import Link from 'next/link'
import { ChevronRight, Menu, X, ArrowRight, Sparkles, Brain, Zap, Search, Github } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
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
    const { isSignedIn } = useAuth()
    return (
        <>
            <HeroHeader />
            <main className="overflow-hidden bg-[#070707]">
                <section>
                    <div className="relative pt-32 pb-20">
                        {/* High-end atmospheric background from previous logic */}
                        <div className="absolute inset-x-0 top-0 -z-10 h-[800px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0059ff10] via-transparent to-transparent opacity-80"></div>
                        
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
                                    <Sparkles size={12} className="text-[#0059ff]" />
                                    <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400">Your knowledge. Elevated.</span>
                                </div>
                                
                                <h1 className="text-5xl sm:text-6xl md:text-8xl font-serif text-white tracking-tight leading-[1.05] mb-8 max-w-4xl mx-auto italic">
                                    Where great minds<br />
                                    <span className="text-[#0059ff]">never forget.</span>
                                </h1>
                                
                                <p className="mt-4 max-w-2xl text-zinc-400 text-lg sm:text-xl font-light leading-relaxed">
                                    Recall is the intelligence layer for people who think in systems. 
                                    Capture what matters, surface what's relevant, and let AI do the heavy lifting.
                                </p>
                                
                                <div className="mt-12 flex flex-col sm:flex-row items-center gap-4">
                                    <Button
                                        asChild
                                        size="lg"
                                        className="rounded-full px-8 py-6 text-base active:scale-95">
                                        <Link href={isSignedIn ? ROUTES.dashboard : ROUTES.register}>
                                            <span className="flex items-center gap-2">{isSignedIn ? "Go to Dashboard" : "Start building yours"} <ArrowRight size={18} /></span>
                                        </Link>
                                    </Button>
                                    <Button
                                        asChild
                                        size="lg"
                                        variant="ghost"
                                        className="rounded-full px-8 py-6 text-base text-white border border-white/10 hover:bg-white/5 transition-all active:scale-95">
                                        <Link href="#features">
                                            <span>See how it works</span>
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
                                        className="h-auto w-full rounded-xl object-contain bg-[#0e0e0e]/50 opacity-90 transition-opacity hover:opacity-100"
                                        src="/dashboard_mockup.png"
                                        alt="Recall Dashboard Preview"
                                    />
                                    {/* Overlay Subtle Glow */}
                                    <div className="absolute inset-0 bg-[#0059ff05] mix-blend-overlay pointer-events-none" />
                                </div>
                            </div>
                        </AnimatedGroup>
                    </div>
                </section>

                <section className="bg-[#070707] pb-32 pt-20">
                    <div className="group relative m-auto max-w-5xl px-6">
                       
                        
                

                    
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
    const { isSignedIn } = useAuth()
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
                                <div className="w-8 h-8 rounded overflow-hidden flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                    <img src="/favicon.png" alt="Recall" className="w-full h-full object-cover" />
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
                                {!isSignedIn && (
                                    <Button
                                        asChild
                                        variant="ghost"
                                        className="text-zinc-400 hover:text-white text-sm font-medium hover:bg-transparent">
                                        <Link href={ROUTES.login}>Sign in</Link>
                                    </Button>
                                )}
                                <Button
                                    asChild
                                    className="rounded-full px-6 py-2 font-medium active:scale-95">
                                    <Link href={isSignedIn ? ROUTES.dashboard : ROUTES.register}>{isSignedIn ? "Dashboard" : "Get early access"}</Link>
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
                                    className="w-full rounded-full py-6 text-lg font-medium">
                                    <Link href={isSignedIn ? ROUTES.dashboard : ROUTES.register}>{isSignedIn ? "Dashboard" : "Get Started"}</Link>
                                </Button>
                                {!isSignedIn && (
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="w-full rounded-full border-white/10 text-white py-6 text-lg font-medium">
                                        <Link href={ROUTES.login}>Sign In</Link>
                                    </Button>
                                )}
                             </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}
