"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth, useFirestore, useUser, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile } from "@/firebase";
import { useEffect, useState } from "react";
import { FirebaseError } from "firebase/app";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Mail, Lock, User, Sparkles, LogIn, UserPlus, MapPin } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

const signupSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});


type AuthFormProps = {
  formType: 'login' | 'signup';
};

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,35.242,44,30.038,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
);


export function AuthForm({ formType }: AuthFormProps) {
  const [isMounted, setIsMounted] = useState(false);
  const isLogin = formType === 'login';
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const formSchema = isLogin ? loginSchema : signupSchema;
  type FormSchema = z.infer<typeof formSchema>;
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: isLogin ? { email: '', password: '' } : { fullName: '', email: '', password: '' },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (user && !isUserLoading) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  if (!isMounted) {
    return null;
  }

  const onSubmit = async (values: FormSchema) => {
    if (!auth || !firestore) return;
    try {
      if (isLogin) {
        const { email, password } = values as z.infer<typeof loginSchema>;
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const { email, password, fullName } = values as z.infer<typeof signupSchema>;
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        await updateProfile(userCredential.user, { displayName: fullName });

        const userDocRef = doc(firestore, 'users', userCredential.user.uid);
        await setDoc(userDocRef, {
            displayName: fullName,
            email: userCredential.user.email,
            photoURL: userCredential.user.photoURL,
            createdAt: serverTimestamp(),
            privacyDefault: 'private',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
      }
      router.push('/dashboard');
    } catch (error) {
      if (error instanceof FirebaseError) {
        if (error.code === 'auth/email-already-in-use') {
          form.setError('email', {
            type: 'manual',
            message: 'This email address is already in use. Please log in.',
          });
        } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
          form.setError('root', {
            type: 'manual',
            message: 'Invalid email or password. Please try again.',
          });
        } else {
           form.setError('root', {
            type: 'manual',
            message: 'An unexpected error occurred. Please try again.',
          });
          console.error(error);
        }
      }
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth || !firestore) return;
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Create or update user document in Firestore
        const userDocRef = doc(firestore, 'users', user.uid);
        await setDoc(userDocRef, {
            displayName: user.displayName || 'User',
            email: user.email,
            photoURL: user.photoURL,
            createdAt: serverTimestamp(),
            privacyDefault: 'private',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }, { merge: true }); // merge: true will update existing or create new
        
        router.push('/dashboard');
    } catch (error) {
        if (error instanceof FirebaseError && error.code !== 'auth/popup-closed-by-user') {
            form.setError('root', {
                type: 'manual',
                message: 'Failed to sign in with Google. Please try again.',
            });
            console.error('Google Sign-In Error:', error);
        }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      <Card className="mx-auto max-w-md w-full shadow-2xl border-2 border-primary/10 bg-background/95 backdrop-blur-sm relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <CardHeader className="space-y-3 pb-6">
          <div className="flex items-center justify-center mb-2">
            <div className="p-3 rounded-full bg-gradient-to-br from-primary to-primary/60 shadow-lg">
              <MapPin className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-headline text-center bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {isLogin ? 'Welcome Back!' : 'Join WanderLust'}
          </CardTitle>
          <CardDescription className="text-center text-base">
            {isLogin ? "Continue your journey with us" : "Start your travel adventure today"}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 px-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {!isLogin && (
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem className="group">
                      <FormLabel className="flex items-center gap-2 font-medium group-hover:text-primary transition-colors">
                        <User className="h-4 w-4" />
                        Full Name
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="John Doe" 
                            {...field} 
                            className="pl-10 transition-all duration-200 focus:scale-[1.02] focus:border-primary focus:ring-2 focus:ring-primary/20" 
                          />
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="group">
                    <FormLabel className="flex items-center gap-2 font-medium group-hover:text-primary transition-colors">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="email" 
                          placeholder="you@example.com" 
                          {...field} 
                          className="pl-10 transition-all duration-200 focus:scale-[1.02] focus:border-primary focus:ring-2 focus:ring-primary/20" 
                        />
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="group">
                    <div className="flex items-center justify-between">
                        <FormLabel className="flex items-center gap-2 font-medium group-hover:text-primary transition-colors">
                          <Lock className="h-4 w-4" />
                          Password
                        </FormLabel>
                        {isLogin && (
                            <Link href="#" className="text-sm text-primary hover:underline transition-all hover:scale-105">
                            Forgot password?
                            </Link>
                        )}
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                          className="pl-10 transition-all duration-200 focus:scale-[1.02] focus:border-primary focus:ring-2 focus:ring-primary/20" 
                        />
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.formState.errors.root && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 animate-in fade-in slide-in-from-top-2">
                  <FormMessage className="text-destructive font-medium">{form.formState.errors.root.message}</FormMessage>
                </div>
              )}
              <Button 
                type="submit" 
                className="w-full h-11 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 hover:scale-105 hover:shadow-xl group" 
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Processing...
                  </>
                ) : (
                  <>
                    {isLogin ? (
                      <>
                        <LogIn className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        Sign In
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                        Create Account
                      </>
                    )}
                  </>
                )}
              </Button>
            </form>
          </Form>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-primary/20" />
            </div>
            <div className="relative flex justify-center text-sm uppercase">
                <span className="bg-background px-3 text-muted-foreground font-medium">Or continue with</span>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full h-11 border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 hover:scale-105 group" 
            onClick={handleGoogleSignIn}
          >
            <GoogleIcon className="mr-2 group-hover:scale-110 transition-transform" />
            <span className="font-medium">{isLogin ? 'Sign in with Google' : 'Sign up with Google'}</span>
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center text-center text-sm pb-6 pt-4 border-t border-primary/10">
          <p className="text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <Link 
              href={isLogin ? "/signup" : "/login"} 
              className="ml-2 font-semibold text-primary hover:underline transition-all hover:scale-105 inline-block"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
