
'use server';

/**
 * @fileOverview This flow analyzes images of materials used in a job to identify the items, quantities, and flag any non-standard or unauthorized materials.
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
  unauthorizedItems: z.array(
    z.object({
        item: z.string().describe('The name of the unauthorized material detected.'),
        reason: z.string().describe('The reason why this material is considered unauthorized.')
    })
  ).describe('A list of any detected materials that are non-standard, from a different company, or not on the issued list.'),
  technicianPresent: z.boolean().describe('Whether a person, presumably the technician, is visible in the photo as proof of work.'),
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
  prompt: `You are an AI Quality Control Specialist for a fiber optics ISP. Your primary role is to analyze images of materials used by field technicians to ensure compliance with company standards.

You will be provided with a photo of materials, details of the task, and a list of materials that were officially issued for the task.

Your instructions are:
1.  Identify all materials and their quantities visible in the photo. Populate the 'materialsUsed' field.
2.  Compare the identified materials with the 'materialsIssued' list. Populate the 'missingItems' field with any materials from the issued list that are not visible in the photo.
3.  Critically examine the materials in the photo for any signs of non-compliance. This includes:
    - Items that are not on the 'materialsIssued' list.
    - Items that appear to be from a different brand or of a different specification than the company standard (e.g., wrong type of fiber cable, non-standard connectors, different colored wiring or tubes).
    - Any other visual anomalies that suggest a deviation from standard procedure.
4. For each non-compliant item you detect, add it to the 'unauthorizedItems' field with a clear 'reason' for why it's being flagged (e.g., "Unrecognized brand", "Item not on issued list", "Incorrect cable type detected").
5. Analyze the photo to determine if a person (the technician) is present in the image. This serves as part of the proof of work. Set the 'technicianPresent' field to true if a person is visible, otherwise set it to false.
6. Provide overall notes and observations in the 'notes' field.

Task Details: {{{taskDetails}}}
Materials Issued: {{{materialsIssued}}}
Photo: {{media url=photoDataUri}}

Analyze the photo with a high degree of scrutiny to ensure 100% compliance and perfect installation quality.
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
