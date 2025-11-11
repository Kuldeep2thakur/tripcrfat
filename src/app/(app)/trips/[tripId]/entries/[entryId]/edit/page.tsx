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
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { updateDoc, doc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarIcon, Paperclip } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Entry } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const EditEntrySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  visitedAt: z.date({
    required_error: "A date for this entry is required.",
  }),
  media: z.any().optional(),
});


export default function EditEntryPage() {
  const { tripId, entryId } = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const entryRef = useMemoFirebase(() => {
    if (!firestore || !tripId || !entryId || !user) return null;
    return doc(firestore, `users/${user.uid}/trips/${tripId}/entries`, entryId as string);
  }, [firestore, tripId, entryId, user]);

  const { data: entry, isLoading: isLoadingEntry } = useDoc<Entry>(entryRef);

  const form = useForm<z.infer<typeof EditEntrySchema>>({
    resolver: zodResolver(EditEntrySchema),
    defaultValues: {
      title: '',
      content: '',
    },
  });

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (entry) {
        const visitedDate = entry.visitedAt instanceof Date 
            ? entry.visitedAt
            : (entry.visitedAt as any)?.toDate?.() || new Date(entry.visitedAt as string);

        form.reset({
            title: entry.title,
            content: entry.content,
            visitedAt: visitedDate,
        });
    }
  }, [entry, form]);

  const onSubmit = async (data: z.infer<typeof EditEntrySchema>) => {
    if (!user || !tripId || !entryId || !entryRef || !entry) return;

    setIsSubmitting(true);

    try {
        let newMediaUrls: string[] = [];
        if (data.media && data.media.length > 0) {
            newMediaUrls = await Promise.all(
                Array.from(data.media as FileList).map(file => fileToDataUrl(file))
            );
        }

        const existingMedia = entry.media || [];
        const combinedMedia = [...existingMedia, ...newMediaUrls];

        const updatedEntryData = {
          title: data.title,
          content: data.content,
          visitedAt: data.visitedAt,
          media: combinedMedia,
        };
        
        updateDoc(entryRef, updatedEntryData)
          .catch(error => {
            console.error("Error updating document: ", error);
          });
        
        toast({
            title: "Entry Updated",
            description: "Your diary entry has been successfully saved.",
        });
        router.push(`/trips/${tripId}`);

    } catch (error) {
        console.error("Error updating entry:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "There was a problem saving your entry. Please try again.",
        });
    } finally {
        setIsSubmitting(false);
    }
  };
  
    if (isUserLoading || isLoadingEntry) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
                <div className="mb-4">
                     <Skeleton className="h-8 w-32" />
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent className="space-y-8">
                         <div className="space-y-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                         <div className="space-y-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-24 w-full" />
                        </div>
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
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
      <Card className="bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-rose-950/20 border-2 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-transparent">Edit Diary Entry</CardTitle>
          <CardDescription>
            Update your memories or add new photos.
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
                name="media"
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>Add More Photos & Videos</FormLabel>
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
                      Select new files to add to this entry. Supported formats: images (JPG, PNG, GIF) and videos (MP4, WebM, MOV). Existing media will be kept.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />


              <Button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
