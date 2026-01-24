import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase';
import { Navbar } from '@/components/layout/navbar';
import { GlobalBanner } from '@/components/global-banner';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'WanderLust: Your Digital Travel Diary',
  description: 'A centralized online travel diary to record trips, attach multimedia, visualize routes, and share selectively.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body suppressHydrationWarning className={cn(inter.className, "font-body")}>
        <FirebaseClientProvider>
          <GlobalBanner />
          <Navbar />
          {children}
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
