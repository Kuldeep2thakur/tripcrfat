'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, MapPin, Calendar, Users, DollarSign, Loader2, ArrowRight, Compass, Plane, MoveRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection } from 'firebase/firestore';

export default function PlanTripPage() {
  const { user } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    fromDestination: '',
    toDestination: '',
    duration: '',
    budget: '',
    travelers: '',
    interests: '',
    travelStyle: '',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const generateTripPlan = async () => {
    if (!formData.toDestination || !formData.duration) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide at least a destination and duration.',
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate-trip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const plan = await response.json();

      if (!response.ok) {
        console.error('API Error:', plan);
        throw new Error(plan.error || `Server error: ${response.status}`);
      }

      if (plan.error && !plan.fallback) {
        throw new Error(plan.error);
      }

      setGeneratedPlan(plan);
      
      toast({
        title: plan.fallback ? 'Trip Plan Generated (Fallback)' : 'Trip Plan Generated!',
        description: plan.fallback 
          ? 'Using fallback plan. AI service may be temporarily unavailable.'
          : 'Your AI-powered personalized trip plan is ready.',
      });
    } catch (error: any) {
      console.error('Error generating trip plan:', error);
      toast({
        variant: 'destructive',
        title: 'Error Generating Trip',
        description: error.message || 'Failed to generate trip plan. Please check console for details.',
      });
    } finally {
      setIsGenerating(false);
    }
  };


  const saveAsTrip = async () => {
    if (!user || !firestore || !generatedPlan) return;

    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + parseInt(formData.duration || '3'));

      const tripTitle = generatedPlan.fromDestination 
        ? `Trip from ${generatedPlan.fromDestination} to ${generatedPlan.toDestination}`
        : `Trip to ${generatedPlan.toDestination}`;
      
      const tripDescription = generatedPlan.fromDestination
        ? `Planned trip from ${generatedPlan.fromDestination} to ${generatedPlan.toDestination} for ${generatedPlan.duration} days`
        : `Planned trip to ${generatedPlan.toDestination} for ${generatedPlan.duration} days`;

      const tripData = {
        title: tripTitle,
        description: tripDescription,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        visibility: 'private',
        ownerId: user.uid,
        coverPhotoId: 'trip-cover-1',
        coverPhotoURL: '/placeholder-trip.jpg',
        planDetails: generatedPlan,
      };

      const tripsCollection = collection(firestore, `users/${user.uid}/trips`);
      const docRef = await addDoc(tripsCollection, tripData);

      toast({
        title: 'Trip Saved!',
        description: 'Your planned trip has been saved to your trips.',
      });

      router.push(`/trips/${docRef.id}`);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save trip. Please try again.',
      });
    }
  };

  return (
    <div className="pb-8 min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-accent/20" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        
        <section className="relative px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Sparkles className="h-4 w-4" />
                <span>AI-Powered Planning</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-headline font-bold tracking-tight mb-4">
                <span className="gradient-text">Plan Your Perfect Trip</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Tell us about your dream destination and we'll use free AI to create a personalized itinerary just for you.
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <Card className="bg-card/80 backdrop-blur border-primary/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-primary" />
                Trip Details
              </CardTitle>
              <CardDescription>
                Provide information about your ideal trip
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <div className="space-y-2">
                  <Label htmlFor="fromDestination" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    From (Optional)
                  </Label>
                  <Input
                    id="fromDestination"
                    name="fromDestination"
                    placeholder="e.g., New York, London"
                    value={formData.fromDestination}
                    onChange={handleInputChange}
                    className="border-primary/20 focus:border-primary/40"
                  />
                  <p className="text-xs text-muted-foreground">Your starting location</p>
                </div>

                {/* Arrow indicator */}
                <div className="flex justify-center my-2">
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                    <MoveRight className="h-4 w-4 text-primary" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="toDestination" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    To Destination *
                  </Label>
                  <Input
                    id="toDestination"
                    name="toDestination"
                    placeholder="e.g., Paris, Tokyo, Bali"
                    value={formData.toDestination}
                    onChange={handleInputChange}
                    className="border-primary/20 focus:border-primary/40"
                  />
                  <p className="text-xs text-muted-foreground">Where you want to go</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Duration (days) *
                </Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  placeholder="e.g., 7"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="border-primary/20 focus:border-primary/40"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Budget Range
                </Label>
                <Input
                  id="budget"
                  name="budget"
                  placeholder="e.g., $2000-$3000"
                  value={formData.budget}
                  onChange={handleInputChange}
                  className="border-primary/20 focus:border-primary/40"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="travelers" className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Number of Travelers
                </Label>
                <Input
                  id="travelers"
                  name="travelers"
                  type="number"
                  placeholder="e.g., 2"
                  value={formData.travelers}
                  onChange={handleInputChange}
                  className="border-primary/20 focus:border-primary/40"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interests">Interests & Preferences</Label>
                <Textarea
                  id="interests"
                  name="interests"
                  placeholder="e.g., culture, food, adventure, relaxation"
                  value={formData.interests}
                  onChange={handleInputChange}
                  className="border-primary/20 focus:border-primary/40 resize-none"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="travelStyle">Travel Style</Label>
                <Input
                  id="travelStyle"
                  name="travelStyle"
                  placeholder="e.g., luxury, backpacking, family-friendly"
                  value={formData.travelStyle}
                  onChange={handleInputChange}
                  className="border-primary/20 focus:border-primary/40"
                />
              </div>

              <Button
                onClick={generateTripPlan}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Plan...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Trip Plan
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Generated Plan */}
          <div className="space-y-6">
            {!generatedPlan ? (
              <Card className="bg-card/50 backdrop-blur border-dashed border-2 border-primary/20">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <Plane className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Your Plan Will Appear Here</h3>
                  <p className="text-muted-foreground max-w-sm">
                    Fill in the trip details and click "Generate Trip Plan" to see your personalized itinerary.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="bg-card/80 backdrop-blur border-primary/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="gradient-text">Your Trip Plan</span>
                      <Button
                        onClick={saveAsTrip}
                        variant="outline"
                        className="border-primary/30 hover:bg-primary/10"
                      >
                        Save as Trip
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      {generatedPlan.fromDestination 
                        ? `${generatedPlan.duration} days: ${generatedPlan.fromDestination} → ${generatedPlan.toDestination}`
                        : `${generatedPlan.duration} days in ${generatedPlan.toDestination}`
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Itinerary */}
                    <div>
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Daily Itinerary
                      </h3>
                      <div className="space-y-4">
                        {generatedPlan.itinerary.map((day: any) => (
                          <div key={day.day} className="border-l-2 border-primary/30 pl-4 pb-4">
                            <h4 className="font-medium text-primary mb-2">{day.title}</h4>
                            <div className="space-y-2">
                              {day.activities.map((activity: any, idx: number) => (
                                <div key={idx} className="text-sm">
                                  <span className="font-medium text-muted-foreground">{activity.time}:</span>{' '}
                                  <span>{activity.activity}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div>
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Recommendations
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-sm mb-1">Accommodation</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {generatedPlan.recommendations.accommodation.map((item: string, idx: number) => (
                              <li key={idx}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-1">Dining</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {generatedPlan.recommendations.dining.map((item: string, idx: number) => (
                              <li key={idx}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-1">Activities</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {generatedPlan.recommendations.activities.map((item: string, idx: number) => (
                              <li key={idx}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-1">Transportation</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {generatedPlan.recommendations.transportation.map((item: string, idx: number) => (
                              <li key={idx}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Tips */}
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Travel Tips</h3>
                      <ul className="text-sm text-muted-foreground space-y-2">
                        {generatedPlan.tips.map((tip: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">✓</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
