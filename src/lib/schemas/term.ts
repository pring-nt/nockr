import { z } from 'zod';
import { CourseSchema } from './course';

export const TermSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1).default('Term 1'),
	courses: z.array(CourseSchema).default([])
});

export type Term = z.infer<typeof TermSchema>;
