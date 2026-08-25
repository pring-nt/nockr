import { z } from 'zod';
import { HonorTierSchema } from './honors';

export const UniversitySettingsSchema = z.object({
	// Added 'up' to the allowed modes!
	mode: z.enum(['dlsu', 'up', 'ust', 'admu', 'custom']).default('dlsu'),
	gradeDirection: z.enum(['ascending', 'descending']).default('ascending'),
	gradeMin: z.number().default(0),
	gradeMax: z.number().default(4),
	failingGrade: z.number().nullable().default(0.0),

	deansListEnabled: z.boolean().default(true),
	deansListLabel: z.string().default("Dean's List"),
	deansListTiers: z.array(HonorTierSchema).default([]),

	deansListMinUnits: z.number().default(0),
	deansListMinCourseGrade: z.number().nullable().default(null),

	latinHonorsEnabled: z.boolean().default(true),
	latinHonorsLabel: z.string().default('Latin Honors'),
	latinHonorsTiers: z.array(HonorTierSchema).default([]),
	latinHonorsNoFailPolicy: z.boolean().default(true)
});

export type UniversitySettings = z.infer<typeof UniversitySettingsSchema>;
export type UniversityMode = UniversitySettings['mode'];
