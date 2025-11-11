'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useUser } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarIcon, Paperclip, MapPin } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LocationPicker } from '@/components/location-picker';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { toast } from '@/hooks/use-toast';
import { uploadToCloudinary } from '@/lib/cloudinary';

const NewEntrySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  visitedAt: z.date({
    required_error: "A date for this entry is required.",
  }),
  media: z.any().optional(),
  location: z.object({
    name: z.string(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number()
    })
  }).optional(),
});


export default function NewEntryPage() {
  const { tripId } = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof NewEntrySchema>>({
    resolver: zodResolver(NewEntrySchema),
    defaultValues: {
      title: '',
      content: '',
      visitedAt: new Date(),
    },
  });

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const onSubmit = async (data: z.infer<typeof NewEntrySchema>) => {
    if (!user || !firestore || !tripId) return;

    setIsSubmitting(true);

    try {
        let mediaURLs: string[] = [];
    if (data.media && data.media.length > 0) {
      for (const file of Array.from(data.media as FileList)) {
        const uploaded = await uploadToCloudinary(file as File);
        const downloadURL = uploaded.secure_url || uploaded.url;
        mediaURLs.push(downloadURL);
      }
    }

        // Create entry in the user's trips subcollection
        const entriesCollection = collection(firestore, `users/${user.uid}/trips/${tripId}/entries`);
        const entryData: any = {
            title: data.title,
            content: data.content,
            visitedAt: data.visitedAt,
            tripId: tripId,
            authorId: user.uid,
            createdAt: serverTimestamp(),
            media: mediaURLs,
            ownerId: user.uid, // Add owner ID for security rules
        };

        // Only add location if it exists and is not undefined
        if (data.location && data.location.coordinates && data.location.name) {
            entryData.location = data.location;
        }

        await addDoc(entriesCollection, entryData);

        toast({
          title: "Entry Saved",
          description: "Your new diary entry has been successfully saved.",
        });
        
        router.push(`/trips/${tripId}`);
    } catch (error) {
        console.error("Error creating entry:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "There was a problem creating your entry. Please try again.",
        });
    } finally {
        setIsSubmitting(false);
    }
  };
  
    if (isUserLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
        <div className="mb-4">
            <Button asChild variant="ghost" size="sm">
                <Link href={`/trips/${tripId}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Trip
                </Link>
            </Button>
        </div>
      <Card className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-cyan-950/20 border-2 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">Add New Diary Entry</CardTitle>
          <CardDescription>
            Record your memories and upload photos from this day of your trip.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., A Day at the Museum" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

                <FormField
                  control={form.control}
                  name="visitedAt"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diary Entry</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Write about your experiences, thoughts, and feelings from the day..."
                        className="resize-y min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <LocationPicker
                            onLocationSelect={(location) => field.onChange(location)}
                            defaultLocation={field.value}
                          />
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Pin the location on the map or search for a place.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="media"
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>Add Photos & Videos</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <Paperclip className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input 
                                {...rest}
                                type="file" 
                                multiple
                                accept="image/*,video/*"
                                className="pl-10"
                                onChange={(e) => onChange(e.target.files)}
                            />
                        </div>
                    </FormControl>
                    <FormDescription>
                      You can select multiple files. Supported formats: images (JPG, PNG, GIF) and videos (MP4, WebM, MOV).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                {isSubmitting ? 'Saving...' : 'Save Entry'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
