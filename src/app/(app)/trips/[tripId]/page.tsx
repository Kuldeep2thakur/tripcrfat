
'use client';

import { useDoc, useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { useParams, useRouter } from 'next/navigation';
import { doc, collection, query, orderBy, where } from 'firebase/firestore';
import { Trip, Entry, User as TripUser } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { MediaDisplay } from '@/components/media-display';
import { MapView } from '@/components/map-view';
import { ItineraryMap } from '@/components/itinerary-map';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, Calendar, Edit, Globe, Lock, MapPin, PlusCircle, Users, MoreVertical, Share2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { EntryGallery } from '@/components/entry-gallery';

const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('') : '';

function AuthorAvatar({ authorId }: { authorId: string }) {
    const firestore = useFirestore();
    const authorRef = useMemoFirebase(() => {
        if (!firestore || !authorId) return null;
        return doc(firestore, 'users', authorId);
    }, [firestore, authorId]);
    const { data: author, isLoading } = useDoc<TripUser>(authorRef);

    if (isLoading) {
        return <Skeleton className="h-6 w-6 rounded-full" />;
    }

    if (!author) {
        return null;
    }

    const authorName = author.displayName || author.email || author.id;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>
                    <Avatar className="h-6 w-6">
                        {author.photoURL && <AvatarImage src={author.photoURL} alt={authorName} />}
                        <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
                    </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{authorName}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

function SharedWithAvatars({ trip }: { trip: Trip }) {
    // Disabled user lookup due to Firestore security rules not allowing user listing
    // TODO: Implement alternative approach (e.g., store user info in trip document)
    
    if (!trip.sharedWith || trip.sharedWith.length === 0) {
        return <p className="text-sm text-muted-foreground">Only you</p>;
    }
    
    // Show count of shared users instead of fetching their details
    const sharedCount = trip.sharedWith.length;

    return (
        <p className="text-sm text-muted-foreground">
            Shared with {sharedCount} {sharedCount === 1 ? 'person' : 'people'}
        </p>
    );
}

const VisibilityIcon = ({ visibility }: { visibility: Trip['visibility'] }) => {
  const iconProps = { className: "h-4 w-4 mr-2" };
  switch (visibility) {
    case 'public':
      return <><Globe {...iconProps} /> Public</>;
    case 'private':
      return <><Lock {...iconProps} /> Private</>;
    case 'shared':
      return <><Users {...iconProps} /> Shared</>;
    default:
      return null;
  }
};


export default function TripPage() {
    const { tripId } = useParams();
    const router = useRouter();
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();

    const tripRef = useMemoFirebase(() => {
        if (!firestore || !tripId || !user) return null;
        return doc(firestore, `users/${user.uid}/trips`, tripId as string);
    }, [firestore, tripId, user]);

    const { data: trip, isLoading: isLoadingTrip } = useDoc<Trip>(tripRef);

    const entriesQuery = useMemoFirebase(() => {
        if (!tripRef || !user) return null;
        return query(collection(firestore, `users/${user.uid}/trips/${tripId}/entries`), orderBy('visitedAt', 'desc'));
    }, [tripRef, user, firestore, tripId]);
    
    const { data: entries, isLoading: isLoadingEntries } = useCollection<Entry>(entriesQuery);

    const onDeleteTrip = async () => {
        if (!tripRef) return;
        const confirmDelete = window.confirm('Delete this trip and all its entries? This cannot be undone.');
        if (!confirmDelete) return;
        try {
            const { deleteDoc, getDocs } = await import('firebase/firestore');
            const { collection } = await import('firebase/firestore');
            // delete entries under trip
            const entriesSnap = await getDocs(collection(firestore!, `users/${user!.uid}/trips/${tripId}/entries`));
            const batchModule = await import('firebase/firestore');
            const batch = (batchModule as any).writeBatch(firestore!);
            entriesSnap.forEach(docSnap => batch.delete(docSnap.ref));
            await batch.commit();
            // delete trip doc
            await deleteDoc(tripRef);
            if (typeof window !== 'undefined') window.alert('Trip deleted');
            router.push('/dashboard');
        } catch (e: any) {
            if (typeof window !== 'undefined') window.alert(`Failed to delete trip: ${e?.message || ''}`);
        }
    };

    const onShareTrip = async () => {
        try {
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            const link = `${origin}/trips/${tripId}`;
            await navigator.clipboard.writeText(link);
            if (typeof window !== 'undefined') window.alert(`Share link copied: ${link}`);
        } catch (e: any) {
            if (typeof window !== 'undefined') window.alert('Could not copy link');
        }
    };

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    // Animate entry cards on load
    useEffect(() => {
        const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) return;
        let ctx: any;
        (async () => {
            const { gsap } = await import('gsap');
            const root = document;
            const cards = root.querySelectorAll('.entry-card');
            if (!cards.length) return;
            ctx = gsap.context(() => {
                gsap.set(cards, { y: 16, opacity: 0 });
                gsap.to(cards, { opacity: 1, y: 0, duration: 0.45, stagger: 0.06, ease: 'power2.out' });
            });
        })();
        return () => ctx?.revert?.();
    }, [entries?.length]);

    const placeholderPhoto = trip?.coverPhotoId ? PlaceHolderImages.find(p => p.id === trip.coverPhotoId) : PlaceHolderImages.find(p => p.id === 'trip-cover-1');
    const coverPhotoURL = trip?.coverPhotoURL || placeholderPhoto?.imageUrl;
    const coverPhotoAlt = placeholderPhoto?.description || 'Trip cover image';
    const coverPhotoHint = placeholderPhoto?.imageHint || 'travel landscape';

    if (isLoadingTrip || isUserLoading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <Skeleton className="h-12 w-48 mb-8" />
                <Skeleton className="w-full h-96 rounded-2xl mb-6" />
                <Skeleton className="h-8 w-64 mb-4" />
                <Skeleton className="h-5 w-full mb-2" />
                <Skeleton className="h-5 w-4/5" />
            </div>
        );
    }

    if (!trip) {
        return (
            <div className="text-center py-16">
                <h2 className="text-2xl font-semibold">Trip not found</h2>
                <p className="text-muted-foreground mt-2">The trip you are looking for does not exist or you do not have permission to view it.</p>
                <Button asChild className="mt-6">
                    <Link href="/dashboard">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
            </div>
        );
    }
    
    const isOwner = user?.uid === trip.ownerId;
    const canAddEntry = isOwner || (trip.visibility === 'shared' && trip.sharedWith?.includes(user?.uid || ''));

    return (
        <div className="min-h-screen">
             <header className="relative h-64 md:h-80 w-full">
                {coverPhotoURL && (
                    <Image
                        src={coverPhotoURL}
                        alt={coverPhotoAlt}
                        fill
                        className="object-cover"
                        priority
                        data-ai-hint={coverPhotoHint}
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4 sm:p-6 lg:p-8 text-white">
                    <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">{trip.title}</h1>
                    <div className="flex items-center text-lg mt-2 text-gray-200">
                        <Calendar className="h-5 w-5 mr-2" />
                        {typeof (trip.startDate as any) === 'string' ? (trip.startDate as any) : format(trip.startDate as any, 'MMM dd, yyyy')} - {typeof (trip.endDate as any) === 'string' ? (trip.endDate as any) : format(trip.endDate as any, 'MMM dd, yyyy')}
                    </div>
                </div>
                {isOwner && (
                    <div className="absolute top-4 right-4 flex gap-2">
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="capitalize flex items-center gap-1.5">
                                <VisibilityIcon visibility={trip?.visibility} />
                                {trip?.visibility}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" aria-label="More options">
                                  <MoreVertical className="h-5 w-5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {trip?.visibility === 'shared' && (
                                  <DropdownMenuItem onClick={onShareTrip} className="flex items-center gap-2">
                                    <Share2 className="h-4 w-4" /> Share
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={onDeleteTrip} className="text-destructive flex items-center gap-2">
                                  <Trash2 className="h-4 w-4" /> Delete Trip
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                )}
            </header>
            <main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                        <EntryGallery entries={entries ?? undefined} />
                        <div className="flex justify-between items-center mb-6">
                             <h2 className="text-2xl font-bold font-headline">Trip Diary</h2>
                             <div className="flex items-center gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="secondary">View Trip Map</Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-5xl">
                                    <DialogHeader>
                                      <DialogTitle>Trip Map</DialogTitle>
                                    </DialogHeader>
                                    {entries && entries.length > 0 ? (
                                      <ItineraryMap
                                        entries={entries}
                                        fallbackCenter={trip?.location?.coordinates ? [trip.location.coordinates.lat, trip.location.coordinates.lng] : undefined}
                                        fallbackTitle={trip?.title}
                                      />
                                    ) : (
                                      <ItineraryMap
                                        entries={[]}
                                        fallbackCenter={trip?.location?.coordinates ? [trip.location.coordinates.lat, trip.location.coordinates.lng] : undefined}
                                        fallbackTitle={trip?.title}
                                      />
                                    )}
                                  </DialogContent>
                                </Dialog>
                                {canAddEntry && (
                                  <Button asChild>
                                      <Link href={`/trips/${tripId}/new`}>
                                          <PlusCircle className="mr-2 h-4 w-4" />
                                          Add Entry
                                      </Link>
                                  </Button>
                                )}
                             </div>
                        </div>

                        {isLoadingEntries ? (
                            <div className="space-y-6">
                                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
                            </div>
                        ) : entries && entries.length > 0 ? (
                            <div className="space-y-6">
                                {entries.map(entry => {
                                     const visitedDate = entry.visitedAt instanceof Date 
                                        ? entry.visitedAt
                                        : (entry.visitedAt as any)?.toDate?.() || new Date(entry.visitedAt as string);
                                    
                                    const canEditEntry = isOwner || (entry.authorId === user?.uid);

                                    return (
                                        <div key={entry.id} className="entry-card bg-card p-4 rounded-lg shadow-sm border space-y-4">
                                            <div className="space-y-4">
                                                {entry.media && entry.media.length > 0 && (
                                                    <MediaDisplay media={entry.media} title={entry.title} />
                                                )}
                                                {entry.location && (
                                                    <MapView location={entry.location} />
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-lg font-semibold">{entry.title}</h3>
                                                        <div className="text-sm text-muted-foreground mb-2 space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="h-4 w-4" />
                                                                {format(visitedDate, 'PPP')}
                                                                {entry.authorId && (
                                                                    <>
                                                                        <span>&middot;</span>
                                                                        <AuthorAvatar authorId={entry.authorId} />
                                                                    </>
                                                                )}
                                                            </div>
                                                            {entry.location && (
                                                                <div className="flex items-center gap-2">
                                                                    <MapPin className="h-4 w-4" />
                                                                    {entry.location.name}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                     {canEditEntry && (
                                                        <Button asChild variant="outline" size="sm">
                                                            <Link href={`/trips/${tripId}/entries/${entry.id}/edit`}>
                                                                <Edit className="h-3 w-3 mr-2" />
                                                                Edit
                                                            </Link>
                                                        </Button>
                                                     )}
                                                </div>
                                                <p className="text-sm whitespace-pre-wrap">{entry.content}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                             <div className="text-center py-16 border-2 border-dashed rounded-lg">
                                <h2 className="text-xl font-semibold">No entries yet!</h2>
                                <p className="text-muted-foreground mt-2 mb-6">Start your diary by adding your first entry.</p>
                                {canAddEntry && (
                                    <Button asChild>
                                        <Link href={`/trips/${tripId}/new`}>
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            Add First Entry
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        )}

                    </div>
                     <aside className="space-y-6">
                        <div className="bg-card p-4 rounded-lg shadow-sm border">
                            <h3 className="font-semibold font-headline mb-3">About this trip</h3>
                            <p className="text-sm text-muted-foreground">{trip.description}</p>
                        </div>
                        <div className="bg-card p-4 rounded-lg shadow-sm border">
                            <h3 className="font-semibold font-headline mb-3">Visibility</h3>
                            <p className="flex items-center capitalize text-sm">
                                <VisibilityIcon visibility={trip.visibility} />
                            </p>
                        </div>
                        <div className="bg-card p-4 rounded-lg shadow-sm border">
                            <h3 className="font-semibold font-headline mb-3">Shared With</h3>
                            <SharedWithAvatars trip={trip} />
                        </div>
                    </aside>
                </div>

            </main>

        </div>
    );
}
