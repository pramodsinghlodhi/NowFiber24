'use server';

/**
 * @fileOverview This flow analyzes images of materials used in a job to identify the items and quantities.
 *
 * - analyzeMaterialsUsed - A function that handles the analysis of materials used in a job.
 * - AnalyzeMaterialsUsedInput - The input type for the analyzeMaterialsUsed function.
 * - AnalyzeMaterialsUsedOutput - The return type for the analyzeMaterialsUsed function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeMaterialsUsedInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the materials used in a job, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  taskDetails: z.string().describe('Details of the task for which materials were used.'),
  materialsIssued: z.string().describe('List of materials issued for the task.'),
});
export type AnalyzeMaterialsUsedInput = z.infer<typeof AnalyzeMaterialsUsedInputSchema>;

const AnalyzeMaterialsUsedOutputSchema = z.object({
  materialsUsed: z.array(
    z.object({
      item: z.string().describe('The name of the material used.'),
      quantity: z.number().describe('The quantity of the material used.'),
    })
  ).describe('The list of materials identified in the image and their quantities.'),
  missingItems: z.array(
    z.string().describe('List of materials issued but not found in the image.')
  ).describe('The list of materials that were issued but are not accounted for in the image.'),
  notes: z.string().describe('Any notes or observations about the materials or their usage.'),
});
export type AnalyzeMaterialsUsedOutput = z.infer<typeof AnalyzeMaterialsUsedOutputSchema>;

export async function analyzeMaterialsUsed(input: AnalyzeMaterialsUsedInput): Promise<AnalyzeMaterialsUsedOutput> {
  return analyzeMaterialsUsedFlow(input);
}

const analyzeMaterialsUsedPrompt = ai.definePrompt({
  name: 'analyzeMaterialsUsedPrompt',
  input: {schema: AnalyzeMaterialsUsedInputSchema},
  output: {schema: AnalyzeMaterialsUsedOutputSchema},
  prompt: `You are an AI assistant specialized in analyzing images of materials used in field engineering tasks.

You will be provided with a photo of materials, details of the task, and a list of materials that were originally issued for the task. Your goal is to identify the materials present in the photo, determine their quantities, and identify any missing materials.

Task Details: {{{taskDetails}}}
Materials Issued: {{{materialsIssued}}}
Photo: {{media url=photoDataUri}}

Based on the image, identify the materials used, their quantities, and list any missing items compared to the materials issued. Provide any relevant notes or observations.

Ensure that the output is well-formatted and easy to understand.
`,
});

const analyzeMaterialsUsedFlow = ai.defineFlow(
  {
    name: 'analyzeMaterialsUsedFlow',
    inputSchema: AnalyzeMaterialsUsedInputSchema,
    outputSchema: AnalyzeMaterialsUsedOutputSchema,
  },
  async input => {
    const {output} = await analyzeMaterialsUsedPrompt(input);
    return output!;
  }
);
