import { z } from 'zod';
import { CourseTypeSchema } from './course';

export const ChecklistItemSchema = z.object({
	id: z.string(),
	label: z.string(),
	units: z.number().int().min(0).max(12).default(3),
	type: CourseTypeSchema.default('graded'),
	completed: z.boolean().default(false)
});

export const ChecklistFilterSchema = z.enum(['all', 'todo', 'planned', 'done']);
export const ChecklistSortSchema = z.enum(['custom', 'alphabetical', 'term']);

export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;
export type ChecklistFilter = z.infer<typeof ChecklistFilterSchema>;
export type ChecklistSort = z.infer<typeof ChecklistSortSchema>;
