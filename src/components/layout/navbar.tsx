'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Menu,
  Home,
  LayoutDashboard,
  Compass,
  Map,
  User,
  LogOut,
  Settings,
  MapPin,
  Globe2,
  LogIn,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { collection, query, where, orderBy, limit, updateDoc, doc } from 'firebase/firestore';

const links = [
  { href: '/', label: 'Home', exact: true, icon: Home },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/trips', label: 'Trips', icon: Map },
  { href: '/map', label: 'Map View', icon: Globe2 },
];

interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow';
  actorId: string;
  actorName: string;
  actorPhoto?: string;
  postId?: string;
  postType?: 'reel' | 'story';
  message: string;
  read: boolean;
  createdAt: any;
}

function timeAgo(timestamp: any): string {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Fetch Notifications
  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
  }, [firestore, user]);

  const { data: notifications } = useCollection<Notification>(notificationsQuery);
  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const markAsRead = async (notificationId: string) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'notifications', notificationId), { read: true });
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getUserInitials = () => {
    if (!user?.displayName) return 'U';
    return user.displayName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Logic for styles
  const isHomePage = pathname === '/';

  // "Transparent Style": Active on Home Page ALWAYS (regardless of scroll).
  // Active on other pages ONLY if specific conditions met (but here we default to standard).
  const useTransparentStyle = isHomePage;

  // Background Logic:
  // - Home: Always Transparent (fixed)
  // - Other: Sticky + Solid/Blurred
  const useSolidBackground = !isHomePage;

  return (
    <header className={`${isHomePage ? 'fixed' : 'sticky'} top-0 z-50 w-full transition-all duration-500 border-b ${useSolidBackground
      ? 'bg-background/80 backdrop-blur-md shadow-md border-border/40'
      : 'bg-transparent border-transparent'
      }`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between transition-all duration-500 ${useTransparentStyle ? 'h-24' : 'h-16'}`}>

          {/* Logo */}
          <Link
            href="/"
            className={`flex items-center gap-2 font-headline font-bold transition-all duration-500 hover:scale-105 group 
              ${useTransparentStyle ? 'text-white tracking-widest text-2xl' : 'text-foreground tracking-tight text-xl'}
            `}
          >
            {/* Icon: Hidden on Home, visible otherwise */}
            <MapPin
              className={`transition-all duration-500 group-hover:rotate-12 
                ${useTransparentStyle ? 'w-0 h-0 opacity-0' : 'w-6 h-6 opacity-100 text-primary'}
              `}
            />

            <span className={useTransparentStyle ? "uppercase font-bold" : "bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"}>
              WanderLust
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center mx-6 gap-2">
            {links.map(link => {
              const Icon = link.icon;
              const isActive = link.exact
                ? pathname === link.href
                : pathname?.startsWith(link.href);

              // Dynamic Classes for Transitions
              const textClasses = useTransparentStyle
                ? 'text-[11px] uppercase tracking-[0.25em] font-bold text-white/90 hover:text-white' // Home Style (Always)
                : 'text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'; // Other Pages

              const activeClasses = useTransparentStyle
                ? 'text-white'
                : 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary';

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-500 group ${isActive ? activeClasses : textClasses
                    }`}
                >
                  {/* Icon: Only show when NOT on home */}
                  <Icon className={`w-4 h-4 transition-all duration-500 ${useTransparentStyle ? 'w-0 opacity-0' : 'w-4 opacity-100'}`} />

                  {link.label}

                  {/* Underline Indicator for Home only */}
                  {isActive && useTransparentStyle && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-white rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {!user ? (
              <>
                {/* Login Button Transition */}
                <Button
                  asChild
                  size="sm"
                  className={`transition-all duration-500 px-6 
                      ${useTransparentStyle
                      ? 'bg-transparent border border-white/40 text-white hover:bg-white hover:text-black hover:border-white rounded-md uppercase text-[11px] font-bold tracking-widest h-10'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm h-9 text-sm font-medium rounded-md'
                    }
                    `}
                >
                  <Link href="/login">
                    {useTransparentStyle ? 'Log In' : 'Sign up'}
                    {useTransparentStyle && <LogIn className="ml-2 w-3 h-3" />}
                  </Link>
                </Button>

                {/* Extra Sign Up Button (Only visible on other pages) */}
                {!useTransparentStyle && (
                  <Button asChild variant="ghost" size="sm" className="hidden sm:flex">
                    <Link href="/login">Log in</Link>
                  </Button>
                )}
              </>
            ) : (
              <>
                {/* Notifications Bell */}
                <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`relative transition-all duration-200 hover:scale-110 ${useTransparentStyle ? 'text-white hover:bg-white/10' : 'text-foreground hover:bg-accent'}`}
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0 bg-zinc-900 border-zinc-800 text-white" align="end">
                    <div className="p-4 border-b border-zinc-800">
                      <h3 className="font-bold">Notifications</h3>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      {!notifications || notifications.length === 0 ? (
                        <div className="p-8 text-center text-zinc-500">
                          <Bell className="w-12 h-12 mx-auto mb-2 opacity-20" />
                          <p className="text-sm">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            onClick={() => {
                              markAsRead(notification.id);
                              setNotificationsOpen(false);
                            }}
                            className={`flex items-start gap-3 p-4 hover:bg-zinc-800/50 cursor-pointer transition-colors border-b border-zinc-800/50 ${!notification.read ? 'bg-zinc-800/30' : ''
                              }`}
                          >
                            <Avatar className="w-10 h-10 flex-shrink-0">
                              <AvatarImage src={notification.actorPhoto} />
                              <AvatarFallback className="bg-zinc-700 text-white text-xs">
                                {notification.actorName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm">
                                <span className="font-semibold">{notification.actorName}</span>{' '}
                                <span className="text-zinc-400">{notification.message}</span>
                              </p>
                              <p className="text-xs text-zinc-500 mt-1">
                                {timeAgo(notification.createdAt)}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Profile Avatar */}
                <Link href="/profile">
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full transition-all duration-200 hover:scale-110">
                    <Avatar className={`h-10 w-10 border-2 transition-all duration-500 hover:shadow-lg ${useTransparentStyle ? 'border-white/50 hover:border-white' : 'border-primary/20 hover:border-primary/40'}`}>
                      <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                      <AvatarFallback className={`transition-all duration-500 ${useTransparentStyle ? 'bg-white/20 text-white backdrop-blur-md' : 'bg-primary/10 text-primary font-semibold'}`}>
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className={`md:hidden ${useTransparentStyle ? 'text-white hover:bg-white/10' : 'text-foreground'}`}>
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-4 mt-8">
                  {links.map(link => {
                    const Icon = link.icon;
                    const isActive = link.exact
                      ? pathname === link.href
                      : pathname?.startsWith(link.href);

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 hover:translate-x-2 group ${isActive
                          ? 'bg-primary/10 text-primary shadow-sm'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          }`}
                      >
                        <Icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                        {link.label}
                      </Link>
                    );
                  })}

                  {!user && (
                    <>
                      <div className="my-4 border-t" />
                      <Button asChild variant="outline" className="w-full">
                        <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                          Log in
                        </Link>
                      </Button>
                      <Button asChild className="w-full">
                        <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                          Sign up
                        </Link>
                      </Button>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
