import { z } from 'zod';
import { CourseTypeSchema } from './course';

export const ChecklistItemSchema = z.object({
	id: z.string(),
	label: z.string(),
	units: z.number().int().min(0).max(12).default(3),
	type: CourseTypeSchema.default('graded'),
	completed: z.boolean().default(false)
});

export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;
