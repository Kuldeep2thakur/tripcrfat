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
import { useState } from 'react';
import { ShareTripDialog } from './share-trip-dialog';


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

  const [shareOpen, setShareOpen] = useState(false);


  return (
    <Card
      className="flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm group transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] cursor-pointer"
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
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
              data-ai-hint={coverPhotoHint}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent opacity-80" />

            {trip.location?.name && (
              <div className="absolute left-4 bottom-4 inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md text-white px-3 py-1.5 text-xs font-bold border border-white/10 group-hover:border-orange-500/50 transition-colors uppercase tracking-wider">
                <MapPin className="h-3 w-3 text-orange-500" />
                <span className="line-clamp-1 max-w-[200px]">{trip.location.name}</span>
              </div>
            )}
          </div>
        )}
        <div className="absolute top-3 right-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Badge variant="secondary" className="capitalize flex items-center gap-1.5 bg-black/60 backdrop-blur text-white border-white/10 hover:bg-black/80">
            <VisibilityIcon visibility={trip.visibility} />
            {trip.visibility}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full bg-black/40 text-white p-2 hover:bg-orange-500 transition-colors backdrop-blur-sm border border-white/10">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#0f172a] border-white/10 text-white">
              <DropdownMenuItem onSelect={() => setShareOpen(true)} className="flex items-center gap-2 focus:bg-white/10 focus:text-white cursor-pointer">
                <Share2 className="h-4 w-4" /> Share Trip
              </DropdownMenuItem>
              {isOwner && (
                <DropdownMenuItem onClick={onDeleteTrip} className="text-red-400 focus:bg-red-500/10 focus:text-red-400 flex items-center gap-2 cursor-pointer">
                  <Trash2 className="h-4 w-4" /> Delete Trip
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {isOwner && <Badge className="absolute top-3 left-3 bg-orange-500 hover:bg-orange-600 text-white border-none shadow-lg">My Trip</Badge>}
      </CardHeader>
      <CardContent className="p-5 flex-grow space-y-3">
        <CardTitle className="font-bold text-xl text-white group-hover:text-orange-400 transition-colors leading-tight">
          {trip.title}
        </CardTitle>
        <div className="flex items-center text-sm text-white/50 font-medium">
          <Calendar className="h-4 w-4 mr-2 text-white/30" />
          <span>{trip.startDate ? new Date(trip.startDate).toLocaleDateString() : 'No date'}</span>
        </div>

        <p className="text-sm text-white/60 line-clamp-2 leading-relaxed">{trip.description || 'No description provided.'}</p>
      </CardContent>
      <CardFooter className="p-5 pt-0 flex justify-between items-center border-t border-white/5 mt-auto">
        <div className="pt-4">
          <SharedWithAvatars trip={trip} />
        </div>
        <div className="pt-4 group/cta text-orange-400 ml-auto inline-flex items-center text-sm font-bold uppercase tracking-wider">
          View <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover/cta:translate-x-1" />
        </div>
      </CardFooter>
      <ShareTripDialog trip={trip} open={shareOpen} onOpenChange={setShareOpen} />
    </Card >
  );
}
