import type { Trip, User as FirestoreUser } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { Calendar, Globe, Lock, Users, ArrowRight, MapPin } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Share2, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useUser, useFirestore } from '@/firebase';


type TripCardProps = {
  trip: Trip;
};

const VisibilityIcon = ({ visibility }: { visibility: Trip['visibility'] }) => {
  switch (visibility) {
    case 'public':
      return <Globe className="h-4 w-4" />;
    case 'private':
      return <Lock className="h-4 w-4" />;
    case 'shared':
      return <Users className="h-4 w-4" />;
    default:
      return null;
  }
};

function SharedWithAvatars({ trip }: { trip: Trip }) {
  const count = trip.sharedWith?.length ?? 0;
  return (
    <span className="text-sm text-muted-foreground">
      {count === 0 ? 'Only you' : `${count} member${count > 1 ? 's' : ''}`}
    </span>
  );
}


export function TripCard({ trip }: TripCardProps) {
  const placeholderPhoto = trip.coverPhotoId ? PlaceHolderImages.find(p => p.id === trip.coverPhotoId) : PlaceHolderImages.find(p => p.id === 'trip-cover-1');
  const coverPhotoURL = trip.coverPhotoURL || placeholderPhoto?.imageUrl;
  const coverPhotoAlt = placeholderPhoto?.description || 'Trip cover image';
  const coverPhotoHint = placeholderPhoto?.imageHint || 'travel landscape';
  
  const { user } = useUser();
  const isOwner = user?.uid === trip.ownerId;
  const firestore = useFirestore();
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/trips/${trip.id}`);
  };

  const onDeleteTrip = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!firestore || !user) return;
    const ok = window.confirm('Delete this trip and all its entries? This cannot be undone.');
    if (!ok) return;
    try {
      const { collection, getDocs, deleteDoc, doc, writeBatch } = await import('firebase/firestore');
      const entriesSnap = await getDocs(collection(firestore, `users/${user.uid}/trips/${trip.id}/entries`));
      const batch = writeBatch(firestore);
      entriesSnap.forEach(d => batch.delete(d.ref));
      await batch.commit();
      await deleteDoc(doc(firestore, `users/${user.uid}/trips`, trip.id));
      window.alert('Trip deleted');
    } catch (err: any) {
      window.alert(`Failed to delete trip: ${err?.message || ''}`);
    }
  };

  const onShareTrip = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const link = `${origin}/trips/${trip.id}`;
      await navigator.clipboard.writeText(link);
      window.alert(`Share link copied: ${link}`);
    } catch {
      window.alert('Could not copy link');
    }
  };


  return (
    <Card 
      className="flex flex-col overflow-hidden rounded-xl border bg-card/80 backdrop-blur group shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-card/90 cursor-pointer"
      onClick={handleCardClick}
    >
      <CardHeader className="p-0 relative">
        {coverPhotoURL && (
          <div className="relative aspect-[3/2] w-full overflow-hidden">
            <Image
              src={coverPhotoURL}
              alt={coverPhotoAlt}
              width={600}
              height={400}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              data-ai-hint={coverPhotoHint}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
            {trip.location?.name && (
              <div className="absolute left-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 text-xs font-medium border border-white/20 group-hover:bg-black/70 transition-all">
                <MapPin className="h-3.5 w-3.5" />
                <span className="line-clamp-1 max-w-[200px]">{trip.location.name}</span>
              </div>
            )}
          </div>
        )}
        <div className="absolute top-2 right-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Badge variant="secondary" className="capitalize flex items-center gap-1.5">
            <VisibilityIcon visibility={trip.visibility} />
            {trip.visibility}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-md bg-black/40 text-white p-1.5 hover:bg-black/60">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {trip.visibility === 'shared' && (
                <DropdownMenuItem onClick={onShareTrip} className="flex items-center gap-2">
                  <Share2 className="h-4 w-4" /> Share
                </DropdownMenuItem>
              )}
              {isOwner && (
                <DropdownMenuItem onClick={onDeleteTrip} className="text-destructive flex items-center gap-2">
                  <Trash2 className="h-4 w-4" /> Delete Trip
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
         {isOwner && <Badge variant="default" className="absolute top-2 left-2">My Trip</Badge>}
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="font-headline text-lg mb-2 hover:text-primary transition-colors">
          {trip.title}
        </CardTitle>
        <div className="flex items-center text-sm text-muted-foreground mb-3">
          <Calendar className="h-4 w-4 mr-2" />
          <span>{trip.startDate} - {trip.endDate}</span>
        </div>
        {trip.location?.name && (
          <div className="flex items-center text-sm text-muted-foreground mb-3">
            <MapPin className="h-4 w-4 mr-2" />
            <span className="line-clamp-1">{trip.location.name}</span>
          </div>
        )}
        <p className="text-sm text-muted-foreground line-clamp-3">{trip.description}</p>
      </CardContent>
      <CardFooter className="p-4 flex justify-between items-center">
         <SharedWithAvatars trip={trip} />
        <div className="group/cta text-primary ml-auto inline-flex items-center text-sm font-medium">
          View Trip <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </div>
      </CardFooter>
    </Card>
  );
}
