// src/lib/schemas/share.ts
import { z } from 'zod';

export const AspectRatioSchema = z.enum([
	'9:16', // 1080 × 1920 — Story
	'3:4', // 1080 × 1440 — Portrait
	'2:3', // 1080 × 1620 — Tall
	'1:1', // 1080 × 1080 — Square
	'4:3', // 1440 × 1080 — Landscape
	'16:9' // 1920 × 1080 — Wide
]);

export const GradeDisplayModeSchema = z.enum([
	'full', // 3.83
	'masked', // 3.XX
	'hidden' // column removed entirely
]);

export const ShareConfigSchema = z.object({
	widgets: z.object({
		academicSummary: z.boolean().default(false),
		termHeader: z.boolean().default(true),
		courseList: z.boolean().default(true),
		deansListBadge: z.boolean().default(true),
		latinHonorsBadge: z.boolean().default(true)
	}),
	privacy: z.object({
		maskGPA: z.boolean().default(false), // 3.83 -> 3.XX
		courseGradeDisplay: GradeDisplayModeSchema.default('full')
	}),
	aspectRatio: AspectRatioSchema.default('3:4'),
	background: z.enum(['theme', 'solid', 'transparent']).default('solid')
});

export type ShareConfig = z.infer<typeof ShareConfigSchema>;
export type AspectRatio = z.infer<typeof AspectRatioSchema>;
export type GradeDisplayMode = z.infer<typeof GradeDisplayModeSchema>;
