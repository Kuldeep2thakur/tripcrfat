'use client';

import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { Entry } from '@/lib/types';
import { useEffect, useRef } from 'react';

function isImageURL(url: string) {
  return /\.(png|jpe?g|gif|webp|bmp|avif|svg)(\?.*)?$/i.test(url);
}

function isVideoURL(url: string) {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}

type EntryGalleryProps = {
  entries: Entry[] | undefined;
};

export function EntryGallery({ entries }: EntryGalleryProps) {
  if (!entries || entries.length === 0) return null;

  const items = entries.flatMap((e) =>
    (e.media || [])
      .filter((m) => isImageURL(m) || isVideoURL(m))
      .map((m) => ({ url: m, title: e.title, isVideo: isVideoURL(m) }))
  );

  if (items.length === 0) return null;

  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    let ctx: any;
    (async () => {
      const { gsap } = await import('gsap');
      if (!rootRef.current) return;
      const tiles = rootRef.current.querySelectorAll('.gallery-item');
      ctx = gsap.context(() => {
        gsap.set(tiles, { y: 16, opacity: 0 });
        gsap.to(tiles, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.06,
          ease: 'power2.out',
        });
      }, rootRef);
    })();
    return () => {
      ctx?.revert?.();
    };
  }, [items.length]);

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold font-headline">Photos</h2>
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
        {items.map((item, idx) => (
          <Dialog key={idx}>
            <DialogTrigger asChild>
              <div className="gallery-item mb-4 break-inside-avoid cursor-pointer group">
                <div className="overflow-hidden rounded-lg relative">
                  {item.isVideo ? (
                    <>
                      <video
                        src={item.url}
                        className="w-full h-auto object-cover"
                        muted
                        playsInline
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="p-2 rounded-full bg-black/50">
                          {/* simple play icon triangle */}
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="white" aria-hidden>
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </>
                  ) : (
                    <Image
                      src={item.url}
                      alt={item.title || `Photo ${idx + 1}`}
                      width={800}
                      height={600}
                      className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-none w-screen h-screen p-0">
              <DialogHeader>
                <DialogTitle className="sr-only">{item.title || (item.isVideo ? `Video ${idx + 1}` : `Photo ${idx + 1}`)}</DialogTitle>
              </DialogHeader>
              <div className="absolute top-3 right-3 z-10">
                <button aria-label="Close" className="rounded-md bg-black/60 text-white px-3 py-1.5 text-sm hover:bg-black/80" data-close>
                  Close
                </button>
              </div>
              <div className="w-screen h-screen flex items-center justify-center bg-black">
                {item.isVideo ? (
                  <video src={item.url} controls className="max-w-full max-h-full object-contain" autoPlay playsInline />
                ) : (
                  <Image
                    src={item.url}
                    alt={item.title || `Photo ${idx + 1}`}
                    width={2400}
                    height={1800}
                    className="max-w-full max-h-full w-auto h-auto object-contain"
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </section>
  );
}
