'use client';
import { TripCard } from "@/components/trip-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { PlusCircle, Search, MapPin, Sparkles, Compass, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { collection, query } from "firebase/firestore";
import Link from "next/link";
import { Trip } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function TripsPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const tripsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    // Query the current user's trips under users/{userId}/trips
    return query(collection(firestore, `users/${user.uid}/trips`));
  }, [user, firestore]);

  const { data: trips, isLoading: isLoadingTrips } = useCollection<Trip>(tripsQuery);

  const [q, setQ] = useState("");
  const myTrips = trips;
  const filteredTrips = useMemo(() => {
    if (!myTrips) return myTrips;
    if (!q.trim()) return myTrips;
    const needle = q.toLowerCase();
    return myTrips.filter(t =>
      (t.title || "").toLowerCase().includes(needle) ||
      (t.description || "").toLowerCase().includes(needle)
    );
  }, [myTrips, q]);

  if (isUserLoading || isLoadingTrips) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-[#050505]">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">All Trips</h1>
          <Button disabled className="bg-white/5 text-white/50">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Trip
          </Button>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-[200px] w-full rounded-3xl bg-white/5" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px] bg-white/5" />
                <Skeleton className="h-4 w-[200px] bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0f172a] to-black text-white font-sans selection:bg-orange-500 selection:text-white pb-20">
      <div className="relative overflow-hidden">
        {/* Decorative Blob */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />

        <section className="relative px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-4 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-sm font-medium border border-orange-500/20">
                <Compass className="h-4 w-4" />
                <span>Your Adventures</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
                All Trips
              </h1>
              <p className="text-white/60 text-lg max-w-2xl">Browse and manage all your travel adventures in one place.</p>
            </div>

            <div className="flex flex-wrap gap-3 relative z-10">
              <div className="relative hidden lg:block w-72">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search trips..."
                  className="pl-9 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-orange-500/50 rounded-full backdrop-blur-sm"
                />
              </div>
              <Button asChild variant="outline" className="rounded-full bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white h-12 px-6">
                <Link href="/plan-trip">
                  <Wand2 className="mr-2 h-4 w-4 text-orange-400" />
                  <span className="hidden lg:inline">Plan Trip</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white h-12 px-6">
                <Link href="/map">
                  <MapPin className="mr-2 h-4 w-4 text-orange-400" />
                  <span className="hidden lg:inline">Map View</span>
                </Link>
              </Button>
              <Button asChild className="rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-12 px-6 shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] transition-all">
                <Link href="/dashboard/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Trip
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-6 lg:hidden relative z-10">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search trips..."
                className="pl-9 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-orange-500/50 rounded-full backdrop-blur-sm"
              />
            </div>
          </div>
        </section>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 mt-2 relative z-10">
        {filteredTrips && filteredTrips.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-gradient-to-b from-orange-400 to-red-600 rounded-full" />
                <h2 className="text-xl font-bold text-white">
                  {q ? `Found ${filteredTrips.length} trip${filteredTrips.length !== 1 ? 's' : ''}` : `${filteredTrips.length} Trip${filteredTrips.length !== 1 ? 's' : ''}`}
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTrips.map(trip => (
                <div key={trip.id} className="trip-card-anim will-change-transform">
                  <TripCard trip={trip} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="relative text-center py-24 border border-dashed border-white/10 rounded-3xl bg-white/5 backdrop-blur overflow-hidden group max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/5 via-transparent to-blue-500/5 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/5 mb-6 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                <Compass className="h-8 w-8 text-orange-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">No trips found</h2>
              <p className="text-white/50 mt-2 mb-8 max-w-md mx-auto">
                {q ? 'Try a different keyword or clear your search.' : 'Start your next adventure by creating a new trip and capturing memories.'}
              </p>
              <Button asChild size="lg" className="rounded-full bg-white text-black hover:bg-orange-500 hover:text-white font-bold px-8 h-12 shadow-lg transition-all duration-300">
                <Link href="/dashboard/new">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Create Your First Trip
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
