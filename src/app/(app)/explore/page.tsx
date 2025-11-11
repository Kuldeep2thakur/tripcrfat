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
        <div className="p-4 sm:p-6 lg:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-headline font-bold">Explore Public Trips</h1>
                <p className="text-muted-foreground mt-2">Discover adventures from the WanderLust community.</p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
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
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-headline font-bold">Explore Public Trips</h1>
        <p className="text-muted-foreground mt-2">Discover adventures from the WanderLust community.</p>
      </header>

      {publicTrips && publicTrips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {publicTrips.map(trip => (
            <TripCard key={trip.id} trip={trip} />
            ))}
        </div>
        ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <h2 className="text-2xl font-semibold">No public trips to explore.</h2>
                <p className="text-muted-foreground mt-2">Check back later for new adventures from the community!</p>
            </div>
      )}
    </div>
  );
}
