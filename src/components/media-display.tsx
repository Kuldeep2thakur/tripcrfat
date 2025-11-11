'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Image from 'next/image';
import { Play } from 'lucide-react';

interface MediaDisplayProps {
  media: string[];
  title: string;
}

const isVideoURL = (url: string) => {
  // Check if URL ends with common video extensions
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/.test(url.toLowerCase());
};

export function MediaDisplay({ media, title }: MediaDisplayProps) {
  if (!media || media.length === 0) return null;

  return (
    <div className="relative">
      <Carousel>
        <CarouselContent>
          {media.map((url, index) => (
            <CarouselItem key={index}>
              <Dialog>
                <DialogTrigger asChild>
                  <div className="relative cursor-pointer">
                    {isVideoURL(url) ? (
                      // Video thumbnail with play button
                      <div className="relative">
                        <video 
                          src={url}
                          className="rounded-lg object-cover w-full h-64"
                          muted
                          playsInline
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="p-3 rounded-full bg-black/50">
                            <Play className="h-8 w-8 text-white" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Image
                      <Image 
                        src={url}
                        alt={`${title} - Media ${index + 1}`}
                        width={800}
                        height={600}
                        className="rounded-lg object-cover w-full h-64"
                      />
                    )}
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>{title} - {isVideoURL(url) ? 'Video' : 'Photo'} {index + 1}</DialogTitle>
                  </DialogHeader>
                  {isVideoURL(url) ? (
                    <video 
                      src={url}
                      controls
                      className="rounded-lg w-full"
                      autoPlay
                      playsInline
                    />
                  ) : (
                    <Image
                      src={url}
                      alt={`${title} - Photo ${index + 1}`}
                      width={1600}
                      height={1200}
                      className="rounded-lg object-contain w-full"
                    />
                  )}
                </DialogContent>
              </Dialog>
            </CarouselItem>
          ))}
        </CarouselContent>
        {media.length > 1 && (
          <>
            <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2" />
            <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2" />
          </>
        )}
      </Carousel>
    </div>
  );
}