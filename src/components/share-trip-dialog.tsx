'use client';

import { useState } from 'react';
import { Trip, User as TripUser } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Share2 } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, arrayUnion, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('') : '';

function AuthorAvatar({ authorId }: { authorId: string }) {
    const firestore = useFirestore();
    const authorRef = useMemoFirebase(() => {
        if (!firestore || !authorId) return null;
        return doc(firestore, 'users', authorId);
    }, [firestore, authorId]);
    const { data: author, isLoading } = useDoc<TripUser>(authorRef);

    if (isLoading) return <Skeleton className="h-6 w-6 rounded-full" />;
    if (!author) return null;

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

interface ShareTripDialogProps {
    trip: Trip;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ShareTripDialog({ trip, open, onOpenChange }: ShareTripDialogProps) {
    const firestore = useFirestore();
    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const tripRef = useMemoFirebase(() => {
        if (!firestore || !trip) return null;
        // Construct ref: users/{ownerId}/trips/{tripId}
        return doc(firestore, 'users', trip.ownerId, 'trips', trip.id!);
    }, [firestore, trip]);

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

    const inviteUser = async () => {
        if (!tripRef || !inviteEmail.trim()) return;
        setIsInviting(true);
        try {
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
            const link = `${origin}/trips/${trip.id}`;
            await navigator.clipboard.writeText(link);
            if (typeof window !== 'undefined') {
                window.alert('Link copied to clipboard!');
            }
        } catch (e: any) {
            console.error(e);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#0f172a] border-white/10 text-white sm:max-w-md" onClick={(e) => e.stopPropagation()}>
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
                            defaultValue={typeof window !== 'undefined' ? `${window.location.origin}/trips/${trip.id}` : ''}
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
                                : 'Only you and invited friends can view.'}
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
    );
}
