
'use client';

import { useDoc, useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { useParams, useRouter } from 'next/navigation';
import { doc, collection, query, orderBy, where, updateDoc, arrayUnion, getDocs, limit } from 'firebase/firestore';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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

    const [shareOpen, setShareOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const togglePublic = async (checked: boolean) => {
        if (!tripRef) return;
        setIsUpdating(true);
        try {
            await updateDoc(tripRef, {
                visibility: checked ? 'public' : 'private'
            });
        } catch (error: any) {
            console.error(error);
            if (typeof window !== 'undefined') window.alert('Failed to update visibility');
        } finally {
            setIsUpdating(false);
        }
    };

    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);

    const inviteUser = async () => {
        if (!tripRef || !inviteEmail.trim()) return;
        setIsInviting(true);
        try {
            // Find user by email
            const usersRef = collection(firestore!, 'users');
            const q = query(usersRef, where('email', '==', inviteEmail.trim()), limit(1));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                alert('User not found with this email.');
                setIsInviting(false);
                return;
            }

            const foundUser = snapshot.docs[0];
            const foundUserId = foundUser.id;

            if (foundUserId === trip.ownerId) {
                alert('You are the owner of this trip.');
                setIsInviting(false);
                return;
            }

            if (trip.sharedWith?.includes(foundUserId)) {
                alert('User is already invited.');
                setIsInviting(false);
                return;
            }

            await updateDoc(tripRef, {
                sharedWith: arrayUnion(foundUserId)
            });

            setInviteEmail('');
            alert(`Invited ${inviteEmail}!`);
        } catch (error) {
            console.error(error);
            alert('Failed to invite user');
        } finally {
            setIsInviting(false);
        }
    };

    const onCopyLink = async () => {
        try {
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            const link = `${origin}/trips/${tripId}`;
            await navigator.clipboard.writeText(link);
            if (typeof window !== 'undefined') {
                // Could use a toast here, but alert is consistent with existing code for now
                // actually let's just change the button text momentarily or something, but alert is fine as placeholder
                window.alert('Link copied to clipboard!');
            }
        } catch (e: any) {
            console.error(e);
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
            <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-[#050505]">
                <Skeleton className="h-12 w-48 mb-6 bg-white/5" />
                <Skeleton className="w-full h-96 rounded-2xl mb-6 bg-white/5" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                        <Skeleton className="h-8 w-64 mb-4 bg-white/5" />
                        <Skeleton className="h-32 w-full rounded-xl bg-white/5" />
                    </div>
                    <div className="space-y-6">
                        <Skeleton className="h-40 w-full rounded-xl bg-white/5" />
                    </div>
                </div>
            </div>
        );
    }

    if (!trip) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
                <div className="text-center py-16 max-w-md w-full border border-white/10 rounded-3xl bg-white/5 backdrop-blur">
                    <h2 className="text-2xl font-bold text-white">Trip not found</h2>
                    <p className="text-white/50 mt-2">The trip you are looking for does not exist or you do not have permission to view it.</p>
                    <Button asChild className="mt-6 rounded-full bg-orange-500 hover:bg-orange-600">
                        <Link href="/dashboard">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    const isOwner = user?.uid === trip.ownerId;
    const canAddEntry = isOwner || (trip.sharedWith?.includes(user?.uid || ''));

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0f172a] to-black text-white selection:bg-orange-500 selection:text-white pb-20">
            <header className="relative h-[50vh] min-h-[400px] w-full group overflow-hidden">
                {coverPhotoURL && (
                    <Image
                        src={coverPhotoURL}
                        alt={coverPhotoAlt}
                        fill
                        className="object-cover transition-transform duration-1000 group-hover:scale-105"
                        priority
                        data-ai-hint={coverPhotoHint}
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4 sm:p-6 lg:p-8 text-white w-full max-w-5xl mx-auto z-10">
                    <div className="flex flex-col gap-3 animate-in slide-in-from-bottom-5 duration-700 fade-in">
                        <Badge className="w-fit bg-orange-500/80 hover:bg-orange-600 backdrop-blur text-white border-none mb-2">
                            <VisibilityIcon visibility={trip?.visibility} />
                        </Badge>
                        <h1 className="font-bold text-4xl sm:text-5xl md:text-6xl tracking-tight leading-tight">{trip.title}</h1>
                        <div className="flex items-center text-lg text-white/80 font-medium">
                            <Calendar className="h-5 w-5 mr-2 text-orange-400" />
                            {typeof (trip.startDate as any) === 'string' ? (trip.startDate as any) : format(trip.startDate as any, 'MMM dd, yyyy')} - {typeof (trip.endDate as any) === 'string' ? (trip.endDate as any) : format(trip.endDate as any, 'MMM dd, yyyy')}
                        </div>
                    </div>
                </div>

                {isOwner && (
                    <div className="absolute top-4 right-4 z-20">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="icon" className="rounded-full bg-black/40 text-white hover:bg-orange-500 backdrop-blur border border-white/10 transition-colors h-10 w-10">
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#0f172a] border-white/10 text-white rounded-xl">
                                <DropdownMenuItem onSelect={() => setShareOpen(true)} className="flex items-center gap-2 focus:bg-white/10 focus:text-white cursor-pointer py-2.5">
                                    <Share2 className="h-4 w-4" /> Share Trip
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={onDeleteTrip} className="text-red-400 focus:bg-red-500/10 focus:text-red-400 flex items-center gap-2 cursor-pointer py-2.5">
                                    <Trash2 className="h-4 w-4" /> Delete Trip
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </header>

            <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto -mt-10 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-8">
                        {/* Description Card */}
                        <div className="bg-white/5 p-6 rounded-3xl shadow-xl backdrop-blur-md border border-white/10">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-white/50 mb-3 border-b border-white/5 pb-2">About this trip</h3>
                            <p className="text-lg text-white/80 leading-relaxed font-light">{trip.description || "No description provided."}</p>
                        </div>

                        {/* Actions Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-4 py-4">
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <div className="w-1 h-6 bg-orange-500 rounded-full" />
                                Trip Diary
                            </h2>
                            <div className="flex items-center gap-3">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10 hover:text-white bg-transparent">
                                            <MapPin className="mr-2 h-4 w-4 text-orange-400" /> Map
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-5xl bg-[#0f172a] border-white/10 text-white">
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
                                    <Button asChild className="rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg hover:shadow-orange-500/20">
                                        <Link href={`/trips/${tripId}/new`}>
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            Add Entry
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Entries List */}
                        {isLoadingEntries ? (
                            <div className="space-y-6">
                                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-3xl bg-white/5" />)}
                            </div>
                        ) : entries && entries.length > 0 ? (
                            <div className="space-y-8 relative">
                                {/* Timeline Line */}
                                <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-gradient-to-b from-orange-500/50 via-white/10 to-transparent hidden md:block" />

                                {entries.map((entry, idx) => {
                                    const visitedDate = entry.visitedAt instanceof Date
                                        ? entry.visitedAt
                                        : (entry.visitedAt as any)?.toDate?.() || new Date(entry.visitedAt as string);

                                    const canEditEntry = isOwner || (entry.authorId === user?.uid);

                                    return (
                                        <div key={entry.id} className="entry-card relative group md:pl-20">
                                            {/* Timeline Dot */}
                                            <div className="absolute left-[30px] top-6 w-3 h-3 rounded-full bg-orange-500 border-2 border-[#0f172a] z-10 hidden md:block group-hover:scale-125 transition-transform" />

                                            <div className="bg-white/5 hover:bg-white/10 transition-colors p-6 rounded-3xl border border-white/10 space-y-5 backdrop-blur-sm">
                                                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                                    <div>
                                                        <h3 className="text-xl font-bold mb-1">{entry.title}</h3>
                                                        <div className="text-sm text-white/50 space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="h-4 w-4 text-orange-400" />
                                                                {format(visitedDate, 'PPP')}
                                                                {entry.authorId && (
                                                                    <>
                                                                        <span className="text-white/20">&middot;</span>
                                                                        <AuthorAvatar authorId={entry.authorId} />
                                                                    </>
                                                                )}
                                                            </div>
                                                            {entry.location && (
                                                                <div className="flex items-center gap-2">
                                                                    <MapPin className="h-4 w-4 text-blue-400" />
                                                                    {entry.location.name}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {canEditEntry && (
                                                        <Button asChild variant="ghost" size="sm" className="text-white/40 hover:text-white hover:bg-white/10 rounded-full h-8 w-8 p-0">
                                                            <Link href={`/trips/${tripId}/entries/${entry.id}/edit`}>
                                                                <Edit className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    )}
                                                </div>

                                                {entry.media && entry.media.length > 0 && (
                                                    <div className="rounded-2xl overflow-hidden border border-white/5">
                                                        <MediaDisplay media={entry.media} title={entry.title} />
                                                    </div>
                                                )}

                                                {/* Text Content */}
                                                <div className="text-white/70 whitespace-pre-wrap leading-relaxed font-light">
                                                    {entry.content}
                                                </div>

                                                {entry.location && (
                                                    <div className="pt-2">
                                                        <div className="h-32 w-full rounded-xl overflow-hidden border border-white/10 opacity-70 hover:opacity-100 transition-opacity">
                                                            <MapView location={entry.location} />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/5">
                                <h2 className="text-xl font-semibold mb-2">No entries yet</h2>
                                <p className="text-white/50 mb-6 max-w-sm mx-auto">This trip is an empty canvas. Start your diary by adding your first entry.</p>
                                {canAddEntry && (
                                    <Button asChild className="rounded-full bg-white text-black hover:bg-orange-500 hover:text-white font-bold">
                                        <Link href={`/trips/${tripId}/new`}>
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            Add First Entry
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        )}
                        <div className="mt-8">
                            <EntryGallery entries={entries ?? undefined} />
                        </div>

                    </div>

                    {/* Sidebar */}
                    <aside className="space-y-6">
                        <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-white/50 mb-4 flex items-center gap-2">
                                <Users className="h-4 w-4" /> Shared With
                            </h3>
                            <div className="flex items-center gap-2">
                                <SharedWithAvatars trip={trip} />
                            </div>
                        </div>

                        {/* Map Preview Widget (if global map exists for trip) */}
                        {trip.location && (
                            <div className="bg-white/5 p-1 rounded-3xl border border-white/10 overflow-hidden">
                                <div className="h-48 w-full rounded-[20px] overflow-hidden opacity-60 hover:opacity-100 transition-opacity relative group cursor-pointer">
                                    <MapView location={trip.location} />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-colors">
                                        <div className="bg-black/50 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-white border border-white/20">Trip Location</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </aside>
                </div>

                {/* Share Dialog */}
                <Dialog open={shareOpen} onOpenChange={setShareOpen}>
                    <DialogContent className="bg-[#0f172a] border-white/10 text-white sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Share2 className="h-5 w-5 text-orange-500" />
                                Share Trip
                            </DialogTitle>
                            <DialogDescription className="text-white/60">
                                Manage who can see this trip.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex items-center space-x-2 py-4">
                            <div className="grid flex-1 gap-2">
                                <Label htmlFor="link" className="sr-only">
                                    Link
                                </Label>
                                <Input
                                    id="link"
                                    defaultValue={typeof window !== 'undefined' ? `${window.location.origin}/trips/${tripId}` : ''}
                                    readOnly
                                    className="bg-white/5 border-white/10 text-white"
                                />
                            </div>
                            <Button onClick={onCopyLink} size="sm" className="px-3 bg-orange-500 hover:bg-orange-600 text-white">
                                <span className="sr-only">Copy</span>
                                <Share2 className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex items-center justify-between space-x-2 border-t border-white/10 pt-4">
                            <div className="flex flex-col space-y-1">
                                <Label htmlFor="public-mode" className="font-medium text-white">Public Access</Label>
                                <span className="text-xs text-white/50">
                                    {trip.visibility === 'public'
                                        ? 'Anyone with the link can view.'
                                        : 'Only you can view this trip.'}
                                </span>
                            </div>
                            <Switch
                                id="public-mode"
                                checked={trip.visibility === 'public'}
                                onCheckedChange={togglePublic}
                                disabled={isUpdating}
                                className="data-[state=checked]:bg-orange-500"
                            />
                        </div>

                        <div className="space-y-4 border-t border-white/10 pt-4 mt-4">
                            <div className="space-y-2">
                                <Label className="font-medium text-white">Invite Friends</Label>
                                <p className="text-xs text-white/50">Add friends by email to let them view and add entries (photos/videos).</p>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="friend@example.com"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        className="bg-white/5 border-white/10 text-white"
                                    />
                                    <Button onClick={inviteUser} disabled={isInviting} className="bg-white/10 hover:bg-white/20 text-white">
                                        {isInviting ? '...' : 'Invite'}
                                    </Button>
                                </div>
                            </div>

                            {trip.sharedWith && trip.sharedWith.length > 0 && (
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-white/70">Invited People</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {trip.sharedWith.map(uid => (
                                            <div key={uid} className="bg-white/10 rounded-full px-3 py-1 flex items-center gap-2 text-xs text-white">
                                                <AuthorAvatar authorId={uid} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

            </main>

        </div>
    );
}
