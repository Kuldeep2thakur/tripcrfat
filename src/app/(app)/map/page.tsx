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
        <div className="h-[600px] w-full rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
            <p className="text-white/50 animate-pulse">Loading map...</p>
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
            <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-[#050505]">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-white">Trips Map</h1>
                    <p className="text-white/40 mt-2">Loading your trips...</p>
                </header>
                <Skeleton className="h-[600px] w-full rounded-2xl bg-white/5" />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0f172a] to-black text-white font-sans selection:bg-orange-500 selection:text-white pb-20">
            <div className="relative overflow-hidden">
                {/* Decorative Blob */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

                <section className="relative px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
                    <div className="flex flex-col gap-4">
                        <Button asChild variant="ghost" size="sm" className="w-fit text-white/50 hover:text-white hover:bg-white/5">
                            <Link href="/trips">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Trips
                            </Link>
                        </Button>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <div className="relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                                        <MapIcon className="h-6 w-6 text-orange-500" />
                                    </div>
                                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Trips Map</h1>
                                </div>
                                <p className="text-white/60 mt-2 max-w-2xl">
                                    Visualize all your travel destinations on an interactive map.
                                </p>
                            </div>
                        </div>
                        {trips && trips.length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-white/40 font-medium">
                                <span className="text-white">{trips.length}</span>
                                <span>{trips.length === 1 ? 'trip' : 'trips'} total</span>
                                <span className="mx-2 text-white/20">•</span>
                                <span className="text-white">
                                    {trips.filter(t => t.location?.coordinates).length}
                                </span>
                                <span>with locations</span>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            <div className="px-4 sm:px-6 lg:px-8 relative z-10">
                {trips && trips.length > 0 ? (
                    <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                        <TripsMap trips={trips} />
                    </div>
                ) : (
                    <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/5 backdrop-blur max-w-2xl mx-auto">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-6 border border-white/10">
                            <MapIcon className="h-8 w-8 text-white/30" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">No trips to display</h2>
                        <p className="text-white/50 mt-2 mb-8">
                            Create your first trip to see it on the map.
                        </p>
                        <Button asChild className="rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-12 px-8">
                            <Link href="/dashboard/new">Create Your First Trip</Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
