'use client';
import { TripCard } from "@/components/trip-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { PlusCircle, Map, Calendar, TrendingUp, ArrowRight, FileText, MapPin, Compass, Sparkles, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { collection, query, orderBy, limit, getDocs, collectionGroup } from "firebase/firestore";
import Link from "next/link";
import { Trip } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const [totalEntriesCount, setTotalEntriesCount] = useState(0);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  // Fetch total entries count
  useEffect(() => {
    const fetchEntriesCount = async () => {
      if (!user || !firestore) return;

      try {
        // Use collection group query to get all entries across all trips
        const entriesQuery = query(
          collectionGroup(firestore, 'entries'),
        );
        const snapshot = await getDocs(entriesQuery);

        // Filter entries that belong to this user
        const userEntries = snapshot.docs.filter(doc => {
          const data = doc.data();
          return data.authorId === user.uid;
        });

        setTotalEntriesCount(userEntries.length);
      } catch (error) {
        console.error('Error fetching entries count:', error);
        setTotalEntriesCount(0);
      }
    };

    fetchEntriesCount();
  }, [user, firestore]);

  // Fetch all trips to get total count
  const allTripsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/trips`));
  }, [user, firestore]);

  const { data: allTrips, isLoading: isLoadingAllTrips } = useCollection<Trip>(allTripsQuery);

  // Fetch recent trips for display
  const recentTripsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, `users/${user.uid}/trips`),
      orderBy('startDate', 'desc'),
      limit(6)
    );
  }, [user, firestore]);

  const { data: recentTrips, isLoading: isLoadingRecentTrips } = useCollection<Trip>(recentTripsQuery);

  // Calculate statistics from trips data
  const stats = useMemo(() => {
    const totalTrips = allTrips?.length || 0;

    // Use the fetched entries count
    const totalEntries = totalEntriesCount;

    // Get unique locations from trips
    const uniqueLocations = new Set(
      allTrips?.filter(trip => trip.location?.name).map(trip => trip.location!.name)
    ).size || 0;

    return {
      totalTrips,
      totalEntries,
      uniqueLocations
    };
  }, [allTrips, totalEntriesCount]);

  const isLoading = isUserLoading || isLoadingAllTrips || isLoadingRecentTrips;

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-headline font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Welcome back!</p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-[120px] w-full rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
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
    <div className="pb-8 min-h-screen bg-gradient-to-b from-background to-muted/40">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/15 via-accent/10 to-transparent" />
        <section className="relative px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-headline font-bold">Dashboard</h1>
              <p className="text-muted-foreground mt-1">Welcome back, {user?.displayName || 'Traveler'}!</p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="border-primary/30 hover:bg-primary/10">
                <Link href="/plan-trip">
                  <Wand2 className="mr-2 h-4 w-4" />
                  Plan Trip
                </Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                <Link href="/dashboard/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Trip
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
              <div className="p-2 rounded-full bg-blue-500/10">
                <Map className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{stats.totalTrips}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalTrips === 1 ? 'travel adventure' : 'travel adventures'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Journal Entries</CardTitle>
              <div className="p-2 rounded-full bg-emerald-500/10">
                <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{stats.totalEntries}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalEntries === 1 ? 'memory captured' : 'memories captured'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Locations Visited</CardTitle>
              <div className="p-2 rounded-full bg-purple-500/10">
                <MapPin className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{stats.uniqueLocations}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.uniqueLocations === 1 ? 'unique destination' : 'unique destinations'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Trips Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-headline font-bold">Recent Trips</h2>
              </div>
              <p className="text-muted-foreground text-sm">Your latest adventures</p>
            </div>
            {stats.totalTrips > 0 && (
              <Button asChild variant="ghost" className="hover:bg-primary/10">
                <Link href="/trips" className="group">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            )}
          </div>

          {recentTrips && recentTrips.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentTrips.map(trip => (
                <div key={trip.id} className="trip-card-anim will-change-transform">
                  <TripCard trip={trip} />
                </div>
              ))}
            </div>
          ) : (
            <div className="relative text-center py-20 border-2 border-dashed rounded-2xl bg-gradient-to-br from-card/50 to-muted/30 backdrop-blur overflow-hidden">
              <div className="absolute inset-0 shimmer opacity-30" />
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Compass className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">No trips yet</h2>
                <p className="text-muted-foreground mt-2 mb-6 max-w-md mx-auto">Start your next adventure by creating a new trip and capturing memories.</p>
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
    </div>
  );
}
