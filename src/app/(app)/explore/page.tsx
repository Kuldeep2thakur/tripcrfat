'use client';
import { TripCard } from "@/components/trip-card";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collectionGroup, query, where } from "firebase/firestore";
import { Trip } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function ExplorePage() {
  const firestore = useFirestore();

  const publicTripsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Use a collectionGroup query to read trips stored under each user's
    // `users/{userId}/trips` subcollection. This matches your security rules
    // which protect per-user trips while allowing public visibility.
    return query(collectionGroup(firestore, 'trips'), where('visibility', '==', 'public'));
  }, [firestore]);

  const { data: publicTrips, isLoading: isLoadingPublicTrips } = useCollection<Trip>(publicTripsQuery);

  if (isLoadingPublicTrips) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-[#050505] pt-24">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">Explore Public Trips</h1>
          <p className="text-white/40 mt-2">Discover adventures from the WanderLust community.</p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
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
    <div className="min-h-screen bg-gradient-to-b from-[#0f172a] to-black text-white font-sans selection:bg-orange-500 selection:text-white pb-20 pt-24">
      <div className="relative overflow-hidden px-4 sm:px-6 lg:px-8">
        {/* Decorative Blob */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

        <header className="mb-10 relative z-10">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">Explore</h1>
          <p className="text-lg text-white/60 max-w-2xl">
            Discover public trips shared by the WanderLust community. Get inspired for your next adventure.
          </p>
        </header>

        {publicTrips && publicTrips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
            {publicTrips.map(trip => (
              <div key={trip.id} className="trip-card-anim will-change-transform">
                <TripCard trip={trip} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/5 backdrop-blur max-w-2xl mx-auto relative z-10">
            <h2 className="text-2xl font-bold text-white mb-2">No public trips yet</h2>
            <p className="text-white/50 mt-2">
              Be the first to share your adventure with the world!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
