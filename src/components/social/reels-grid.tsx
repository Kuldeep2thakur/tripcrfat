'use client';

import { useState, useRef, useEffect, MouseEvent as ReactMouseEvent } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, limit, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove, getDoc, setDoc } from 'firebase/firestore';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { Button } from '@/components/ui/button';
import { Plus, Video, Loader2, Heart, MessageCircle, Share2, Play, Volume2, VolumeX, X, Music, Type, Smile, ChevronRight, ChevronUp, ChevronDown, Check, MapPin, Upload, Palette, Sparkles, Bookmark, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';

interface Reel {
    id: string;
    authorId: string;
    authorName: string;
    authorPhoto?: string;
    videoUrl: string;
    thumbnailUrl?: string;
    caption: string;
    location?: string;
    createdAt: any;
    likes?: string[];

    // Metadata
    overlayText?: string;
    textPos?: { x: number, y: number };
    textStyle?: {
        font: string;
        colorClass: string;
        animation: string;
        bg: boolean;
    };
    sticker?: string;
    stickerPos?: { x: number, y: number };
    musicTrack?: string;
}

interface Comment {
    id: string;
    authorId: string;
    authorName: string;
    authorPhoto?: string;
    text: string;
    createdAt: any;
    parentCommentId?: string; // For replies
}

const MUSIC_TRACKS = ["Chill Lo-Fi", "Summer Vibes", "Travel Pop", "Upbeat Energy"];
const STICKERS = ["✈️", "🌍", "🔥", "❤️", "📍", "😎", "🥥", "📸", "👻", "🎉"];

// --- CREATIVE ASSETS ---
const FONTS = [
    { name: 'Classic', class: 'font-sans' },
    { name: 'Modern', class: 'font-mono tracking-widest uppercase' },
    { name: 'Bold', class: 'font-black italic' },
    { name: 'Hand', class: 'font-serif italic' },
];

const COLORS = [
    { name: 'White', class: 'text-white' },
    { name: 'Black', class: 'text-black' },
    { name: 'Sunset', class: 'bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent' },
    { name: 'Ocean', class: 'bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent' },
    { name: 'Berry', class: 'bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent' },
    { name: 'Gold', class: 'bg-gradient-to-r from-yellow-400 to-amber-600 bg-clip-text text-transparent' },
    { name: 'Pink', class: 'text-pink-500' },
    { name: 'Blue', class: 'text-blue-500' },
];

const ANIMATIONS = [
    { name: 'None', class: '' },
    { name: 'Fade', class: 'animate-in fade-in zoom-in duration-1000' },
    { name: 'Slide', class: 'animate-in slide-in-from-bottom duration-1000' },
    { name: 'Bounce', class: 'animate-bounce' },
    { name: 'Pulse', class: 'animate-pulse' },
    { name: 'Spin', class: 'animate-in spin-in-1 duration-1000' },
];

// Helper function to create notification
async function createNotification(firestore: any, data: {
    userId: string;
    type: 'like' | 'comment' | 'follow';
    actorId: string;
    actorName: string;
    actorPhoto?: string;
    postId?: string;
    postType?: 'reel' | 'story';
    message: string;
}) {
    try {
        await addDoc(collection(firestore, 'notifications'), {
            ...data,
            read: false,
            createdAt: serverTimestamp(),
        });
    } catch (err) {
        console.error('Failed to create notification:', err);
    }
}

function ReelComments({ reelId, reelAuthorId }: { reelId: string; reelAuthorId: string }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const [commentText, setCommentText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [replyTo, setReplyTo] = useState<Comment | null>(null);

    const commentsQuery = useMemoFirebase(() => {
        if (!firestore || !reelId) return null;
        return query(
            collection(firestore, 'reels', reelId, 'comments'),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, reelId]);

    const { data: comments } = useCollection<Comment>(commentsQuery);

    const handleSendComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim() || !user || !firestore) return;

        setIsSending(true);
        try {
            await addDoc(collection(firestore, 'reels', reelId, 'comments'), {
                authorId: user.uid,
                authorName: user.displayName || 'User',
                authorPhoto: user.photoURL,
                text: commentText.trim(),
                parentCommentId: replyTo?.id || null,
                createdAt: serverTimestamp(),
            });

            // Create notification for reel author (if not commenting on own reel)
            if (user.uid !== reelAuthorId) {
                await createNotification(firestore, {
                    userId: reelAuthorId,
                    type: 'comment',
                    actorId: user.uid,
                    actorName: user.displayName || 'User',
                    actorPhoto: user.photoURL || undefined,
                    postId: reelId,
                    postType: 'reel',
                    message: replyTo ? `replied to a comment on your reel` : 'commented on your reel',
                });
            }

            setCommentText('');
            setReplyTo(null);
        } catch (error) {
            console.error("Failed to post comment", error);
        } finally {
            setIsSending(false);
        }
    };

    // Group comments by parent
    const topLevelComments = comments?.filter(c => !c.parentCommentId) || [];
    const getReplies = (commentId: string) => comments?.filter(c => c.parentCommentId === commentId) || [];

    return (
        <div className="flex flex-col h-full bg-black/90 backdrop-blur-xl text-white">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                {topLevelComments.length === 0 && (
                    <div className="text-center text-white/40 mt-10 text-sm">No comments yet.</div>
                )}
                {topLevelComments.map((comment) => (
                    <div key={comment.id} className="space-y-2">
                        <div className="flex gap-3 items-start animate-fade-in">
                            <Avatar className="w-8 h-8 border border-white/20">
                                <AvatarImage src={comment.authorPhoto} />
                                <AvatarFallback className="text-black text-xs">{comment.authorName[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col flex-1">
                                <span className="text-xs font-bold text-white/90">{comment.authorName}</span>
                                <p className="text-sm text-white/80">{comment.text}</p>
                                <button
                                    onClick={() => setReplyTo(comment)}
                                    className="text-xs text-white/50 hover:text-white/70 mt-1 w-fit"
                                >
                                    Reply
                                </button>
                            </div>
                        </div>
                        {/* Replies */}
                        {getReplies(comment.id).map((reply) => (
                            <div key={reply.id} className="flex gap-3 items-start ml-11 animate-fade-in">
                                <Avatar className="w-6 h-6 border border-white/20">
                                    <AvatarImage src={reply.authorPhoto} />
                                    <AvatarFallback className="text-black text-[10px]">{reply.authorName[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-white/90">{reply.authorName}</span>
                                    <p className="text-xs text-white/70">{reply.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            <form onSubmit={handleSendComment} className="p-3 border-t border-white/10 bg-black/50 space-y-2">
                {replyTo && (
                    <div className="flex items-center justify-between px-3 py-1 bg-white/10 rounded-lg">
                        <span className="text-xs text-white/60">Replying to {replyTo.authorName}</span>
                        <button type="button" onClick={() => setReplyTo(null)} className="text-white/60 hover:text-white">
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                )}
                <div className="flex gap-2">
                    <Input
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder={user ? "Add a comment..." : "Log in to comment"}
                        disabled={!user || isSending}
                        className="bg-white/10 border-none text-white placeholder:text-white/40 h-10 rounded-full focus-visible:ring-1 focus-visible:ring-white/30"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!commentText.trim() || isSending}
                        className="rounded-full bg-pink-500 hover:bg-pink-600 text-white h-10 w-10 shrink-0"
                    >
                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </div>
            </form>
        </div>
    );
}

export function ReelsGrid() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [isUploading, setIsUploading] = useState(false);

    // Create Reel State
    const [newReelFile, setNewReelFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [caption, setCaption] = useState('');
    const [location, setLocation] = useState('');
    const [step, setStep] = useState<'edit' | 'caption'>('edit');

    // Creative Tools State
    const [activeTool, setActiveTool] = useState<'none' | 'text' | 'music' | 'sticker'>('none');

    // Sub-tool state for Text Editor (Font | Color | Anim)
    const [textTab, setTextTab] = useState<'font' | 'color' | 'anim'>('font');

    const [editorState, setEditorState] = useState({
        text: '',
        textPos: { x: 50, y: 50 },
        textStyle: {
            font: 'font-sans',
            colorClass: 'text-white',
            animation: '',
            bg: false
        },
        sticker: '',
        stickerPos: { x: 50, y: 50 },
        music: '',
    });

    // Saved Reels State
    const [savedReels, setSavedReels] = useState<string[]>([]);

    useEffect(() => {
        const fetchSaved = async () => {
            if (!user || !firestore) return;
            const docRef = doc(firestore, 'users', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setSavedReels(docSnap.data().savedReels || []);
            }
        };
        fetchSaved();
    }, [user, firestore]);


    // Dragging Logic
    const [dragging, setDragging] = useState<'text' | 'sticker' | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const handlePointerDown = (e: React.PointerEvent, type: 'text' | 'sticker') => {
        setDragging(type);
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!dragging || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        const clampedX = Math.max(0, Math.min(100, x));
        const clampedY = Math.max(0, Math.min(100, y));

        if (dragging === 'text') {
            setEditorState(prev => ({ ...prev, textPos: { x: clampedX, y: clampedY } }));
        } else {
            setEditorState(prev => ({ ...prev, stickerPos: { x: clampedX, y: clampedY } }));
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setDragging(null);
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    // View Reel State
    const [selectedReel, setSelectedReel] = useState<Reel | null>(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const reelsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'reels'), orderBy('createdAt', 'desc'), limit(20));
    }, [firestore]);

    const { data: reels } = useCollection<Reel>(reelsQuery);

    useEffect(() => {
        if (newReelFile) {
            const url = URL.createObjectURL(newReelFile);
            setPreviewUrl(url);
            setStep('edit');
            // Reset Defaults
            setEditorState({
                text: '', textPos: { x: 50, y: 50 },
                textStyle: { font: 'font-sans', colorClass: 'text-white', animation: '', bg: false },
                sticker: '', stickerPos: { x: 50, y: 30 },
                music: ''
            });
            setActiveTool('none');
            setCaption('');
            setLocation('');
            return () => URL.revokeObjectURL(url);
        } else {
            setPreviewUrl(null);
        }
    }, [newReelFile]);

    const handleCreateReel = async () => {
        if (!newReelFile || !user || !firestore) return;

        try {
            setIsUploading(true);
            const uploadData = await uploadToCloudinary(newReelFile);
            await addDoc(collection(firestore, 'reels'), {
                authorId: user.uid,
                authorName: user.displayName || 'Traveler',
                authorPhoto: user.photoURL,
                videoUrl: uploadData.secure_url,
                caption: caption,
                location: location,
                likes: [],
                createdAt: serverTimestamp(),
                // Metadata
                overlayText: editorState.text,
                textPos: editorState.textPos,
                textStyle: editorState.textStyle,
                sticker: editorState.sticker,
                stickerPos: editorState.stickerPos,
                musicTrack: editorState.music,
            });
            setNewReelFile(null);
        } catch (error) {
            console.error("Reel upload failed", error);
            alert('Failed to upload reel');
        } finally {
            setIsUploading(false);
        }
    };

    const handleToggleLike = async (e: ReactMouseEvent, reel: Reel) => {
        e.stopPropagation();
        if (!user || !firestore) return;
        const reelRef = doc(firestore, 'reels', reel.id);
        const isLiked = reel.likes?.includes(user.uid);

        try {
            if (isLiked) {
                await updateDoc(reelRef, { likes: arrayRemove(user.uid) });
            } else {
                await updateDoc(reelRef, { likes: arrayUnion(user.uid) });
                // Create notification if not liking own reel
                if (user.uid !== reel.authorId) {
                    await createNotification(firestore, {
                        userId: reel.authorId,
                        type: 'like',
                        actorId: user.uid,
                        actorName: user.displayName || 'User',
                        actorPhoto: user.photoURL || undefined,
                        postId: reel.id,
                        postType: 'reel',
                        message: 'liked your reel',
                    });
                }
            }
        } catch (error) {
            console.error("Like failed", error);
        }
    };

    const handleToggleSave = async (e: ReactMouseEvent, reel: Reel) => {
        e.stopPropagation();
        if (!user || !firestore) return;
        const userRef = doc(firestore, 'users', user.uid);
        const isSaved = savedReels.includes(reel.id);

        try {
            // Optimistic update
            if (isSaved) {
                setSavedReels(prev => prev.filter(id => id !== reel.id));
                await updateDoc(userRef, { savedReels: arrayRemove(reel.id) });
            } else {
                setSavedReels(prev => [...prev, reel.id]);
                // Use setDoc with merge in case user doc doesn't fully exist or savedReels field is missing
                await setDoc(userRef, { savedReels: arrayUnion(reel.id) }, { merge: true });
            }
        } catch (error) {
            console.error("Save failed", error);
        }
    };

    const handleShare = async (e: ReactMouseEvent, reel: Reel) => {
        e.stopPropagation();
        try {
            if (navigator.share) {
                await navigator.share({ title: `Watch ${reel.authorName}'s Reel`, text: reel.caption, url: window.location.href });
            } else {
                await navigator.clipboard.writeText(window.location.href);
                alert("Link copied!");
            }
        } catch (err) { console.log("Share failed", err); }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setNewReelFile(file);
    };

    const handleCustomAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setEditorState(prev => ({ ...prev, music: file.name.substring(0, 20) }));
            setActiveTool('none');
        }
    };

    const togglePlay = (e: ReactMouseEvent) => {
        e.stopPropagation();
        if (videoRef.current) {
            if (isPlaying) videoRef.current.pause();
            else videoRef.current.play();
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = (e: ReactMouseEvent) => {
        e.stopPropagation();
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    useEffect(() => {
        if (selectedReel) { setIsPlaying(true); setIsMuted(false); }
    }, [selectedReel]);

    // Handle Keyboard Navigation
    useEffect(() => {
        if (!selectedReel) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                handlePrevReel();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                handleNextReel();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    });

    // --- REEL NAVIGATION LOGIC ---
    const wheelTimeout = useRef<any>(null);
    const touchStart = useRef(0);

    const handleNextReel = (e?: any) => {
        if (e) e.stopPropagation();
        if (!selectedReel || !reels || reels.length === 0) return;
        const index = reels.findIndex(r => r.id === selectedReel.id);
        const nextIndex = (index + 1) % reels.length;
        setSelectedReel(reels[nextIndex]);
    };

    const handlePrevReel = (e?: any) => {
        if (e) e.stopPropagation();
        if (!selectedReel || !reels || reels.length === 0) return;
        const index = reels.findIndex(r => r.id === selectedReel.id);
        // If index is -1 (not found), default to 0. 
        // Logic: (index - 1 + length) % length handles positive wrap around.
        const prevIndex = (index - 1 + reels.length) % reels.length;
        setSelectedReel(reels[prevIndex]);
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (wheelTimeout.current) return;
        wheelTimeout.current = setTimeout(() => {
            wheelTimeout.current = null;
        }, 500); // 500ms cool down

        if (e.deltaY > 50) {
            handleNextReel();
        } else if (e.deltaY < -50) {
            handlePrevReel();
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStart.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        const diff = touchStart.current - e.changedTouches[0].clientY;
        if (Math.abs(diff) > 50) {
            if (diff > 0) handleNextReel();
            else handlePrevReel();
        }
    };
    // ----------------------------


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-4">
                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                    <Video className="w-5 h-5 text-pink-500" /> Trending Reels
                </h2>

                {user && (
                    <label className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:text-white h-9 px-4 text-sm font-medium transition-colors">
                        <Plus className="w-4 h-4" /> Create Reel
                        <input type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />
                    </label>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
                {reels?.map((reel) => (
                    <div
                        key={reel.id}
                        className="relative aspect-[9/16] rounded-xl overflow-hidden bg-zinc-900 group shrink-0 shadow-md hover:scale-[1.02] transition-transform duration-300 cursor-pointer border border-white/5"
                        onClick={() => setSelectedReel(reel)}
                    >
                        <video
                            src={reel.videoUrl}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                            loop
                            onMouseEnter={(e) => e.currentTarget.play().catch(() => { })}
                            onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90 flex flex-col justify-end p-4 pointer-events-none">
                            <div className="flex items-center gap-2 mb-2 bg-black/40 px-2 py-1 rounded-full w-fit backdrop-blur-sm">
                                <Avatar className="w-5 h-5 border border-white/50">
                                    <AvatarImage src={reel.authorPhoto} />
                                    <AvatarFallback className="text-[10px]">{reel.authorName[0]}</AvatarFallback>
                                </Avatar>
                                <span className="text-white text-[10px] font-bold truncate max-w-[80px]">{reel.authorName}</span>
                            </div>
                            <p className="text-white text-xs line-clamp-2 mb-3 opacity-90 drop-shadow-md px-1">{reel.caption}</p>
                            <div className="flex items-center gap-2 text-white/90 px-1 pointer-events-auto">
                                <Button size="icon" variant="ghost" className="h-6 w-auto gap-1 px-2 rounded-full bg-black/40 hover:bg-black/60 text-white" onClick={(e) => handleToggleLike(e, reel)}>
                                    <Heart className={`w-3 h-3 ${reel.likes?.includes(user?.uid || '') ? 'fill-pink-500 text-pink-500' : ''}`} />
                                    <span className="text-[10px]">{reel.likes?.length || 0}</span>
                                </Button>
                                <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm">
                                    <MessageCircle className="w-3 h-3" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* CREATE REEL STUDIO */}
            <Dialog open={!!newReelFile} onOpenChange={(open) => !open && setNewReelFile(null)}>
                <DialogContent className="p-0 border-0 bg-black max-w-[100vw] sm:max-w-[450px] h-[100dvh] sm:h-[85vh] flex flex-col items-center justify-center overflow-hidden rounded-none sm:rounded-2xl">
                    <DialogTitle className="sr-only">Create Reel</DialogTitle>
                    {previewUrl && (
                        <div className="relative w-full h-full bg-black group text-white">

                            {step === 'edit' && (
                                <>
                                    <div
                                        ref={containerRef}
                                        className="relative w-full h-full overflow-hidden touch-none"
                                        onPointerMove={handlePointerMove}
                                        onPointerUp={handlePointerUp}
                                    >
                                        <video src={previewUrl} className="w-full h-full object-cover pointer-events-none" autoPlay loop playsInline muted />

                                        {editorState.text && (
                                            <div
                                                onPointerDown={(e) => handlePointerDown(e, 'text')}
                                                className={`absolute cursor-move z-20 select-none pb-8 whitespace-nowrap ${editorState.textStyle?.animation}`}
                                                style={{
                                                    left: `${editorState.textPos.x}%`,
                                                    top: `${editorState.textPos.y}%`,
                                                    transform: 'translate(-50%, -50%)',
                                                }}
                                            >
                                                <h2 className={`text-3xl sm:text-4xl text-center px-4 py-2 rounded-xl border border-transparent 
                                                    ${editorState.textStyle?.font} 
                                                    ${editorState.textStyle?.colorClass}
                                                    ${editorState.textStyle?.bg ? 'bg-black/60 backdrop-blur-md shadow-xl border-white/10' : 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]'}
                                                `}>
                                                    {editorState.text}
                                                </h2>
                                            </div>
                                        )}

                                        {editorState.sticker && (
                                            <div
                                                onPointerDown={(e) => handlePointerDown(e, 'sticker')}
                                                className="absolute cursor-move z-20 select-none text-7xl drop-shadow-lg pb-8"
                                                style={{
                                                    left: `${editorState.stickerPos.x}%`,
                                                    top: `${editorState.stickerPos.y}%`,
                                                    transform: 'translate(-50%, -50%)'
                                                }}
                                            >
                                                {editorState.sticker}
                                            </div>
                                        )}

                                        {editorState.music && (
                                            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 text-white/90 text-xs font-medium border border-white/10 z-10">
                                                <Music className="w-3 h-3" /> {editorState.music}
                                            </div>
                                        )}
                                    </div>

                                    {!activeTool.match(/text/) && (
                                        <>
                                            <div className="absolute top-4 left-4 z-50">
                                                <button onClick={() => setNewReelFile(null)} className="p-2 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60"><X className="w-6 h-6" /></button>
                                            </div>
                                            <div className="absolute top-20 right-4 z-50 flex flex-col gap-4">
                                                <button onClick={() => setActiveTool('music')} className="flex flex-col items-center gap-1 group">
                                                    <div className={`p-3 rounded-full backdrop-blur-md transition-all ${editorState.music ? 'bg-white text-black' : 'bg-black/40 text-white hover:bg-black/60'}`}><Music className="w-5 h-5" /></div>
                                                    <span className="text-[10px] font-bold drop-shadow-md">Audio</span>
                                                </button>
                                                <button onClick={() => setActiveTool('text')} className="flex flex-col items-center gap-1 group">
                                                    <div className={`p-3 rounded-full backdrop-blur-md transition-all ${editorState.text ? 'bg-white text-black' : 'bg-black/40 text-white hover:bg-black/60'}`}><Type className="w-5 h-5" /></div>
                                                    <span className="text-[10px] font-bold drop-shadow-md">Text</span>
                                                </button>
                                                <button onClick={() => setActiveTool('sticker')} className="flex flex-col items-center gap-1 group">
                                                    <div className={`p-3 rounded-full backdrop-blur-md transition-all ${editorState.sticker ? 'bg-white text-black' : 'bg-black/40 text-white hover:bg-black/60'}`}><Smile className="w-5 h-5" /></div>
                                                    <span className="text-[10px] font-bold drop-shadow-md">Sticker</span>
                                                </button>
                                            </div>
                                            <div className="absolute bottom-6 right-6 z-50">
                                                <Button onClick={() => setStep('caption')} className="rounded-full bg-white text-black hover:bg-white/90 font-bold px-8 h-12 shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-transform active:scale-95">
                                                    Next <ChevronRight className="w-4 h-4 ml-1" />
                                                </Button>
                                            </div>
                                        </>
                                    )}

                                    {/* --- TEXT TOOL --- */}
                                    {activeTool === 'text' && (
                                        <div className="absolute inset-0 bg-black/80 z-[60] flex flex-col animate-in fade-in">
                                            <div className="flex items-center justify-between p-4">
                                                <div className="w-16"></div>
                                                <div className="flex bg-zinc-800 rounded-full p-1">
                                                    <button onClick={() => setTextTab('font')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${textTab === 'font' ? 'bg-zinc-600 text-white' : 'text-zinc-400'}`}>Aa</button>
                                                    <button onClick={() => setTextTab('color')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${textTab === 'color' ? 'bg-zinc-600 text-white' : 'text-zinc-400'}`}><Palette className="w-3.5 h-3.5" /></button>
                                                    <button onClick={() => setTextTab('anim')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${textTab === 'anim' ? 'bg-zinc-600 text-white' : 'text-zinc-400'}`}><Sparkles className="w-3.5 h-3.5" /></button>
                                                </div>
                                                <button onClick={() => setActiveTool('none')} className="text-white font-bold text-sm bg-white/10 px-4 py-2 rounded-full hover:bg-white/20">Done</button>
                                            </div>

                                            <div className="flex-1 flex flex-col items-center justify-center">
                                                <Input
                                                    autoFocus
                                                    value={editorState.text}
                                                    onChange={(e) => setEditorState(prev => ({ ...prev, text: e.target.value }))}
                                                    placeholder="Type..."
                                                    className={`bg-transparent border-none text-center text-4xl sm:text-5xl placeholder:text-white/30 focus-visible:ring-0 max-w-[90%]
                                                        ${editorState.textStyle?.font} 
                                                        ${editorState.textStyle?.colorClass}
                                                        ${editorState.textStyle?.bg ? 'bg-white/10 rounded-xl py-4' : ''}
                                                    `}
                                                />
                                            </div>

                                            {/* Bottom Controls Panel */}
                                            <div className="h-40 bg-zinc-900 border-t border-white/10 p-4">
                                                {textTab === 'font' && (
                                                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                                                        {FONTS.map(font => (
                                                            <button
                                                                key={font.name}
                                                                onClick={() => setEditorState(p => ({ ...p, textStyle: { ...p.textStyle, font: font.class } }))}
                                                                className={`flex-shrink-0 w-24 h-24 rounded-xl border-2 flex items-center justify-center bg-zinc-800 ${editorState.textStyle?.font === font.class ? 'border-pink-500' : 'border-transparent'}`}
                                                            >
                                                                <span className={`text-white text-lg ${font.class}`}>{font.name}</span>
                                                            </button>
                                                        ))}
                                                        <button
                                                            onClick={() => setEditorState(p => ({ ...p, textStyle: { ...p.textStyle, bg: !p.textStyle.bg } }))}
                                                            className={`flex-shrink-0 w-24 h-24 rounded-xl border-2 flex flex-col items-center justify-center bg-zinc-800 ${editorState.textStyle?.bg ? 'border-pink-500 bg-zinc-700' : 'border-transparent'}`}
                                                        >
                                                            <div className="w-8 h-8 bg-white/20 rounded mb-2"></div>
                                                            <span className="text-xs text-white uppercase font-bold">Box</span>
                                                        </button>
                                                    </div>
                                                )}
                                                {textTab === 'color' && (
                                                    <div className="flex gap-4 overflow-x-auto no-scrollbar items-center h-full">
                                                        {COLORS.map(color => (
                                                            <button
                                                                key={color.name}
                                                                onClick={() => setEditorState(p => ({ ...p, textStyle: { ...p.textStyle, colorClass: color.class } }))}
                                                                className={`flex-shrink-0 w-12 h-12 rounded-full border-2 ${editorState.textStyle?.colorClass === color.class ? 'border-white scale-110' : 'border-transparent'}`}
                                                            >
                                                                <div className={`w-full h-full rounded-full ${color.class.includes('bg-') ? color.class.replace('bg-clip-text text-transparent', '') : color.class.replace('text-', 'bg-')}`} />
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                                {textTab === 'anim' && (
                                                    <div className="flex gap-3 overflow-x-auto no-scrollbar items-center h-full">
                                                        {ANIMATIONS.map(anim => (
                                                            <button
                                                                key={anim.name}
                                                                onClick={() => setEditorState(p => ({ ...p, textStyle: { ...p.textStyle, animation: anim.class } }))}
                                                                className={`flex-shrink-0 px-6 py-3 rounded-full border border-white/10 bg-zinc-800 text-white text-sm font-bold ${editorState.textStyle?.animation === anim.class ? 'bg-pink-600 border-pink-500' : 'hover:bg-zinc-700'}`}
                                                            >
                                                                {anim.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Music Tool UI */}
                                    {activeTool === 'music' && (
                                        <div className="absolute top-20 right-16 z-[60] bg-black/95 border border-white/10 rounded-xl p-4 w-56 space-y-2 animate-in slide-in-from-right-10">
                                            {/* Same Music Implementation */}
                                            <h3 className="text-white text-xs font-bold mb-2 uppercase text-white/50">Featured</h3>
                                            {MUSIC_TRACKS.map(track => (
                                                <button
                                                    key={track}
                                                    onClick={() => { setEditorState(prev => ({ ...prev, music: track })); setActiveTool('none'); }}
                                                    className="w-full text-left p-2 rounded-lg hover:bg-white/10 text-white text-xs flex items-center justify-between"
                                                >
                                                    {track}
                                                    {editorState.music === track && <Check className="w-3 h-3 text-orange-500" />}
                                                </button>
                                            ))}
                                            <h3 className="text-white text-xs font-bold mt-3 mb-2 uppercase text-white/50">Device</h3>
                                            <label className="w-full flex items-center gap-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs cursor-pointer">
                                                <Upload className="w-3 h-3" /> Select from Device
                                                <input type="file" accept="audio/*" className="hidden" onChange={handleCustomAudio} />
                                            </label>
                                            <button onClick={() => { setEditorState(prev => ({ ...prev, music: '' })); setActiveTool('none'); }} className="w-full text-center text-[10px] text-red-400 mt-2 py-1">Remove Song</button>
                                            <button onClick={() => setActiveTool('none')} className="absolute -top-2 -left-2 bg-white text-black rounded-full p-1"><X className="w-3 h-3" /></button>
                                        </div>
                                    )}

                                    {/* Sticker Tool UI */}
                                    {activeTool === 'sticker' && (
                                        <div className="absolute top-40 right-16 z-[60] bg-black/95 border border-white/10 rounded-xl p-4 w-64 animate-in slide-in-from-right-10">
                                            <div className="grid grid-cols-4 gap-2">
                                                {STICKERS.map(sticker => (
                                                    <button
                                                        key={sticker}
                                                        onClick={() => { setEditorState(prev => ({ ...prev, sticker: sticker })); setActiveTool('none'); }}
                                                        className="text-3xl hover:bg-white/10 rounded-lg p-2 transition-colors"
                                                    >
                                                        {sticker}
                                                    </button>
                                                ))}
                                            </div>
                                            <button onClick={() => { setEditorState(prev => ({ ...prev, sticker: '' })); setActiveTool('none'); }} className="w-full text-center text-[10px] text-red-400 mt-2">Remove Sticker</button>
                                            <button onClick={() => setActiveTool('none')} className="absolute -top-2 -left-2 bg-white text-black rounded-full p-1"><X className="w-3 h-3" /></button>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* STEP 2: CAPTION (Same) */}
                            {step === 'caption' && (
                                <div className="absolute inset-0 bg-zinc-900 flex flex-col">
                                    <div className="p-4 flex items-center justify-between border-b border-white/10">
                                        <button onClick={() => setStep('edit')} className="p-2 -ml-2 text-white"><X className="w-6 h-6" /></button>
                                        <h3 className="font-bold text-white">New Reel</h3>
                                        <div className="w-8" />
                                    </div>
                                    <div className="p-6 flex flex-col gap-6 flex-1">
                                        <div className="flex gap-4">
                                            <div className="relative w-24 h-36 bg-black rounded-lg overflow-hidden border border-white/10 shrink-0">
                                                <video src={previewUrl} className="w-full h-full object-cover" muted />
                                                {/* Preview text (Simplified) */}
                                                {editorState.text && <div className="absolute inset-0 flex items-center justify-center"><span className="text-[10px] bg-black/50 text-white px-1">Preview</span></div>}
                                            </div>
                                            <div className="flex-1 space-y-4">
                                                <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Write a caption..." className="w-full bg-transparent border-none text-white placeholder:text-white/40 resize-none focus:ring-0 text-sm" rows={3} />
                                                <div className="h-px bg-white/10 w-full" />
                                                <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-white/50" /><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Add Location" className="bg-transparent border-none h-8 p-0 text-white placeholder:text-white/40 focus-visible:ring-0 text-sm" /></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6 border-t border-white/10">
                                        <Button onClick={handleCreateReel} disabled={isUploading} className="w-full rounded-full bg-pink-600 hover:bg-pink-700 text-white font-bold h-12 text-lg">{isUploading ? <Loader2 className="animate-spin mr-2" /> : 'Share Reel'}</Button>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* VIEW REEL DIALOG */}
            <Dialog open={!!selectedReel} onOpenChange={(open) => !open && setSelectedReel(null)}>
                <DialogContent className="p-0 border-0 bg-black max-w-[100vw] sm:max-w-[400px] h-[100dvh] sm:h-[85vh] flex items-center justify-center overflow-hidden rounded-none sm:rounded-2xl">
                    <DialogTitle className="sr-only">Viewing Reel</DialogTitle>
                    {selectedReel && (
                        <div
                            className="relative w-full h-full flex items-center justify-center bg-zinc-900 group/player"
                            onWheel={handleWheel}
                            onTouchStart={handleTouchStart}
                            onTouchEnd={handleTouchEnd}
                        >
                            <button onClick={() => setSelectedReel(null)} className="absolute top-4 left-4 z-50 p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60"><X className="w-5 h-5" /></button>
                            <button onClick={toggleMute} className="absolute top-4 right-4 z-50 p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60">{isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</button>

                            <div className="relative w-full h-full">
                                <video ref={videoRef} src={selectedReel.videoUrl} className="w-full h-full object-cover cursor-pointer" autoPlay loop playsInline muted={isMuted} onClick={togglePlay} />

                                {/* SAVED OVERLAYS */}
                                {selectedReel.overlayText && (
                                    <div
                                        className={`absolute z-10 pointer-events-none whitespace-nowrap ${selectedReel.textStyle?.animation}`}
                                        style={{
                                            left: `${selectedReel.textPos?.x || 50}%`,
                                            top: `${selectedReel.textPos?.y || 50}%`,
                                            transform: 'translate(-50%, -50%)',
                                        }}
                                    >
                                        <h2 className={`text-xl md:text-3xl lg:text-4xl text-center px-4 py-2 rounded-xl border border-transparent 
                                            ${selectedReel.textStyle?.font} 
                                            ${selectedReel.textStyle?.colorClass}
                                            ${selectedReel.textStyle?.bg ? 'bg-black/60 backdrop-blur-md shadow-xl border-white/10' : 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]'}
                                        `}>
                                            {selectedReel.overlayText}
                                        </h2>
                                    </div>
                                )}
                                {selectedReel.sticker && (
                                    <div className="absolute z-10 pointer-events-none text-6xl md:text-8xl drop-shadow-lg" style={{ left: `${selectedReel.stickerPos?.x || 50}%`, top: `${selectedReel.stickerPos?.y || 30}%`, transform: 'translate(-50%, -50%)' }}>
                                        {selectedReel.sticker}
                                    </div>
                                )}
                                {selectedReel.musicTrack && (
                                    <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 text-white/90 text-xs font-medium border border-white/10 z-10 animate-in fade-in slide-in-from-top-4 duration-500">
                                        <Music className="w-3 h-3 animate-bounce" /> {selectedReel.musicTrack}
                                    </div>
                                )}
                            </div>


                            {!isPlaying && <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20 z-30"><div className="p-4 bg-black/40 backdrop-blur-md rounded-full border border-white/10"><Play className="w-8 h-8 text-white fill-white ml-1" /></div></div>}

                            {/* BOTTOM INFO */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-40 pointer-events-none h-1/2 flex flex-col justify-end">
                                <div className="flex items-center gap-3 mb-4 pointer-events-auto">
                                    <Avatar className="w-10 h-10 border-2 border-white/20"><AvatarImage src={selectedReel.authorPhoto} /><AvatarFallback>{selectedReel.authorName[0]}</AvatarFallback></Avatar>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2"><span className="text-white font-bold text-sm text-shadow">{selectedReel.authorName}</span><button className="text-[10px] font-bold bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded-full transition-colors border border-white/10">Follow</button></div>
                                        <div className="flex items-center gap-2 text-white/70 text-xs">{selectedReel.location && <><MapPin className="w-3 h-3" /> {selectedReel.location} •</>} <span>Original Audio</span></div>
                                    </div>
                                </div>
                                <p className="text-white text-sm mb-2 max-w-[80%] font-medium drop-shadow-md">{selectedReel.caption}</p>

                                {/* ACTIONS */}
                                <div className="absolute bottom-20 right-2 flex flex-col items-center gap-6 pointer-events-auto z-50 scale-90 sm:scale-100">
                                    <button className="flex flex-col items-center gap-1 group" onClick={(e) => handleToggleLike(e, selectedReel)}>
                                        <div className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 group-hover:bg-pink-500/80 transition-all shadow-lg active:scale-90 flex items-center justify-center w-12 h-12">
                                            <Heart className={`w-6 h-6 transition-transform group-hover:scale-110 ${selectedReel.likes?.includes(user?.uid || '') ? 'fill-pink-500 text-pink-500' : 'text-white'}`} />
                                        </div>
                                        <span className="text-[10px] text-white font-bold drop-shadow-md">{selectedReel.likes?.length || 'Like'}</span>
                                    </button>
                                    <Sheet>
                                        <SheetTrigger asChild>
                                            <button className="flex flex-col items-center gap-1 group">
                                                <div className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 group-hover:bg-blue-500/80 transition-all shadow-lg active:scale-90 flex items-center justify-center w-12 h-12">
                                                    <MessageCircle className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                                                </div>
                                                <span className="text-[10px] text-white font-bold drop-shadow-md">Comments</span>
                                            </button>
                                        </SheetTrigger>
                                        <SheetContent side="bottom" className="h-[60vh] sm:h-[500px] p-0 border-0 rounded-t-3xl sm:rounded-3xl m-0 sm:m-4 bg-transparent shadow-none">
                                            <SheetTitle className="sr-only">Comments</SheetTitle>
                                            <ReelComments reelId={selectedReel.id} reelAuthorId={selectedReel.authorId} />
                                        </SheetContent>
                                    </Sheet>
                                    <button className="flex flex-col items-center gap-1 group" onClick={(e) => handleShare(e, selectedReel)}><div className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 group-hover:bg-green-500/80 transition-all shadow-lg active:scale-90 flex items-center justify-center w-12 h-12"><Share2 className="w-6 h-6 text-white group-hover:scale-110 transition-transform" /></div><span className="text-[10px] text-white font-bold drop-shadow-md">Share</span></button>
                                    <button className="flex flex-col items-center gap-1 group" onClick={(e) => handleToggleSave(e, selectedReel)}>
                                        <div className={`p-3 rounded-full backdrop-blur-md border transition-all shadow-lg active:scale-90 flex items-center justify-center w-12 h-12 ${savedReels.includes(selectedReel.id) ? 'bg-white border-white' : 'bg-black/40 border-white/10 group-hover:bg-white/20'}`}>
                                            <Bookmark className={`w-6 h-6 transition-colors ${savedReels.includes(selectedReel.id) ? 'fill-black text-black' : 'text-white'}`} />
                                        </div>
                                        <span className="text-[10px] text-white font-bold drop-shadow-md">{savedReels.includes(selectedReel.id) ? 'Saved' : 'Save'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
