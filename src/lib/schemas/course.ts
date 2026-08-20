import { z } from 'zod';

export const CourseSchema = z.object({
	id: z.uuid(),
	name: z.string().min(1).default('Course'),
	units: z.number().int().min(1).max(12).default(3),
	grade: z.number().nullable().default(null)
});

export type Course = z.infer<typeof CourseSchema>;
