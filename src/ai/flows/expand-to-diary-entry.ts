'use server';
/**
 * @fileOverview Expands bullet points into a diary-style entry.
 *
 * - expandToDiaryEntry - A function that expands bullet points into a diary entry.
 * - ExpandToDiaryEntryInput - The input type for the expandToDiaryEntry function.
 * - ExpandToDiaryEntryOutput - The return type for the expandToDiaryEntry function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExpandToDiaryEntryInputSchema = z.object({
  bulletPoints: z.array(z.string()).describe('A list of bullet points to expand into a diary entry.'),
});
export type ExpandToDiaryEntryInput = z.infer<typeof ExpandToDiaryEntryInputSchema>;

const ExpandToDiaryEntryOutputSchema = z.object({
  diaryEntry: z.string().describe('The generated diary-style entry.'),
});
export type ExpandToDiaryEntryOutput = z.infer<typeof ExpandToDiaryEntryOutputSchema>;

export async function expandToDiaryEntry(input: ExpandToDiaryEntryInput): Promise<ExpandToDiaryEntryOutput> {
  return expandToDiaryEntryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'expandToDiaryEntryPrompt',
  input: {schema: ExpandToDiaryEntryInputSchema},
  output: {schema: ExpandToDiaryEntryOutputSchema},
  prompt: `You are a creative and descriptive travel writer. A user will provide you with a list of bullet points from their day. Your task is to expand these points into a beautiful, engaging, and personal diary entry. Capture the essence of the experiences and emotions.

Here are the user's bullet points:
{{#each bulletPoints}}
- {{{this}}}
{{/each}}
`,
});

const expandToDiaryEntryFlow = ai.defineFlow(
  {
    name: 'expandToDiaryEntryFlow',
    inputSchema: ExpandToDiaryEntryInputSchema,
    outputSchema: ExpandToDiaryEntryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
