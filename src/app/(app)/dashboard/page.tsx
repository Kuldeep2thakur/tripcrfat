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
      <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-[#050505]">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-white/40 mt-2">Welcome back!</p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-[120px] w-full rounded-3xl bg-white/5" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
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

        <section className="relative px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="relative z-10">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">Dashboard</h1>
              <p className="text-white/60 mt-2 text-lg">Your adventure hub, {user?.displayName || 'Traveler'}.</p>
            </div>
            <div className="flex gap-3 relative z-10">
              <Link href="/plan-trip">
                <Button variant="outline" className="rounded-full bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white h-12 px-6">
                  <Wand2 className="mr-2 h-4 w-4 text-orange-400" />
                  Plan Trip
                </Button>
              </Link>
              <Link href="/dashboard/new">
                <Button className="rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-12 px-6 shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all hover:shadow-[0_0_30px_rgba(249,115,22,0.6)]">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Trip
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
        {/* Stats Cards - Updated to Glassmorphism */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl hover:-translate-y-1 transition-transform duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-white/60 uppercase tracking-widest">Total Trips</CardTitle>
              <div className="p-2 rounded-full bg-orange-500/10 border border-orange-500/20 group-hover:bg-orange-500/20 transition-colors">
                <Map className="h-4 w-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white mb-1">{stats.totalTrips}</div>
              <p className="text-xs text-white/40">
                {stats.totalTrips === 1 ? 'Adventure Logged' : 'Adventures Logged'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl hover:-translate-y-1 transition-transform duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-white/60 uppercase tracking-widest">Journal Entries</CardTitle>
              <div className="p-2 rounded-full bg-blue-500/10 border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                <FileText className="h-4 w-4 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white mb-1">{stats.totalEntries}</div>
              <p className="text-xs text-white/40">
                {stats.totalEntries === 1 ? 'Memory Captured' : 'Memories Captured'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl hover:-translate-y-1 transition-transform duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-white/60 uppercase tracking-widest">Places</CardTitle>
              <div className="p-2 rounded-full bg-purple-500/10 border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors">
                <MapPin className="h-4 w-4 text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white mb-1">{stats.uniqueLocations}</div>
              <p className="text-xs text-white/40">
                {stats.uniqueLocations === 1 ? 'Location Visited' : 'Locations Visited'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Trips Section */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-gradient-to-b from-orange-400 to-red-600 rounded-full" />
                <h2 className="text-2xl font-bold text-white">Recent Trips</h2>
              </div>
              <p className="text-white/40 text-sm ml-4">Your latest adventures awaiting you.</p>
            </div>
            {stats.totalTrips > 0 && (
              <Link href="/trips">
                <Button variant="ghost" className="text-orange-400 hover:text-white hover:bg-white/5 transition-colors">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
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
            <div className="relative text-center py-24 border border-dashed border-white/10 rounded-3xl bg-white/5 backdrop-blur overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/5 via-transparent to-blue-500/5 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/5 mb-6 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                  <Compass className="h-8 w-8 text-orange-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">No trips yet</h2>
                <p className="text-white/50 mt-2 mb-8 max-w-md mx-auto leading-relaxed">
                  The world is waiting. Start your journey by creating your first trip and capturing unforgettable moments.
                </p>
                <Link href="/dashboard/new">
                  <Button size="lg" className="rounded-full bg-white text-black hover:bg-orange-500 hover:text-white font-bold px-8 h-12 shadow-lg transition-all duration-300">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Create Your First Trip
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
