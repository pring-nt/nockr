import { z } from 'zod';
import { boundedText, MAX_ID, MAX_LABEL } from './limits';

export const HonorTierSchema = z.object({
	id: boundedText(MAX_ID),
	label: boundedText(MAX_LABEL),
	lowerBound: z.number(),
	upperBound: z.number()
});

export type HonorTier = z.infer<typeof HonorTierSchema>;
