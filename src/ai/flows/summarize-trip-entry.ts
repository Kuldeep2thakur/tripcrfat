'use server';
/**
 * @fileOverview Summarizes a long trip entry, providing a concise summary of key moments and details.
 *
 * - summarizeTripEntry - A function that summarizes a trip entry.
 * - SummarizeTripEntryInput - The input type for the summarizeTripEntry function.
 * - SummarizeTripEntryOutput - The return type for the summarizeTripEntry function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeTripEntryInputSchema = z.object({
  tripEntryContent: z.string().describe('The content of the trip entry to summarize.'),
});
export type SummarizeTripEntryInput = z.infer<typeof SummarizeTripEntryInputSchema>;

const SummarizeTripEntryOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the trip entry.'),
});
export type SummarizeTripEntryOutput = z.infer<typeof SummarizeTripEntryOutputSchema>;

export async function summarizeTripEntry(input: SummarizeTripEntryInput): Promise<SummarizeTripEntryOutput> {
  return summarizeTripEntryFlow(input);
}

const summarizeTripEntryPrompt = ai.definePrompt({
  name: 'summarizeTripEntryPrompt',
  input: {schema: SummarizeTripEntryInputSchema},
  output: {schema: SummarizeTripEntryOutputSchema},
  prompt: `Summarize the following trip entry content, focusing on the key moments and details:\n\n{{tripEntryContent}}`,
});

const summarizeTripEntryFlow = ai.defineFlow(
  {
    name: 'summarizeTripEntryFlow',
    inputSchema: SummarizeTripEntryInputSchema,
    outputSchema: SummarizeTripEntryOutputSchema,
  },
  async input => {
    const {output} = await summarizeTripEntryPrompt(input);
    return output!;
  }
);
