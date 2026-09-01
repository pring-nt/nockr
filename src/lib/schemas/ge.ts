import { z } from 'zod';

export const GEItemSchema = z.object({
	id: z.string(),
	label: z.string(),
	completed: z.boolean().default(false)
});

export type GEItem = z.infer<typeof GEItemSchema>;
