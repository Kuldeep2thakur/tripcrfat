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
            <div className="p-4 sm:p-6 lg:p-8">
                <header className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-headline font-bold">All Trips</h1>
                    <Button disabled>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Trip
                    </Button>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex flex-col space-y-3">
                            <Skeleton className="h-[200px] w-full rounded-xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[250px]" />
                                <Skeleton className="h-4 w-[200px]" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

  return (
    <div className="pb-8 min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-accent/20" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <section className="relative px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
                <Compass className="h-4 w-4" />
                <span>Your Adventures</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-headline font-bold tracking-tight">
                <span className="gradient-text">All Trips</span>
              </h1>
              <p className="text-muted-foreground text-base mt-2">Browse and manage all your travel adventures.</p>
            </div>
            <div className="flex gap-2">
              <div className="relative hidden sm:block">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search trips..."
                  className="pl-9 w-64 border-primary/20 focus:border-primary/40 bg-background/80 backdrop-blur"
                />
              </div>
              <Button asChild variant="outline" className="border-primary/30 hover:bg-primary/10">
                <Link href="/plan-trip">
                  <Wand2 className="mr-2 h-4 w-4" />
                  <span className="hidden lg:inline">Plan Trip</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-primary/30 hover:bg-primary/10">
                <Link href="/map">
                  <MapPin className="mr-2 h-4 w-4" />
                  <span className="hidden lg:inline">Map View</span>
                </Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg hover:shadow-xl transition-all">
                <Link href="/dashboard/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Trip
                </Link>
              </Button>
            </div>
          </div>
          <div className="mt-4 sm:hidden">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search trips..." className="pl-9 border-primary/20 focus:border-primary/40 bg-background/80 backdrop-blur" />
            </div>
          </div>
        </section>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 mt-8">
        {filteredTrips && filteredTrips.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">
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
          <div className="relative text-center py-20 border-2 border-dashed rounded-2xl bg-gradient-to-br from-card/50 to-muted/30 backdrop-blur overflow-hidden">
            <div className="absolute inset-0 shimmer opacity-30" />
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Compass className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">No trips found</h2>
              <p className="text-muted-foreground mt-2 mb-6 max-w-md mx-auto">
                {q ? 'Try a different keyword or clear your search.' : 'Start your next adventure by creating a new trip and capturing memories.'}
              </p>
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg">
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
