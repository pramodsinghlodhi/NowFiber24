
'use server';

// The main genkit.ts file, which contains the Genkit configuration,
// is imported here to ensure it is loaded and initialized.
import './genkit';

import './flows/auto-fault-detection';
import './flows/analyze-materials-used';
import './flows/trace-route-flow';
import './flows/return-materials-flow';
