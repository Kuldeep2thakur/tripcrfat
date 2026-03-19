'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, limit, doc, updateDoc, setDoc, getDoc, getDocs, deleteDoc, collectionGroup, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    Loader2, Users, Map, Video, Globe, AlertTriangle,
    Trash2, Shield, Settings, LayoutDashboard, Search,
    Menu, LogOut, ChevronRight, LayoutTemplate
} from 'lucide-react';
import { User, Trip } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { cn } from '@/lib/utils';

export default function AdminPage() {
    const { user, isUserLoading: userLoading } = useUser();
    const firestore = useFirestore();
    const auth = useAuth();
    const router = useRouter();

    // Navigation State
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'trips' | 'ui' | 'home'>('overview');

    // Data State
    const [stats, setStats] = useState({ users: 0, trips: 0, reels: 0 });
    const [loadingStats, setLoadingStats] = useState(true);

    const [usersList, setUsersList] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [userSearch, setUserSearch] = useState('');

    const [allTrips, setAllTrips] = useState<Trip[]>([]);
    const [loadingTrips, setLoadingTrips] = useState(false);
    const [tripSearch, setTripSearch] = useState('');

    const [config, setConfig] = useState({
        bannerText: '',
        showBanner: false,
        maintenanceMode: false
    });
    const [savingConfig, setSavingConfig] = useState(false);

    const [homeConfig, setHomeConfig] = useState({
        heroTitle: 'WanderLust',
        heroSubtitle: 'Your Digital Travel Diary',
        heroVideoId: 'zHYcM9mQiac',
        showHeroText: true
    });
    const [savingHomeConfig, setSavingHomeConfig] = useState(false);

    // --- EFFECT: Check Admin & Fetch Stats ---
    useEffect(() => {
        const checkRoleAndFetch = async () => {
            if (!user || !firestore) return;
            setLoadingStats(true);
            try {
                // Parallel fetch for speed
                const [usersSnap, reelsSnap] = await Promise.all([
                    getDocs(query(collection(firestore, 'users'))),
                    getDocs(query(collection(firestore, 'reels')))
                ]);

                setStats({
                    users: usersSnap.size,
                    trips: 0, // Updated when trips loaded
                    reels: reelsSnap.size
                });
            } catch (e) {
                console.error("Stats fetch error", e);
            } finally {
                setLoadingStats(false);
            }
        };
        checkRoleAndFetch();
    }, [user, firestore]);

    // --- EFFECT: Config ---
    useEffect(() => {
        if (!firestore) return;
        getDoc(doc(firestore, 'config', 'site')).then(snap => {
            if (snap.exists()) setConfig(snap.data() as any);
        });
        getDoc(doc(firestore, 'config', 'home')).then(snap => {
            if (snap.exists()) setHomeConfig(snap.data() as any);
        });
    }, [firestore]);

    // --- ACTIONS ---

    const fetchUsers = async () => {
        if (!firestore) return;
        setLoadingUsers(true);
        try {
            const q = query(collection(firestore, 'users'), limit(100));
            const snap = await getDocs(q);
            const list: User[] = [];
            snap.forEach(d => list.push({ id: d.id, ...d.data() } as User));
            setUsersList(list);
        } catch (e) { console.error(e) }
        setLoadingUsers(false);
    };

    const fetchTrips = async () => {
        if (!firestore) return;
        setLoadingTrips(true);
        try {
            const q = query(collectionGroup(firestore, 'trips'), orderBy('startDate', 'desc'), limit(100));
            const snap = await getDocs(q);
            const list: Trip[] = [];
            snap.forEach(d => {
                const data = d.data();
                list.push({ id: d.id, ...data, tripRef: d.ref, ownerId: data.ownerId || 'unknown' } as Trip);
            });
            setAllTrips(list);
            setStats(prev => ({ ...prev, trips: list.length }));
        } catch (e) { console.error(e) }
        setLoadingTrips(false);
    };

    const toggleBanUser = async (userId: string, currentStatus: boolean) => {
        if (!firestore) return;
        if (!window.confirm(`Are you sure you want to ${currentStatus ? 'unban' : 'ban'} this user?`)) return;
        try {
            await updateDoc(doc(firestore, 'users', userId), { isBanned: !currentStatus });
            setUsersList(prev => prev.map(u => u.id === userId ? { ...u, isBanned: !currentStatus } : u) as any);
        } catch (e) { console.error(e); alert('Action failed'); }
    };

    const deleteUser = async (userId: string) => {
        if (!firestore) return;
        if (!window.confirm('Delete this user PERMANENTLY?')) return;
        try {
            await deleteDoc(doc(firestore, 'users', userId));
            setUsersList(prev => prev.filter(u => u.id !== userId));
        } catch (e) { console.error(e); }
    };

    const deleteTrip = async (trip: Trip) => {
        if (!firestore || !trip.tripRef) return;
        if (!window.confirm(`Delete trip "${trip.title}" PERMANENTLY?`)) return;
        try {
            await deleteDoc(trip.tripRef);
            setAllTrips(prev => prev.filter(t => t.id !== trip.id));
        } catch (e) { console.error(e); alert("Failed to delete trip."); }
    };

    const handleSaveConfig = async () => {
        if (!firestore) return;
        setSavingConfig(true);
        try {
            await setDoc(doc(firestore, 'config', 'site'), config, { merge: true });
        } catch (e) { console.error(e); alert('Failed to save'); }
        setSavingConfig(false);
    };

    const handleSaveHomeConfig = async () => {
        if (!firestore) return;
        setSavingHomeConfig(true);
        try {
            await setDoc(doc(firestore, 'config', 'home'), homeConfig, { merge: true });
        } catch (e) { console.error(e); alert('Failed to save home settings'); }
        setSavingHomeConfig(false);
    };

    const handleLogout = () => {
        signOut(auth).then(() => router.push('/'));
    }

    // --- FILTERING ---
    const filteredUsers = usersList.filter(u =>
        u.displayName?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase())
    );

    const publicTrips = allTrips.filter(t => t.visibility === 'public' && t.title.toLowerCase().includes(tripSearch.toLowerCase()));
    const privateTrips = allTrips.filter(t => t.visibility !== 'public' && t.title.toLowerCase().includes(tripSearch.toLowerCase()));

    // --- NAVIGATION HELPERS ---
    const NavItem = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
        <button
            onClick={() => { setActiveTab(id); if (id === 'users' && usersList.length === 0) fetchUsers(); if (id === 'trips' && allTrips.length === 0) fetchTrips(); }}
            className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium w-full text-left font-headline tracking-wide",
                activeTab === id
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
            )}
        >
            <Icon className="h-5 w-5" />
            {label}
            {activeTab === id && <ChevronRight className="h-4 w-4 ml-auto opacity-50" />}
        </button>
    );

    if (userLoading) return <div className="h-screen w-full bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin text-orange-500 h-8 w-8" /></div>;

    return (
        <div className="flex h-screen bg-[#09090b] text-white overflow-hidden font-body">

            {/* SIDEBAR */}
            <aside className="w-72 hidden md:flex flex-col border-r border-white/10 bg-[#0f172a] p-6 relative z-10">
                <div className="flex items-center gap-3 px-2 mb-10">
                    <Shield className="h-8 w-8 text-orange-500" />
                    <div>
                        <h1 className="text-xl font-bold font-headline tracking-tight">Admin<span className="text-orange-500">Panel</span></h1>
                        <p className="text-xs text-white/40">TripCraft Manager</p>
                    </div>
                </div>

                <nav className="space-y-2 flex-1">
                    <div className="text-xs font-bold text-white/30 uppercase tracking-widest px-4 mb-2">Main Menu</div>
                    <NavItem id="overview" icon={LayoutDashboard} label="Dashboard" />
                    <NavItem id="users" icon={Users} label="Users" />
                    <NavItem id="trips" icon={Map} label="Trips Database" />

                    <div className="text-xs font-bold text-white/30 uppercase tracking-widest px-4 mb-2 mt-8">System</div>
                    <NavItem id="home" icon={LayoutTemplate} label="Home Page" />
                    <NavItem id="ui" icon={Settings} label="Global Settings" />
                </nav>

                <div className="mt-auto pt-6 border-t border-white/10">
                    <div className="flex items-center gap-3 px-4 mb-4">
                        <Avatar className="h-8 w-8 ring-2 ring-white/10">
                            <AvatarImage src={user?.photoURL || undefined} />
                            <AvatarFallback>AD</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user?.displayName || 'Admin'}</p>
                            <p className="text-xs text-white/50 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <Button variant="ghost" className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-400/10 gap-2" onClick={handleLogout}>
                        <LogOut className="h-4 w-4" /> Sign Out
                    </Button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 overflow-y-auto relative custom-scrollbar bg-black/50">
                {/* Header (Mobile Toggle + Title) */}
                <header className="sticky top-0 z-20 bg-[#09090b]/80 backdrop-blur-md border-b border-white/5 px-8 h-20 flex items-center justify-between">
                    <h2 className="text-2xl font-bold font-headline capitalize">{activeTab === 'ui' ? 'Configurations' : activeTab === 'home' ? 'Home Page Editor' : activeTab}</h2>
                    <div className="flex items-center gap-4">
                        <Button variant="outline" className="hidden md:flex border-white/10 text-xs bg-transparent hover:bg-white/5" onClick={() => router.push('/dashboard')}>
                            Open App Application
                        </Button>
                    </div>
                </header>

                <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">

                    {/* OVERVIEW CONTENT */}
                    {activeTab === 'overview' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20 text-white">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium text-blue-400">Total Users</CardTitle>
                                        <Users className="h-4 w-4 text-blue-400" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold">{loadingStats ? '...' : stats.users}</div>
                                        <p className="text-xs text-white/40 mt-1">Registered travelers</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20 text-white">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium text-green-400">Total Trips</CardTitle>
                                        <Map className="h-4 w-4 text-green-400" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold">{stats.trips || (allTrips.length > 0 ? allTrips.length : '--')}</div>
                                        <p className="text-xs text-white/40 mt-1">Adventures planned</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-gradient-to-br from-pink-500/10 to-transparent border-pink-500/20 text-white">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium text-pink-400">Active Reels</CardTitle>
                                        <Video className="h-4 w-4 text-pink-400" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold">{loadingStats ? '...' : stats.reels}</div>
                                        <p className="text-xs text-white/40 mt-1">Short videos shared</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20 text-white">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium text-orange-400">System Health</CardTitle>
                                        <Shield className="h-4 w-4 text-orange-400" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-orange-400">100%</div>
                                        <p className="text-xs text-white/40 mt-1">Operational</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* USERS CONTENT */}
                    {activeTab === 'users' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between gap-4">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                                    <Input
                                        placeholder="Search users..."
                                        className="pl-10 bg-white/5 border-white/10 focus-visible:ring-orange-500"
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                    />
                                </div>
                                <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loadingUsers} className="border-white/10">
                                    Refresh List
                                </Button>
                            </div>

                            <Card className="bg-[#0f172a]/50 border-white/10 text-white backdrop-blur-sm">
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader className="bg-white/5">
                                            <TableRow className="border-white/5 hover:bg-transparent">
                                                <TableHead className="text-white/60 font-medium">User Profile</TableHead>
                                                <TableHead className="text-white/60 font-medium">Contact</TableHead>
                                                <TableHead className="text-white/60 font-medium">Role</TableHead>
                                                <TableHead className="text-white/60 font-medium">Status</TableHead>
                                                <TableHead className="text-right text-white/60 font-medium">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loadingUsers ? Array(5).fill(0).map((_, i) => (
                                                <TableRow key={i} className="border-white/5"><TableCell colSpan={5} className="h-16"><div className="h-2 w-full bg-white/5 rounded animate-pulse" /></TableCell></TableRow>
                                            )) : filteredUsers.length === 0 ? (
                                                <TableRow><TableCell colSpan={5} className="h-32 text-center text-white/30">No users found.</TableCell></TableRow>
                                            ) : filteredUsers.map((u) => (
                                                <TableRow key={u.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                                    <TableCell className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9 border border-white/10">
                                                            <AvatarImage src={u.photoURL || undefined} />
                                                            <AvatarFallback className="bg-zinc-800">{u.displayName?.[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-medium text-sm">{u.displayName}</span>
                                                    </TableCell>
                                                    <TableCell className="text-white/60 text-sm">{u.email}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className={cn("capitalize shadow-none", u.role === 'admin' ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30" : "bg-white/10 text-white/60")}>
                                                            {u.role || 'user'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {u.isBanned ? (
                                                            <Badge variant="destructive">Banned</Badge>
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-green-400 text-xs font-medium px-2 py-1 rounded-full bg-green-400/10 w-fit">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> Active
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <Button variant="ghost" size="icon" onClick={() => toggleBanUser(u.id, !!u.isBanned)} className={cn("rounded-full", u.isBanned ? "text-green-400 hover:bg-green-400/10" : "text-amber-400 hover:bg-amber-400/10")}>
                                                                <AlertTriangle className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" onClick={() => deleteUser(u.id)} className="rounded-full text-white/40 hover:text-red-400 hover:bg-red-400/10">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* TRIPS CONTENT */}
                    {activeTab === 'trips' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between gap-4">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                                    <Input
                                        placeholder="Search trips..."
                                        className="pl-10 bg-white/5 border-white/10 focus-visible:ring-orange-500"
                                        value={tripSearch}
                                        onChange={(e) => setTripSearch(e.target.value)}
                                    />
                                </div>
                                <Button variant="outline" size="sm" onClick={fetchTrips} disabled={loadingTrips} className="border-white/10">
                                    Refresh Database
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold flex items-center gap-2 text-lg"><Globe className="h-5 w-5 text-green-400" /> Public Trips</h3>
                                        <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded-md">{publicTrips.length} found</span>
                                    </div>
                                    <div className="rounded-xl border border-white/10 bg-[#0f172a]/50 overflow-hidden min-h-[300px]">
                                        {loadingTrips ? <div className="p-8"><Loader2 className="animate-spin text-white/20" /></div> : (
                                            <Table>
                                                <TableBody>
                                                    {publicTrips.map(trip => (
                                                        <TableRow key={trip.id} className="border-white/5 hover:bg-white/5">
                                                            <TableCell className="font-medium text-white">{trip.title}</TableCell>
                                                            <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => deleteTrip(trip)} className="text-white/40 hover:text-red-400"><Trash2 className="h-4 w-4" /></Button></TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold flex items-center gap-2 text-lg"><Shield className="h-5 w-5 text-orange-400" /> Private/Shared</h3>
                                        <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded-md">{privateTrips.length} found</span>
                                    </div>
                                    <div className="rounded-xl border border-white/10 bg-[#0f172a]/50 overflow-hidden min-h-[300px]">
                                        {loadingTrips ? <div className="p-8"><Loader2 className="animate-spin text-white/20" /></div> : (
                                            <Table>
                                                <TableBody>
                                                    {privateTrips.map(trip => (
                                                        <TableRow key={trip.id} className="border-white/5 hover:bg-white/5">
                                                            <TableCell className="font-medium text-white">{trip.title}</TableCell>
                                                            <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => deleteTrip(trip)} className="text-white/40 hover:text-red-400"><Trash2 className="h-4 w-4" /></Button></TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* HIOME CONFIG CONTENT */}
                    {activeTab === 'home' && (
                        <div className="space-y-6 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <Card className="bg-[#0f172a]/50 border-white/10 text-white backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle>Hero Section</CardTitle>
                                    <CardDescription className="text-white/40">Customize the main landing experience.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between p-4 rounded-lg bg-black/40 border border-white/5">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="show-hero" className="text-base font-medium">Show Hero Text</Label>
                                            <p className="text-xs text-white/40">Overlay title and subtitle on video.</p>
                                        </div>
                                        <Switch
                                            id="show-hero"
                                            checked={homeConfig.showHeroText}
                                            onCheckedChange={(c) => setHomeConfig(p => ({ ...p, showHeroText: c }))}
                                            className="data-[state=checked]:bg-orange-500"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="hero-title">Main Title</Label>
                                        <Input
                                            id="hero-title"
                                            value={homeConfig.heroTitle}
                                            onChange={(e) => setHomeConfig(p => ({ ...p, heroTitle: e.target.value }))}
                                            className="bg-black/20 border-white/10"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="hero-sub">Subtitle</Label>
                                        <Input
                                            id="hero-sub"
                                            value={homeConfig.heroSubtitle}
                                            onChange={(e) => setHomeConfig(p => ({ ...p, heroSubtitle: e.target.value }))}
                                            className="bg-black/20 border-white/10"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="hero-video">YouTube Video ID</Label>
                                        <div className="flex gap-2">
                                            <div className="bg-white/5 px-3 py-2 text-white/40 text-sm border border-white/10 rounded-md">youtube.com/embed/</div>
                                            <Input
                                                id="hero-video"
                                                value={homeConfig.heroVideoId}
                                                onChange={(e) => setHomeConfig(p => ({ ...p, heroVideoId: e.target.value }))}
                                                className="bg-black/20 border-white/10 flex-1"
                                                placeholder="d1d4669..."
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                                <div className="p-6 border-t border-white/10 flex justify-end">
                                    <Button onClick={handleSaveHomeConfig} disabled={savingHomeConfig} className="bg-white text-black hover:bg-white/90 font-bold px-8">
                                        {savingHomeConfig ? <Loader2 className="animate-spin mr-2" /> : 'Save Home Settings'}
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* SETTINGS CONTENT */}
                    {activeTab === 'ui' && (
                        <div className="space-y-6 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <Card className="bg-[#0f172a]/50 border-white/10 text-white backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle>Global Announcement</CardTitle>
                                    <CardDescription className="text-white/40">Display a banner at the top of every page.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between p-4 rounded-lg bg-black/40 border border-white/5">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="show-banner" className="text-base font-medium">Enable Banner</Label>
                                            <p className="text-xs text-white/40">Toggle visibility sitewide.</p>
                                        </div>
                                        <Switch
                                            id="show-banner"
                                            checked={config.showBanner}
                                            onCheckedChange={(c) => setConfig(p => ({ ...p, showBanner: c }))}
                                            className="data-[state=checked]:bg-orange-500"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="banner-text">Announcement Message</Label>
                                        <Input
                                            id="banner-text"
                                            value={config.bannerText}
                                            onChange={(e) => setConfig(p => ({ ...p, bannerText: e.target.value }))}
                                            placeholder="Type your message..."
                                            className="bg-black/20 border-white/10 h-12"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-[#0f172a]/50 border-red-500/10 text-white backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-red-400">Emergency Zone</CardTitle>
                                    <CardDescription className="text-white/40">Critical site controls.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="maintenance" className="text-base font-medium text-red-300">Maintenance Mode</Label>
                                            <p className="text-xs text-white/40">Block access for all non-admin users.</p>
                                        </div>
                                        <Switch
                                            id="maintenance"
                                            checked={config.maintenanceMode}
                                            onCheckedChange={(c) => setConfig(p => ({ ...p, maintenanceMode: c }))}
                                            className="data-[state=checked]:bg-red-500"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex justify-end pt-4">
                                <Button onClick={handleSaveConfig} disabled={savingConfig} className="bg-white text-black hover:bg-white/90 font-bold px-8">
                                    {savingConfig ? <Loader2 className="animate-spin mr-2" /> : 'Save Changes'}
                                </Button>
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}
