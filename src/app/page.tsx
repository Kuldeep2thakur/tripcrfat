'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { MapPin, Calendar, Users, ArrowRight, Search, Play, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, where, limit } from 'firebase/firestore';
import { Trip } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { StoriesBar } from '@/components/social/stories-bar';
import { ReelsGrid } from '@/components/social/reels-grid';

export default function HomePage() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();

  // Query for public trips (limit to 3 for the "Top Rated" section to match design)
  const publicTripsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collectionGroup(firestore, 'trips'), where('visibility', '==', 'public'), limit(3));
  }, [firestore]);

  const { data: publicTrips, isLoading: isLoadingPublicTrips } = useCollection<Trip>(publicTripsQuery);

  return (
    <div ref={rootRef} className="flex flex-col min-h-screen bg-gradient-to-b from-[#0f172a] to-black text-white font-sans selection:bg-orange-500 selection:text-white">

      {/* 1. HERO SECTION */}
      <section className="relative w-full h-[100vh] flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <iframe
            className="w-full h-full object-cover scale-[1.35] pointer-events-none opacity-80"
            src="https://www.youtube.com/embed/zHYcM9mQiac?autoplay=1&mute=1&controls=0&loop=1&playlist=zHYcM9mQiac&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&disablekb=1&fs=0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          {/* Gradient Overlay for smooth transition to dark body */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[#0f172a]" />
        </div>

        {/* Hero Content - REMOVED as per user request */}
        {/* <div className="relative z-10 container px-4 flex flex-col items-center gap-8 mt-[-50px] animate-in fade-in zoom-in duration-1000"> ... </div> */}

      </section>

      {/* 2. STORIES & REELS SECTION */}
      <section className="py-20 bg-[#050505] relative z-10">
        <div className="container mx-auto px-4 sm:px-6 space-y-16">
          {/* Gradient Divider */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Stories */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <div className="w-1 h-8 bg-gradient-to-b from-orange-400 to-red-600 rounded-full" />
                Travel Stories
              </h3>
            </div>
            <StoriesBar />
          </div>

          {/* Reels */}
          <ReelsGrid />
        </div>
      </section>

      {/* 3. WHY CHOOSE US SECTION */}
      <section className="py-32 bg-[#050505] container mx-auto px-4 sm:px-6 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">

          {/* Left Content */}
          <div className="space-y-10">
            <div className="inline-block px-4 py-1.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold text-sm tracking-wide uppercase">
              Our Promise
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-white leading-[1.1] tracking-tight">
              Why Choose WanderLust <br /> For Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-200">Journey?</span>
            </h2>
            <p className="text-white/60 text-lg leading-relaxed font-light">
              We're a trusted digital travel partner that brings the best travel experiences to specific destinations around the world. We offer exclusive tools, route tracking, and unforgettable adventures.
            </p>

            <ul className="space-y-5 pt-4">
              {['Top Destinations', 'Flexible Travel Packages', 'Expert Travel Guides', 'Affordable & Transparent Pricing'].map((item) => (
                <li key={item} className="flex items-center text-white/90 font-medium text-lg">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mr-4 shadow-[0_0_10px_rgba(249,115,22,0.5)]" /> {item}
                </li>
              ))}
            </ul>

            <Button className="mt-8 rounded-full h-14 px-10 bg-white text-black hover:bg-orange-500 hover:text-white transition-all duration-300 font-bold text-md">
              Read Our Story <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>

          {/* Right Images (Arch Layout) - Dark Theme Adapted */}
          <div className="relative h-[650px] w-full hidden lg:block">
            {/* Main Tall Arch Image */}
            <div className="absolute top-0 right-10 w-[300px] h-[550px] rounded-t-[150px] rounded-b-[30px] overflow-hidden shadow-2xl border border-white/10 z-10 transition-transform hover:-translate-y-4 duration-700 bg-gray-900 group">
              <Image
                src="https://images.unsplash.com/photo-1528629297340-d1d466945dc5?q=80&w=1000&auto=format&fit=crop" // Japan
                alt="Japan"
                fill
                className="object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60" />
              <div className="absolute bottom-8 left-8 right-8">
                <div className="bg-white/10 backdrop-blur-md px-5 py-4 rounded-2xl border border-white/10">
                  <div className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-1">Gateway to</div>
                  <div className="text-xl font-bold text-white">Unforgettable Journeys</div>
                </div>
              </div>
            </div>

            {/* Secondary Circle/Arch Image */}
            <div className="absolute bottom-10 left-0 w-[320px] h-[360px] rounded-t-[180px] rounded-b-[30px] overflow-hidden shadow-2xl border border-white/10 z-0 bg-gray-800 grayscale hover:grayscale-0 transition-all duration-700">
              <Image
                src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1000&auto=format&fit=crop" // Ancient ruins
                alt="Travel"
                fill
                className="object-cover opacity-70 hover:opacity-100 transition-opacity"
              />
              <div className="absolute top-10 right-10 bg-orange-600 text-white rounded-full w-24 h-24 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(234,88,12,0.4)] z-20">
                <span className="text-3xl font-bold">25+</span>
                <span className="text-[10px] uppercase font-bold text-white/80 tracking-wider">Years</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. LOGO STRIP */}
      <div className="py-16 bg-[#050505] border-y border-white/5 overflow-hidden">
        <div className="container mx-auto px-6 opacity-40 hover:opacity-100 transition-opacity duration-700 flex justify-between items-center gap-10 flex-wrap">
          {/* Text placeholder for brands */}
          <span className="text-xl font-bold text-white/30 uppercase tracking-widest">Trusted Partners</span>
          <div className="flex gap-16 font-bold text-white/50 text-2xl items-center">
            <span>RaraRoots</span>
            <span>ORBIT INC.</span>
            <span>HousePool</span>
            <span>ProCircle</span>
          </div>
        </div>
      </div>

      {/* 5. FEATURED DESTINATIONS */}
      <section className="py-32 container mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <h3 className="text-orange-500 font-bold uppercase tracking-[0.2em] mb-3 text-sm">Top Rated Destinations</h3>
            <h2 className="text-5xl font-bold text-white leading-tight">For Your Next <span className="text-white/50">Adventure.</span></h2>
          </div>
          <Link href="/explore">
            <Button variant="outline" className="rounded-full bg-transparent border-white/20 text-white hover:bg-white hover:text-black transition-all px-8 h-12">
              Explore More <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Custom Trip Card Grid matching design (Tall Arch Cards) */}
        {isLoadingPublicTrips ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-[550px] w-full rounded-[40px] bg-white/5" />
            ))}
          </div>
        ) : publicTrips && publicTrips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {publicTrips.map((trip, idx) => {
              const placeholder = PlaceHolderImages.find(p => p.id === trip.coverPhotoId) || PlaceHolderImages[0];
              const imgUrl = trip.coverPhotoURL || placeholder.imageUrl;

              return (
                <div key={trip.id} className="group relative h-[550px] w-full rounded-[40px] overflow-hidden cursor-pointer bg-gray-900 border border-white/5 transition-all duration-700 hover:-translate-y-2">
                  <Link href={`/trips/${trip.id}`} className="block w-full h-full">
                    <Image
                      src={imgUrl}
                      alt={trip.title}
                      fill
                      className="object-cover transition-transform duration-1000 group-hover:scale-110 opacity-70 group-hover:opacity-100"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90" />

                    <div className="absolute bottom-10 left-10 right-10 text-white transform transition-transform duration-500 group-hover:translate-y-[-10px]">
                      <h3 className="text-4xl font-bold mb-3 leading-none tracking-tight">{trip.title}</h3>
                      {trip.location?.name && (
                        <div className="flex items-center text-orange-400 text-sm font-bold uppercase tracking-wider mb-4">
                          <MapPin className="w-4 h-4 mr-2" /> {trip.location.name}
                        </div>
                      )}

                      {/* Description sliding up */}
                      <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-500">
                        <div className="overflow-hidden">
                          <p className="text-white/70 text-sm font-light leading-relaxed">
                            {trip.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="absolute top-6 right-6 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold text-white border border-white/20 uppercase tracking-widest">
                      {idx === 0 ? 'Top Pick' : 'Trending'}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/5 rounded-[40px] border border-white/5">
            <p className="text-xl text-white/40">No popular destinations found right now.</p>
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="bg-black text-white/40 py-20 border-t border-white/5">
        <div className="container mx-auto px-6 text-center">
          <div className="mb-8">
            <span className="text-3xl font-bold text-white tracking-widest uppercase">Wander<span className="text-orange-500">Lust.</span></span>
          </div>
          <div className="flex justify-center gap-10 mb-12 text-sm font-bold uppercase tracking-widest">
            <Link href="#" className="hover:text-white transition-colors">About</Link>
            <Link href="#" className="hover:text-white transition-colors">Services</Link>
            <Link href="#" className="hover:text-white transition-colors">Destinations</Link>
            <Link href="#" className="hover:text-white transition-colors">Contact</Link>
          </div>
          <p className="text-xs font-mono">&copy; {new Date().getFullYear()} WanderLust Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
