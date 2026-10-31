import { z } from 'zod';
import { CourseSchema } from './course';
import { boundedText, MAX_ID, MAX_TERM_NAME } from './limits';

export const TermSchema = z.object({
	id: boundedText(MAX_ID),
	name: boundedText(MAX_TERM_NAME).default('Term 1'),
	courses: z.array(CourseSchema).default([])
});

export type Term = z.infer<typeof TermSchema>;
