'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Camera, Map, Share2, Sparkles, Users, Route, Globe2, ChevronDown, LayoutDashboard } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useUser } from '@/firebase';

// Dynamically import Three.js background with no SSR
const ThreeBackground = dynamic(() => import('@/components/three-background').then(mod => ({ default: mod.ThreeBackground })), {
  ssr: false,
});

const features = [
  {
    icon: <Camera className="h-8 w-8 text-primary" />,
    title: 'Multimedia Entries',
    description: 'Attach photos and videos to bring your travel stories to life.',
  },
  {
    icon: <Map className="h-8 w-8 text-primary" />,
    title: 'Route Visualization',
    description: 'See your journey unfold on an interactive map.',
  },
  {
    icon: <Share2 className="h-8 w-8 text-primary" />,
    title: 'Selective Sharing',
    description: 'Keep your diaries private or share your adventures with friends and family.',
  },
  {
    icon: <Sparkles className="h-8 w-8 text-primary" />,
    title: 'AI Suggestions',
    description: 'Get AI-powered recommendations for your next destination.',
  },
];

export default function HomePage() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'hero-image');
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { user } = useUser();

  useEffect(() => {
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    let ctx: any;
    (async () => {
      const { gsap } = await import('gsap');
      if (!rootRef.current) return;
      const tl = gsap.timeline();
      tl.fromTo('.hero-title', { y: 30, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' })
        .fromTo('.hero-subtitle', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }, '-=0.4')
        .fromTo('.hero-badge', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.7)' }, '-=0.3')
        .fromTo('.hero-cta', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out', stagger: 0.1 }, '-=0.3')
        .fromTo('.hero-stats', { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out', stagger: 0.08 }, '-=0.2')
        .fromTo('.scroll-indicator', { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }, '-=0.2');
      
      // Floating animation for gradient blobs
      gsap.to('.blob-1', { y: 30, x: 20, duration: 4, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      gsap.to('.blob-2', { y: -30, x: -20, duration: 5, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      
      ctx = gsap.context(() => {
        const cards = rootRef.current!.querySelectorAll('.feature-card');
        if (cards.length) {
          gsap.set(cards, { y: 30, opacity: 0, scale: 0.95 });
          gsap.to(cards, { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out', delay: 0.3 });
        }
      }, rootRef);
    })();
    return () => ctx?.revert?.();
  }, []);

  return (
    <div ref={rootRef} className="flex flex-col min-h-screen">
      <ThreeBackground />
      <main className="flex-1">
        <section className="relative w-full h-[70vh] md:h-[80vh] flex items-center justify-center text-center overflow-hidden bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50" />
          <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-cyan-500/30 blur-3xl opacity-70 blob-1" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-pink-500/30 blur-3xl opacity-70 blob-2" />
          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-purple-500/20 blur-3xl opacity-50" />
          <div className="relative z-10 container px-4 md:px-6">
            <div className="max-w-3xl mx-auto space-y-4">
              <h1 className="hero-title font-headline text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl drop-shadow-2xl">
                <span className="inline-block hover:scale-110 transition-transform duration-300 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">Wander</span>
                <span className="inline-block hover:scale-110 transition-transform duration-300 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-pulse">Lust</span>
              </h1>
              <p className="hero-subtitle text-lg text-gray-200 md:text-xl drop-shadow-lg">
                Your Digital Travel Diary. <span className="font-semibold text-white">Beautifully simple</span>, powerfully personal.
              </p>
              <div className="flex items-center justify-center gap-2 hero-badge">
                <span className="inline-flex items-center rounded-full bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 px-4 py-1.5 text-sm font-medium text-white ring-2 ring-cyan-400/30 backdrop-blur-md hover:ring-cyan-400/50 hover:scale-105 transition-all duration-300 cursor-default shadow-lg shadow-cyan-500/20">
                  <Sparkles className="mr-1.5 h-4 w-4 text-cyan-300 animate-pulse" /> AI‑powered planning
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <Button asChild size="lg" className="hero-cta bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 hover:from-cyan-600 hover:via-blue-600 hover:to-purple-600 text-white font-bold hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 group border-0">
                    <Link href="/dashboard">
                      <LayoutDashboard className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                      Go to Dashboard
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild size="lg" className="hero-cta bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 hover:from-cyan-600 hover:via-blue-600 hover:to-purple-600 text-white font-bold hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 group border-0">
                      <Link href="/signup">
                        Get Started
                        <Sparkles className="ml-2 h-4 w-4 group-hover:rotate-12 group-hover:scale-125 transition-transform" />
                      </Link>
                    </Button>
                    <Button asChild size="lg" className="hero-cta bg-white/10 hover:bg-white/20 text-white font-semibold hover:scale-105 hover:shadow-xl transition-all duration-300 backdrop-blur-md border-2 border-white/30 hover:border-white/50">
                      <Link href="/login">Log In</Link>
                    </Button>
                  </>
                )}
              </div>
              <div className="mx-auto grid grid-cols-3 gap-4 pt-2 text-gray-200">
                <div className="hero-stats flex items-center justify-center gap-2 hover:scale-110 transition-transform duration-300 cursor-default p-3 rounded-lg hover:bg-white/10 backdrop-blur-sm">
                  <Users className="h-5 w-5 text-cyan-400" />
                  <div className="text-sm"><span className="font-bold text-white bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">10k+</span> travelers</div>
                </div>
                <div className="hero-stats flex items-center justify-center gap-2 hover:scale-110 transition-transform duration-300 cursor-default p-3 rounded-lg hover:bg-white/10 backdrop-blur-sm">
                  <Route className="h-5 w-5 text-blue-400" />
                  <div className="text-sm"><span className="font-bold text-white bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">25k+</span> routes</div>
                </div>
                <div className="hero-stats flex items-center justify-center gap-2 hover:scale-110 transition-transform duration-300 cursor-default p-3 rounded-lg hover:bg-white/10 backdrop-blur-sm">
                  <Globe2 className="h-5 w-5 text-purple-400" />
                  <div className="text-sm"><span className="font-bold text-white bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">120+</span> countries</div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 scroll-indicator">
            <Link href="#features" className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-white ring-2 ring-cyan-400/30 hover:ring-cyan-400/50 backdrop-blur-md transition-all duration-300 hover:scale-110 animate-bounce shadow-lg shadow-cyan-500/20">
              <ChevronDown className="h-6 w-6" />
            </Link>
          </div>
        </section>
        <section id="features" className="py-12 md:py-24 bg-gradient-to-b from-background via-blue-50/30 to-background dark:via-blue-950/10">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">Powerful Features</h2>
              <p className="text-muted-foreground text-lg">Everything you need to document your adventures</p>
            </div>
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <Card key={index} className="feature-card bg-gradient-to-br from-white via-blue-50/50 to-purple-50/50 dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/20 backdrop-blur-sm border-2 border-blue-200/50 dark:border-blue-800/50 shadow-lg hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:scale-105 hover:-translate-y-2 group cursor-pointer">
                  <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                    <div className="p-3 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 group-hover:from-cyan-500/30 group-hover:to-purple-500/30 transition-all duration-300 group-hover:rotate-6 group-hover:scale-110 transform shadow-lg">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-headline font-semibold group-hover:bg-gradient-to-r group-hover:from-cyan-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">{feature.title}</h3>
                    <p className="text-muted-foreground group-hover:text-foreground transition-colors duration-300">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-gradient-to-r from-blue-900 via-purple-900 to-pink-900 py-6">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <p className="text-white/80">&copy; {new Date().getFullYear()} <span className="font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">WanderLust</span>. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

