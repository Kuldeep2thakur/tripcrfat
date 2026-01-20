'use client';

import { useState, useEffect, useRef, MouseEvent as ReactMouseEvent } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, limit, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Loader2, X, Heart, MessageCircle, Send, Music, Type, Smile, ChevronRight, Check, Upload, Palette, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import Image from 'next/image';

interface Story {
    id: string;
    authorId: string;
    authorName: string;
    authorPhoto?: string;
    mediaUrl: string;
    mediaType: 'image' | 'video';
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

function StoryComments({ storyId, storyAuthorId }: { storyId: string; storyAuthorId: string }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const [commentText, setCommentText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [replyTo, setReplyTo] = useState<Comment | null>(null);

    const commentsQuery = useMemoFirebase(() => {
        if (!firestore || !storyId) return null;
        return query(
            collection(firestore, 'stories', storyId, 'comments'),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, storyId]);

    const { data: comments } = useCollection<Comment>(commentsQuery);

    const handleSendComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim() || !user || !firestore) return;

        setIsSending(true);
        try {
            await addDoc(collection(firestore, 'stories', storyId, 'comments'), {
                authorId: user.uid,
                authorName: user.displayName || 'User',
                authorPhoto: user.photoURL,
                text: commentText.trim(),
                parentCommentId: replyTo?.id || null,
                createdAt: serverTimestamp(),
            });

            // Create notification for story author (if not commenting on own story)
            if (user.uid !== storyAuthorId) {
                await createNotification(firestore, {
                    userId: storyAuthorId,
                    type: 'comment',
                    actorId: user.uid,
                    actorName: user.displayName || 'User',
                    actorPhoto: user.photoURL || undefined,
                    postId: storyId,
                    postType: 'story',
                    message: replyTo ? `replied to a comment on your story` : 'commented on your story',
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
                        className="rounded-full bg-orange-500 hover:bg-orange-600 text-white h-10 w-10 shrink-0"
                    >
                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </div>
            </form>
        </div>
    );
}

export function StoriesBar() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [isUploading, setIsUploading] = useState(false);

    // View Story State
    const [selectedStory, setSelectedStory] = useState<Story | null>(null);
    const [progress, setProgress] = useState(0);

    // Create Story State
    const [newStoryFile, setNewStoryFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Creative Tools State
    const [activeTool, setActiveTool] = useState<'none' | 'text' | 'music' | 'sticker'>('none');

    // Sub-tool state
    const [textTab, setTextTab] = useState<'font' | 'color' | 'anim'>('font');

    // Editor State
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

    // Fetch recent stories
    const storiesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'stories'), orderBy('createdAt', 'desc'), limit(20));
    }, [firestore]);

    const { data: stories } = useCollection<Story>(storiesQuery);

    useEffect(() => {
        if (newStoryFile) {
            const url = URL.createObjectURL(newStoryFile);
            setPreviewUrl(url);
            // Reset editor
            setEditorState({
                text: '', textPos: { x: 50, y: 50 },
                textStyle: { font: 'font-sans', colorClass: 'text-white', animation: '', bg: false },
                sticker: '', stickerPos: { x: 50, y: 30 },
                music: ''
            });
            setActiveTool('none');
            return () => URL.revokeObjectURL(url);
        } else {
            setPreviewUrl(null);
        }
    }, [newStoryFile]);

    useEffect(() => {
        if (!selectedStory) {
            setProgress(0);
            return;
        }
        const duration = selectedStory.mediaType === 'video' ? 10000 : 5000;
        const interval = 50;
        const increment = 100 / (duration / interval);
        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(timer);
                    return 100;
                }
                return prev + increment;
            });
        }, interval);
        return () => clearInterval(timer);
    }, [selectedStory]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setNewStoryFile(file);
        }
    };

    const handleCustomAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setEditorState(prev => ({ ...prev, music: file.name.substring(0, 20) }));
            setActiveTool('none');
        }
    };

    const handleUploadStory = async () => {
        if (!newStoryFile || !user || !firestore) return;
        try {
            setIsUploading(true);
            const uploadData = await uploadToCloudinary(newStoryFile);
            await addDoc(collection(firestore, 'stories'), {
                authorId: user.uid,
                authorName: user.displayName || 'Traveler',
                authorPhoto: user.photoURL,
                mediaUrl: uploadData.secure_url,
                mediaType: newStoryFile.type.startsWith('video') ? 'video' : 'image',
                createdAt: serverTimestamp(),
                likes: [],
                // Metadata
                overlayText: editorState.text,
                textPos: editorState.textPos,
                textStyle: editorState.textStyle,
                sticker: editorState.sticker,
                stickerPos: editorState.stickerPos,
                musicTrack: editorState.music,
            });
            setNewStoryFile(null);
        } catch (error) {
            console.error("Story upload failed", error);
            alert('Failed to upload story');
        } finally {
            setIsUploading(false);
        }
    };

    const handleToggleLike = async (e: ReactMouseEvent) => {
        e.stopPropagation();
        if (!user || !firestore || !selectedStory) return;
        const storyRef = doc(firestore, 'stories', selectedStory.id);
        const isLiked = selectedStory.likes?.includes(user.uid);

        try {
            if (isLiked) {
                await updateDoc(storyRef, { likes: arrayRemove(user.uid) });
            } else {
                await updateDoc(storyRef, { likes: arrayUnion(user.uid) });
                // Create notification if not liking own story
                if (user.uid !== selectedStory.authorId) {
                    await createNotification(firestore, {
                        userId: selectedStory.authorId,
                        type: 'like',
                        actorId: user.uid,
                        actorName: user.displayName || 'User',
                        actorPhoto: user.photoURL || undefined,
                        postId: selectedStory.id,
                        postType: 'story',
                        message: 'liked your story',
                    });
                }
            }
        } catch (error) {
            console.error("Like failed", error);
        }
    };

    return (
        <div className="w-full overflow-x-auto py-2 no-scrollbar">
            <div className="flex gap-4 px-4 min-w-max">

                {user && (
                    <div className="flex flex-col items-center gap-2 cursor-pointer group">
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                            <div className="w-full h-full p-[2px] rounded-full border-2 border-dashed border-white/20 group-hover:border-orange-500 transition-colors">
                                <Avatar className="w-full h-full rounded-full border-2 border-transparent">
                                    <AvatarImage src={user.photoURL || undefined} />
                                    <AvatarFallback className="bg-white/10 text-white font-bold">{user.displayName?.[0] || 'U'}</AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1.5 border-2 border-[#050505] shadow-sm transform transition-transform group-hover:scale-110">
                                <label htmlFor="story-upload" className="cursor-pointer flex items-center justify-center">
                                    <Plus className="w-3 h-3 text-white" />
                                </label>
                                <input id="story-upload" type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
                            </div>
                        </div>
                        <span className="text-xs font-medium text-white/60 group-hover:text-white transition-colors">You</span>
                    </div>
                )}

                {stories?.map((story) => (
                    <div key={story.id} className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => setSelectedStory(story)}>
                        <div className={`w-16 h-16 sm:w-20 sm:h-20 p-[2px] rounded-full bg-gradient-to-tr ${story.likes?.includes(user?.uid || '') ? 'from-pink-500 to-red-500' : 'from-yellow-400 via-orange-500 to-purple-600'} animate-in zoom-in spin-in-3 duration-500`}>
                            <div className="w-full h-full p-[2px] bg-[#050505] rounded-full">
                                <Avatar className="w-full h-full rounded-full object-cover">
                                    <AvatarImage src={story.authorPhoto} />
                                    <AvatarFallback>{story.authorName[0]}</AvatarFallback>
                                </Avatar>
                            </div>
                        </div>
                        <span className="text-xs font-medium text-white/60 truncate max-w-[70px] group-hover:text-white transition-colors">
                            {story.authorName.split(' ')[0]}
                        </span>
                    </div>
                ))}
            </div>

            {/* CREATE STORY DIALOG */}
            <Dialog open={!!newStoryFile} onOpenChange={(open) => !open && setNewStoryFile(null)}>
                <DialogContent className="p-0 border-0 bg-black max-w-[100vw] sm:max-w-[400px] h-[100dvh] sm:h-[85vh] flex flex-col items-center justify-center overflow-hidden rounded-none sm:rounded-2xl">
                    <DialogTitle className="sr-only">Create Story</DialogTitle>

                    {previewUrl && (
                        <div className="relative w-full h-full bg-black group touch-none">
                            {/* EDITOR CONTAINER */}
                            <div
                                ref={containerRef}
                                className="relative w-full h-full overflow-hidden"
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                            >
                                {newStoryFile?.type.startsWith('video') ? (
                                    <video src={previewUrl} className="w-full h-full object-cover pointer-events-none" autoPlay loop playsInline muted />
                                ) : (
                                    <Image src={previewUrl} alt="Preview" fill className="object-cover pointer-events-none" />
                                )}

                                {/* Draggable Text Overlay */}
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
                                        className="absolute cursor-move z-20 select-none text-8xl drop-shadow-lg pb-8"
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


                            {/* Sidebar Tools */}
                            {!activeTool.match(/text/) && (
                                <div className="absolute top-4 left-0 right-0 z-50 flex items-center justify-between px-4 transition-opacity duration-200">
                                    <button onClick={() => setNewStoryFile(null)} className="p-2 rounded-full bg-black/20 text-white">
                                        <X className="w-6 h-6" />
                                    </button>
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => setActiveTool(activeTool === 'music' ? 'none' : 'music')} className={`p-2 rounded-full text-white hover:bg-black/40 ${activeTool === 'music' ? 'bg-white text-black' : 'bg-black/20'}`}>
                                            <Music className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => setActiveTool('text')} className="p-2 rounded-full bg-black/20 text-white hover:bg-black/40">
                                            <Type className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => setActiveTool(activeTool === 'sticker' ? 'none' : 'sticker')} className={`p-2 rounded-full text-white hover:bg-black/40 ${activeTool === 'sticker' ? 'bg-white text-black' : 'bg-black/20'}`}>
                                            <Smile className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
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
                                <div className="absolute bottom-24 left-4 right-4 z-[60] bg-black/90 border border-white/10 rounded-xl p-4 animate-in slide-in-from-bottom-10 space-y-2">
                                    {/* Same Music Implementation */}
                                    <h3 className="text-white text-sm font-bold mb-2">Select Music</h3>
                                    {MUSIC_TRACKS.map(track => (
                                        <button key={track} onClick={() => { setEditorState(prev => ({ ...prev, music: track })); setActiveTool('none'); }} className="w-full text-left p-2 rounded-lg hover:bg-white/10 text-white/80 text-sm flex items-center justify-between group">
                                            {track} {editorState.music === track && <Check className="w-4 h-4 text-orange-500" />}
                                        </button>
                                    ))}
                                    <h3 className="text-white text-xs font-bold mt-3 mb-2 uppercase text-white/50">Device</h3>
                                    <label className="w-full flex items-center gap-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs cursor-pointer">
                                        <Upload className="w-3 h-3" /> Select from Device
                                        <input type="file" accept="audio/*" className="hidden" onChange={handleCustomAudio} />
                                    </label>
                                    <button onClick={() => { setEditorState(prev => ({ ...prev, music: '' })); setActiveTool('none'); }} className="w-full text-center text-xs text-red-400 mt-2 py-2">Remove</button>
                                </div>
                            )}

                            {/* Sticker Tool UI */}
                            {activeTool === 'sticker' && (
                                <div className="absolute bottom-24 left-4 right-4 z-[60] bg-black/90 border border-white/10 rounded-xl p-4 animate-in slide-in-from-bottom-10">
                                    <h3 className="text-white text-sm font-bold mb-3">Add Sticker</h3>
                                    <div className="grid grid-cols-4 gap-4">
                                        {STICKERS.map(sticker => (
                                            <button key={sticker} onClick={() => { setEditorState(prev => ({ ...prev, sticker: sticker })); setActiveTool('none'); }} className="text-3xl hover:bg-white/10 rounded-lg p-2 transition-colors">
                                                {sticker}
                                            </button>
                                        ))}
                                    </div>
                                    <button onClick={() => { setEditorState(prev => ({ ...prev, sticker: '' })); setActiveTool('none'); }} className="w-full text-center text-xs text-red-400 mt-4">Remove</button>
                                </div>
                            )}

                            {/* Bottom Controls */}
                            {activeTool !== 'text' && (
                                <div className="absolute bottom-0 left-0 right-0 p-6 z-50 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-full border border-white/20 bg-white/10 flex items-center justify-center text-xs text-white">Effects</div>
                                    </div>
                                    <Button
                                        onClick={handleUploadStory}
                                        disabled={isUploading}
                                        className="rounded-full bg-white text-black hover:bg-white/90 font-bold px-6 h-12 flex items-center gap-2 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                                    >
                                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : (<>Your Story <ChevronRight className="w-4 h-4 ml-1" /></>)}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* VIEW STORY DIALOG */}
            <Dialog open={!!selectedStory} onOpenChange={(open) => !open && setSelectedStory(null)}>
                <DialogContent className="p-0 border-0 bg-black max-w-[100vw] sm:max-w-[450px] h-[100dvh] sm:h-[85vh] flex items-center justify-center overflow-hidden rounded-none sm:rounded-2xl">
                    <DialogTitle className="sr-only">Viewing Story</DialogTitle>
                    {selectedStory && (
                        <div className="relative w-full h-full flex items-center justify-center bg-zinc-900">

                            {/* Progress & Header */}
                            <div className="absolute top-2 left-2 right-2 flex gap-1 z-50">
                                <div className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                                    <div className="h-full bg-white transition-all duration-100 ease-linear" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                            <div className="absolute top-6 left-4 right-4 flex items-center justify-between z-50">
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-9 h-9 border border-white/20">
                                        <AvatarImage src={selectedStory.authorPhoto} />
                                        <AvatarFallback>{selectedStory.authorName[0]}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-white font-bold text-sm drop-shadow-md">{selectedStory.authorName}</span>
                                </div>
                                <button onClick={() => setSelectedStory(null)} className="p-2 bg-black/20 rounded-full text-white"><X className="w-5 h-5" /></button>
                            </div>

                            <div className="relative w-full h-full">
                                {selectedStory.mediaType === 'video' ? (
                                    <video src={selectedStory.mediaUrl} playsInline autoPlay className="w-full h-full object-cover" />
                                ) : (
                                    <Image src={selectedStory.mediaUrl} alt="Story" fill className="object-cover" priority />
                                )}

                                {/* RENDER SAVED METADATA OVERLAYS */}
                                {selectedStory.overlayText && (
                                    <div
                                        className={`absolute z-10 pointer-events-none whitespace-nowrap ${selectedStory.textStyle?.animation}`}
                                        style={{
                                            left: `${selectedStory.textPos?.x || 50}%`,
                                            top: `${selectedStory.textPos?.y || 50}%`,
                                            transform: 'translate(-50%, -50%)',
                                        }}
                                    >
                                        <h2 className={`text-xl md:text-3xl lg:text-4xl text-center px-4 py-2 rounded-xl border border-transparent 
                                            ${selectedStory.textStyle?.font} 
                                            ${selectedStory.textStyle?.colorClass}
                                            ${selectedStory.textStyle?.bg ? 'bg-black/60 backdrop-blur-md shadow-xl border-white/10' : 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]'}
                                        `}>
                                            {selectedStory.overlayText}
                                        </h2>
                                    </div>
                                )}
                                {selectedStory.sticker && (
                                    <div className="absolute z-10 pointer-events-none text-6xl md:text-8xl drop-shadow-lg" style={{ left: `${selectedStory.stickerPos?.x || 50}%`, top: `${selectedStory.stickerPos?.y || 30}%`, transform: 'translate(-50%, -50%)' }}>
                                        {selectedStory.sticker}
                                    </div>
                                )}
                                {selectedStory.musicTrack && (
                                    <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 text-white/90 text-xs font-medium border border-white/10 z-10 animate-in fade-in slide-in-from-top-4 duration-500">
                                        <Music className="w-3 h-3 animate-bounce" /> {selectedStory.musicTrack}
                                    </div>
                                )}
                            </div>


                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent z-40 flex items-center gap-4">
                                <div className="h-10 w-full rounded-full border border-white/30 bg-white/10 flex items-center px-4 text-white/70 text-sm">Reply...</div>
                                <button className="p-2 text-white transition-transform active:scale-90" onClick={handleToggleLike}>
                                    <Heart className={`w-7 h-7 stroke-[1.5] ${selectedStory.likes?.includes(user?.uid || '') ? 'fill-pink-500 text-pink-500' : ''}`} />
                                </button>
                                <Sheet>
                                    <SheetTrigger asChild>
                                        <button className="p-2 text-white"><MessageCircle className="w-7 h-7 stroke-[1.5]" /></button>
                                    </SheetTrigger>
                                    <SheetContent side="bottom" className="h-[60vh] sm:h-[500px] p-0 border-0 rounded-t-3xl sm:rounded-3xl m-0 sm:m-4 bg-transparent shadow-none">
                                        <SheetTitle className="sr-only">Comments</SheetTitle>
                                        <StoryComments storyId={selectedStory.id} storyAuthorId={selectedStory.authorId} />
                                    </SheetContent>
                                </Sheet>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
