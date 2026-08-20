import { z } from 'zod';
import { HonorTierSchema } from './honors';

export const UniversitySettingsSchema = z.object({
	mode: z.enum(['dlsu', 'custom']).default('dlsu'),
	gradeDirection: z.enum(['ascending', 'descending']).default('ascending'),
	gradeMin: z.number().default(0),
	gradeMax: z.number().default(4),
	failingGrade: z.number().nullable().default(0.0),

	deansListEnabled: z.boolean().default(true),
	deansListLabel: z.string().default("Dean's List"),
	deansListTiers: z.array(HonorTierSchema).default([]),

	latinHonorsEnabled: z.boolean().default(true),
	latinHonorsLabel: z.string().default('Latin Honors'),
	latinHonorsTiers: z.array(HonorTierSchema).default([]),
	latinHonorsNoFailPolicy: z.boolean().default(true)
});

export type UniversitySettings = z.infer<typeof UniversitySettingsSchema>;
