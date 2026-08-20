import { z } from 'zod';

export const HonorTierSchema = z.object({
	id: z.uuid(),
	label: z.string().min(1),
	lowerBound: z.number(),
	upperBound: z.number()
});

export type HonorTier = z.infer<typeof HonorTierSchema>;
