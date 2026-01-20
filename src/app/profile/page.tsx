'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { updateProfile, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, query, collection, where, orderBy, updateDoc, documentId } from 'firebase/firestore';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogHeader, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Grid, Bookmark, UserSquare2, Settings, Edit, Camera, Loader2, Play, Volume2, VolumeX, Heart, MessageCircle, Share2, X, LogOut } from 'lucide-react';
import Image from 'next/image';

interface UserProfile {
    bio?: string;
    website?: string;
    followers?: number;
    following?: number;
    postsCount?: number;
    savedReels?: string[];
}

interface Reel {
    id: string;
    authorId: string;
    authorName: string;
    authorPhoto?: string;
    videoUrl: string;
    thumbnailUrl?: string; // If you have thumbnails, otherwise video poster
    caption: string;
    location?: string;
    likes?: string[];
    // ... other fields
}

export default function ProfilePage() {
    const { user } = useUser();
    const auth = useAuth();
    const router = useRouter();
    const firestore = useFirestore();
    const [profileData, setProfileData] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Edit Profile State
    const [isEditing, setIsEditing] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [editName, setEditName] = useState('');
    const [editBio, setEditBio] = useState('');
    const [editFile, setEditFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    // Fetch Extra Profile Data (Bio, Stats, Saved Reels IDs)
    useEffect(() => {
        const fetchProfile = async () => {
            if (!user || !firestore) return;
            try {
                const docRef = doc(firestore, 'users', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setProfileData(docSnap.data() as UserProfile);
                } else {
                    // Create default if not exists
                    await setDoc(docRef, { bio: '', followers: 0, following: 0, postsCount: 0, savedReels: [] });
                }
            } catch (err) {
                console.error("Error fetching profile:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [user, firestore]);

    // Fetch User's Reels
    const reelsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'reels'),
            where('authorId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, user]);

    const { data: userReels } = useCollection<Reel>(reelsQuery);

    // Fetch Saved Reels
    // Note: 'in' operator is limited to 10 items. For production, execute multiple queries or fetch all and filter client-side.
    // For this demo, we'll fetch up to 10.
    const savedReelsQuery = useMemoFirebase(() => {
        if (!firestore || !profileData?.savedReels || profileData.savedReels.length === 0) return null;
        return query(
            collection(firestore, 'reels'),
            where(documentId(), 'in', profileData.savedReels.slice(0, 10))
        );
    }, [firestore, profileData]);

    const { data: savedReelsData } = useCollection<Reel>(savedReelsQuery);

    // Initialize Edit Form
    useEffect(() => {
        if (user && profileData) {
            setEditName(user.displayName || '');
            setEditBio(profileData.bio || '');
        }
    }, [user, profileData, isEditing]);

    const handleSaveProfile = async () => {
        if (!user || !firestore) return;
        setIsSaving(true);
        try {
            let photoURL = user.photoURL;

            // 1. Upload new photo if selected
            if (editFile) {
                const uploadData = await uploadToCloudinary(editFile);
                photoURL = uploadData.secure_url;
            }

            // 2. Update Auth Profile
            await updateProfile(user, {
                displayName: editName,
                photoURL: photoURL
            });

            // 3. Update Firestore Profile
            const userRef = doc(firestore, 'users', user.uid);
            await updateDoc(userRef, {
                bio: editBio
            });

            // Update local state to reflect immediately
            setProfileData(prev => ({ ...prev, bio: editBio }));
            setIsEditing(false);
            setEditFile(null); // Reset file input

            // Reload window to refresh auth state visuals mostly or force re-render
            window.location.reload();

        } catch (error) {
            console.error("Failed to save profile", error);
        } finally {
            setIsSaving(false);
        }
    };

    // --- REEL VIEWER RE-IMPLEMENTATION (Mini version for profile) ---
    const [selectedReel, setSelectedReel] = useState<Reel | null>(null);

    if (isLoading) {
        return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 text-white animate-spin" /></div>;
    }

    if (!user) {
        return <div className="min-h-screen bg-black text-white flex items-center justify-center">Please log in to view profile.</div>;
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white pb-20 pt-20">
            <div className="max-w-4xl mx-auto px-4">

                {/* HEADER SECTION */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

                    {/* Avatar */}
                    <div className="relative group">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-[2px] bg-gradient-to-tr from-pink-500 via-orange-500 to-yellow-500">
                            <div className="w-full h-full rounded-full border-4 border-black overflow-hidden bg-zinc-900">
                                <Avatar className="w-full h-full">
                                    <AvatarImage src={user.photoURL || undefined} className="object-cover" />
                                    <AvatarFallback className="text-4xl bg-zinc-800 text-white">{user.displayName?.[0]}</AvatarFallback>
                                </Avatar>
                            </div>
                        </div>
                        {/* Quick Edit Trigger (Optional) */}
                        <button onClick={() => setIsEditing(true)} className="absolute bottom-2 right-2 p-2 bg-blue-500 rounded-full border-4 border-black text-white hover:bg-blue-600 transition-transform hover:scale-110 md:hidden">
                            <Edit className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-left space-y-4">
                        <div className="flex flex-col md:flex-row items-center gap-4 mb-2">
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{user.displayName}</h1>
                            <div className="flex gap-2">
                                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                                    <DialogTrigger asChild>
                                        <Button size="sm" variant="secondary" className="font-semibold bg-white/10 hover:bg-white/20 text-white border-none">
                                            Edit profile
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-[425px]">
                                        <DialogHeader>
                                            <DialogTitle>Edit Profile</DialogTitle>
                                            <DialogDescription className="text-zinc-400">Make changes to your profile here. Click save when you're done.</DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-6 py-4">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="relative w-24 h-24 rounded-full overflow-hidden bg-zinc-800 border-2 border-white/10 group cursor-pointer">
                                                    {editFile ? (
                                                        <Image src={URL.createObjectURL(editFile)} alt="Preview" fill className="object-cover" />
                                                    ) : (
                                                        <Avatar className="w-full h-full">
                                                            <AvatarImage src={user.photoURL || undefined} />
                                                            <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                                                        </Avatar>
                                                    )}
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Camera className="w-6 h-6 text-white" />
                                                    </div>
                                                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setEditFile(e.target.files?.[0] || null)} />
                                                </div>
                                                <span className="text-xs text-blue-400 font-medium">Change Profile Photo</span>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase text-zinc-500">Display Name</label>
                                                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-black/50 border-white/10 text-white focus-visible:ring-offset-0 focus-visible:ring-blue-500" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase text-zinc-500">Bio</label>
                                                <Textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} className="bg-black/50 border-white/10 text-white min-h-[100px] resize-none focus-visible:ring-offset-0 focus-visible:ring-blue-500" placeholder="Write a something about yourself..." />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" onClick={() => setIsEditing(false)} className="hover:bg-white/10 text-white">Cancel</Button>
                                            <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white">
                                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                                <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
                                    <SheetTrigger asChild>
                                        <Button size="sm" variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-none"><Settings className="w-4 h-4" /></Button>
                                    </SheetTrigger>
                                    <SheetContent className="bg-zinc-900 border-zinc-800 text-white">
                                        <SheetHeader>
                                            <SheetTitle className="text-white">Settings</SheetTitle>
                                        </SheetHeader>
                                        <div className="mt-8 space-y-2">
                                            <button
                                                onClick={() => {
                                                    setSettingsOpen(false);
                                                    setIsEditing(true);
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-white/10 transition-colors"
                                            >
                                                <Edit className="w-5 h-5" />
                                                <span>Edit Profile</span>
                                            </button>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                                            >
                                                <LogOut className="w-5 h-5" />
                                                <span>Log out</span>
                                            </button>
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center justify-center md:justify-start gap-8 text-sm">
                            <div className="flex md:flex-row flex-col items-center md:gap-1">
                                <span className="font-bold text-white text-lg md:text-base">{userReels?.length || 0}</span>
                                <span className="text-white/60">posts</span>
                            </div>
                            <div className="flex md:flex-row flex-col items-center md:gap-1">
                                <span className="font-bold text-white text-lg md:text-base">{profileData?.followers || 0}</span>
                                <span className="text-white/60">followers</span>
                            </div>
                            <div className="flex md:flex-row flex-col items-center md:gap-1">
                                <span className="font-bold text-white text-lg md:text-base">{profileData?.following || 0}</span>
                                <span className="text-white/60">following</span>
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="max-w-md text-sm leading-relaxed text-white/90 whitespace-pre-line">
                            <h3 className="font-bold mb-1">{user.displayName}</h3>
                            {profileData?.bio || "No bio yet."}
                        </div>
                    </div>
                </div>

                {/* CONTENT TABS */}
                <Tabs defaultValue="reels" className="w-full">
                    <TabsList className="w-full bg-transparent border-t border-white/10 h-12 p-0 flex justify-center gap-12 rounded-none mb-4">
                        <TabsTrigger value="reels" className="h-full rounded-none border-t-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white text-white/40 uppercase text-xs font-bold tracking-widest gap-2">
                            <Grid className="w-3 h-3" /> REELS
                        </TabsTrigger>
                        <TabsTrigger value="saved" className="h-full rounded-none border-t-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white text-white/40 uppercase text-xs font-bold tracking-widest gap-2">
                            <Bookmark className="w-3 h-3" /> SAVED
                        </TabsTrigger>
                        <TabsTrigger value="tagged" className="h-full rounded-none border-t-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white text-white/40 uppercase text-xs font-bold tracking-widest gap-2">
                            <UserSquare2 className="w-3 h-3" /> TAGGED
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="reels" className="min-h-[300px]">
                        {userReels?.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-white/40">
                                <div className="p-4 rounded-full border-2 border-white/10 mb-4"><Camera className="w-8 h-8" /></div>
                                <h3 className="text-xl font-bold text-white mb-2">No Posts Yet</h3>
                                <p className="text-sm">Start capturing your moments.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-1 md:gap-4">
                                {userReels?.map((reel) => (
                                    <div
                                        key={reel.id}
                                        className="relative aspect-[9/16] bg-zinc-900 group cursor-pointer overflow-hidden"
                                        onClick={() => setSelectedReel(reel)}
                                    >
                                        <video src={reel.videoUrl} className="w-full h-full object-cover" muted />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-bold">
                                            <div className="flex items-center gap-1"><Heart className="w-5 h-5 fill-white" /> {reel.likes?.length || 0}</div>
                                            <div className="flex items-center gap-1"><MessageCircle className="w-5 h-5 fill-white" /> 0</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                    <TabsContent value="saved">
                        {(!savedReelsData || savedReelsData.length === 0) ? (
                            <div className="flex flex-col items-center justify-center py-20 text-white/40">
                                <div className="p-4 rounded-full border-2 border-white/10 mb-4"><Bookmark className="w-8 h-8" /></div>
                                <h3 className="text-xl font-bold text-white mb-2">Use Saved Reels</h3>
                                <p className="text-sm">Save photos and videos that you want to see again.</p>
                                <p className="text-xs text-white/40 mt-1">No one is notified, and only you can see what you've saved.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-1 md:gap-4">
                                {savedReelsData?.map((reel) => (
                                    <div
                                        key={reel.id}
                                        className="relative aspect-[9/16] bg-zinc-900 group cursor-pointer overflow-hidden"
                                        onClick={() => setSelectedReel(reel)}
                                    >
                                        <video src={reel.videoUrl} className="w-full h-full object-cover" muted />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-bold">
                                            <div className="flex items-center gap-1"><Heart className="w-5 h-5 fill-white" /> {reel.likes?.length || 0}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                    <TabsContent value="tagged">
                        <div className="flex flex-col items-center justify-center py-20 text-white/40">
                            <p className="text-sm">Photos of you will appear here.</p>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* FULL SCREEN REEL VIEWER DIALOG (Simplified) */}
            <Dialog open={!!selectedReel} onOpenChange={(open) => !open && setSelectedReel(null)}>
                <DialogContent className="p-0 border-0 bg-black max-w-[100vw] sm:max-w-[400px] h-[100dvh] sm:h-[85vh] flex items-center justify-center overflow-hidden rounded-none sm:rounded-2xl">
                    <DialogTitle className="sr-only">Viewing Reel</DialogTitle>
                    {selectedReel && (
                        <div className="relative w-full h-full flex items-center justify-center bg-zinc-900">
                            <button onClick={() => setSelectedReel(null)} className="absolute top-4 right-4 z-50 p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60"><X className="w-5 h-5" /></button>
                            <video src={selectedReel.videoUrl} className="w-full h-full object-cover" controls autoPlay loop />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
