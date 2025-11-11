'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, orderBy, query } from 'firebase/firestore';
import type { Entry, Trip } from '@/lib/types';
import { EntryGallery } from '@/components/entry-gallery';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function TripGalleryPage() {
  const { tripId } = useParams();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const tripRef = useMemoFirebase(() => {
    if (!firestore || !tripId || !user) return null;
    return doc(firestore, `users/${user.uid}/trips`, tripId as string);
  }, [firestore, tripId, user]);

  const { data: trip, isLoading: isLoadingTrip } = useDoc<Trip>(tripRef);

  const entriesQuery = useMemoFirebase(() => {
    if (!tripRef || !user) return null;
    return query(
      collection(firestore, `users/${user.uid}/trips/${tripId}/entries`),
      orderBy('visitedAt', 'desc')
    );
  }, [tripRef, user, firestore, tripId]);

  const { data: entries, isLoading: isLoadingEntries } = useCollection<Entry>(entriesQuery);

  if (!isUserLoading && !user) {
    router.push('/login');
    return null;
  }

  if (isLoadingTrip || isUserLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-12 w-48 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/trips/${tripId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Trip
              </Link>
            </Button>
            <h1 className="font-headline text-lg font-semibold">
              {trip?.title || 'Gallery'}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <EntryGallery entries={entries ?? undefined} />
      </main>
    </div>
  );
}
