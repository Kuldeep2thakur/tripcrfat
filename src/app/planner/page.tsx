'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Calendar, Users, DollarSign, Heart, Compass, StickyNote, Sparkles, Plane } from 'lucide-react';

export default function PlannerPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const [form, setForm] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    startingCity: '',
    budgetLevel: 'medium',
    travelers: 1,
    interests: '',
    travelStyle: 'balanced',
    notes: '',
  });

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'travelers' ? Number(value) : value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const payload = {
        destination: form.destination,
        startDate: form.startDate,
        endDate: form.endDate,
        startingCity: form.startingCity || undefined,
        budgetLevel: form.budgetLevel as 'low' | 'medium' | 'high',
        travelers: Number(form.travelers) || 1,
        interests: form.interests.split(',').map(s => s.trim()).filter(Boolean),
        travelStyle: form.travelStyle as 'relaxed' | 'balanced' | 'packed',
        notes: form.notes || undefined,
      };
      const res = await fetch('/api/ai/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errorMsg = data.message || data.error || 'Failed to generate plan';
        throw new Error(errorMsg);
      }
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error('Plan generation error:', err);
      setError(err.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fade in animation on mount
    const elements = document.querySelectorAll('.fade-in');
    elements.forEach((el, index) => {
      setTimeout(() => {
        el.classList.add('opacity-100', 'translate-y-0');
      }, index * 100);
    });
  }, []);

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 max-w-5xl">
      <div className="mb-8 text-center fade-in opacity-0 translate-y-4 transition-all duration-500">
        <h1 className="text-3xl md:text-4xl font-headline font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          AI Trip Planner
        </h1>
        <p className="text-muted-foreground mt-2">Plan a day-by-day itinerary powered by Gemini.</p>
      </div>

      <Card className="mb-8 fade-in opacity-0 translate-y-4 transition-all duration-500 hover:shadow-2xl border-2 border-primary/10 bg-gradient-to-br from-background via-background to-primary/5">
        <CardContent className="p-8">
          <div className="mb-6 flex items-center gap-3 pb-4 border-b border-primary/20">
            <div className="p-2 rounded-lg bg-primary/10">
              <Plane className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Trip Details</h2>
              <p className="text-sm text-muted-foreground">Fill in your travel preferences</p>
            </div>
          </div>
          <form onSubmit={submit} className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2 group">
              <Label htmlFor="destination" className="flex items-center gap-2 font-medium group-hover:text-primary transition-colors">
                <MapPin className="h-4 w-4" />
                Destination
              </Label>
              <div className="relative">
                <Input 
                  id="destination" 
                  name="destination" 
                  placeholder="e.g., Tokyo, Paris, New York" 
                  value={form.destination} 
                  onChange={onChange} 
                  required 
                  className="pl-10 transition-all duration-200 focus:scale-[1.02] focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background/50" 
                />
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>
            <div className="space-y-2 group">
              <Label htmlFor="startingCity" className="flex items-center gap-2 font-medium group-hover:text-primary transition-colors">
                <Plane className="h-4 w-4" />
                Starting City <span className="text-xs text-muted-foreground">(optional)</span>
              </Label>
              <div className="relative">
                <Input 
                  id="startingCity" 
                  name="startingCity" 
                  placeholder="e.g., Delhi, Mumbai, Bangalore" 
                  value={form.startingCity} 
                  onChange={onChange} 
                  className="pl-10 transition-all duration-200 focus:scale-[1.02] focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background/50" 
                />
                <Plane className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>
            <div className="space-y-2 group">
              <Label htmlFor="startDate" className="flex items-center gap-2 font-medium group-hover:text-primary transition-colors">
                <Calendar className="h-4 w-4" />
                Start Date
              </Label>
              <div className="relative">
                <Input 
                  id="startDate" 
                  name="startDate" 
                  type="date" 
                  value={form.startDate} 
                  onChange={onChange} 
                  required 
                  className="pl-10 transition-all duration-200 focus:scale-[1.02] focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background/50" 
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2 group">
              <Label htmlFor="endDate" className="flex items-center gap-2 font-medium group-hover:text-primary transition-colors">
                <Calendar className="h-4 w-4" />
                End Date
              </Label>
              <div className="relative">
                <Input 
                  id="endDate" 
                  name="endDate" 
                  type="date" 
                  value={form.endDate} 
                  onChange={onChange} 
                  required 
                  className="pl-10 transition-all duration-200 focus:scale-[1.02] focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background/50" 
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2 group">
              <Label className="flex items-center gap-2 font-medium group-hover:text-primary transition-colors">
                <DollarSign className="h-4 w-4" />
                Budget Level
              </Label>
              <Select value={form.budgetLevel} onValueChange={(v) => setForm(p => ({...p, budgetLevel: v}))}>
                <SelectTrigger className="transition-all duration-200 focus:scale-[1.02] focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background/50">
                  <SelectValue placeholder="Select your budget" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">💵 Budget-Friendly</SelectItem>
                  <SelectItem value="medium">💰 Moderate</SelectItem>
                  <SelectItem value="high">💎 Luxury</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 group">
              <Label htmlFor="travelers" className="flex items-center gap-2 font-medium group-hover:text-primary transition-colors">
                <Users className="h-4 w-4" />
                Number of Travelers
              </Label>
              <div className="relative">
                <Input 
                  id="travelers" 
                  name="travelers" 
                  type="number" 
                  min={1} 
                  value={form.travelers} 
                  onChange={onChange} 
                  className="pl-10 transition-all duration-200 focus:scale-[1.02] focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background/50" 
                />
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>
            <div className="space-y-2 md:col-span-2 group">
              <Label htmlFor="interests" className="flex items-center gap-2 font-medium group-hover:text-primary transition-colors">
                <Heart className="h-4 w-4" />
                Interests <span className="text-xs text-muted-foreground">(comma separated)</span>
              </Label>
              <div className="relative">
                <Input 
                  id="interests" 
                  name="interests" 
                  placeholder="e.g., museums, street food, hiking, photography, nightlife" 
                  value={form.interests} 
                  onChange={onChange} 
                  className="pl-10 transition-all duration-200 focus:scale-[1.02] focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background/50" 
                />
                <Heart className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>
            <div className="space-y-2 md:col-span-2 group">
              <Label className="flex items-center gap-2 font-medium group-hover:text-primary transition-colors">
                <Compass className="h-4 w-4" />
                Travel Style
              </Label>
              <Select value={form.travelStyle} onValueChange={(v) => setForm(p => ({...p, travelStyle: v}))}>
                <SelectTrigger className="transition-all duration-200 focus:scale-[1.02] focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background/50">
                  <SelectValue placeholder="Choose your pace" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relaxed">🌴 Relaxed - Take it easy</SelectItem>
                  <SelectItem value="balanced">⚖️ Balanced - Mix of both</SelectItem>
                  <SelectItem value="packed">⚡ Packed - See it all</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2 group">
              <Label htmlFor="notes" className="flex items-center gap-2 font-medium group-hover:text-primary transition-colors">
                <StickyNote className="h-4 w-4" />
                Additional Notes <span className="text-xs text-muted-foreground">(optional)</span>
              </Label>
              <div className="relative">
                <Textarea 
                  id="notes" 
                  name="notes" 
                  rows={4} 
                  placeholder="Any must-see spots, dietary restrictions, accessibility needs, or special preferences..." 
                  value={form.notes} 
                  onChange={onChange} 
                  className="pl-10 pt-3 transition-all duration-200 focus:scale-[1.02] focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background/50 resize-none" 
                />
                <StickyNote className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>
            <div className="md:col-span-2 flex gap-3 pt-4 border-t border-primary/10">
              <Button 
                type="submit" 
                disabled={loading} 
                size="lg"
                className="flex-1 transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:hover:scale-100 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-lg font-semibold group"
              >
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Generating Your Perfect Itinerary...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                    Generate AI Trip Plan
                    <Sparkles className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-4 border-destructive animate-in fade-in slide-in-from-top-4 duration-500">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-destructive mb-2">Error</h3>
            <p className="text-destructive mb-4">{error}</p>
            {error.includes('API key') && (
              <div className="text-sm text-muted-foreground space-y-2">
                <p className="font-medium">To fix this:</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Get a free API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline text-primary">Google AI Studio</a></li>
                  <li>Create a <code className="bg-muted px-1 py-0.5 rounded">.env.local</code> file in the project root</li>
                  <li>Add: <code className="bg-muted px-1 py-0.5 rounded">GOOGLE_GENAI_API_KEY=your_key_here</code></li>
                  <li>Restart the dev server: <code className="bg-muted px-1 py-0.5 rounded">npm run dev</code></li>
                </ol>
                <p className="mt-3">See <code className="bg-muted px-1 py-0.5 rounded">ENV_SETUP.md</code> for detailed instructions.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Card className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <span className="text-2xl">🌍</span> Summary
              </h2>
              <p className="text-muted-foreground whitespace-pre-wrap">{result.summary}</p>
            </CardContent>
          </Card>

          {Array.isArray(result.dailyPlan) && result.dailyPlan.map((d: any, dayIndex: number) => (
            <Card key={d.day} className="hover:shadow-xl transition-all duration-300 hover:scale-[1.01] animate-in fade-in slide-in-from-left-4" style={{ animationDelay: `${dayIndex * 100}ms` }}>
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm">{d.day}</span>
                    {d.title}
                  </h3>
                </div>
                <div className="space-y-3">
                  {Array.isArray(d.activities) && d.activities.map((a: any, idx: number) => (
                    <div key={idx} className="rounded-md border p-3 hover:bg-accent/50 transition-all duration-200 hover:scale-[1.02] group cursor-pointer">
                      <div className="text-sm font-medium group-hover:text-primary transition-colors">
                        {a.timeOfDay ? `${a.timeOfDay}: ` : ''}{a.name}
                      </div>
                      <div className="text-sm text-muted-foreground">{a.description}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {a.location && <span>📍 {a.location}. </span>}
                        {a.estimatedCost && <span>💰 {a.estimatedCost}. </span>}
                        {a.tips && <span>💡 {a.tips}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {Array.isArray(result.packingTips) && (
            <Card className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <span className="text-2xl">🎒</span> Packing tips
                </h3>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  {result.packingTips.map((t: string, i: number) => (<li key={i} className="hover:text-foreground transition-colors">{t}</li>))}
                </ul>
              </CardContent>
            </Card>
          )}

          {Array.isArray(result.localTips) && (
            <Card className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <span className="text-2xl">📍</span> Local tips
                </h3>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  {result.localTips.map((t: string, i: number) => (<li key={i} className="hover:text-foreground transition-colors">{t}</li>))}
                </ul>
              </CardContent>
            </Card>
          )}

          {Array.isArray(result.estimatedBudgetBreakdown) && (
            <Card className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <span className="text-2xl">💰</span> Estimated budget
                </h3>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  {result.estimatedBudgetBreakdown.map((b: any, i: number) => (<li key={i} className="hover:text-foreground transition-colors"><span className="font-medium">{b.category}:</span> {b.amount}</li>))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
