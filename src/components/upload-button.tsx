'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface UploadButtonProps {
  onUploadComplete: (url: string) => void;
  className?: string;
}

export function UploadButton({ onUploadComplete, className }: UploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (event: Event) => {
    const e = event.target as HTMLInputElement;
    if (!e.files || e.files.length === 0) return;

    const file = e.files[0];
    setIsUploading(true);

    try {
      // Get the signature from our API
      const response = await fetch('/api/cloudinary/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paramsToSign: {
            timestamp: Math.round(new Date().getTime() / 1000),
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to get upload signature');
      
      const { signature, timestamp } = await response.json();

      // Create form data for Cloudinary upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp.toString());
      formData.append('api_key', process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '');
      formData.append('folder', 'travelog');

      // Upload to Cloudinary
      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!uploadResponse.ok) throw new Error('Upload failed');

      const uploadResult = await uploadResponse.json();
      onUploadComplete(uploadResult.secure_url);

      toast({
        title: 'Success',
        description: 'Image uploaded successfully',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Button
      variant="outline"
      className={className}
      disabled={isUploading}
      onClick={() => {
        // Create and trigger a hidden file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = handleUpload;
        input.click();
      }}
    >
      {isUploading ? 'Uploading...' : 'Upload Image'}
    </Button>
  );
}