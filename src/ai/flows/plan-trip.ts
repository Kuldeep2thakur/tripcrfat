import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const PlanTripInputSchema = z.object({
  destination: z.string().min(2),
  startDate: z.string().describe('ISO date for trip start'),
  endDate: z.string().describe('ISO date for trip end'),
  startingCity: z.string().optional(),
  budgetLevel: z.enum(['low', 'medium', 'high']).default('medium'),
  travelers: z.number().int().min(1).default(1),
  interests: z.array(z.string()).default([]),
  travelStyle: z.enum(['relaxed', 'balanced', 'packed']).default('balanced'),
  notes: z.string().optional(),
});
export type PlanTripInput = z.infer<typeof PlanTripInputSchema>;

export const PlanTripOutputSchema = z.object({
  summary: z.string(),
  dailyPlan: z.array(z.object({
    day: z.number(),
    title: z.string(),
    activities: z.array(z.object({
      timeOfDay: z.enum(['morning', 'afternoon', 'evening']).optional(),
      name: z.string(),
      description: z.string(),
      location: z.string().optional(),
      tips: z.string().optional(),
      estimatedCost: z.string().optional(),
    })),
  })),
  packingTips: z.array(z.string()).optional(),
  localTips: z.array(z.string()).optional(),
  estimatedBudgetBreakdown: z.array(z.object({ category: z.string(), amount: z.string() })).optional(),
});
export type PlanTripOutput = z.infer<typeof PlanTripOutputSchema>;

export async function planTrip(input: PlanTripInput): Promise<PlanTripOutput> {
  try {
    console.log('[planTrip] Starting with input:', JSON.stringify(input, null, 2));
    const result = await planTripFlow(input);
    console.log('[planTrip] Success, got result');
    return result;
  } catch (error: any) {
    console.error('[planTrip] Error:', error);
    console.error('[planTrip] Error message:', error.message);
    console.error('[planTrip] Error stack:', error.stack);
    throw error;
  }
}

const planTripPrompt = ai.definePrompt({
  name: 'planTripPrompt',
  input: { schema: PlanTripInputSchema },
  prompt: `You are an expert travel planner. Create a practical, safe, and engaging day-by-day itinerary.

Destination: {{destination}}
Dates: {{startDate}} to {{endDate}}
Starting city (if provided): {{startingCity}}
Travelers: {{travelers}}
Budget level: {{budgetLevel}}
Interests: {{#each interests}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
Style/Pace: {{travelStyle}}
Notes: {{notes}}

Rules:
- Prefer popular, safe, and publicly accessible attractions.
- Balance activities across the day based on style.
- Include travel time considerations and adjacency where relevant.
- Respect budget level in activity, food, and transport choices.
- Provide succinct titles and informative descriptions.
- Use local context (cuisine, customs) without hallucinating specifics.
- Prices should be ballpark and clearly marked "approx." if included.

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "summary": "Brief overview of the trip",
  "dailyPlan": [
    {
      "day": 1,
      "title": "Day title",
      "activities": [
        {
          "timeOfDay": "morning",
          "name": "Activity name",
          "description": "Activity description",
          "location": "Location name",
          "tips": "Helpful tips",
          "estimatedCost": "Cost estimate"
        }
      ]
    }
  ],
  "packingTips": ["tip1", "tip2"],
  "localTips": ["tip1", "tip2"],
  "estimatedBudgetBreakdown": [
    {"category": "Accommodation", "amount": "$500"}
  ]
}

Provide 2-5 activities per day. Do not include any text outside the JSON.
`,
});

const planTripFlow = ai.defineFlow(
  {
    name: 'planTripFlow',
    inputSchema: PlanTripInputSchema,
    outputSchema: PlanTripOutputSchema,
  },
  async (input) => {
    try {
      console.log('[planTripFlow] Calling prompt...');
      const result = await planTripPrompt(input);
      console.log('[planTripFlow] Prompt returned');
      
      // Extract text from the response
      const text = result.text || result.output?.text || '';
      console.log('[planTripFlow] Response text length:', text.length);
      
      if (!text) {
        throw new Error('No response text received from AI');
      }
      
      // Try to extract JSON from the response
      let jsonText = text.trim();
      
      // Remove markdown code blocks if present
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      
      // Parse the JSON
      const parsed = JSON.parse(jsonText);
      console.log('[planTripFlow] Successfully parsed JSON');
      
      // Validate against schema
      const validated = PlanTripOutputSchema.parse(parsed);
      console.log('[planTripFlow] Validation successful');
      
      return validated;
    } catch (error: any) {
      console.error('[planTripFlow] Flow error:', error);
      if (error instanceof SyntaxError) {
        throw new Error(`Failed to parse AI response as JSON: ${error.message}`);
      }
      throw new Error(`Trip planning failed: ${error.message || 'Unknown error'}`);
    }
  }
);
