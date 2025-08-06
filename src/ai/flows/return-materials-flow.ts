
'use server';

/**
 * @fileOverview This flow analyzes a photo of unused materials being returned by a technician at the end of the day.
 *
 * - returnMaterialsFlow - A function that handles the analysis of returned materials.
 * - ReturnMaterialsInput - The input type for the returnMaterialsFlow function.
 * - ReturnMaterialsOutput - The return type for the returnMaterialsFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ReturnMaterialsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the unused materials being returned, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ReturnMaterialsInput = z.infer<typeof ReturnMaterialsInputSchema>;

const ReturnMaterialsOutputSchema = z.object({
  materialsToReturn: z.array(
    z.object({
      item: z.string().describe('The name of the material identified for return.'),
      quantity: z.number().describe('The quantity of the material identified.'),
    })
  ).describe('The list of all materials identified in the image and their quantities.'),
  notes: z.string().describe('Any notes or observations about the returned materials, such as visible damage or wear.'),
});
export type ReturnMaterialsOutput = z.infer<typeof ReturnMaterialsOutputSchema>;


const returnMaterialsPrompt = ai.definePrompt({
  name: 'returnMaterialsPrompt',
  input: {schema: ReturnMaterialsInputSchema},
  output: {schema: ReturnMaterialsOutputSchema},
  prompt: `You are an AI Inventory Assistant for a fiber optics ISP. Your task is to analyze a photo submitted by a technician as "Proof of Return" for unused materials at the end of their shift.

Your instructions are:
1.  Carefully identify every item and its quantity visible in the photo. These are the materials being returned to stock. Populate the 'materialsToReturn' field with your findings.
2.  Provide brief, relevant notes in the 'notes' field. For example, if you see any damage to the items, mention it. Otherwise, a simple confirmation is sufficient.

Analyze the photo to accurately log all returned items.

Photo: {{media url=photoDataUri}}
`,
});

export const returnMaterialsFlow = ai.defineFlow(
  {
    name: 'returnMaterialsFlow',
    inputSchema: ReturnMaterialsInputSchema,
    outputSchema: ReturnMaterialsOutputSchema,
  },
  async input => {
    const {output} = await returnMaterialsPrompt(input);
    return output!;
  }
);
