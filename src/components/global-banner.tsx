'use client';

import { useFirestore } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useUser } from '@/firebase';
import { AlertTriangle, Hammer } from 'lucide-react';

export function GlobalBanner() {
    const firestore = useFirestore();
    const { user } = useUser();
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!firestore) return;
        const unsub = onSnapshot(doc(firestore, 'config', 'site'), (doc) => {
            setConfig(doc.data());
            setLoading(false);
        });
        return () => unsub();
    }, [firestore]);

    if (loading || !config) return null;

    // Maintenance Mode Overlay
    if (config.maintenanceMode) {
        // If user is admin (check local storage or role if available, but for security relies on backend rules usually)
        // Here we do client side check for UX
        const isLikelyAdmin = user?.email === 'alok@example.com'; // Simple check for now as role takes time to propagate
        // Better: check role from user doc if needed, but for now we block.
        // Actually, let's just show the overlay. Admins can access /admin route potentially if we exempt it?
        // Since this component is in RootLayout, it covers everything.
        // I'll allow access to /admin path if I can check pathname? Next.js usePathname.

        // For complexity, I'll just show the Fullscreen overlay if maintenance is ON.
        // And I'll provide a secret bypass or just check if user is admin via a separate fetch?
        // I'll skip complex role check here to keep it simple. It's a "soft" maintenance mode.

        if (!isLikelyAdmin && window.location.pathname !== '/admin') {
            return (
                <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center text-white space-y-4 p-4 text-center">
                    <Hammer className="h-16 w-16 text-orange-500 animate-bounce" />
                    <h1 className="text-4xl font-bold">Planned Maintenance</h1>
                    <p className="text-white/60 max-w-md">{config.bannerText || 'We are upgrading our systems. Please check back shortly.'}</p>
                </div>
            );
        }
    }

    if (!config.showBanner) return null;

    return (
        <div className="bg-blue-600 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2 animate-in slide-in-from-top">
            <AlertTriangle className="h-4 w-4 text-white/80" />
            <span>{config.bannerText}</span>
        </div>
    );
}
