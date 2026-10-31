import { z } from 'zod';

export const CourseTypeSchema = z.enum(['graded', 'non-academic', 'credited']);
export const CourseResultSchema = z.enum(['pending', 'passed', 'failed']);

export const CourseSchema = z.object({
	id: z.string(),
	name: z.string().default(''),
	units: z.number().int().min(0).max(12).default(3),
	grade: z.number().nullable().default(null),
	type: CourseTypeSchema.default('graded'),
	// Only read when type is not 'graded'. Those courses keep `grade` so it survives a type change.
	result: CourseResultSchema.default('pending')
});

export type Course = z.infer<typeof CourseSchema>;
export type CourseType = z.infer<typeof CourseTypeSchema>;
export type CourseResult = z.infer<typeof CourseResultSchema>;
