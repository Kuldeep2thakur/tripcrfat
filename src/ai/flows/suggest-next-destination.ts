'use server';

/**
 * @fileOverview A flow to suggest new travel destinations based on user's past trips.
 *
 * - suggestNextDestination - A function that suggests travel destinations.
 * - SuggestNextDestinationInput - The input type for the suggestNextDestination function.
 * - SuggestNextDestinationOutput - The return type for the suggestNextDestination function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestNextDestinationInputSchema = z.object({
  pastTrips: z.array(z.string()).describe('An array of descriptions of the user\'s past trips.'),
});
export type SuggestNextDestinationInput = z.infer<typeof SuggestNextDestinationInputSchema>;

const SuggestNextDestinationOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('An array of suggested travel destinations.'),
});
export type SuggestNextDestinationOutput = z.infer<typeof SuggestNextDestinationOutputSchema>;

export async function suggestNextDestination(input: SuggestNextDestinationInput): Promise<SuggestNextDestinationOutput> {
  return suggestNextDestinationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestNextDestinationPrompt',
  input: {schema: SuggestNextDestinationInputSchema},
  output: {schema: SuggestNextDestinationOutputSchema},
  prompt: `You are a travel expert. Given the following descriptions of the user's past trips, suggest new travel destinations that the user might enjoy.

Past Trips:
{{#each pastTrips}}- {{{this}}}
{{/each}}

Suggestions:`,
});

const suggestNextDestinationFlow = ai.defineFlow(
  {
    name: 'suggestNextDestinationFlow',
    inputSchema: SuggestNextDestinationInputSchema,
    outputSchema: SuggestNextDestinationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
