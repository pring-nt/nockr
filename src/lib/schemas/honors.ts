import { z } from 'zod';

export const HonorTierSchema = z.object({
	id: z.string(),
	label: z.string(),
	lowerBound: z.number(),
	upperBound: z.number()
});

export type HonorTier = z.infer<typeof HonorTierSchema>;
