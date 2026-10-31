import { z } from 'zod';
import { CourseTypeSchema } from './course';
import { boundedText, MAX_COURSE_NAME, MAX_COURSE_UNITS, MAX_ID } from './limits';

export const ChecklistItemSchema = z.object({
	id: boundedText(MAX_ID),
	label: boundedText(MAX_COURSE_NAME),
	units: z.number().int().min(0).max(MAX_COURSE_UNITS).default(3),
	type: CourseTypeSchema.default('graded'),
	completed: z.boolean().default(false)
});

export const ChecklistFilterSchema = z.enum(['all', 'todo', 'planned', 'done']);
export const ChecklistSortSchema = z.enum(['custom', 'alphabetical', 'term']);

export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;
export type ChecklistFilter = z.infer<typeof ChecklistFilterSchema>;
export type ChecklistSort = z.infer<typeof ChecklistSortSchema>;
