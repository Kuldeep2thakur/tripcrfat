'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, query } from "firebase/firestore";
import { Trip } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Map as MapIcon } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import the map component with no SSR
const TripsMap = dynamic(() => import("@/components/trips-map").then(mod => ({ default: mod.TripsMap })), {
    ssr: false,
    loading: () => (
        <div className="h-[600px] w-full rounded-lg overflow-hidden bg-muted flex items-center justify-center">
            <p className="text-muted-foreground">Loading map...</p>
        </div>
    ),
});

export default function MapPage() {
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
        return query(collection(firestore, `users/${user.uid}/trips`));
    }, [user, firestore]);

    const { data: trips, isLoading: isLoadingTrips } = useCollection<Trip>(tripsQuery);

    useEffect(() => {
        if (trips) {
            console.log('Trips loaded:', trips);
            console.log('Trips with locations:', trips.filter(t => t.location?.coordinates));
        }
    }, [trips]);

    if (isUserLoading || isLoadingTrips) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-headline font-bold">Trips Map</h1>
                    <p className="text-muted-foreground mt-2">Loading your trips...</p>
                </header>
                <Skeleton className="h-[600px] w-full rounded-xl" />
            </div>
        );
    }

    return (
        <div className="pb-8 min-h-screen bg-gradient-to-b from-background to-muted/40">
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/15 via-accent/10 to-transparent" />
                <section className="relative px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
                    <div className="flex flex-col gap-4">
                        <Button asChild variant="ghost" size="sm" className="w-fit">
                            <Link href="/trips">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Trips
                            </Link>
                        </Button>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <div className="flex items-center gap-3">
                                    <MapIcon className="h-8 w-8 text-primary" />
                                    <h1 className="text-3xl sm:text-4xl font-headline font-bold">Trips Map</h1>
                                </div>
                                <p className="text-muted-foreground mt-2">
                                    Visualize all your travel destinations on an interactive map
                                </p>
                            </div>
                        </div>
                        {trips && trips.length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="font-medium">{trips.length}</span>
                                <span>{trips.length === 1 ? 'trip' : 'trips'} total</span>
                                <span className="mx-2">•</span>
                                <span className="font-medium">
                                    {trips.filter(t => t.location?.coordinates).length}
                                </span>
                                <span>with locations</span>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            <div className="px-4 sm:px-6 lg:px-8">
                {trips && trips.length > 0 ? (
                    <TripsMap trips={trips} />
                ) : (
                    <div className="text-center py-16 border-2 border-dashed rounded-lg">
                        <MapIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <h2 className="text-2xl font-semibold">No trips to display</h2>
                        <p className="text-muted-foreground mt-2 mb-6">
                            Create your first trip to see it on the map
                        </p>
                        <Button asChild>
                            <Link href="/dashboard/new">Create Your First Trip</Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
