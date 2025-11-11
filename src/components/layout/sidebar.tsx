
'use client';

import {
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Globe, LayoutDashboard, LogOut, Settings, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useUser, useAuth } from '@/firebase';
import { Skeleton } from '../ui/skeleton';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/explore', label: 'Explore', icon: Globe },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('');

  const handleSignOut = async () => {
    await auth.signOut();
    router.push('/');
  };

  const userAvatar = user ? PlaceHolderImages.find(p => p.id === 'avatar-1') : null;
  const userName = user?.displayName || user?.email?.split('@')[0] || 'Wanderer';
  const userEmail = user?.email || 'No email';


  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            <span className="font-headline text-xl font-semibold">WanderLust</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map(item => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="gap-0">
        <Separator className="mb-2" />
        <SidebarMenu>
            <SidebarMenuItem>
                <Link href="/profile">
                    <SidebarMenuButton isActive={pathname === '/profile'} tooltip="Profile">
                        <UserIcon/>
                        <span>Profile</span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <Link href="#">
                    <SidebarMenuButton tooltip="Settings">
                        <Settings/>
                        <span>Settings</span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
        </SidebarMenu>
        <Separator className="my-2" />
        <div className="p-2 flex items-center gap-3">
          {isUserLoading ? (
            <div className="flex items-center gap-3 w-full">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex flex-col gap-1 w-full">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ) : user ? (
            <>
              <Avatar className="h-10 w-10">
                {userAvatar && <AvatarImage src={userAvatar.imageUrl} alt={userName} />}
                <AvatarFallback>{getInitials(userName)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="font-medium truncate">{userName}</span>
                <span className="text-xs text-muted-foreground truncate">{userEmail}</span>
              </div>
              <Button onClick={handleSignOut} variant="ghost" size="icon" className="ml-auto flex-shrink-0">
                <LogOut />
              </Button>
            </>
          ) : (
             <Button asChild className="w-full">
                <Link href="/login">Log In</Link>
            </Button>
          )}
        </div>
      </SidebarFooter>
    </>
  );
}
