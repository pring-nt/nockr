import { z } from 'zod';
import { boundedText, MAX_COURSE_NAME, MAX_COURSE_UNITS, MAX_ID } from './limits';

export const CourseTypeSchema = z.enum(['graded', 'non-academic', 'credited']);
export const CourseResultSchema = z.enum(['pending', 'passed', 'failed']);

export const CourseSchema = z.object({
	id: boundedText(MAX_ID),
	name: boundedText(MAX_COURSE_NAME).default(''),
	units: z.number().int().min(0).max(MAX_COURSE_UNITS).default(3),
	grade: z.number().nullable().default(null),
	type: CourseTypeSchema.default('graded'),
	// Only read when type is not 'graded'. Those courses keep `grade` so it survives a type change.
	result: CourseResultSchema.default('pending')
});

export type Course = z.infer<typeof CourseSchema>;
export type CourseType = z.infer<typeof CourseTypeSchema>;
export type CourseResult = z.infer<typeof CourseResultSchema>;
